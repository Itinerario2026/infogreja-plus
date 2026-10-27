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

        <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Abrir menu">☰</button>
        <nav className={`nav ${open ? "show" : ""}`}>
          <Link to="/" onClick={close}>Início</Link>
          <a href="/#igrejas" onClick={close}>Paróquias</a>
          <Link to="/creditos" onClick={close}>Créditos</Link>
          <Link to="/admin/login" onClick={close} className="nav-admin-link">
            Área Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
