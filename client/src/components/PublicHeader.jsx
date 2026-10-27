import { useState } from "react";
import { Link } from "react-router-dom";

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="topbar brand-header">
      <div className="container nav-wrap">
        <Link to="/" className="brand brand-lockup" onClick={close}>
          <span className="brand-mark brand-logo-wrap">
            <img src="/logo-minha-paroquia.jpg" alt="Minha Paróquia" className="brand-logo"/>
          </span>
          <span className="brand-copy">
            <strong>Minha Paróquia</strong>
            <small>fé • informação • comunidade</small>
          </span>
        </Link>

        <div className="header-identity">
          <span className="header-dot"></span>
          <span>Comunidades conectadas em um só lugar</span>
        </div>

        <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Abrir menu">☰</button>
        <nav className={`nav ${open ? "show" : ""}`}>
          <Link to="/" onClick={close}>Início</Link>
          <a href="/#igrejas" onClick={close} className="nav-cta">Paróquias</a>
          <Link to="/creditos" onClick={close} className="nav-credits-link">Créditos</Link>
          <Link to="/admin/login" onClick={close} className="nav-admin-btn">
            <span className="nav-admin-icon" aria-hidden="true">⚙️</span>
            <span>Área Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
