import React, { useState, useRef, useEffect, useCallback } from "react";
import { analyzeForm, generateReferencePdf, downloadPdf, base64ToBlobUrl, getConfStyle, checkScanServiceHealth } from "../services/scanService";

const STEPS = ["upload","processing","review","voice","pdf"];
const STEP_LABELS = ["1 Upload","2 Process","3 Review","4 Voice","5 PDF"];
const PROC_STAGES = [
  {id:"upload",label:"Uploading document",pct:10},
  {id:"ocr",label:"Running AI OCR (EasyOCR)",pct:35},
  {id:"layoutlmv3",label:"LayoutLMv3 Analysis",pct:70},
  {id:"autofill",label:"Cross-referencing profile",pct:90},
  {id:"done",label:"Complete!",pct:100},
];

export default function OfflineScanModal({onClose,userProfile={}}){
  const [step,setStep]=useState("upload");
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [procStage,setProcStage]=useState("");
  const [procPct,setProcPct]=useState(0);
  const [analysis,setAnalysis]=useState(null);
  const [error,setError]=useState("");
  const [pdfB64,setPdfB64]=useState(null);
  const [pdfUrl,setPdfUrl]=useState(null);
  const [voiceIdx,setVoiceIdx]=useState(0);
  const [voiceActive,setVoiceActive]=useState(false);
  const [svcStatus,setSvcStatus]=useState(null);
  const [generating,setGenerating]=useState(false);
  const fileRef=useRef(null);
  const recogRef=useRef(null);

  useEffect(()=>{checkScanServiceHealth().then(setSvcStatus);},[]);
  useEffect(()=>()=>{recogRef.current?.stop();window.speechSynthesis?.cancel();},[]);

  function pickFile(f){
    if(!f)return;
    const ok=["application/pdf","image/jpeg","image/png","image/jpg"].includes(f.type)||/\.(pdf|jpg|jpeg|png)$/i.test(f.name);
    if(!ok){setError("Please upload PDF, JPG or PNG.");return;}
    setError("");setFile(f);
    if(f.type.startsWith("image/")){const r=new FileReader();r.onload=e=>setPreview(e.target.result);r.readAsDataURL(f);}else setPreview(null);
  }

  async function startAnalysis(){
    if(!file)return;
    setStep("processing");setError("");setProcPct(0);
    try{
      const result=await analyzeForm(file,userProfile,"en",(stage,pct)=>{setProcStage(stage);setProcPct(pct);});
      setAnalysis(result);setStep("review");
    }catch(e){setError(e.message);setStep("upload");}
  }

  async function handleGeneratePdf(){
    setGenerating(true);setError("");
    try{
      const b64=await generateReferencePdf(analysis,userProfile);
      setPdfB64(b64);setPdfUrl(base64ToBlobUrl(b64));setStep("pdf");
    }catch(e){setError(e.message);}finally{setGenerating(false);}
  }

  const speakField=useCallback((field)=>{
    if(!window.speechSynthesis||!field)return;
    // Small delay to ensure browser handles the sequence
    setTimeout(()=>{
      window.speechSynthesis.cancel();
      const txt=`Field: ${field.label}. ${field.value?"Current value: "+field.value+".":"This field is currently empty."} ${field.explanation||""}`;
      const u=new SpeechSynthesisUtterance(txt);
      u.rate=0.85;u.pitch=1.0;
      u.onstart = () => console.log("Speech started");
      u.onerror = (e) => console.error("Speech error", e);
      window.speechSynthesis.speak(u);
    }, 100);
  },[]);

  function voiceNav(dir,fields){
    const next=Math.max(0,Math.min(fields.length-1,voiceIdx+dir));
    setVoiceIdx(next);
    speakField(fields[next]);
  }

  function toggleSTT(fields,curIdx){
    if(voiceActive){recogRef.current?.stop();setVoiceActive(false);return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setError("Speech recognition not supported.");return;}
    const r=new SR();
    r.continuous=false;r.lang="en-IN";
    r.onresult=e=>{
      const t=e.results[0][0].transcript.toLowerCase().trim();
      if(t.includes("next"))voiceNav(1,fields);
      else if(t.includes("previous")||t.includes("back"))voiceNav(-1,fields);
      else if(t.includes("explain"))speakField(fields[curIdx]);
      else if(t.includes("skip"))voiceNav(1,fields);
      else if(t.includes("close"))onClose();
      setVoiceActive(false);
    };
    r.onerror=()=>setVoiceActive(false);
    r.onend=()=>setVoiceActive(false);
    recogRef.current=r;r.start();setVoiceActive(true);
  }

  function onDrop(e){e.preventDefault();pickFile(e.dataTransfer.files[0]);}

  const CC={
    green:{border:"border-emerald-400",bg:"bg-emerald-50",badge:"bg-emerald-100 text-emerald-800",dot:"bg-emerald-500"},
    yellow:{border:"border-amber-400",bg:"bg-amber-50",badge:"bg-amber-100 text-amber-800",dot:"bg-amber-400"},
    red:{border:"border-red-400",bg:"bg-red-50",badge:"bg-red-100 text-red-800",dot:"bg-red-500"},
  };
  function cs(level){return CC[level]||CC.yellow;}

  const fields=analysis?.fields||[];
  const curField=fields[voiceIdx];

  return(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 to-violet-800 text-white shrink-0">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-0.5">Sahayak AI</div>
            <h2 className="text-lg font-extrabold">Offline Scan &amp; AI Form Assist</h2>
            <div className="text-xs text-indigo-200 mt-0.5">LayoutLMv3 · EasyOCR · Voice Guide</div>
          </div>
          <div className="flex items-center gap-3">
            {svcStatus!==null&&<span className={`text-[10px] font-bold px-2 py-1 rounded-full ${svcStatus.ok?"bg-emerald-500":"bg-amber-500"}`}>{svcStatus.ok?"AI READY":"TESSERACT MODE"}</span>}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-sm">✕</button>
          </div>
        </div>
        <div className="flex gap-1 px-6 pt-3 pb-0 shrink-0">
          {STEP_LABELS.map((s,i)=>{
            const sKey=STEPS[i];const done=STEPS.indexOf(step)>i;const active=step===sKey;
            return(<div key={s} className={`flex-1 text-center text-[10px] font-bold py-1.5 rounded-t-lg border-b-2 transition-all ${active?"border-indigo-600 text-indigo-700 bg-indigo-50":done?"border-emerald-400 text-emerald-600 bg-emerald-50":"border-transparent text-slate-400"}`}>{s}</div>);
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {error&&<div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800 font-medium">{error}</div>}

          {step==="upload"&&(
            <div className="space-y-4">
              <div onDragOver={e=>e.preventDefault()} onDrop={onDrop} onClick={()=>fileRef.current?.click()}
                className="border-2 border-dashed border-indigo-300 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                <div className="text-4xl mb-3">{file?"📄":"🗂️"}</div>
                {file?(
                  <div>
                    <div className="font-bold text-slate-800">{file.name}</div>
                    <div className="text-sm text-slate-500 mt-1">{(file.size/1024).toFixed(1)} KB</div>
                    {preview&&<img src={preview} alt="preview" className="mt-3 max-h-40 mx-auto rounded-xl border"/>}
                  </div>
                ):(
                  <div>
                    <div className="font-semibold text-slate-700 group-hover:text-indigo-700">Drop form here or click to browse</div>
                    <div className="text-sm text-slate-400 mt-1">PDF · JPG · PNG supported</div>
                    <div className="text-xs text-slate-300 mt-1">Works offline · Supports any government form</div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e=>pickFile(e.target.files[0])}/>
              </div>
              {file&&(
                <button onClick={startAnalysis} className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  <span>🧠</span> Analyze with AI (LayoutLMv3)
                </button>
              )}
            </div>
          )}

          {step==="processing"&&(
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="text-5xl mb-4 animate-pulse">🧠</div>
                <div className="text-xl font-bold text-slate-800">Processing with AI</div>
                <div className="text-sm text-slate-500 mt-1">Using EasyOCR + LayoutLMv3 transformer</div>
              </div>
              <div className="space-y-3">
                {PROC_STAGES.map(stage=>{
                  const done=procPct>=stage.pct;const active=procStage===stage.id;
                  return(
                    <div key={stage.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active?"bg-indigo-50 border border-indigo-200":done?"bg-emerald-50":"bg-slate-50"}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done?"bg-emerald-500 text-white":active?"bg-indigo-500 text-white animate-pulse":"bg-slate-200 text-slate-400"}`}>{done?"✓":"…"}</div>
                      <span className={`text-sm font-medium ${active?"text-indigo-700":done?"text-emerald-700":"text-slate-400"}`}>{stage.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-xl bg-slate-100 overflow-hidden h-3">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 rounded-full" style={{width:`${procPct}%`}}/>
              </div>
              <div className="text-center text-sm font-bold text-indigo-700">{procPct}% Complete</div>
            </div>
          )}

          {step==="review"&&analysis&&(
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{analysis.form_title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Model: <span className="font-semibold text-indigo-600 uppercase">{analysis.model_used}</span> · Confidence: <span className="font-semibold">{Math.round(analysis.overall_confidence*100)}%</span></div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-full">{analysis.autofill_count} auto</span>
                  <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-1 rounded-full">{analysis.missing_count} missing</span>
                </div>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {fields.map(f=>{
                  const c=cs(f.conf_level);
                  return(
                    <div key={f.field_id} className={`p-3 rounded-xl border-2 ${c.border} ${c.bg}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`}/>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{f.label}</span>
                            {f.required&&<span className="text-[9px] font-bold text-red-600">REQUIRED</span>}
                            {f.autofilled&&<span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">AUTO-FILLED</span>}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-800 pl-4">{f.value||<span className="text-slate-300 italic font-normal">Not filled</span>}</div>
                          {f.warning&&<div className="mt-1 text-[11px] text-amber-700 pl-4">⚠ {f.warning}</div>}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${c.badge}`}>{Math.round(f.confidence*100)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>{setStep("voice");speakField(fields[0]);}} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:-translate-y-0.5 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">🎙️ Start Voice Guide</button>
                <button onClick={handleGeneratePdf} disabled={generating} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold hover:-translate-y-0.5 transition-all shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-60">{generating?"Generating…":"📄 Generate PDF"}</button>
              </div>
            </div>
          )}

          {step==="voice"&&analysis&&curField&&(
            <div className="space-y-5">
              <div className="text-center py-2">
                <div className="text-4xl mb-2">🎙️</div>
                <div className="font-bold text-slate-800 text-lg">Voice-Guided Assistance</div>
                <div className="text-xs text-slate-400">Field {voiceIdx+1} of {fields.length}</div>
              </div>
              <div className={`p-5 rounded-2xl border-2 ${cs(curField.conf_level).border} ${cs(curField.conf_level).bg}`}>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{curField.label}</div>
                <div className="text-2xl font-extrabold text-slate-800 min-h-8">{curField.value||<span className="text-slate-300">Empty</span>}</div>
                <div className="mt-3 text-sm text-slate-600 leading-relaxed">{curField.explanation}</div>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <button onClick={()=>voiceNav(-1,fields)} disabled={voiceIdx===0} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 disabled:opacity-40">← Prev</button>
                <button onClick={()=>speakField(curField)} className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 font-semibold text-sm hover:bg-indigo-200">🔊 Read Again</button>
                <button onClick={()=>toggleSTT(fields,voiceIdx)} className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${voiceActive?"bg-rose-500 text-white animate-pulse":"bg-violet-100 text-violet-700 hover:bg-violet-200"}`}>{voiceActive?"🔴 Listening…":"🎤 Speak"}</button>
                <button onClick={()=>voiceNav(1,fields)} disabled={voiceIdx>=fields.length-1} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 disabled:opacity-40">Next →</button>
              </div>
              <div className="text-center text-xs text-slate-400">Commands: "Next" · "Back" · "Explain" · "Close"</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="h-full bg-violet-500 rounded-full transition-all" style={{width:`${((voiceIdx+1)/fields.length)*100}%`}}/>
              </div>
              <button onClick={handleGeneratePdf} disabled={generating} className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:-translate-y-0.5 transition-all shadow-lg text-sm disabled:opacity-60">{generating?"Generating PDF…":"📄 Finish & Generate PDF"}</button>
            </div>
          )}

          {step==="pdf"&&pdfUrl&&(
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">📄</div>
                <div className="font-bold text-slate-800">Reference Copy Ready</div>
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-2 inline-block">⚠ REFERENCE COPY – VERIFY DETAILS BEFORE SUBMITTING</div>
              </div>
              <iframe src={pdfUrl} className="w-full h-80 rounded-xl border border-slate-200 shadow-inner" title="Reference PDF"/>
              <div className="flex gap-3">
                <button onClick={()=>downloadPdf(pdfB64,"sahayak-ref-"+Date.now()+".pdf")} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:-translate-y-0.5 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">⬇️ Download PDF</button>
                <button onClick={()=>setStep("review")} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all text-sm">← Back to Review</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
