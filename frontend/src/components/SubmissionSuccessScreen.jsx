import React from "react";

export default function SubmissionSuccessScreen({ trackingId, onGoHistory }) {
  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(`Submitted successfully. Your tracking ID is ${trackingId}`);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
        <div className="text-xl font-bold text-slate-900">Submitted</div>
        <div className="mt-2 text-slate-700">Tracking ID</div>
        <div className="mt-1 text-2xl font-extrabold text-slate-900">{trackingId}</div>
        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-900"
          onClick={speak}
        >
          Listen
        </button>
      </div>
      <button
        type="button"
        className="w-full rounded-xl bg-slate-900 px-4 py-4 text-base font-semibold text-white"
        onClick={onGoHistory}
      >
        View history
      </button>
    </div>
  );
}
