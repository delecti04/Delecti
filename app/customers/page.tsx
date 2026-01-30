"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Customer = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
};

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Customer[]>([]);
  const [err, setErr] = useState("");

  // create form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
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

    let query = supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(50);
    if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);

    const { data, error } = await query;
    if (error) return setErr(error.message);
    setItems((data as any) || []);
  }

  async function createCustomer() {
    setErr("");
    if (!(await requireAuth())) return;

    const { error } = await supabase.from("customers").insert([{
      name, phone, email, address, city, notes
    }]);
    if (error) return setErr(error.message);

    setName(""); setPhone(""); setEmail(""); setAddress(""); setCity(""); setNotes("");
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="grid grid-2">
      <div className="card">
        <h1 className="h1">Kunder</h1>

        <div className="field">
          <label>Søg (navn)</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Søg på kundenavn…" />
        </div>
        <div className="row">
          <button className="btn secondary" onClick={load}>Søg/Opdater</button>
        </div>

        {err && <p className="small" style={{ marginTop: 10 }}>{err}</p>}

        <div className="list" style={{ marginTop: 12 }}>
          {items.map((c) => (
            <a className="item" key={c.id} href={`/customers/${c.id}`}>
              <div style={{ fontWeight: 700 }}>{c.name || "Uden navn"}</div>
              <div className="small">
                {c.phone ? c.phone : ""} {c.city ? `• ${c.city}` : ""}
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Opret kunde</h2>

        <div className="field"><label>Navn</label><input value={name} onChange={(e)=>setName(e.target.value)} /></div>
        <div className="field"><label>Telefon</label><input value={phone} onChange={(e)=>setPhone(e.target.value)} /></div>
        <div className="field"><label>Email</label><input value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
        <div className="field"><label>Adresse</label><input value={address} onChange={(e)=>setAddress(e.target.value)} /></div>
        <div className="field"><label>Postnr/by</label><input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="fx 8000 Aarhus C" /></div>
        <div className="field"><label>Kunde-noter</label><textarea value={notes} onChange={(e)=>setNotes(e.target.value)} /></div>

        <button className="btn" onClick={createCustomer}>Gem kunde</button>
      </div>
    </div>
  );
}
