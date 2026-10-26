import React, { useRef, useState, useEffect } from 'react';
import { Eraser, PenTool, Check, Sparkles } from 'lucide-react';
import { Language } from '../../../types';

interface VirtualSignaturePadProps {
  language: Language;
  inspectorName: string;
  onSignatureChange: (signatureDataUrl: string | null) => void;
}

export const VirtualSignaturePad: React.FC<VirtualSignaturePadProps> = ({
  language,
  inspectorName,
  onSignatureChange,
}) => {
  const isAr = language === 'ar';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundGuideline(ctx, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  const drawBackgroundGuideline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(15, height - 18);
    ctx.lineTo(width - 15, height - 18);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.font = '10px monospace';
    ctx.fillText('X _________________________', 15, height - 8);
  };

  // Generate an automated cursive electronic signature
  const generatePresetSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundGuideline(ctx, canvas.width, canvas.height);

    ctx.save();
    ctx.font = 'italic bold 22px "Brush Script MT", "Caveat", "Dancing Script", cursive, serif';
    ctx.fillStyle = '#2563eb';
    ctx.shadowColor = 'rgba(37, 99, 235, 0.3)';
    ctx.shadowBlur = 4;
    ctx.fillText(inspectorName || 'Eng. Ahmed M.', 25, 45);

    // Dynamic underline flourish
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(25, 52);
    ctx.bezierCurveTo(90, 56, 160, 44, 220, 50);
    ctx.stroke();
    ctx.restore();

    setHasSignature(true);
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawBackgroundGuideline(ctx, canvas.width, canvas.height);
    generatePresetSignature();
  }, []);

  // Mouse / Touch drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="space-y-2 p-3.5 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-200 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isAr ? 'لوحة التوقيع الإلكتروني الافتراضي (Digital Signature Pad):' : 'Virtual Electronic Signature Pad:'}</span>
        </span>
        <span className="text-[10px] text-cyan-400">
          {hasSignature ? (isAr ? '✓ التوقيع موثّق' : '✓ Signature Captured') : (isAr ? 'ارسم توقيعك هنا' : 'Draw signature here')}
        </span>
      </div>

      <div className="relative rounded-lg border border-slate-700 bg-white/95 overflow-hidden shadow-inner cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={320}
          height={75}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-20 select-none block"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={clearCanvas}
          className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px]"
        >
          <Eraser className="w-3 h-3 text-rose-400" />
          <span>{isAr ? 'مسح التوقيع' : 'Clear'}</span>
        </button>

        <button
          type="button"
          onClick={generatePresetSignature}
          className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-400 hover:text-cyan-300 transition cursor-pointer flex items-center gap-1 text-[11px]"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{isAr ? 'توقيع معتمد تلقائي' : 'Auto Sign'}</span>
        </button>
      </div>
    </div>
  );
};
