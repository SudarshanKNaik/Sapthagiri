import React, { useRef } from "react";

// Large tappable upload tile for low-digital-literacy UX.
export default function DocumentUploadCard({ title, subtitle, status = "missing", onPickFile }) {
  const inputRef = useRef(null);

  const statusStyles = {
    missing: "border-slate-200 bg-white border-dashed hover:border-indigo-400 hover:bg-slate-50",
    uploaded: "border-indigo-200 bg-indigo-50",
    warning: "border-amber-200 bg-amber-50",
  };

  const statusText = {
    missing: "Not added",
    uploaded: "Added",
    warning: "Check",
  };

  const badgeStyles = {
    missing: "bg-slate-100 text-slate-500",
    uploaded: "bg-indigo-100 text-indigo-700",
    warning: "bg-amber-100 text-amber-700",
  }

  return (
    <div className={`rounded-xl border-2 p-5 text-left transition-all ${statusStyles[status] || statusStyles.missing}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-base font-bold ${status === 'uploaded' ? 'text-indigo-900' : 'text-slate-800'}`}>{title}</div>
          {subtitle ? <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        <div className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${badgeStyles[status] || badgeStyles.missing}`}>
          {statusText[status] || status}
        </div>
      </div>

      <button
        type="button"
        className={`mt-6 w-full rounded-lg px-4 py-3 text-sm font-bold transition-all ${
          status === "uploaded" 
            ? "bg-white border-2 border-indigo-100 text-indigo-600 shadow-sm hover:border-indigo-200" 
            : "bg-slate-900 text-white shadow-sm hover:bg-slate-800"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        {status === "uploaded" ? "Replace photo" : "Upload photo"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onPickFile?.(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
