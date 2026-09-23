import * as React from "react";

export function MadeWithMagnusBadge() {
  return (
    <div
      className="pointer-events-auto fixed bottom-3 right-3 z-40 max-w-[calc(100vw-1.5rem)] cursor-pointer select-none rounded-full border border-[#d8e1e8] bg-white/85 px-2.5 py-1.5 shadow-[0_8px_20px_rgba(18,32,41,0.10)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_24px_rgba(18,32,41,0.12)] dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-900 md:bottom-4 md:right-4 md:px-3 md:py-1.5"
      aria-label="Made with Magnus"
      title="Made with Magnus"
    >
      <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.02em] text-[#20364d] dark:text-slate-100 md:text-[11px]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#d8e1e8] bg-[#f5f8fa] text-[10px] font-semibold text-[#16364c] shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          M
        </span>
        <span>Made with Magnus</span>
      </div>
    </div>
  );
}
