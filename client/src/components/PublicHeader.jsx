import { useState } from "react";

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="topbar brand-header">
      <div className="container nav-wrap">
        <a href="/#inicio" className="brand brand-lockup" onClick={close}>
          <span className="brand-mark brand-logo-wrap"><img src="/logo-minha-paroquia.jpg" alt="Minha Paróquia" className="brand-logo"/></span>
          <span className="brand-copy">
            <strong>Minha Paróquia</strong>
            <small>fé • informação • comunidade</small>
          </span>
        </a>

        <div className="header-identity">
          <span className="header-dot"></span>
          <span>Comunidades conectadas em um só lugar</span>
        </div>

        <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Abrir menu">☰</button>
        <nav className={`nav ${open ? "show" : ""}`}>
          <a href="/#inicio" onClick={close}>Início</a>
          <a href="/#igrejas" onClick={close} className="nav-cta">Paróquias</a>
        </nav>
      </div>
    </header>
  );
}
