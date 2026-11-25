/**
 * Light and Dark surface tokens for the INSCO Engineering Network.
 * Mirrors `useTheme()` so the entire #network portal seamlessly supports both themes.
 */
export function networkSurface(isLight: boolean) {
  return {
    shell: isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#07070f] text-slate-200',
    header: isLight
      ? 'border-b border-slate-200 bg-white/95 text-slate-900 shadow-xs'
      : 'border-b border-violet-500/20 bg-[#0a0a18] text-white',
    footer: isLight
      ? 'mt-4 border-t border-slate-200 bg-white py-6 text-[11px] text-slate-600'
      : 'mt-4 border-t border-[#232345] bg-[#08080f] py-6 text-[11px] text-slate-400',
    card: isLight
      ? 'rounded-xl border border-slate-200 bg-white shadow-xs'
      : 'rounded-xl border border-[#232345] bg-[#0f0f22]',
    subCard: isLight
      ? 'rounded-lg border border-slate-200 bg-slate-50'
      : 'rounded-lg border border-[#232345] bg-[#0b0b18]',
    input: isLight
      ? 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none'
      : 'w-full min-w-0 rounded-lg border border-[#2a2a4d] bg-[#0b0b18] px-2.5 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-400 focus:outline-none',
    chip: isLight
      ? 'rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700'
      : 'rounded border border-[#2a2a4d] bg-[#14142a] px-1.5 py-0.5 text-[10px] text-slate-300',
    buttonSecondary: isLight
      ? 'inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 transition cursor-pointer hover:border-violet-500 hover:text-violet-700'
      : 'inline-flex items-center gap-1 rounded-lg border border-[#2a2a4d] bg-[#14142a] px-2.5 py-1 text-[10px] font-bold text-slate-300 transition cursor-pointer hover:border-violet-400/50 hover:text-white',
    buttonPrimary:
      'inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white transition cursor-pointer hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50',
    navInactive: isLight
      ? 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-800'
      : 'border border-[#232345] bg-[#101028] text-slate-300 hover:border-violet-400/50 hover:text-white',
    navActive: isLight
      ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/20'
      : 'bg-violet-500 text-slate-950 shadow-md shadow-violet-500/20',
    heading: isLight ? 'text-slate-900' : 'text-white',
    subtext: isLight ? 'text-slate-600' : 'text-slate-400',
    muted: isLight ? 'text-slate-500' : 'text-slate-500',
    divider: isLight ? 'border-slate-200' : 'border-[#1d1d38]',
    divideList: isLight ? 'divide-slate-200' : 'divide-[#1d1d38]',
  };
}
