import React from "react";

// Wraps an input field and shows a confidence-based border color.
// green > 90, yellow 60-90, red < 60 or missing.
export default function ConfidenceFieldWrapper({ label, confidence = 0, children, hint }) {
  let border = "border-red-400";
  if (confidence > 90) border = "border-green-500";
  else if (confidence >= 60) border = "border-amber-400";

  return (
    <div className={`w-full rounded-xl border-2 ${border} bg-white p-3 text-left`}
      aria-label={label}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">{label}</div>
          {hint ? <div className="mt-0.5 text-xs text-slate-500">{hint}</div> : null}
        </div>
        <div className="text-xs font-semibold text-slate-600">{Math.round(confidence)}%</div>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
