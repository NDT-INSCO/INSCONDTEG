import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  Download,
  FlaskConical,
  FolderKanban,
  FolderSync,
  Loader2,
  LogOut,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import type { Language } from '../../types';
import type { AcademyTab } from '../../academyTabs';
import {
  DEFAULT_INSCO_DRIVE_FOLDER_URL,
  buildOrganizedCatalogMarkdown,
  classifyDriveItem,
  formatFileSize,
  parseDriveFolderId,
  type ClassifiedDriveItem,
  type DriveOrganizerCategory,
} from '../../utils/driveOrganizer';
import {
  disconnectGoogleDrive,
  fetchDriveFileContent,
  getCachedDriveAccessToken,
  listDriveFolderTree,
  observeDriveAuth,
  signInWithGoogleDrive,
} from '../../client/googleDriveService';
import type { EdbDocument, EdbIndexEntry } from '../../edb/types';
import {
  buildEdbIndexEntryFromVocationalBook,
  buildImportedSimulatorLab,
  buildVocationalEdbBook,
  type ExtractedDriveContent,
  type ImportedDriveSimulator,
  type ImportedVocationalBookEntry,
} from '../../utils/driveAcademyImporter';
import {
  upsertDriveAcademyImport,
  useDriveAcademyLibrary,
} from '../../utils/driveAcademyStore';

interface GoogleDriveOrganizerProps {
  language: Language;
  onOpenLab?: (labId: string) => void;
  onOpenTab?: (tab: AcademyTab) => void;
  onOpenImportedBook?: (book: EdbDocument, entry: EdbIndexEntry) => void;
}

async function extractLocalFile(file: File): Promise<ExtractedDriveContent> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.html') || name.endsWith('.htm')) {
    const htmlContent = await file.text();
    const text = htmlContent
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return { text, htmlContent, extractionMethod: 'html' };
  }
  if (name.endsWith('.csv')) {
    const raw = await file.text();
    const csvRows = raw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, 60)
      .map(l => l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()));
    return { text: raw, csvRows, extractionMethod: 'csv' };
  }
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const pdfjs = await import('pdfjs-dist');
      try {
        const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        if (workerModule?.default && pdfjs.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
        }
      } catch {
        // fallback in test env
      }
      const buffer = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjs.getDocument({ data: buffer, useSystemFonts: true, verbosity: 0 }).promise;
      try {
        const maxPages = Math.min(pdf.numPages, 20);
        const pages: Array<{ pageNumber: number; text: string }> = [];
        for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          const text = content.items
            .map(item => ('str' in item && typeof item.str === 'string' ? item.str : ''))
            .filter(Boolean)
            .join(' ')
            .trim();
          if (text) pages.push({ pageNumber, text });
        }
        return {
          text: pages.map(p => p.text).join('\n\n'),
          pages,
          extractionMethod: 'pdfjs',
        };
      } finally {
        const closable = pdf as unknown as { destroy?: () => Promise<void>; cleanup?: () => Promise<void> };
        if (typeof closable.destroy === 'function') await closable.destroy();
        else if (typeof closable.cleanup === 'function') await closable.cleanup();
      }
    } catch {
      return { text: '', extractionMethod: 'metadata-only' };
    }
  }
  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.json') || file.type.startsWith('text/')) {
    return { text: await file.text(), extractionMethod: 'text' };
  }
  return { text: '', extractionMethod: 'metadata-only' };
}

export const GoogleDriveOrganizer: React.FC<GoogleDriveOrganizerProps> = ({
  language,
  onOpenLab,
  onOpenTab,
  onOpenImportedBook,
}) => {
  const isAr = language === 'ar';
  const driveLibrary = useDriveAcademyLibrary();
  const localUploadRef = useRef<HTMLInputElement>(null);

  const [folderInput, setFolderInput] = useState(DEFAULT_INSCO_DRIVE_FOLDER_URL);
  const [needsAuth, setNeedsAuth] = useState(() => !getCachedDriveAccessToken());
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [loadingFiles, setLoadingFiles] = useState(false);
  const [folderTitle, setFolderTitle] = useState<string>('');
  const [loadedFolderId, setLoadedFolderId] = useState<string | null>(null);
  const [items, setItems] = useState<ClassifiedDriveItem[]>([]);
  const [filter, setFilter] = useState<'all' | DriveOrganizerCategory>('all');
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const [importingAcademy, setImportingAcademy] = useState(false);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  useEffect(() => {
    return observeDriveAuth(
      (user) => {
        setNeedsAuth(false);
        setAuthEmail(user.email);
      },
      (user) => {
        setNeedsAuth(true);
        setAuthEmail(user?.email ?? null);
      }
    );
  }, []);

  const loadFolder = useCallback(async (overrideToken?: string) => {
    const token = overrideToken ?? getCachedDriveAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    const folderId = parseDriveFolderId(folderInput);
    if (!folderId) {
      setError(isAr ? 'رابط أو معرّف المجلد غير صالح.' : 'Invalid folder URL or ID.');
      return;
    }

    setLoadingFiles(true);
    setError(null);
    setStatusNotice(null);
    try {
      const result = await listDriveFolderTree(token, folderId);
      setFolderTitle(result.folderName);
      setLoadedFolderId(folderId);
      setItems(result.files.map(classifyDriveItem));
      setStatusNotice(
        isAr
          ? `تم مسح "${result.folderName}" (${result.files.length} ملفاً). اضغط «وضع كل العلوم داخل المنصة» لاستيعابها كتعليم مهني ومحاكيات داخل إنسكو دون مغادرة المنصة.`
          : `Scanned "${result.folderName}" (${result.files.length} files). Click "Import All Sciences into Platform" to integrate them inside INSCO Academy.`
      );
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      if (status === 401) {
        setNeedsAuth(true);
      }
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingFiles(false);
    }
  }, [folderInput, isAr]);

  const handleGoogleLogin = async () => {
    setAuthBusy(true);
    setError(null);
    try {
      const session = await signInWithGoogleDrive();
      setNeedsAuth(false);
      setAuthEmail(session.user.email);
      await loadFolder(session.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGoogleDrive();
    setNeedsAuth(true);
    setAuthEmail(null);
    setItems([]);
    setLoadedFolderId(null);
    setStatusNotice(null);
  };

  const toggleItemCategory = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              category: item.category === 'education' ? 'simulators' : 'education',
            }
          : item
      )
    );
  };

  const educationItems = useMemo(() => items.filter(i => i.category === 'education'), [items]);
  const simulatorItems = useMemo(() => items.filter(i => i.category === 'simulators'), [items]);

  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return items.filter(item => {
      if (filter !== 'all' && item.category !== filter) return false;
      if (!q) return true;
      return `${item.name} ${item.discipline} ${item.folderPath ?? ''}`.toLowerCase().includes(q);
    });
  }, [filter, items, searchText]);

  const handleExportIndex = () => {
    if (!items.length || !loadedFolderId) return;
    const md = buildOrganizedCatalogMarkdown(items, folderTitle || 'INSCO Academy', loadedFolderId, language);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insco-academy-catalog-${loadedFolderId.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importedBookBySourceId = useMemo(() => {
    const map = new Map<string, ImportedVocationalBookEntry>();
    for (const entry of driveLibrary.books) {
      map.set(entry.sourceFileId, entry);
    }
    return map;
  }, [driveLibrary.books]);

  const importedSimBySourceId = useMemo(() => {
    const map = new Map<string, ImportedDriveSimulator>();
    for (const sim of driveLibrary.simulators) {
      map.set(sim.sourceFileId, sim);
    }
    return map;
  }, [driveLibrary.simulators]);

  const handleImportSciencesToAcademy = async (subset?: ClassifiedDriveItem[]) => {
    const token = getCachedDriveAccessToken();
    if (!token) {
      setNeedsAuth(true);
      setError(isAr ? 'سجّل الدخول أولاً لاستيراد العلوم إلى داخل المنصة.' : 'Sign in first to import sciences into the platform.');
      return;
    }
    const targetItems = subset && subset.length > 0 ? subset : items;
    if (!targetItems.length) return;

    setImportingAcademy(true);
    setError(null);
    setStatusNotice(null);
    setImportProgress({ done: 0, total: targetItems.length });

    const newBooks: ImportedVocationalBookEntry[] = [];
    const newSims: ImportedDriveSimulator[] = [];

    try {
      for (let idx = 0; idx < targetItems.length; idx += 1) {
        const file = targetItems[idx];
        const extracted = await fetchDriveFileContent(token, file);
        if (file.category === 'simulators') {
          newSims.push(buildImportedSimulatorLab(file, extracted));
        } else {
          const book = buildVocationalEdbBook(file, extracted);
          const indexEntry = buildEdbIndexEntryFromVocationalBook(book);
          newBooks.push({
            book,
            indexEntry,
            sourceFileId: file.id,
            discipline: file.discipline,
            suggestedLabTab: file.suggestedTab,
            importedAt: new Date().toISOString(),
            extractionMethod: extracted.extractionMethod,
          });
        }
        setImportProgress({ done: idx + 1, total: targetItems.length });
      }

      upsertDriveAcademyImport(newBooks, newSims);
      setStatusNotice(
        isAr
          ? `تم نقل ودمج العلوم بالكامل داخل منصة إنسكو: ${newBooks.length} وحدة تعليم مهني + ${newSims.length} محاكي تفاعلي. كل القراءة والتطبيق يتم داخل المنصة دون أي روابط خارجية.`
          : `All sciences are now hosted inside INSCO Platform: ${newBooks.length} Vocational Education modules + ${newSims.length} Interactive Simulators.`
      );
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      if (status === 401) setNeedsAuth(true);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImportingAcademy(false);
    }
  };

  const handleLocalFilesImport = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setImportingAcademy(true);
    setError(null);
    setStatusNotice(null);
    setImportProgress({ done: 0, total: files.length });

    const newBooks: ImportedVocationalBookEntry[] = [];
    const newSims: ImportedDriveSimulator[] = [];

    try {
      for (let idx = 0; idx < files.length; idx += 1) {
        const localFile = files[idx];
        const classified = classifyDriveItem({
          id: `local-${localFile.name.replace(/[^a-zA-Z0-9]/g, '-')}-${localFile.size}`,
          name: localFile.name,
          mimeType: localFile.type || 'application/octet-stream',
          sizeBytes: localFile.size,
          folderPath: '/',
        });
        const extracted = await extractLocalFile(localFile);
        if (classified.category === 'simulators') {
          newSims.push(buildImportedSimulatorLab(classified, extracted));
        } else {
          const book = buildVocationalEdbBook(classified, extracted);
          const indexEntry = buildEdbIndexEntryFromVocationalBook(book);
          newBooks.push({
            book,
            indexEntry,
            sourceFileId: classified.id,
            discipline: classified.discipline,
            suggestedLabTab: classified.suggestedTab,
            importedAt: new Date().toISOString(),
            extractionMethod: extracted.extractionMethod,
          });
        }
        setImportProgress({ done: idx + 1, total: files.length });
      }
      upsertDriveAcademyImport(newBooks, newSims);
      setStatusNotice(
        isAr
          ? `تم دمج ${files.length} ملفاً محلياً داخل المنصة (${newBooks.length} تعليم مهني + ${newSims.length} محاكي).`
          : `Integrated ${files.length} local file(s) inside the platform (${newBooks.length} vocational modules + ${newSims.length} simulators).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImportingAcademy(false);
      if (localUploadRef.current) localUploadRef.current.value = '';
    }
  };

  const openSuggestedDestination = (tab: AcademyTab) => {
    if (onOpenTab) {
      onOpenTab(tab);
      return;
    }
    if (onOpenLab && (tab === 'ge_exposure_time' || tab === 'sim_labs_rt' || tab === 'rt_lab' || tab === 'weld_simulator' || tab === 'dac_builder' || tab === 'v1_v2_calibration' || tab === 'paut_controller' || tab === 'pwht_curve' || tab === 'defects')) {
      onOpenLab(tab);
      return;
    }
    window.location.hash = `#${tab}`;
  };

  return (
    <section
      id="insco-drive-organizer"
      data-testid="google-drive-organizer"
      className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-[#0e152d] via-[#0b1024] to-[#080b18] p-5 sm:p-6 space-y-4 shadow-xl"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-sky-300">
            <FolderKanban className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'استيراد العلوم إلى داخل منصة إنسكو · تعليم مهني ومحاكيات' : 'In-Platform Science Importer · Vocational Ed & Simulators'}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            {isAr
              ? 'نقل كل العلوم من المجلد إلى داخل الأكاديمية (تعليم مهني ومحاكيات)'
              : 'Bring Sciences into INSCO Academy (Vocational Ed & Simulators)'}
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {isAr
              ? 'يستخلص الكتب والمناهج والتجارب من الرابط أو من جهازك ويحوّلها بالكامل إلى وحدات تعليم مهني ومعامل محاكاة تعمل 100% داخل منصة إنسكو دون أي تحويل أو تشغيل على منصات أخرى.'
              : 'Extracts books, study guides, and labs from the folder or local files directly into INSCO Academy Vocational Education & Interactive Simulators — hosted 100% inside this platform.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!needsAuth && authEmail ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[180px]">{authEmail}</span>
              <button
                type="button"
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'فصل' : 'Sign out'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authBusy}
              data-testid="google-drive-signin-btn"
              className="gsi-material-button inline-flex items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-md transition hover:bg-slate-100 cursor-pointer disabled:opacity-60"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper flex items-center gap-2.5">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-4 h-4 shrink-0 block"
                    aria-hidden="true"
                  >
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {authBusy
                    ? (isAr ? 'جاري الربط...' : 'Connecting...')
                    : (isAr ? 'جلب العلوم من حساب Google' : 'Connect Source Folder')}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Folder URL Bar + Direct Local Upload */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={folderInput}
          onChange={e => setFolderInput(e.target.value)}
          dir="ltr"
          aria-label={isAr ? 'رابط أو معرف المجلد المصدر' : 'Source Folder URL or ID'}
          placeholder="https://drive.google.com/drive/folders/..."
          className="flex-1 rounded-xl border border-[#2d3666] bg-[#0a0f24] px-3.5 py-2 text-xs font-mono text-slate-100 focus:border-sky-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => (needsAuth ? void handleGoogleLogin() : void loadFolder())}
          disabled={loadingFiles || authBusy}
          data-testid="google-drive-scan-btn"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-xs font-black text-slate-950 transition cursor-pointer disabled:opacity-60"
        >
          {loadingFiles ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" /> : <FolderSync className="w-4 h-4 shrink-0" aria-hidden="true" />}
          <span>{isAr ? 'فحص الرابط وتصنيف العلوم' : 'Scan & Classify'}</span>
        </button>
        <button
          type="button"
          onClick={() => localUploadRef.current?.click()}
          disabled={importingAcademy}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-200 transition cursor-pointer disabled:opacity-60"
        >
          <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{isAr ? 'رفع ملفات للمنصة' : 'Upload to Platform'}</span>
        </button>
        <input
          ref={localUploadRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,.html,.htm,.json"
          className="hidden"
          onChange={e => void handleLocalFilesImport(e.target.files)}
        />
      </div>

      {/* Live In-Platform Summary Bar */}
      {(driveLibrary.books.length > 0 || driveLibrary.simulators.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          <span>
            {isAr
              ? `نشط حالياً داخل منصة إنسكو: ${driveLibrary.books.length} وحدة تعليم مهني + ${driveLibrary.simulators.length} محاكي تفاعلي.`
              : `Currently hosted inside INSCO Platform: ${driveLibrary.books.length} Vocational modules + ${driveLibrary.simulators.length} Simulators.`}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openSuggestedDestination('knowledge')}
              className="rounded-lg border border-amber-400/50 bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-200 cursor-pointer"
            >
              {isAr ? 'فتح التعليم المهني (#knowledge)' : 'Open Vocational Lessons'}
            </button>
            <button
              type="button"
              onClick={() => openSuggestedDestination('workshops')}
              className="rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-200 cursor-pointer"
            >
              {isAr ? 'فتح معامل المحاكاة (#workshops)' : 'Open Simulation Labs'}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {statusNotice ? (
        <div role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{statusNotice}</span>
        </div>
      ) : null}

      {/* Classified Results Dashboard */}
      {items.length > 0 && (
        <div className="space-y-4 pt-1">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-2xl border p-3.5 text-start transition cursor-pointer ${
                filter === 'all' ? 'border-sky-400 bg-sky-500/15' : 'border-[#26305c] bg-[#0b1024] hover:border-sky-400/50'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>{isAr ? 'إجمالي العلوم المكتشفة' : 'Total Discovered'}</span>
                <Sparkles className="w-4 h-4 shrink-0 text-sky-400" aria-hidden="true" />
              </div>
              <p className="mt-1 text-2xl font-black text-white">{items.length}</p>
            </button>

            <button
              type="button"
              onClick={() => setFilter('education')}
              className={`rounded-2xl border p-3.5 text-start transition cursor-pointer ${
                filter === 'education' ? 'border-amber-400 bg-amber-500/15' : 'border-[#26305c] bg-[#0b1024] hover:border-amber-400/50'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-amber-300">
                <span>{isAr ? 'التعليم المهني والمناهج' : 'Vocational Education'}</span>
                <BookOpen className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
              </div>
              <p className="mt-1 text-2xl font-black text-white">{educationItems.length}</p>
            </button>

            <button
              type="button"
              onClick={() => setFilter('simulators')}
              className={`rounded-2xl border p-3.5 text-start transition cursor-pointer ${
                filter === 'simulators' ? 'border-emerald-400 bg-emerald-500/15' : 'border-[#26305c] bg-[#0b1024] hover:border-emerald-400/50'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-emerald-300">
                <span>{isAr ? 'المحاكيات والمعامل التفاعلية' : 'Interactive Simulators'}</span>
                <FlaskConical className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden="true" />
              </div>
              <p className="mt-1 text-2xl font-black text-white">{simulatorItems.length}</p>
            </button>
          </div>

          {/* Search & Primary In-Platform Import Action */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 shrink-0 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" aria-hidden="true" />
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder={isAr ? 'ابحث باسم الملف أو التخصص...' : 'Search filename or NDT method...'}
                className="w-full rounded-xl border border-[#2d3666] bg-[#0a0f24] ps-8 pe-3 py-1.5 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={importingAcademy || items.length === 0}
                onClick={() => void handleImportSciencesToAcademy()}
                data-testid="google-drive-import-academy-btn"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 transition cursor-pointer disabled:opacity-50"
              >
                {importingAcademy ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                <span>
                  {importingAcademy
                    ? (isAr ? `جاري بناء المحتوى داخل المنصة (${importProgress.done}/${importProgress.total})...` : `Building inside platform (${importProgress.done}/${importProgress.total})...`)
                    : (isAr ? 'وضع كل العلوم داخل المنصة (تعليم مهني + محاكيات)' : 'Put All Sciences Inside Platform (Vocational Ed & Simulators)')}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportIndex}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#2d3666] bg-[#101633] hover:border-sky-400/60 px-3 py-2 text-xs font-bold text-slate-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'تصدير الفهرس' : 'Export Index'}</span>
              </button>
            </div>
          </div>

          {importingAcademy && (
            <div className="space-y-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-[11px] font-bold text-emerald-300">
                {isAr
                  ? `جارٍ استخلاص العلوم وتحويلها إلى وحدات تعليم مهني ومحاكيات داخل المنصة (${importProgress.done} / ${importProgress.total})...`
                  : `Extracting sciences into in-platform Vocational Education & Simulators (${importProgress.done} / ${importProgress.total})...`}
              </p>
              <progress
                value={importProgress.done}
                max={Math.max(1, importProgress.total)}
                className="w-full h-2 overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:bg-emerald-400 [&::-moz-progress-bar]:bg-emerald-400"
              />
            </div>
          )}

          {/* File Classification List (100% On-Platform Controls) */}
          <div className="grid gap-2 max-h-[420px] overflow-y-auto pe-1">
            {filteredItems.map(item => {
              const isSim = item.category === 'simulators';
              const importedBook = importedBookBySourceId.get(item.id);
              const importedSim = importedSimBySourceId.get(item.id);
              return (
                <div
                  key={item.id}
                  data-testid="google-drive-file-row"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-[#252e58] bg-[#090e21] p-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-black ${
                          isSim
                            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-400/40 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {isSim ? <FlaskConical className="w-3 h-3 shrink-0" aria-hidden="true" /> : <BookOpen className="w-3 h-3 shrink-0" aria-hidden="true" />}
                        <span>{isSim ? (isAr ? 'محاكيات' : 'Simulators') : (isAr ? 'تعليم مهني' : 'Vocational Ed')}</span>
                      </span>
                      <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-sky-300">
                        {item.discipline}
                      </span>
                      {(importedBook || importedSim) ? (
                        <span className="text-[10px] font-bold text-emerald-400">
                          ✓ {isAr ? 'داخل المنصة' : 'In platform'}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatFileSize(item.sizeBytes)} · {isAr ? item.reasonAr : item.reasonEn}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {importedBook && onOpenImportedBook ? (
                      <button
                        type="button"
                        onClick={() => onOpenImportedBook(importedBook.book, importedBook.indexEntry)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-2.5 py-1 text-[10px] font-black text-slate-950 cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>{isAr ? 'فتح كتعليم مهني' : 'Open Vocational Ed'}</span>
                      </button>
                    ) : importedSim ? (
                      <button
                        type="button"
                        onClick={() => openSuggestedDestination('workshops')}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1 text-[10px] font-black text-slate-950 cursor-pointer"
                      >
                        <FlaskConical className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>{isAr ? 'تشغيل المحاكي' : 'Run Simulator'}</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => toggleItemCategory(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-900 hover:border-sky-400 px-2.5 py-1 text-[10px] font-bold text-slate-200 cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>{isSim ? (isAr ? 'تحويل لتعليم مهني' : 'Set Vocational Ed') : (isAr ? 'تحويل لمحاكي' : 'Set Simulator')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSuggestedDestination(item.suggestedTab)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-300 cursor-pointer"
                    >
                      <span>{isAr ? `معمل #${item.suggestedTab}` : `Lab #${item.suggestedTab}`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
