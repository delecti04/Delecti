"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatDK, startOfTodayISO, startOfTomorrowISO } from "@/lib/date";

type Booking = {
  id: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  customers?: { name: string | null } | null;
  dogs?: { name: string | null } | null;
};

export default function Dashboard() {
  const [items, setItems] = useState<Booking[]>([]);
  const [err, setErr] = useState<string>("");

  async function load() {
    setErr("");
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setErr("Log ind først (Login-menuen øverst).");
      return;
    }

    const from = startOfTodayISO();
    const to = startOfTomorrowISO();

    const { data, error } = await supabase
      .from("bookings")
      .select("id,start_time,end_time,notes, customers(name), dogs(name)")
      .gte("start_time", from)
      .lt("start_time", to)
      .order("start_time", { ascending: true });

    if (error) {
      setErr(error.message);
      return;
    }
    setItems((data as any) || []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="grid grid-2">
      <div className="card">
        <h1 className="h1">Dagens aftaler</h1>

        <div className="row no-print" style={{ marginBottom: 10 }}>
          <a className="btn" href="/customers">➕ Ny/Find kunde</a>
          <a className="btn secondary" href="/bookings">➕ Ny booking</a>
        </div>

        {err && <p className="small">{err}</p>}

        <div className="list">
          {items.map((b) => (
            <div className="item" key={b.id}>
              <div style={{ fontWeight: 600 }}>
                {formatDK(b.start_time)} – {formatDK(b.end_time)}
              </div>
              <div className="small">
                {b.dogs?.name ? `${b.dogs.name}` : "Hund"}{" "}
                {b.customers?.name ? `(${b.customers.name})` : ""}
              </div>
              {b.notes && <div className="small">Note: {b.notes}</div>}
            </div>
          ))}
          {!err && items.length === 0 && (
            <div className="small">Ingen aftaler i dag.</div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Hurtigt</h2>
        <div className="list">
          <a className="item" href="/customers">Kunder</a>
          <a className="item" href="/bookings">Kalender</a>
          <a className="item" href="/login">Login / bruger</a>
        </div>
        <p className="small" style={{ marginTop: 10 }}>
          Tip: på mobil kan du “Tilføj til hjemmeskærm” for at få Delecti som app.
        </p>
      </div>
    </div>
  );
}
