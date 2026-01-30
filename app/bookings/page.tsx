"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatDK } from "@/lib/date";

type Customer = { id: string; name: string | null; };
type Dog = { id: string; name: string | null; customer_id: string; };

export default function BookingsPage() {
  const [err, setErr] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [dogId, setDogId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [durationMin, setDurationMin] = useState(60);
  const [notes, setNotes] = useState("");

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

    const c = await supabase.from("customers").select("id,name").order("name", { ascending: true });
    if (c.error) return setErr(c.error.message);
    setCustomers((c.data as any) || []);

    const d = await supabase.from("dogs").select("id,name,customer_id");
    if (d.error) return setErr(d.error.message);
    setDogs((d.data as any) || []);

    // list upcoming bookings
    const b = await supabase.from("bookings").select("*, customers(name), dogs(name)")
      .order("start_time", { ascending: true })
      .limit(100);
    if (b.error) return setErr(b.error.message);
    setItems((b.data as any) || []);
  }

  function toISO(dateStr: string, timeStr: string) {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(dateStr);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  async function createBooking() {
    setErr("");
    if (!(await requireAuth())) return;

    if (!customerId || !dogId) {
      setErr("Vælg kunde og hund.");
      return;
    }

    const startIso = toISO(date, start);
    const endD = new Date(startIso);
    endD.setMinutes(endD.getMinutes() + durationMin);
    const endIso = endD.toISOString();

    const ins = await supabase.from("bookings").insert([{
      customer_id: customerId,
      dog_id: dogId,
      start_time: startIso,
      end_time: endIso,
      notes
    }]);
    if (ins.error) return setErr(ins.error.message);

    setNotes("");
    await load();
  }

  useEffect(() => { load(); }, []);

  const dogsForCustomer = dogs.filter(d => d.customer_id === customerId);

  return (
    <div className="grid grid-2">
      <div className="card">
        <h1 className="h1">Kalender</h1>
        {err && <p className="small">{err}</p>}

        <h2 className="h2">Opret booking</h2>

        <div className="field">
          <label>Kunde</label>
          <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setDogId(""); }}>
            <option value="">Vælg…</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name || "Uden navn"}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Hund</label>
          <select value={dogId} onChange={(e) => setDogId(e.target.value)} disabled={!customerId}>
            <option value="">{customerId ? "Vælg…" : "Vælg kunde først"}</option>
            {dogsForCustomer.map(d => <option key={d.id} value={d.id}>{d.name || "Hund"}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Dato</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>Start</label>
            <input type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="field" style={{ width: 180 }}>
            <label>Varighed (min)</label>
            <select value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}>
              {[15,30,45,60,75,90,105,120].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Noter</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button className="btn" onClick={createBooking}>Gem booking</button>

        <p className="small" style={{ marginTop: 10 }}>
          (Dette er en enkel v1-kalender. Senere kan vi lave ugevisning med træk/drag som Google Kalender.)
        </p>
      </div>

      <div className="card">
        <h2 className="h2">Bookinger</h2>
        <div className="list">
          {items.map((b) => (
            <div className="item" key={b.id}>
              <div style={{ fontWeight: 700 }}>{formatDK(b.start_time)} – {formatDK(b.end_time)}</div>
              <div className="small">
                {b.dogs?.name ? b.dogs.name : "Hund"} {b.customers?.name ? `(${b.customers.name})` : ""}
              </div>
              {b.notes && <div className="small">Note: {b.notes}</div>}
              <div className="row" style={{ marginTop: 8 }}>
                {b.dog_id && <a className="btn secondary" href={`/dogs/${b.dog_id}`}>Åbn hund/journal</a>}
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="small">Ingen bookinger endnu.</div>}
        </div>
      </div>
    </div>
  );
}
