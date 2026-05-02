import React from "react";

function statusBadge(status) {
  if (status === "eligible") return "bg-green-100 text-green-800";
  if (status === "needs_documents") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function EligibilityDashboard({ results = [], selectedIds = [], onToggleSelect, onStartApply }) {
  return (
    <div className="space-y-3">
      {results.map((r) => (
        <div key={r.scheme.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-bold text-slate-900">{r.scheme.name}</div>
              <div className="mt-1 text-sm text-slate-600">Deadline: {r.scheme.deadline}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(r.status)}`}>{r.status.replace("_", " ")}</div>
              {r.status === "eligible" && r.scheme.min_marks >= 90 && (
                <div className="rounded-full bg-ai-primary/10 px-2 py-0.5 text-[10px] font-bold text-ai-primary border border-ai-primary/20">TOP MATCH ✨</div>
              )}
            </div>
          </div>

          <div className="mt-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-ai-secondary">Benefit:</span>
              <span>{r.scheme.benefit}</span>
            </div>
            
            {r.status !== "eligible" && (
              <div className="mt-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                {r.status === "needs_documents" ? (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Missing documents:</div>
                    <div className="text-xs font-semibold text-slate-600">{(r.missingDocs || []).join(", ")}</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reason:</div>
                    <div className="text-xs font-semibold text-red-600">{(r.reasons || []).join(", ")}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ${selectedIds.includes(r.scheme.id) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"}`}
              onClick={() => onToggleSelect?.(r.scheme.id)}
            >
              {selectedIds.includes(r.scheme.id) ? "Selected" : "Compare"}
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              disabled={r.status === "not_eligible"}
              onClick={() => onStartApply?.(r.scheme)}
            >
              Start
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
