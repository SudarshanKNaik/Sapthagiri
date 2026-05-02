import React from "react";

// CAPTCHA cannot be automated; we provide visual + audio guidance.
export default function CaptchaAssistScreen({ onDone }) {
  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(
        "Please complete the CAPTCHA shown on the screen. If you need help, ask someone nearby to read the letters or numbers."
      );
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
        <div className="text-xl font-bold text-slate-900">CAPTCHA help</div>
        <div className="mt-2 text-slate-700">
          This step needs a human. Please fill the CAPTCHA on the portal.
        </div>
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
        onClick={onDone}
      >
        I completed CAPTCHA
      </button>
    </div>
  );
}
