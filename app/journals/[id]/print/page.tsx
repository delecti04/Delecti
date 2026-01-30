"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatDK } from "@/lib/date";

export default function PrintJournal({ params }: { params: { id: string } }) {
  const id = params.id;
  const [err, setErr] = useState("");
  const [j, setJ] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});

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

    const jr = await supabase.from("journals").select("*").eq("id", id).single();
    if (jr.error) return setErr(jr.error.message);
    setJ(jr.data);

    const m = await supabase.from("journal_media").select("*").eq("journal_id", id).order("created_at", { ascending: true });
    if (m.error) return setErr(m.error.message);
    setMedia(m.data || []);

    const map: Record<string, string> = {};
    for (const item of (m.data || [])) {
      const { data, error } = await supabase.storage.from("journal-media").createSignedUrl(item.path, 60 * 60);
      if (!error) map[item.path] = data.signedUrl;
    }
    setSigned(map);
  }

  useEffect(() => { load(); }, []);

  if (err) return <div className="card">{err}</div>;
  if (!j) return <div className="card">Indlæser…</div>;

  return (
    <div className="card">
      <div className="no-print row" style={{ justifyContent: "space-between" }}>
        <div className="small">Delecti – Print</div>
        <button className="btn" onClick={() => window.print()}>Print / Gem som PDF</button>
      </div>

      <h1 className="h1">Journal</h1>
      <div className="small">Oprettet: {formatDK(j.created_at)}</div>

      <hr style={{ border: "none", borderTop: "1px solid #e6e8ee", margin: "14px 0" }} />

      <h2 className="h2">Status inden behandling</h2>
      <div style={{ whiteSpace: "pre-wrap" }}>{j.before_status || "—"}</div>

      <h2 className="h2" style={{ marginTop: 16 }}>Hvad er behandlet</h2>
      <div style={{ whiteSpace: "pre-wrap" }}>{j.treatment || "—"}</div>

      <h2 className="h2" style={{ marginTop: 16 }}>Status efter behandling</h2>
      <div style={{ whiteSpace: "pre-wrap" }}>{j.after_status || "—"}</div>

      <h2 className="h2" style={{ marginTop: 16 }}>Aftaler til næste gang</h2>
      <div style={{ whiteSpace: "pre-wrap" }}>{j.next_time || "—"}</div>

      <hr style={{ border: "none", borderTop: "1px solid #e6e8ee", margin: "18px 0" }} />
      <h2 className="h2">Bilag</h2>

      {media.length === 0 && <div className="small">Ingen bilag.</div>}

      <div className="list">
        {media.map((m) => {
          const url = signed[m.path];
          const isImage = (m.mime || "").startsWith("image/");
          const isVideo = (m.mime || "").startsWith("video/");
          return (
            <div className="item" key={m.id}>
              <div className="small">{m.mime || "fil"}</div>
              {url && isImage && <img src={url} alt="bilag" style={{ width: "100%", borderRadius: 12, marginTop: 8 }} />}
              {url && isVideo && (
                <div className="small" style={{ marginTop: 8 }}>
                  Video kan ikke printes – åbn via link:
                  <div><a href={url} target="_blank">{url}</a></div>
                </div>
              )}
              {url && !isImage && !isVideo && <a href={url} target="_blank">{url}</a>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
