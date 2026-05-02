import React, { useRef } from "react";

// Large tappable upload tile for low-digital-literacy UX.
export default function DocumentUploadCard({ title, subtitle, status = "missing", onPickFile }) {
  const inputRef = useRef(null);

  const statusStyles = {
    missing: "border-red-300 bg-white",
    uploaded: "border-green-400 bg-white",
    warning: "border-amber-400 bg-white",
  };

  const statusText = {
    missing: "Not added",
    uploaded: "Added",
    warning: "Check",
  };

  return (
    <div className={`rounded-2xl border-2 p-4 text-left ${statusStyles[status] || statusStyles.missing}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-0.5 text-sm text-slate-600">{subtitle}</div> : null}
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {statusText[status] || status}
        </div>
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-4 text-base font-semibold text-white"
        onClick={() => inputRef.current?.click()}
      >
        Upload photo
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
