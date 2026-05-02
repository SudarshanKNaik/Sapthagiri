import React from "react";

export default function AgentExecutionTimeline({ activeStage }) {
  const stages = [
    { id: "thinking", label: "Thinking", color: "bg-ai-stage-thinking" },
    { id: "reading", label: "Reading documents", color: "bg-ai-stage-reading" },
    { id: "extracting", label: "Extracting fields", color: "bg-ai-stage-editing" },
    { id: "matching", label: "Matching eligibility", color: "bg-ai-stage-generating" },
    { id: "completed", label: "Completed", color: "bg-ai-stage-completed" },
  ];

  const activeIndex = stages.findIndex((s) => s.id === activeStage);

  return (
    <div className="mb-6 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      {stages.map((stage, i) => {
        const isActive = activeIndex === i;
        const isPast = activeIndex > i;
        const opacity = isActive || isPast ? "opacity-100" : "opacity-40";
        const ring = isActive ? "ring-2 ring-slate-400 ring-offset-2" : "";

        return (
          <div key={stage.id} className={`flex items-center gap-2 ${opacity}`}>
            <div className={`h-3 w-3 rounded-full ${stage.color} ${ring}`} />
            <span className="text-xs font-semibold text-slate-700">{stage.label}</span>
            {i < stages.length - 1 && (
              <div className="mx-2 h-px w-4 bg-slate-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}
