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
      <div className="card p-6 text-left">
        <div className="text-xl font-bold text-slate-900">CAPTCHA help</div>
        <div className="mt-2 text-slate-700">
          This step needs a human. Please fill the CAPTCHA on the portal.
        </div>
        <button
          type="button"
          className="mt-4 w-full btn-secondary py-4"
          onClick={speak}
        >
          Listen
        </button>
      </div>
      <button
        type="button"
        className="btn-primary w-full py-4 text-base"
        onClick={onDone}
      >
        I completed CAPTCHA
      </button>
    </div>
  );
}
