import React from 'react';
import { after, afterEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.org/#academy/learn/edb',
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

import {
  DEFAULT_INSCO_DRIVE_FOLDER_ID,
  DEFAULT_INSCO_DRIVE_FOLDER_URL,
  DRIVE_TARGET_FOLDERS,
  buildOrganizedCatalogMarkdown,
  classifyDriveItem,
  formatFileSize,
  parseDriveFolderId,
  type DriveRawItem,
} from '../src/utils/driveOrganizer';
import {
  buildEdbIndexEntryFromVocationalBook,
  buildImportedSimulatorLab,
  buildVocationalEdbBook,
  computeDriveSimulatorMetrics,
} from '../src/utils/driveAcademyImporter';
import {
  clearDriveAcademyLibrary,
  readDriveAcademyLibrary,
  upsertDriveAcademyImport,
} from '../src/utils/driveAcademyStore';
import { validateEdb } from '../src/edb/validate';

let currentToken: string | null = null;
let driveMutationCount = 0;

await mock.module('../src/client/googleDriveService.ts', {
  namedExports: {
    GOOGLE_DRIVE_SCOPES: ['https://www.googleapis.com/auth/drive'] as const,
    getCachedDriveAccessToken: () => currentToken,
    observeDriveAuth: (_onSuccess?: unknown, onAuthNeeded?: (u: null) => void) => {
      onAuthNeeded?.(null);
      return () => {};
    },
    signInWithGoogleDrive: async () => {
      currentToken = 'mock-oauth-token';
      return {
        user: { email: 'engineer@insco.com' },
        accessToken: currentToken,
      };
    },
    disconnectGoogleDrive: async () => {
      currentToken = null;
    },
    listDriveFolderTree: async () => ({
      folderName: 'مدرسه',
      existingSubfolders: new Map<string, string>(),
      files: [
        {
          id: 'file-edu-1',
          name: 'RT_Level_II_Lecture_Notes.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1_500_000,
          parents: [DEFAULT_INSCO_DRIVE_FOLDER_ID],
          folderPath: '/',
          webViewLink: 'https://drive.google.com/file/d/file-edu-1/view',
        },
        {
          id: 'file-sim-1',
          name: 'Weld_Defect_Virtual_Lab_Simulator.html',
          mimeType: 'text/html',
          sizeBytes: 120_000,
          parents: [DEFAULT_INSCO_DRIVE_FOLDER_ID],
          folderPath: '/',
          webViewLink: 'https://drive.google.com/file/d/file-sim-1/view',
        },
      ],
    }),
    fetchDriveFileContent: async (_token: string, file: DriveRawItem) => {
      if (file.id === 'file-sim-1') {
        return {
          text: 'Weld defect interactive simulator canvas',
          htmlContent: '<div>Interactive Weld Sim</div>',
          extractionMethod: 'html',
        };
      }
      return {
        text: 'ASME Sec V Radiographic Testing Level II study guide.\nUg = (F * d) / D',
        pages: [{ pageNumber: 1, text: 'Radiographic Testing Level II principles.' }],
        extractionMethod: 'pdfjs',
      };
    },
    ensureDriveSubfolder: async () => {
      driveMutationCount += 1;
      return 'should-not-be-called';
    },
    moveDriveFileToFolder: async () => {
      driveMutationCount += 1;
    },
  },
});

const { GoogleDriveOrganizer } = await import('../src/components/academy/GoogleDriveOrganizer');
const { DriveSimulatorRunner } = await import('../src/components/academy/DriveSimulatorRunner');
const { render, fireEvent, cleanup, waitFor } = await import('@testing-library/react');

afterEach(() => {
  cleanup();
  clearDriveAcademyLibrary();
  currentToken = null;
  driveMutationCount = 0;
});

after(() => {
  dom.window.close();
});

describe('driveOrganizer pure utilities (100% on-platform)', () => {
  test('parseDriveFolderId handles full Drive URLs, open?id= URLs, raw IDs, and invalid strings', () => {
    assert.equal(
      parseDriveFolderId(DEFAULT_INSCO_DRIVE_FOLDER_URL),
      DEFAULT_INSCO_DRIVE_FOLDER_ID
    );
    assert.equal(
      parseDriveFolderId(`https://drive.google.com/drive/u/0/folders/${DEFAULT_INSCO_DRIVE_FOLDER_ID}?usp=sharing`),
      DEFAULT_INSCO_DRIVE_FOLDER_ID
    );
    assert.equal(
      parseDriveFolderId(`https://drive.google.com/open?id=${DEFAULT_INSCO_DRIVE_FOLDER_ID}`),
      DEFAULT_INSCO_DRIVE_FOLDER_ID
    );
    assert.equal(
      parseDriveFolderId(DEFAULT_INSCO_DRIVE_FOLDER_ID),
      DEFAULT_INSCO_DRIVE_FOLDER_ID
    );
    assert.equal(parseDriveFolderId(''), null);
    assert.equal(parseDriveFolderId('short'), null);
    assert.equal(parseDriveFolderId('https://example.com/not-drive'), null);
  });

  test('classifyDriveItem separates Education PDFs/codes from interactive Simulators & calibration files', () => {
    const rtBook: DriveRawItem = {
      id: 'f1',
      name: 'ASME_Sec_V_Radiographic_Textbook.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2_400_000,
      parents: [DEFAULT_INSCO_DRIVE_FOLDER_ID],
      folderPath: '/',
    };
    const classifiedBook = classifyDriveItem(rtBook);
    assert.equal(classifiedBook.category, 'education');
    assert.equal(classifiedBook.discipline, 'RT');
    assert.equal(classifiedBook.alreadyInTargetFolder, false);

    const simHtml: DriveRawItem = {
      id: 'f2',
      name: 'RT_Exposure_Calculator_Simulator.html',
      mimeType: 'text/html',
      sizeBytes: 85_000,
      parents: [DEFAULT_INSCO_DRIVE_FOLDER_ID],
      folderPath: '/',
    };
    const classifiedSim = classifyDriveItem(simHtml);
    assert.equal(classifiedSim.category, 'simulators');
    assert.equal(classifiedSim.discipline, 'RT');
    assert.equal(classifiedSim.suggestedTab, 'ge_exposure_time');
    assert.equal(classifiedSim.alreadyInTargetFolder, false);

    const dacSheet: DriveRawItem = {
      id: 'f3',
      name: 'UT_DAC_Curve_Calibration.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      parents: ['sub-ut'],
      folderPath: DRIVE_TARGET_FOLDERS.simulators.name,
    };
    const classifiedDac = classifyDriveItem(dacSheet);
    assert.equal(classifiedDac.category, 'simulators');
    assert.equal(classifiedDac.discipline, 'UT');
    assert.equal(classifiedDac.suggestedTab, 'dac_builder');
    assert.equal(classifiedDac.alreadyInTargetFolder, true);
  });

  test('formatFileSize & buildOrganizedCatalogMarkdown contain no external Drive URLs', () => {
    assert.equal(formatFileSize(undefined), '—');
    assert.equal(formatFileSize(512), '512 B');
    assert.equal(formatFileSize(2048), '2.0 KB');
    assert.equal(formatFileSize(5 * 1024 * 1024), '5.0 MB');

    const items = [
      classifyDriveItem({
        id: '1',
        name: 'NDT_Guide.pdf',
        mimeType: 'application/pdf',
        folderPath: '/',
        webViewLink: 'https://drive.google.com/file/d/1/view',
      }),
      classifyDriveItem({
        id: '2',
        name: 'PAUT_3D_Simulator.html',
        mimeType: 'text/html',
        folderPath: '/',
        webViewLink: 'https://drive.google.com/file/d/2/view',
      }),
    ];

    const mdAr = buildOrganizedCatalogMarkdown(items, 'مدرسة إنسكو', DEFAULT_INSCO_DRIVE_FOLDER_ID, 'ar');
    assert.match(mdAr, /مسار التعليم والمناهج \(1\)/);
    assert.match(mdAr, /مسار المحاكيات والمعامل التفاعلية \(1\)/);
    assert.equal(mdAr.includes('https://drive.google.com'), false);
  });

  test('buildVocationalEdbBook produces strictly valid EDB v1.0 books kept inside platform and buildImportedSimulatorLab creates live physics simulators', () => {
    const eduItem = classifyDriveItem({
      id: 'eduDoc12345',
      name: 'ASME_Sec_V_RT_Vocational_Manual.pdf',
      mimeType: 'application/pdf',
      webViewLink: 'https://drive.google.com/file/d/eduDoc12345/view',
      folderPath: '/',
    });
    const book = buildVocationalEdbBook(eduItem, {
      text: 'ASME Sec V Article 2 Radiographic Examination.\nUg = (F * d) / D\nThickness 16 mm at SFD 700 mm.',
      pages: [
        {
          pageNumber: 1,
          text: 'Radiographic testing principles under ASME Sec V. Ug = (F * d) / D.',
        },
      ],
      extractionMethod: 'pdfjs',
    });

    const validation = validateEdb(book);
    assert.equal(validation.valid, true, `EDB validation errors: ${validation.errors.join(', ')}`);
    assert.equal(book.pages.length >= 3, true);
    assert.ok(book.metadata.standards?.includes('ASME Sec V'));
    assert.equal(JSON.stringify(book).includes('https://drive.google.com'), false);

    const simItem = classifyDriveItem({
      id: 'simCsv999',
      name: 'UT_Shear_Wave_Scan_Simulator.csv',
      mimeType: 'text/csv',
      folderPath: '/',
    });
    const sim = buildImportedSimulatorLab(simItem, {
      text: 'Thickness,Angle\n25,60',
      csvRows: [
        ['Thickness', 'Angle'],
        ['25', '60'],
      ],
      extractionMethod: 'csv',
    });
    assert.equal(sim.mode, 'dataset-lab');
    assert.equal(sim.discipline, 'UT');
    assert.ok(sim.params.length >= 3);
    const metrics = computeDriveSimulatorMetrics(sim, { thicknessMm: 25, angleDeg: 60 });
    assert.ok(metrics.some(m => m.value.includes('mm')));

    clearDriveAcademyLibrary();
    const indexEntry = buildEdbIndexEntryFromVocationalBook(book);
    upsertDriveAcademyImport(
      [
        {
          book,
          indexEntry,
          sourceFileId: eduItem.id,
          discipline: eduItem.discipline,
          suggestedLabTab: eduItem.suggestedTab,
          importedAt: new Date().toISOString(),
          extractionMethod: 'pdfjs',
        },
      ],
      [sim]
    );
    const stored = readDriveAcademyLibrary();
    assert.equal(stored.books.length, 1);
    assert.equal(stored.simulators.length, 1);
    clearDriveAcademyLibrary();
  });
});

describe('GoogleDriveOrganizer & DriveSimulatorRunner stay 100% inside platform', () => {
  test('imports sciences into Vocational Education & Simulators with zero off-platform links or Drive mutations', async () => {
    let openedBookId: string | null = null;
    const ui = render(
      <>
        <GoogleDriveOrganizer
          language="ar"
          onOpenImportedBook={doc => {
            openedBookId = doc.id;
          }}
        />
        <DriveSimulatorRunner language="ar" />
      </>
    );

    assert.ok(ui.getByDisplayValue(DEFAULT_INSCO_DRIVE_FOLDER_URL));
    const signInBtn = ui.getByTestId('google-drive-signin-btn');
    fireEvent.click(signInBtn);

    await waitFor(() => {
      assert.equal(ui.getAllByTestId('google-drive-file-row').length, 2);
    });

    // Zero external anchor links pointing to drive.google.com
    const externalAnchors = Array.from(ui.container.querySelectorAll('a[href*="drive.google.com"]'));
    assert.equal(externalAnchors.length, 0);

    // Import sciences directly into INSCO Platform (Vocational Ed + Simulators)
    fireEvent.click(ui.getByTestId('google-drive-import-academy-btn'));

    await waitFor(() => {
      const library = readDriveAcademyLibrary();
      assert.equal(library.books.length, 1);
      assert.equal(library.simulators.length, 1);
    });

    // Immediate open inside INSCO Vocational EDB reader & in-platform Simulator Runner
    fireEvent.click(ui.getByText('فتح كتعليم مهني'));
    assert.ok(openedBookId?.startsWith('edb-drive-'));

    assert.ok(ui.getByTestId('drive-imported-simulators'));
    assert.equal(driveMutationCount, 0);
  });
});
