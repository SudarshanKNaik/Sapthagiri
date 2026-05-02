import React from "react";

export default function ReasoningPanel({ activeScheme, confidenceMap, lastOcr }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-800 uppercase tracking-wider">Model Reasoning</h3>
        <p className="text-xs text-slate-600">
          This panel explains how SAHAYAK AI interprets your data and determines eligibility.
        </p>
      </div>

      {lastOcr && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-2 text-xs font-bold text-slate-700">OCR Confidence Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(lastOcr.confidence || {})
              .filter(([_, val]) => Number(val) > 0)
              .map(([key, val]) => {
                const score = Number(val);
                let color = "bg-ai-conf-high text-white";
                if (score < 60) color = "bg-ai-conf-low text-white";
                else if (score < 90) color = "bg-ai-conf-med text-white";

                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 capitalize">{key}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${color}`}>
                      {score.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {activeScheme && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-2 text-xs font-bold text-slate-700">Eligibility Rules Match</h4>
          <p className="text-xs font-semibold text-ai-secondary mb-3">{activeScheme.name}</p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex justify-between">
              <span>Income Limit:</span>
              <span className="font-semibold text-slate-900">₹{activeScheme.rules?.income_limit}</span>
            </li>
            <li className="flex justify-between">
              <span>Min Marks:</span>
              <span className="font-semibold text-slate-900">{activeScheme.rules?.min_marks}%</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
