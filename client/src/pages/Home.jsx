import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import { api } from "../services/api";

const byChurch = (items, churchId) =>
  (items || []).filter(item => item.churchId === churchId && !item.pastoralId);

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.publicData().then(setData).catch(err => setError(err.message));
  }, []);

  if (error) return <div className="center-message">{error}</div>;
  if (!data) return <div className="center-message">Carregando...</div>;

  return (
    <>
      <PublicHeader />
      <main>
        <section className="hero-showcase" id="inicio">
          <div className="hero-bg-overlay"></div>
          <div className="container hero-showcase-grid">
            <div className="hero-showcase-copy">
              <span className="eyebrow hero-eyebrow">Minha Paróquia</span>
              <h1>Somos uma comunidade de fé que se reúne em torno do altar de Cristo para celebrar nossa vida e história.</h1>
              <p>Escolha sua comunidade e acesse, em uma página própria, pastorais, horários, eventos, avisos, atividades, grupos e contatos.</p>
              <div className="hero-cta-row">
                <a href="#igrejas" className="btn btn-primary">Ver paróquias</a>
              </div>
              <div className="hero-highlights">
                <div><strong>12</strong><span>paróquias</span></div>
                <div><strong>13</strong><span>pastorais por paróquia</span></div>
                <div><strong>1</strong><span>plataforma integrada</span></div>
              </div>
            </div>

            <div className="hero-visual-panel">
              <div className="hero-visual-grid">
                <img src="/churches/sao_joao_batista.jpg" alt="São João Batista"/>
                <img src="/churches/ns_aparecida.jpg" alt="Nossa Senhora Aparecida"/>
                <img src="/churches/santa_luzia.jpg" alt="Santa Luzia"/>
                <img src="/churches/sagrado_coracao_jesus.jpg" alt="Sagrado Coração"/>
              </div>
              <div className="hero-floating-card card-events">
                <span>Informação organizada</span>
                <strong>Cada paróquia possui sua própria área de conteúdo</strong>
              </div>
              <div className="hero-floating-card card-contact">
                <span>Minha Paróquia</span>
                <strong>Mais simples para encontrar o que sua comunidade precisa</strong>
              </div>
            </div>
          </div>
          <div className="hero-bottom-wave"></div>
        </section>

        <section className="section home-churches-first" id="igrejas">
          <div className="container">
            <div className="home-churches-intro">
              <span className="eyebrow">Comunidades</span>
              <h1>Nossas Paróquias</h1>
              <p>Clique em uma paróquia para abrir sua página e consultar pastorais, missas, programação, eventos, atividades, avisos e contato.</p>
            </div>

            <div className="church-selector-grid church-link-grid">
              {data.churches.map(c => {
                const next = byChurch(data.schedules, c.id)[0];
                return (
                  <Link key={c.id} className="church-select-card church-link-card" to={`/igrejas/${c.id}`}>
                    <div className="church-box-image">
                      <img src={c.image?.replace("assets/img/", "/") || "/igreja1.svg"} alt={c.title}/>
                      <span className="church-open-badge">Acessar paróquia →</span>
                    </div>
                    <div className="church-box-body">
                      <h3>{c.title}</h3>
                      <div className="church-box-location">📍 {c.location}</div>
                      {next && <div className="church-box-time">🕒 {next.date} • {next.time}</div>}
                      {c.instagram && <div className="church-box-instagram">📷 {c.instagram}</div>}
                      <div className="church-card-footer">Ver página completa <span>→</span></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter context="12 paróquias, pastorais e comunidade em um só lugar." />
    </>
  );
}
