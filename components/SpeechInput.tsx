"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
};

export default function SpeechInput({ label, value, onChange, textarea }: Props) {
  const [listening, setListening] = useState(false);
  const SpeechRecognition = useMemo(() => {
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition;
  }, []);

  useEffect(() => {
    setListening(false);
  }, []);

  const canSpeech = !!SpeechRecognition;

  async function start() {
    if (!canSpeech) return;
    const rec = new SpeechRecognition();
    rec.lang = "da-DK";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onChange((value ? value + " " : "") + transcript.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    setListening(true);
    rec.start();
  }

  return (
    <div className="field">
      <label>
        {label}{" "}
        {canSpeech ? (
          <button
            type="button"
            className="btn secondary"
            style={{ padding: "6px 10px", borderRadius: 999, marginLeft: 8 }}
            onClick={start}
            disabled={listening}
          >
            {listening ? "🎤 Lytter…" : "🎤 Dikter"}
          </button>
        ) : (
          <span className="small">(Diktering understøttes ikke i denne browser)</span>
        )}
      </label>

      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
