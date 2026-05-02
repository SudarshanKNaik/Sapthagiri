import React from "react";

// Checks required docs vs locker docs and suggests upload.
export default function DocumentSuggestionPanel({ requiredDocuments = [], availableDocs = {}, onGoUpload }) {
  const missing = requiredDocuments.filter((d) => !availableDocs?.[d]);

  if (!requiredDocuments.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
      <div className="text-xs font-semibold text-slate-500">Documents</div>
      {missing.length ? (
        <>
          <div className="mt-1 text-base font-bold text-slate-900">Missing: {missing.join(", ")}</div>
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            onClick={() => onGoUpload?.()}
          >
            Upload missing documents
          </button>
        </>
      ) : (
        <div className="mt-1 text-base font-bold text-slate-900">All required documents are available</div>
      )}
    </div>
  );
}
