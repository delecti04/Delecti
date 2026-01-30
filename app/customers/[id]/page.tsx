"use client";

import { useEffect, useMemo, useState } from "react";
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

type Dog = {
  id: string;
  customer_id: string;
  name: string | null;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
};

export default function CustomerDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const [err, setErr] = useState("");
  const [c, setC] = useState<Customer | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);

  const mapsUrl = useMemo(() => {
    if (!c) return "";
    const s = [c.address, c.city].filter(Boolean).join(", ");
    return s ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s)}` : "";
  }, [c]);

  // dog create
  const [dn, setDn] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [dnotes, setDnotes] = useState("");

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

    const cust = await supabase.from("customers").select("*").eq("id", id).single();
    if (cust.error) return setErr(cust.error.message);
    setC(cust.data as any);

    const dg = await supabase.from("dogs").select("*").eq("customer_id", id);
    if (dg.error) return setErr(dg.error.message);
    setDogs((dg.data as any) || []);
  }

  async function saveCustomer() {
    if (!c) return;
    setErr("");
    if (!(await requireAuth())) return;

    const { error } = await supabase.from("customers").update({
      name: c.name, phone: c.phone, email: c.email, address: c.address, city: c.city, notes: c.notes
    }).eq("id", id);
    if (error) return setErr(error.message);
  }

  async function createDog() {
    setErr("");
    if (!(await requireAuth())) return;

    const { error } = await supabase.from("dogs").insert([{
      customer_id: id,
      name: dn, breed, age, weight, notes: dnotes
    }]);
    if (error) return setErr(error.message);

    setDn(""); setBreed(""); setAge(""); setWeight(""); setDnotes("");
    await load();
  }

  useEffect(() => { load(); }, []);

  if (!c) return <div className="card">Indlæser… {err && <p className="small">{err}</p>}</div>;

  return (
    <div className="grid grid-2">
      <div className="card">
        <h1 className="h1">Kunde</h1>
        {err && <p className="small">{err}</p>}

        <div className="field"><label>Navn</label>
          <input value={c.name || ""} onChange={(e)=>setC({ ...c, name: e.target.value })} />
        </div>
        <div className="field"><label>Telefon</label>
          <input value={c.phone || ""} onChange={(e)=>setC({ ...c, phone: e.target.value })} />
        </div>
        <div className="field"><label>Email</label>
          <input value={c.email || ""} onChange={(e)=>setC({ ...c, email: e.target.value })} />
        </div>
        <div className="field"><label>Adresse</label>
          <input value={c.address || ""} onChange={(e)=>setC({ ...c, address: e.target.value })} />
        </div>
        <div className="field"><label>Postnr/by</label>
          <input value={c.city || ""} onChange={(e)=>setC({ ...c, city: e.target.value })} />
        </div>
        <div className="field"><label>Kunde-noter</label>
          <textarea value={c.notes || ""} onChange={(e)=>setC({ ...c, notes: e.target.value })} />
        </div>

        <div className="row no-print">
          <button className="btn" onClick={saveCustomer}>Gem ændringer</button>
          {mapsUrl && <a className="btn secondary" href={mapsUrl} target="_blank">Åbn i kort</a>}
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Hunde</h2>
        <div className="list">
          {dogs.map((d) => (
            <a className="item" href={`/dogs/${d.id}`} key={d.id}>
              <div style={{ fontWeight: 700 }}>{d.name || "Hund"}</div>
              <div className="small">{d.breed || ""} {d.weight ? `• ${d.weight}` : ""}</div>
            </a>
          ))}
          {dogs.length === 0 && <div className="small">Ingen hunde endnu.</div>}
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #e6e8ee", margin: "14px 0" }} />

        <h2 className="h2">Opret hund</h2>
        <div className="field"><label>Navn</label><input value={dn} onChange={(e)=>setDn(e.target.value)} /></div>
        <div className="field"><label>Race</label><input value={breed} onChange={(e)=>setBreed(e.target.value)} /></div>
        <div className="field"><label>Alder/fødselsdato</label><input value={age} onChange={(e)=>setAge(e.target.value)} /></div>
        <div className="field"><label>Vægt</label><input value={weight} onChange={(e)=>setWeight(e.target.value)} /></div>
        <div className="field"><label>Noter</label><textarea value={dnotes} onChange={(e)=>setDnotes(e.target.value)} /></div>
        <button className="btn" onClick={createDog}>Gem hund</button>
      </div>
    </div>
  );
}
