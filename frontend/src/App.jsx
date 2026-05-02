import React, { useEffect, useMemo, useState } from "react";
import { LANGS, t } from "./i18n";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { apiFetch, ocrLangFromUiLang } from "./services/api";
import { computeEligibilityClient } from "./services/eligibilityClient";
import {
  listQueuedSubmissions,
  listQueuedUploads,
  queueSubmission,
  queueUpload,
  removeQueuedSubmission,
  removeQueuedUpload,
} from "./services/offlineQueue";

import DocumentUploadCard from "./components/DocumentUploadCard";
import ConfidenceFieldWrapper from "./components/ConfidenceFieldWrapper";
import EligibilityDashboard from "./components/EligibilityDashboard";
import ScholarshipComparisonTable from "./components/ScholarshipComparisonTable";
import DocumentSuggestionPanel from "./components/DocumentSuggestionPanel";
import AutofillFormWizard from "./components/AutofillFormWizard";
import NextStepRecommendationBanner from "./components/NextStepRecommendationBanner";
import CaptchaAssistScreen from "./components/CaptchaAssistScreen";
import SubmissionSuccessScreen from "./components/SubmissionSuccessScreen";
import ApplicationHistoryPanel from "./components/ApplicationHistoryPanel";

import AgentExecutionTimeline from "./components/AgentExecutionTimeline";
import PromptInputArea from "./components/PromptInputArea";
import ReasoningPanel from "./components/ReasoningPanel";


function computeNextBestAction({ locker, eligibilityResults, formReadiness }) {
  const docs = locker?.documents || {};
  const required = ["aadhaar", "income_certificate", "marks_card", "bank_passbook"];
  const missing = required.filter((d) => !docs[d]);
  if (missing.length) return `Upload: ${missing[0]}`;

  const lowConfidenceKey = Object.entries(locker?.verification || {}).find(([, c]) => Number(c) < 60)?.[0];
  if (lowConfidenceKey) return `Verify: ${lowConfidenceKey}`;

  const bestEligible = (eligibilityResults || []).find((r) => r.status === "eligible" || r.status === "needs_documents");
  if (bestEligible) return "Pick a scholarship and apply";

  if (typeof formReadiness === "number" && formReadiness < 80) return "Complete remaining fields";

  return "";
}

export default function App() {
  const [view, setView] = useState("login");

  const [language, setLanguage] = useLocalStorage("sahayak.language", "en");
  const [sessionId, setSessionId] = useLocalStorage("sahayak.sessionId", "");
  const [phone, setPhone] = useLocalStorage("sahayak.phone", "");
  const [reuse, setReuse] = useLocalStorage("sahayak.reuse", false);
  const [locker, setLocker] = useLocalStorage("sahayak.locker", null);
  const [cachedSchemes, setCachedSchemes] = useLocalStorage("sahayak.cachedSchemes", []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastOcr, setLastOcr] = useState(null);

  const [eligibility, setEligibility] = useState(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [activeScheme, setActiveScheme] = useState(null);
  const [trackingId, setTrackingId] = useState("");
  const [history, setHistory] = useState([]);

  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Cache schemes for offline eligibility.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!online) return;
      try {
        const res = await apiFetch("/api/schemes");
        if (!cancelled) setCachedSchemes(res.schemes || []);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [online, setCachedSchemes]);

  // Auto-sync offline queues when connection returns.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!online || !sessionId) return;
      try {
        const uploads = await listQueuedUploads();
        for (const u of uploads) {
          if (cancelled) return;
          if (u.sessionId !== sessionId) continue;
          try {
            const blob = new Blob([u.buf], { type: u.mime || "application/octet-stream" });
            const file = new File([blob], u.fileName || "upload.jpg", { type: u.mime || "image/jpeg" });
            const fd = new FormData();
            fd.append("file", file);
            fd.append("reuse", u.reuse ? "true" : "false");
            fd.append("ocrLang", u.ocrLang || "eng");

            const res = await apiFetch("/api/ocr/upload", {
              sessionId,
              method: "POST",
              body: fd,
            });
            setLastOcr(res);
            if (res.profile) {
              setLocker((prev) => ({
                ...(prev || {}),
                profile: { ...((prev && prev.profile) || {}), ...(res.profile || {}) },
                documents: { ...((prev && prev.documents) || {}), ...(res.profile.documents || {}) },
              }));
            } else if (res.locker) {
              setLocker(res.locker);
            }
            await removeQueuedUpload(u.id);
          } catch {
            // keep in queue
          }
        }

        const submissions = await listQueuedSubmissions();
        for (const s of submissions) {
          if (cancelled) return;
          if (s.sessionId !== sessionId) continue;
          try {
            const res = await apiFetch("/api/submit", {
              sessionId,
              method: "POST",
              body: { schemeId: s.schemeId, phone: s.phone },
            });
            setTrackingId(res.trackingId);
            await removeQueuedSubmission(s.id);
          } catch {
            // keep in queue
          }
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [online, sessionId, setLocker]);

  useEffect(() => {
    // Restore flow if we already have a session.
    if (sessionId) setView("upload");
  }, [sessionId]);

  const schemesForCompare = useMemo(() => {
    const results = eligibility?.results || [];
    const map = new Map(results.map((r) => [r.scheme.id, r.scheme]));
    return selectedCompareIds.map((id) => map.get(id)).filter(Boolean);
  }, [eligibility, selectedCompareIds]);

  const nextAction = useMemo(() => computeNextBestAction({ locker, eligibilityResults: eligibility?.results }), [locker, eligibility]);

  async function doLogin() {
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: { phone },
      });
      setSessionId(res.sessionId);
      setView("language");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveLanguage(lang) {
    setLanguage(lang);
    if (!sessionId) return;
    try {
      await apiFetch("/api/language", { sessionId, method: "POST", body: { language: lang } });
    } catch {
      // ignore
    }
  }

  async function refreshLocker() {
    if (!sessionId) return;
    try {
      const res = await apiFetch("/api/locker", { sessionId });
      setLocker(res.locker);
    } catch {
      // ignore
    }
  }

  async function handleUpload(expectedType, file) {
    if (!online) {
      setError("");
      setBusy(true);
      try {
        await queueUpload({
          sessionId,
          reuse,
          ocrLang: ocrLangFromUiLang(language),
          file,
        });

        // Mark pending doc upload in locker UI.
        setLocker((prev) => ({
          ...(prev || {}),
          documentsPending: {
            ...((prev && prev.documentsPending) || {}),
            pending: true,
          },
        }));
      } catch {
        setError("Offline queue failed");
      } finally {
        setBusy(false);
      }
      return;
    }
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("reuse", reuse ? "true" : "false");
      fd.append("ocrLang", ocrLangFromUiLang(language));

      const res = await apiFetch("/api/ocr/upload", {
        sessionId,
        method: "POST",
        body: fd,
      });
      
      const friendlyName = {
        aadhaar: "Aadhaar",
        income_certificate: "Income Certificate",
        marks_card: "Marks Card",
        bank_passbook: "Bank Passbook"
      }[expectedType] || "document";

      if (res.docTypeDetected === "unknown") {
        setError(`This is not a valid ${friendlyName}. Please upload another one.`);
        return;
      }
      
      if (res.docTypeDetected !== expectedType) {
        setError(`You selected ${friendlyName}, but I detected a ${res.docTypeDetected}. Please try uploading the correct document.`);
      }
      
      setLastOcr(res);
      // Merge the returned profile (which includes documents) into local locker state
      if (res.profile) {
        setLocker((prev) => ({
          ...(prev || {}),
          profile: { ...((prev && prev.profile) || {}), ...(res.profile || {}) },
          documents: { ...((prev && prev.documents) || {}), ...(res.profile.documents || {}) },
          verification: { ...((prev && prev.verification) || {}), ...(res.confidence || {}) },
        }));
      } else if (res.locker) {
        setLocker(res.locker);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadEligibility() {
    const docs = locker?.documents || {};
    const coreDocs = ["aadhaar", "income_certificate", "marks_card", "bank_passbook"];
    const missing = coreDocs.filter(d => !docs[d]);
    
    if (missing.length > 0) {
      setError(`Please upload all required documents first.`);
      return;
    }

    if (!online) {
      // Offline eligibility from cached schemes + current locker.
      const profile = {
        ...(locker?.profile || {}),
        documents: locker?.documents || {},
        state: "Karnataka",
      };
      const results = computeEligibilityClient({ profile, schemes: cachedSchemes });
      setEligibility({ profile, results });
      setView("eligibility");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch("/api/eligibility", { sessionId, method: "POST" });
      setEligibility(res);
      setView("eligibility");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadHistory() {
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch("/api/history", { sessionId });
      setHistory(res.history || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitApplication() {
    if (!online) {
      setError("");
      setBusy(true);
      try {
        await queueSubmission({ sessionId, schemeId: activeScheme?.id, phone });
        setTrackingId("QUEUED");
        setView("success");
      } catch {
        setError("Offline queue failed");
      } finally {
        setBusy(false);
      }
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch("/api/submit", {
        sessionId,
        method: "POST",
        body: { schemeId: activeScheme?.id, phone },
      });
      setTrackingId(res.trackingId);
      setView("success");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const documents = useMemo(() => locker?.documents || {}, [locker]);
  const hasPendingUpload = !!locker?.documentsPending?.pending;

  return (
    <div className="h-screen w-screen grid grid-cols-1 md:grid-cols-12 grid-rows-[1fr_auto] bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Left Panel */}
      <div className="hidden md:flex md:flex-col md:col-span-3 lg:col-span-2 border-r border-slate-200 bg-white p-5 overflow-y-auto">
        <div className="mb-8">
          <div className="text-2xl font-extrabold text-indigo-600 tracking-tight">{t(language, "appName")}</div>
          <div className="text-sm font-medium text-slate-500 mt-1">{t(language, "tagline")}</div>
        </div>

        <div className="space-y-8 flex-1">
          <div>
            <h3 className="mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Settings</h3>
            {!online && <div className="mb-3 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 w-max">OFFLINE MODE</div>}
            
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> PRIVACY ON
              </span>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-colors"
              >
                Logout / Reset
              </button>
            </div>
            
            <select 
              value={language} 
              onChange={(e) => saveLanguage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
            >
              {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Document Locker</h3>
            <div className="space-y-2.5 text-sm font-medium text-slate-700">
              {[
                { key: "aadhaar", label: "Aadhaar" },
                { key: "income_certificate", label: "Income Certificate" },
                { key: "marks_card", label: "Marks Card" },
                { key: "bank_passbook", label: "Bank Passbook" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span>{label}</span>
                  {documents[key] ? (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
                  ) : (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs">✕</span>
                  )}
                </div>
              ))}
            </div>
            <label className="mt-5 flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input type="checkbox" checked={!!reuse} onChange={(e) => setReuse(e.target.checked)} className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-slate-300 checked:border-indigo-600 checked:bg-indigo-600 transition-all" />
                <span className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-[10px]">✓</span>
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors leading-relaxed">{t(language, "reuseLabel")}</span>
            </label>
          </div>
        </div>
        
        <div className="pt-6 mt-auto border-t border-slate-100">
          <button onClick={async () => { await loadHistory(); setView("history"); }} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            View History
          </button>
        </div>
      </div>

      {/* Center Panel */}
      <div className="col-span-1 md:col-span-6 lg:col-span-7 flex flex-col p-4 md:p-8 overflow-y-auto relative bg-white border-x border-slate-100 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]">
        
        {view !== "login" && view !== "language" && (
          <>
            <AgentExecutionTimeline activeStage={busy ? "processing" : "completed"} />
            <NextStepRecommendationBanner nextAction={nextAction} />
          </>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 shadow-sm">{error}</div>
        )}

        <div className={`flex-1 w-full max-w-3xl mx-auto pb-20 ${view === "login" || view === "language" ? "flex flex-col items-center justify-center" : "space-y-6"}`}>
          
          {view === "login" && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 -mt-24">
              <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <span className="text-2xl text-white">✨</span>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">How can I help you today?</h1>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">Enter your phone number to login and start matching with scholarships automatically.</p>
              </div>
              
              <div className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-lg font-semibold text-slate-800 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
                  inputMode="tel"
                  placeholder="Enter Mobile Number"
                />
                <button
                  onClick={doLogin}
                  disabled={busy || !phone}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-base font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-[0_4px_14px_rgba(79,70,229,0.3)]"
                >
                  {busy ? "Connecting..." : "Start Session"}
                </button>
              </div>
            </div>
          )}

          {view === "language" && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 -mt-24">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t(language, "languageTitle")}</h1>
              <div className="w-full max-w-sm grid grid-cols-1 gap-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    className={`rounded-xl border-2 px-4 py-4 text-center text-base font-bold transition-all ${language === l.code ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-100 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                    onClick={async () => {
                      await saveLanguage(l.code);
                      setView("upload");
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "upload" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 bg-ai-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-ai-secondary/20">AI</div>
                <div className="flex-1 space-y-2">
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-slate-800 text-sm leading-relaxed shadow-sm">
                    Let's gather your documents. I'll automatically read them and fill out the forms for you. What would you like to upload first?
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-14">
                <DocumentUploadCard title="Aadhaar" status={documents.aadhaar ? "uploaded" : "missing"} onPickFile={(file) => handleUpload("aadhaar", file)} />
                <DocumentUploadCard title="Income Certificate" status={documents.income_certificate ? "uploaded" : "missing"} onPickFile={(file) => handleUpload("income_certificate", file)} />
                <DocumentUploadCard title="Marks Card" status={documents.marks_card ? "uploaded" : "missing"} onPickFile={(file) => handleUpload("marks_card", file)} />
                <DocumentUploadCard title="Bank Passbook" status={documents.bank_passbook ? "uploaded" : "missing"} onPickFile={(file) => handleUpload("bank_passbook", file)} />
              </div>

              {lastOcr && (
                 <div className="pl-14 animate-in fade-in slide-in-from-bottom-2">
                   <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800 font-medium">
                     I successfully extracted {Object.keys(lastOcr.extracted||{}).length} fields from your {lastOcr.docTypeDetected}. See the right panel for my confidence breakdown.
                   </div>
                 </div>
              )}

              <div className="pl-14 pt-4 flex gap-3">
                <button
                  onClick={refreshLocker}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  Refresh
                </button>
                <button
                  onClick={loadEligibility}
                  disabled={busy}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {busy ? "Thinking..." : "Check Eligibility Matches"}
                </button>
              </div>
            </div>
          )}

          {view === "eligibility" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 bg-ai-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">AI</div>
                <div className="flex-1 space-y-2">
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-slate-800 text-sm leading-relaxed shadow-sm">
                    Based on your profile, I found these matching scholarships. I recommend the ones marked in orange!
                  </div>
                </div>
              </div>

              <div className="pl-14 space-y-4">
                <EligibilityDashboard
                  results={eligibility?.results || []}
                  selectedIds={selectedCompareIds}
                  onToggleSelect={(id) => setSelectedCompareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
                  onStartApply={async (scheme) => {
                    setActiveScheme(scheme);
                    try {
                      const docs = locker?.documents || {};
                      const missing = (scheme.required_documents || []).filter((d) => !docs[d]);
                      if (missing.length && online) {
                        await apiFetch("/api/sms/missing-documents", { sessionId, method: "POST", body: { schemeId: scheme.id } });
                      }
                    } catch {}
                    setView("apply");
                  }}
                />
                <button
                  disabled={selectedCompareIds.length < 2}
                  onClick={() => setView("compare")}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
                >
                  Compare Selected
                </button>
              </div>
            </div>
          )}

          {view === "compare" && (
             <div className="space-y-4 animate-in fade-in duration-500">
               <button onClick={() => setView("eligibility")} className="mb-4 flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 transition-all">
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                 </svg>
                 Back to Matches
               </button>
               <ScholarshipComparisonTable schemes={schemesForCompare} />
             </div>
          )}

          {view === "apply" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 bg-ai-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">AI</div>
                <div className="flex-1 space-y-2">
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-slate-800 text-sm leading-relaxed shadow-sm">
                    I've auto-filled the application for {activeScheme?.name}. Please verify the fields below. Green means I'm highly confident in the data.
                  </div>
                </div>
              </div>
              <div className="pl-14 space-y-4">
                <DocumentSuggestionPanel requiredDocuments={activeScheme?.required_documents || []} availableDocs={documents} onGoUpload={() => setView("upload")} />
                <AutofillFormWizard
                  sessionId={sessionId}
                  language={language}
                  initialProfile={locker?.profile}
                  confidenceMap={locker?.verification}
                  onSubmit={() => setView("captcha")}
                />
              </div>
            </div>
          )}
          
          {view === "captcha" && <CaptchaAssistScreen onDone={submitApplication} />}
          {view === "success" && <SubmissionSuccessScreen trackingId={trackingId} onGoHistory={async () => { await loadHistory(); setView("history"); }} />}
          {view === "history" && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <ApplicationHistoryPanel history={history} />
              <button onClick={() => setView("upload")} className="rounded-xl border-2 border-slate-200 px-4 py-2 font-bold text-slate-700">Back to Dashboard</button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:block lg:col-span-3 border-l border-slate-200 bg-slate-50 p-5 overflow-y-auto">
        <ReasoningPanel activeScheme={activeScheme} confidenceMap={locker?.verification} lastOcr={lastOcr} />
      </div>

      {/* Bottom Panel */}
      <div className="col-span-1 md:col-span-12 border-t border-slate-200 bg-white p-3 md:p-4 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <PromptInputArea 
          onSend={(text) => console.log("User prompt:", text)}
          onVoice={() => alert("Listening...")}
          onUpload={() => setView("upload")}
        />
      </div>
    </div>
  );
}
