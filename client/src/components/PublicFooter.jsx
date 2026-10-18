import { Link } from "react-router-dom";

export default function PublicFooter({ context = "InfoGreja+" }) {
  return (
    <footer className="footer brand-footer">
      <div className="container footer-main">
        <div className="footer-brand-block">
          <div className="footer-brand-line">
            <span className="footer-brand-mark">+</span>
            <strong>InfoGreja+</strong>
          </div>
          <p>Informação, fé e comunidade em um só lugar.</p>
          <small>{context}</small>
        </div>

        <div className="footer-nav-block">
          <span>Navegação</span>
          <Link to="/">Início</Link>
          <a href="/#igrejas">Igrejas</a>
        </div>

        <div className="footer-signature">
          <span>12 igrejas</span>
          <span>13 pastorais por igreja</span>
          <strong>Comunidades conectadas.</strong>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} InfoGreja+</span>
        <span>Feito para aproximar pessoas e comunidades.</span>
      </div>
    </footer>
  );
}
