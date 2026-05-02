import React from "react";

export default function ReadinessProgressMeter({ percent = 0, label = "Application Ready" }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        <div className="text-sm font-bold text-slate-900">{clamped}%</div>
      </div>
      <div className="mt-3 h-3 w-full rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-slate-900" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
