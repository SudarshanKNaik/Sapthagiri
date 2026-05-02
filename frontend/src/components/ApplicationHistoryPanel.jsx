import React from "react";

export default function ApplicationHistoryPanel({ history = [] }) {
  return (
    <div className="space-y-3">
      {history.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
          <div className="text-base font-bold text-slate-900">No submissions yet</div>
        </div>
      ) : null}

      {history.map((h) => (
        <div key={h.trackingId} className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
          <div className="text-base font-bold text-slate-900">{h.schemeId}</div>
          <div className="mt-1 text-sm text-slate-700">Tracking: {h.trackingId}</div>
          <div className="mt-1 text-sm text-slate-500">{new Date(h.submittedAt).toLocaleString()}</div>
          <div className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            {h.status}
          </div>
        </div>
      ))}
    </div>
  );
}
