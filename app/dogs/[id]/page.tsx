"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SpeechInput from "@/components/SpeechInput";
import { formatDK } from "@/lib/date";

type Dog = {
  id: string;
  name: string | null;
  customer_id: string;
};

type Journal = {
  id: string;
  dog_id: string;
  before_status: string | null;
  treatment: string | null;
  after_status: string | null;
  next_time: string | null;
  created_at: string;
};

type Media = {
  id: string;
  journal_id: string;
  path: string;
  mime: string | null;
  created_at: string;
};

export default function DogDetail({ params }: { params: { id: string } }) {
  const dogId = params.id;
  const [err, setErr] = useState("");
  const [dog, setDog] = useState<Dog | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selected, setSelected] = useState<Journal | null>(null);
  const [media, setMedia] = useState<Media[]>([]);

  const [before, setBefore] = useState("");
  const [treat, setTreat] = useState("");
  const [after, setAfter] = useState("");
  const [next, setNext] = useState("");

  async function requireAuth() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setErr("Log ind først (/login).");
      return false;
    }
    return true;
  }

  async function load() {
    setErr("");
    if (!(await requireAuth())) return;

    const d = await supabase.from("dogs").select("id,name,customer_id").eq("id", dogId).single();
    if (d.error) return setErr(d.error.message);
    setDog(d.data as any);

    const j = await supabase.from("journals").select("*").eq("dog_id", dogId).order("created_at", { ascending: false });
    if (j.error) return setErr(j.error.message);
    setJournals((j.data as any) || []);
  }

  async function createJournal() {
    setErr("");
    if (!(await requireAuth())) return;

    const ins = await supabase.from("journals").insert([{
      dog_id: dogId,
      before_status: before,
      treatment: treat,
      after_status: after,
      next_time: next
    }]).select("*").single();

    if (ins.error) return setErr(ins.error.message);

    setBefore(""); setTreat(""); setAfter(""); setNext("");
    await load();
    setSelected(ins.data as any);
    await loadMedia(ins.data.id);
  }

  async function loadMedia(journalId: string) {
    const m = await supabase.from("journal_media").select("*").eq("journal_id", journalId).order("created_at", { ascending: false });
    if (m.error) return setErr(m.error.message);
    setMedia((m.data as any) || []);
  }

  async function selectJournal(j: Journal) {
    setSelected(j);
    setBefore(j.before_status || "");
    setTreat(j.treatment || "");
    setAfter(j.after_status || "");
    setNext(j.next_time || "");
    await loadMedia(j.id);
  }

  async function saveJournal() {
    if (!selected) return;
    setErr("");
    if (!(await requireAuth())) return;

    const up = await supabase.from("journals").update({
      before_status: before,
      treatment: treat,
      after_status: after,
      next_time: next
    }).eq("id", selected.id);

    if (up.error) return setErr(up.error.message);
    await load();
  }

  async function uploadFiles(files: FileList | null) {
    if (!selected) {
      setErr("Vælg/opi en journal først (opret journal før du uploader bilag).");
      return;
    }
    if (!files || files.length === 0) return;
    setErr("");
    if (!(await requireAuth())) return;

    for (const file of Array.from(files)) {
      const path = `${selected.id}/${crypto.randomUUID()}-${file.name}`.replaceAll(" ", "_");
      const { error: upErr } = await supabase.storage.from("journal-media").upload(path, file, {
        contentType: file.type,
        upsert: false
      });
      if (upErr) {
        setErr(upErr.message);
        return;
      }
      const { error: dbErr } = await supabase.from("journal_media").insert([{
        journal_id: selected.id,
        path,
        mime: file.type
      }]);
      if (dbErr) {
        setErr(dbErr.message);
        return;
      }
    }
    await loadMedia(selected.id);
  }

  async function getSignedUrl(path: string) {
    const { data, error } = await supabase.storage.from("journal-media").createSignedUrl(path, 60 * 60);
    if (error) throw error;
    return data.signedUrl;
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="grid grid-2">
      <div className="card">
        <h1 className="h1">Hund: {dog?.name || "…"}</h1>
        {err && <p className="small">{err}</p>}

        <h2 className="h2">Ny journal</h2>
        <SpeechInput label="Status inden behandling" value={before} onChange={setBefore} textarea />
        <SpeechInput label="Hvad er behandlet" value={treat} onChange={setTreat} textarea />
        <SpeechInput label="Status efter behandling" value={after} onChange={setAfter} textarea />
        <SpeechInput label="Aftaler til næste gang" value={next} onChange={setNext} textarea />

        <div className="row no-print">
          <button className="btn" onClick={selected ? saveJournal : createJournal}>
            {selected ? "Gem journal" : "Opret journal"}
          </button>
          {selected && (
            <a className="btn secondary" href={`/journals/${selected.id}/print`} target="_blank">
              Print/PDF
            </a>
          )}
        </div>

        <div className="no-print" style={{ marginTop: 12 }}>
          <div className="small" style={{ marginBottom: 6 }}>
            Bilag (billede/video) – upload til valgt journal:
          </div>
          <input type="file" multiple accept="image/*,video/*" onChange={(e) => uploadFiles(e.target.files)} />
          <div className="small" style={{ marginTop: 6 }}>
            Video vises som link/QR i print (kan ikke “printes” som video).
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Journalhistorik</h2>
        <div className="list">
          {journals.map((j) => (
            <button
              key={j.id}
              className="item"
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={() => selectJournal(j)}
            >
              <div style={{ fontWeight: 700 }}>{formatDK(j.created_at)}</div>
              <div className="small">
                {j.before_status ? j.before_status.slice(0, 60) : "—"}
              </div>
            </button>
          ))}
          {journals.length === 0 && <div className="small">Ingen journaler endnu.</div>}
        </div>

        {selected && (
          <>
            <hr style={{ border: "none", borderTop: "1px solid #e6e8ee", margin: "14px 0" }} />
            <h2 className="h2">Bilag</h2>

            <div className="list">
              {media.map((m) => (
                <MediaItem key={m.id} m={m} getSignedUrl={getSignedUrl} />
              ))}
              {media.length === 0 && <div className="small">Ingen bilag på denne journal.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MediaItem({ m, getSignedUrl }: { m: any; getSignedUrl: (p: string) => Promise<string> }) {
  const [url, setUrl] = useState<string>("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const u = await getSignedUrl(m.path);
        setUrl(u);
      } catch (e: any) {
        setErr(e.message || "Fejl");
      }
    })();
  }, [m.path]);

  if (err) return <div className="small">Bilag fejl: {err}</div>;
  if (!url) return <div className="small">Henter bilag…</div>;

  const isImage = (m.mime || "").startsWith("image/");
  const isVideo = (m.mime || "").startsWith("video/");

  return (
    <div className="item">
      <div className="small">{m.mime || "fil"}</div>
      {isImage && <img src={url} alt="bilag" style={{ width: "100%", borderRadius: 12, marginTop: 8 }} />}
      {isVideo && (
        <video src={url} controls style={{ width: "100%", borderRadius: 12, marginTop: 8 }} />
      )}
      {!isImage && !isVideo && (
        <a className="btn secondary" href={url} target="_blank">Åbn fil</a>
      )}
    </div>
  );
}
