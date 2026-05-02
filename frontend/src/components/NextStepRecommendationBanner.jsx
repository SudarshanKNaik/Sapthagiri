import React from "react";

export default function NextStepRecommendationBanner({ nextAction }) {
  if (!nextAction) return null;
  return (
    <div className="sticky top-0 z-10 mb-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm">
      <div className="text-xs font-semibold text-slate-500">Next step</div>
      <div className="mt-1 text-base font-bold text-slate-900">{nextAction}</div>
    </div>
  );
}
