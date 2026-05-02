import React, { useState } from "react";

export default function PromptInputArea({ onSend, onVoice, onUpload }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText("");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl items-end gap-3 rounded-2xl border-2 border-slate-200 bg-white p-2 focus-within:border-ai-primary">
      <button
        type="button"
        onClick={onUpload}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
        title="Attach file"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      <textarea
        className="max-h-32 min-h-[44px] w-full resize-none bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        placeholder="Ask the assistant, or type a command (e.g. 'explain this field')..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <button
        type="button"
        onClick={onVoice}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
        title="Voice assistant"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleSend}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ai-primary text-white hover:opacity-90 disabled:opacity-50"
        disabled={!text.trim()}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
}
