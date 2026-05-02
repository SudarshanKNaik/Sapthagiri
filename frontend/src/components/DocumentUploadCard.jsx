import React, { useRef } from "react";

// Large tappable upload tile for low-digital-literacy UX.
export default function DocumentUploadCard({ id, highlighted = false, title, subtitle, status = "missing", onPickFile }) {
  const inputRef = useRef(null);

  const statusStyles = {
    missing: "border-[var(--border)] bg-white hover:border-[var(--border-dark)]",
    uploaded: "border-[var(--lime-strong)] bg-[var(--lime)]",
    warning: "border-amber-200 bg-amber-50",
  };

  const statusText = {
    missing: "Not added",
    uploaded: "Added",
    warning: "Check",
  };

  const badgeStyles = {
    missing: "badge badge-outline",
    uploaded: "badge badge-lime",
    warning: "badge bg-amber-100 text-amber-700",
  }

  return (
    <div className={`card-tile border-2 min-h-[220px] transition-all ${
      highlighted
        ? "border-indigo-500 bg-indigo-50 shadow-[0_0_0_4px_rgba(99,102,241,0.35)] animate-pulse"
        : statusStyles[status] || statusStyles.missing
    }`}>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 mt-2">
        <h3 className="text-base font-bold text-gray-900 leading-tight">{title}</h3>
        {highlighted && (
          <div className="text-xs font-bold text-indigo-600 animate-bounce">
            👆 Tap to Upload!
          </div>
        )}
        {subtitle && <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div>}
      </div>

      <div className="mt-auto pt-4 w-full flex flex-col items-center justify-center gap-3">
        <div className={badgeStyles[status] || badgeStyles.missing}>
          {statusText[status] || status}
        </div>
        <button
          id={id}
          type="button"
          className={`w-full px-4 py-2 text-sm font-bold transition-all ${
            highlighted
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
              : status === "uploaded"
                ? "btn-outline-dark bg-white"
                : "btn-primary"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          {highlighted ? "📁 Tap Here to Upload" : status === "uploaded" ? "Replace photo" : "Upload photo"}
        </button>
      </div>

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
