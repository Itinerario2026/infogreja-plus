import { useEffect, useState } from "react";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { api } from "../services/api";

export default function AdminPortal() {
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");

  async function checkSession() {
    setError("");
    setStatus("checking");
    try {
      await api.me();
      setStatus("authenticated");
    } catch (err) {
      if (err.status === 401) {
        setStatus("login");
      } else {
        setError(err.message || "Não foi possível conectar ao servidor Node.js.");
        setStatus("error");
      }
    }
  }

  useEffect(() => {
    checkSession();
  }, []);

  if (status === "checking") {
    return (
      <div className="admin-status-page">
        <div className="admin-status-card">
          <span className="brand-mark">✦</span>
          <h1>InfoGreja+ • Administração</h1>
          <p>Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="admin-status-page">
        <div className="admin-status-card">
          <span className="brand-mark">!</span>
          <h1>Não foi possível abrir o Admin</h1>
          <p>{error}</p>
          <p className="admin-status-help">
            Confirme se a janela <strong>InfoGreja+ - API Node</strong> está aberta e se
            <code> http://localhost:3001/api/health </code> responde no navegador.
          </p>
          <button className="btn btn-primary" onClick={checkSession}>Tentar novamente</button>
          <a className="back-home" href="/">← Voltar ao site</a>
        </div>
      </div>
    );
  }

  if (status === "login") {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}
