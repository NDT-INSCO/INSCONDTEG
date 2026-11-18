import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { Language } from '../../types';

interface ClientErrorBoundaryProps {
  language: Language;
  children: React.ReactNode;
}

interface ClientErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ClientErrorBoundary extends React.Component<
  ClientErrorBoundaryProps,
  ClientErrorBoundaryState
> {
  constructor(props: ClientErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ClientErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected portal error',
    };
  }

  componentDidCatch(error: Error): void {
    console.error('ClientPortal ErrorBoundary caught:', error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isAr = this.props.language === 'ar';
    return (
      <div
        role="alert"
        className="max-w-2xl mx-auto my-10 rounded-xl border border-rose-500/40 bg-slate-900 p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">
              {isAr
                ? 'تعذّر إتمام العملية في بوابة العملاء'
                : 'Unable to complete Client Portal operation'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'تحقق من صلاحية الحساب أو الاتصال بقاعدة البيانات ثم أعد المحاولة.'
                : 'Please verify your account permissions or database connection and try again.'}
            </p>
            <pre className="mt-2 rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-[11px] font-mono text-rose-300 overflow-x-auto max-h-36">
              {this.state.message}
            </pre>
          </div>
        </div>
        <button
          type="button"
          onClick={() => this.setState({ hasError: false, message: '' })}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
        </button>
      </div>
    );
  }
}
