"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function signUpOrIn() {
    setMsg("");
    // prøv login først
    const signIn = await supabase.auth.signInWithPassword({ email, password: pw });
    if (!signIn.error) {
      setMsg("Logget ind ✅");
      return;
    }

    // ellers prøv opret bruger
    const signUp = await supabase.auth.signUp({ email, password: pw });
    if (signUp.error) {
      setMsg("Fejl: " + signUp.error.message);
      return;
    }
    setMsg("Bruger oprettet og logget ind ✅");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMsg("Logget ud ✅");
  }

  return (
    <div className="card">
      <h1 className="h1">Login</h1>
      <p className="small">
        Lav din egen bruger (kun dig) ved at skrive email + kode. Senere kan vi lave flere brugere/roller.
      </p>

      <div className="field">
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dig@domain.dk" />
      </div>

      <div className="field">
        <label>Kodeord</label>
        <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="••••••••" />
      </div>

      <div className="row">
        <button className="btn" onClick={signUpOrIn}>Login / Opret</button>
        <button className="btn secondary" onClick={signOut}>Log ud</button>
      </div>

      {msg && <p className="small" style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}
