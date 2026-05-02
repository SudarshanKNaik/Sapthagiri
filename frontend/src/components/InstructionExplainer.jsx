import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

// Simplifies complex instructions and can read them aloud.
export default function InstructionExplainer({ sessionId, instruction }) {
  const [simplified, setSimplified] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!instruction) return;
      try {
        const res = await apiFetch("/api/simplify", {
          sessionId,
          method: "POST",
          body: { text: instruction },
        });
        if (!cancelled) setSimplified(res.simplified || "");
      } catch {
        if (!cancelled) setSimplified(instruction);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instruction, sessionId]);

  const speak = (text) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  };

  if (!instruction) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
      <div className="text-xs font-semibold text-slate-500">Simple help</div>
      <div className="mt-1 text-base font-bold text-slate-900">{simplified || instruction}</div>
      <button
        type="button"
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
        onClick={() => speak(simplified || instruction)}
      >
        Listen
      </button>
    </div>
  );
}
