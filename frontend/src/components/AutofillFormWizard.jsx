import React, { useEffect, useMemo, useState } from "react";
import ConfidenceFieldWrapper from "./ConfidenceFieldWrapper";
import InstructionExplainer from "./InstructionExplainer";
import VoiceAssistantController from "./VoiceAssistantController";
import ReadinessProgressMeter from "./ReadinessProgressMeter";

function computeReadiness(form) {
  const required = [
    "name",
    "dob",
    "income",
    "marks",
    "accountNumber",
    "ifsc",
  ];
  const filled = required.filter((k) => String(form?.[k] || "").trim().length > 0);
  return Math.round((filled.length / required.length) * 100);
}

// Multi-step form wizard:
// - Autofills from locker profile
// - Highlights confidence
// - Allows edits
// - Supports basic voice commands
export default function AutofillFormWizard({ sessionId, language, initialProfile, confidenceMap, onSubmit }) {
  const [step, setStep] = useState(0);
  const [activeField, setActiveField] = useState("name");
  const [correctionMode, setCorrectionMode] = useState(false);

  const [form, setForm] = useState(() => ({
    name: initialProfile?.name || "",
    dob: initialProfile?.dob || "",
    income: initialProfile?.income ? String(initialProfile.income) : "",
    marks: initialProfile?.marks ? String(initialProfile.marks) : "",
    accountNumber: initialProfile?.accountNumber || "",
    ifsc: initialProfile?.ifsc || "",
  }));

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: initialProfile?.name || prev.name,
      dob: initialProfile?.dob || prev.dob,
      income: initialProfile?.income ? String(initialProfile.income) : prev.income,
      marks: initialProfile?.marks ? String(initialProfile.marks) : prev.marks,
      accountNumber: initialProfile?.accountNumber || prev.accountNumber,
      ifsc: initialProfile?.ifsc || prev.ifsc,
    }));
  }, [initialProfile]);

  const readiness = useMemo(() => computeReadiness(form), [form]);

  const sections = [
    {
      title: "Personal details",
      fields: [
        { key: "name", label: "Name", instruction: "Enter your full name" },
        { key: "dob", label: "Date of birth", instruction: "Enter your date of birth" },
      ],
    },
    {
      title: "Education details",
      fields: [
        { key: "income", label: "Annual income", instruction: "Upload income certificate issued by competent authority" },
        { key: "marks", label: "Marks / Percentage", instruction: "Upload marks card" },
      ],
    },
    {
      title: "Bank details",
      fields: [
        { key: "accountNumber", label: "Account number", instruction: "Enter bank account number" },
        { key: "ifsc", label: "IFSC code", instruction: "Enter IFSC code" },
      ],
    },
  ];

  const current = sections[step];

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

  const speakSection = () => {
    const parts = current.fields.map((f) => `${f.label}: ${form[f.key] || "missing"}`);
    const text = `${current.title}. ${parts.join(". ")}. Say yes if correct, or say change to edit.`;
    speak(text);
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const explainActive = () => {
    const field = current.fields.find((f) => f.key === activeField) || current.fields[0];
    return field?.instruction || "";
  };

  const handleVoiceCommand = (cmd) => {
    if (!cmd) return;

    if (correctionMode) {
      // In correction mode, we treat the whole transcript as the new value.
      setField(activeField, cmd);
      setCorrectionMode(false);
      return;
    }

    if (cmd.includes("stop")) {
      setCorrectionMode(false);
      return;
    }

    if (cmd.includes("next")) {
      if (step < sections.length - 1) setStep((s) => s + 1);
      return;
    }

    if (cmd === "yes") {
      // Treat as confirmation; no-op here, but keeps flow intuitive.
      return;
    }

    if (cmd.includes("change")) {
      setCorrectionMode(true);
      return;
    }

    if (cmd.includes("explain")) {
      speak(explainActive());
    }
  };

  return (
    <div className="space-y-3">
      <ReadinessProgressMeter percent={readiness} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
        <div className="text-xs font-semibold text-slate-500">Confidence colors</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-green-500 bg-white px-3 py-1 text-green-700">Green: verified</span>
          <span className="rounded-full border border-amber-400 bg-white px-3 py-1 text-amber-700">Yellow: check</span>
          <span className="rounded-full border border-red-400 bg-white px-3 py-1 text-red-700">Red: missing/low</span>
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
          onClick={speakSection}
        >
          Read this section
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
        <div className="text-xs font-semibold text-slate-500">Section</div>
        <div className="mt-1 text-xl font-bold text-slate-900">{current.title}</div>
        <div className="mt-1 text-sm text-slate-600">Step {step + 1} of {sections.length}</div>
      </div>

      {current.fields.map((f) => (
        <div key={f.key} className="space-y-2">
          <ConfidenceFieldWrapper label={f.label} confidence={Number(confidenceMap?.[f.key] || 0)}>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              value={form[f.key]}
              onFocus={() => setActiveField(f.key)}
              onChange={(e) => setField(f.key, e.target.value)}
              inputMode={f.key === "income" || f.key === "marks" ? "numeric" : "text"}
            />
          </ConfidenceFieldWrapper>
          <InstructionExplainer sessionId={sessionId} instruction={f.instruction} />
        </div>
      ))}

      <VoiceAssistantController language={language} onCommand={handleVoiceCommand} />

      {correctionMode ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left">
          <div className="text-sm font-semibold text-amber-900">Say the new value now</div>
          <div className="mt-1 text-xs text-amber-800">Field: {activeField}</div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-900 disabled:opacity-50"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        {step < sections.length - 1 ? (
          <button
            type="button"
            className="flex-1 rounded-xl bg-slate-900 px-4 py-4 text-base font-semibold text-white"
            onClick={() => setStep((s) => Math.min(sections.length - 1, s + 1))}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="flex-1 rounded-xl bg-slate-900 px-4 py-4 text-base font-semibold text-white disabled:opacity-50"
            disabled={readiness < 80}
            onClick={() => onSubmit?.(form)}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
