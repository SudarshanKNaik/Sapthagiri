import React, { useEffect, useMemo, useRef, useState } from "react";

// Voice controller:
// - Reads text via TTS
// - Listens for simple commands (yes, change, stop, next, explain)
// Uses Web Speech API; on unsupported browsers, degrades gracefully.
export default function VoiceAssistantController({ onCommand, language = "en" }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const recognition = useMemo(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;
    r.lang = language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-IN";
    return r;
  }, [language]);

  useEffect(() => {
    if (!recognition) return;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      const normalized = transcript.trim().toLowerCase();
      onCommand?.(normalized);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
  }, [recognition, onCommand]);

  const speak = (text) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-IN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    setListening(true);
    recognitionRef.current.start();
  };

  const stopAll = () => {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setListening(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
      <div className="text-xs font-semibold text-slate-500">Voice assistant</div>
      <div className="mt-1 text-sm text-slate-700">Commands: yes, change, next, stop, explain</div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!recognition || listening}
          onClick={startListening}
        >
          {listening ? "Listening..." : "Speak"}
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
          onClick={stopAll}
        >
          Stop
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
          onClick={() => speak("Tell me: yes, change, next, stop, explain")}
        >
          Help
        </button>
      </div>
      {!recognition ? (
        <div className="mt-3 text-xs text-slate-500">Voice recognition not supported in this browser.</div>
      ) : null}
    </div>
  );
}
