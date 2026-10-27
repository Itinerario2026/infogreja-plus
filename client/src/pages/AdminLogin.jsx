import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function AdminLogin() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email:"", password:"" });
  const [recovery, setRecovery] = useState({ email:"", recoveryCode:"", newPassword:"", confirmPassword:"" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newRecoveryCode, setNewRecoveryCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.me().then(() => { window.location.href = "/admin"; }).catch(() => {}); }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      await api.login(form);
      window.location.href = "/admin";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function recover(e) {
    e.preventDefault();
    setError(""); setMessage(""); setNewRecoveryCode("");
    if (recovery.newPassword.length < 8) return setError("A nova senha deve ter pelo menos 8 caracteres.");
    if (recovery.newPassword !== recovery.confirmPassword) return setError("As senhas não coincidem.");
    setLoading(true);
    try {
      const result = await api.recoverPassword({
        email: recovery.email,
        recoveryCode: recovery.recoveryCode,
        newPassword: recovery.newPassword
      });
      setMessage(result.message);
      setNewRecoveryCode(result.newRecoveryCode || "");
      setRecovery(current => ({ ...current, recoveryCode:"", newPassword:"", confirmPassword:"" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function goLogin() {
    setMode("login"); setError(""); setMessage(""); setNewRecoveryCode("");
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-brand">
          <span className="login-logo-wrap"><img src="/logo-minha-paroquia.jpg" alt="Minha Paróquia"/></span>
          <div><strong>Minha Paróquia</strong><span>Área administrativa</span></div>
        </div>

        {mode === "login" ? (
          <div className="login-card">
            <span className="eyebrow">Acesso administrativo</span>
            <h1>Entrar no dashboard</h1>
            <p>Use o e-mail e a senha configurados na primeira inicialização do sistema.</p>
            <form onSubmit={submit}>
              <label>E-mail<input type="email" required autoComplete="username" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
              <label>Senha<input type="password" required autoComplete="current-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
              <button className="btn btn-primary" disabled={loading}>{loading?"Entrando...":"Entrar"}</button>
              {error&&<small className="error-text">{error}</small>}
            </form>
            <button className="forgot-password-link" type="button" onClick={()=>{setMode("recover");setRecovery(r=>({...r,email:form.email}));setError("");}}>Esqueci minha senha</button>
            <a className="back-home" href="/">← Voltar ao site</a>
          </div>
        ) : (
          <div className="login-card recovery-card">
            <span className="eyebrow">Recuperação segura</span>
            <h1>Redefinir senha</h1>
            <p>Informe o e-mail do administrador e a chave de recuperação fornecida na configuração inicial.</p>
            <form onSubmit={recover}>
              <label>E-mail<input type="email" required autoComplete="username" value={recovery.email} onChange={e=>setRecovery({...recovery,email:e.target.value})}/></label>
              <label>Chave de recuperação<input required autoComplete="off" placeholder="MP-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" value={recovery.recoveryCode} onChange={e=>setRecovery({...recovery,recoveryCode:e.target.value.toUpperCase()})}/></label>
              <label>Nova senha<input type="password" required minLength="8" autoComplete="new-password" value={recovery.newPassword} onChange={e=>setRecovery({...recovery,newPassword:e.target.value})}/></label>
              <label>Confirmar nova senha<input type="password" required minLength="8" autoComplete="new-password" value={recovery.confirmPassword} onChange={e=>setRecovery({...recovery,confirmPassword:e.target.value})}/></label>
              <button className="btn btn-primary" disabled={loading}>{loading?"Redefinindo...":"Redefinir senha"}</button>
              {error&&<small className="error-text">{error}</small>}
              {message&&<div className="recovery-success"><strong>{message}</strong>{newRecoveryCode&&<><span>Sua nova chave de recuperação:</span><code>{newRecoveryCode}</code><small>Anote essa chave agora. Ela não será exibida novamente.</small></>}</div>}
            </form>
            <button className="forgot-password-link" type="button" onClick={goLogin}>← Voltar ao login</button>
            <div className="recovery-local-help">Se você perdeu também a chave, execute <strong>REDEFINIR_SENHA.bat</strong> no computador onde o sistema está instalado.</div>
          </div>
        )}
      </div>
    </div>
  );
}
