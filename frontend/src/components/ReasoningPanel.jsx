import React from "react";

export default function ReasoningPanel({ activeScheme, confidenceMap, lastOcr }) {
  const hasOcrData = lastOcr && Object.keys(lastOcr.confidence || {}).length > 0;
  const hasScheme = !!activeScheme;

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4Z"/>
              <circle cx="12" cy="15" r="2"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Model Reasoning</h3>
            <p className="text-[10px] font-medium text-slate-400">AI decision transparency</p>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mb-5">
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-bold border ${
          hasOcrData 
            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
            : "bg-slate-50 text-slate-500 border-slate-100"
        }`}>
          <span className={`w-2 h-2 rounded-full ${hasOcrData ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
          {hasOcrData ? "Data Extracted" : "Awaiting Documents"}
        </div>
      </div>

      {/* How It Works - shown when no data */}
      {!hasOcrData && !hasScheme && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">How It Works</h4>
          {[
            { step: "1", label: "Upload documents", desc: "Aadhaar, Income, Marks, Bank" },
            { step: "2", label: "AI extracts fields", desc: "OCR + NLP processing" },
            { step: "3", label: "Match scholarships", desc: "Rule-based eligibility engine" },
            { step: "4", label: "Auto-fill & apply", desc: "One-click submission" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 group">
              <div className="h-6 w-6 shrink-0 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-extrabold text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                {item.step}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">{item.label}</div>
                <div className="text-[10px] text-slate-400 font-medium">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OCR Confidence Breakdown */}
      {hasOcrData && (
        <div className="mb-5">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Confidence Breakdown</h4>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
            {Object.entries(lastOcr.confidence || {})
              .filter(([_, val]) => Number(val) > 0)
              .sort(([, a], [, b]) => Number(b) - Number(a))
              .map(([key, val]) => {
                const score = Number(val);
                let barColor = "bg-ai-conf-high";
                let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                let label = "High";
                if (score < 60) {
                  barColor = "bg-ai-conf-low";
                  badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                  label = "Low";
                } else if (score < 90) {
                  barColor = "bg-ai-conf-med";
                  badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                  label = "Medium";
                }

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-slate-600 capitalize">{key.replace(/_/g, " ")}</span>
                      <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${badgeColor}`}>
                        {label} · {score.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Extracted Fields Summary */}
      {lastOcr?.extracted && Object.keys(lastOcr.extracted).length > 0 && (
        <div className="mb-5">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Extracted Fields</h4>
          <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="space-y-1.5">
              {Object.entries(lastOcr.extracted).slice(0, 8).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-1 px-1 rounded-md hover:bg-slate-50 transition-colors">
                  <span className="text-[10px] font-semibold text-slate-500 capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="text-[10px] font-bold text-slate-800 max-w-[120px] truncate text-right">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Rules Match */}
      {hasScheme && (
        <div className="mb-5">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Eligibility Match</h4>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
              <span className="text-xs font-bold text-indigo-800">{activeScheme.name}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-indigo-100/60">
                <span className="text-[11px] font-medium text-indigo-600/80">Income Limit</span>
                <span className="text-[11px] font-bold text-indigo-900">₹{activeScheme.income_limit?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-indigo-100/60">
                <span className="text-[11px] font-medium text-indigo-600/80">Min Marks</span>
                <span className="text-[11px] font-bold text-indigo-900">{activeScheme.min_marks}%</span>
              </div>
              {activeScheme.amount && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[11px] font-medium text-indigo-600/80">Award Amount</span>
                  <span className="text-[11px] font-bold text-indigo-900">₹{activeScheme.amount?.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tech Stack Footer */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2.5">Powered By</h4>
        <div className="flex flex-wrap gap-1.5">
          {["Tesseract OCR", "Grok AI", "Rule Engine"].map((tech) => (
            <span key={tech} className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500 border border-slate-50">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
