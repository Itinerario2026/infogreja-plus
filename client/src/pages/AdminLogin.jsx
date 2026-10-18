import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.me().then(() => { window.location.href = "/admin"; }).catch(() => {}); }, []);

  async function submit(e) {
    e.preventDefault(); setLoading(true); setError("");
    try { await api.login(form); window.location.href = "/admin"; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return <div className="login-page"><div className="login-shell"><div className="login-brand"><span className="brand-mark">✦</span><div><strong>InfoGreja+</strong><span>Área restrita</span></div></div><div className="login-card"><span className="eyebrow">Acesso administrativo</span><h1>Entrar no dashboard</h1><p>Use o e-mail e a senha configurados na primeira inicialização do sistema.</p><form onSubmit={submit}><label>E-mail<input type="email" required autoComplete="username" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Senha<input type="password" required autoComplete="current-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button className="btn btn-primary" disabled={loading}>{loading?"Entrando...":"Entrar"}</button>{error&&<small className="error-text">{error}</small>}</form><a className="back-home" href="/">← Voltar ao site</a></div></div></div>;
}
