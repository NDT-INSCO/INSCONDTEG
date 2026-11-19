import React, { useMemo } from 'react';
import { buildCompanyDossierUrl, buildQrVectorGeometry } from '../../client/companyQr';

interface CompanyQrBadgeProps {
  companyId: string;
  companyName?: string;
  sizePx?: number;
  baseUrlOverride?: string;
  className?: string;
}

/**
 * Crisp, scannable SVG QR code generated synchronously from the company's
 * individual Firestore ID -> `#client/companies/<companyId>`.
 */
export const CompanyQrBadge: React.FC<CompanyQrBadgeProps> = ({
  companyId,
  companyName,
  sizePx = 144,
  baseUrlOverride,
  className = '',
}) => {
  const dossierUrl = useMemo(
    () => buildCompanyDossierUrl(companyId, baseUrlOverride),
    [companyId, baseUrlOverride]
  );

  const geometry = useMemo(() => buildQrVectorGeometry(dossierUrl, 2), [dossierUrl]);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-white p-2.5 border border-slate-200 shadow-sm ${className}`}
      data-testid={`company-qr-badge-${companyId}`}
      data-qr-target={dossierUrl}
    >
      <svg
        role="img"
        aria-label={
          companyName
            ? `QR code for ${companyName} (${companyId})`
            : `QR code for company ${companyId}`
        }
        width={sizePx}
        height={sizePx}
        viewBox={`0 0 ${geometry.totalSize} ${geometry.totalSize}`}
        shapeRendering="crispEdges"
      >
        <rect
          width={geometry.totalSize}
          height={geometry.totalSize}
          fill="#ffffff"
        />
        <path d={geometry.pathData} fill="#0f172a" />
      </svg>
    </div>
  );
};
