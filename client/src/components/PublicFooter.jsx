import { Link } from "react-router-dom";

export default function PublicFooter({ context = "Minha Paróquia" }) {
  return (
    <footer className="footer brand-footer">
      <div className="container footer-main">
        <div className="footer-brand-block">
          <div className="footer-brand-line">
            <span className="footer-brand-mark footer-brand-logo-wrap"><img src="/logo-minha-paroquia.jpg" alt="Minha Paróquia" className="footer-brand-logo"/></span>
            <strong>Minha Paróquia</strong>
          </div>
          <p>Informação, fé e comunidade em um só lugar.</p>
          <small>{context}</small>
        </div>

        <div className="footer-nav-block">
          <span>Navegação</span>
          <Link to="/">Início</Link>
          <a href="/#igrejas">Paróquias</a>
          <Link to="/creditos">Créditos do Projeto</Link>
          <Link to="/admin/login">Área do Administrador</Link>
        </div>

        <div className="footer-signature">
          <span>12 comunidades</span>
          <span>13 pastorais por paróquia</span>
          <strong>Comunidades conectadas.</strong>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Minha Paróquia</span>
        <span>Feito para aproximar pessoas e comunidades.</span>
      </div>
    </footer>
  );
}
