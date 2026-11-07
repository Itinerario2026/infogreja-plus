import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import RegistrationModal from "../components/RegistrationModal";
import { api } from "../services/api";

const TABS = [
  ["visao-geral", "Visão geral", "⌂"],
  ["pastorais", "Pastorais", "⛪"],
  ["escala", "Escala", "▦"],
  ["eventos", "Eventos", "★"],
];

const generalByChurch = (items, churchId) =>
  (items || []).filter(item => item.churchId === churchId && !item.pastoralId);

export default function ChurchPage() {
  const { churchId } = useParams();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [registrationItem, setRegistrationItem] = useState("");
  const [contact, setContact] = useState({ name:"", email:"", message:"" });
  const [feedback, setFeedback] = useState("");

  const rawTab = params.get("aba");
  const requestedTab = (rawTab === "horarios" || rawTab === "programacao") ? "escala" : rawTab;
  const currentTab = TABS.some(([id]) => id === requestedTab) ? requestedTab : "visao-geral";

  useEffect(() => {
    api.publicData().then(setData).catch(err => setError(err.message));
  }, []);

  const church = useMemo(() => data?.churches.find(c => c.id === churchId), [data, churchId]);

  if (error) return <div className="center-message">{error}</div>;
  if (!data) return <div className="center-message">Carregando igreja...</div>;
  if (!church) return <div className="center-message">Paróquia não encontrada. <Link to="/">Voltar ao Minha Paróquia</Link></div>;

  const schedules = generalByChurch(data.schedules, church.id);
  const programs = generalByChurch(data.programs, church.id);
  const events = generalByChurch(data.events, church.id);
  const activities = generalByChurch(data.activities, church.id);
  const groups = generalByChurch(data.groups, church.id);
  const notices = generalByChurch(data.notices, church.id);
  const pastorals = (data.pastorals || []).filter(p => p.churchId === church.id);

  function changeTab(tab) {
    setParams({ aba: tab });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function sendContact(e) {
    e.preventDefault();
    setFeedback("");
    try {
      const result = await api.contact({ churchId: church.id, ...contact });
      setFeedback(result.message);
      setContact({ name:"", email:"", message:"" });
    } catch (err) {
      setFeedback(err.message);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="church-page">
        <section className="church-page-hero">
          <div className="church-page-hero-pattern"></div>
          <div className="container church-page-hero-grid">
            <div className="church-page-image">
              <img src={church.image?.replace("assets/img/", "/") || "/igreja1.svg"} alt={church.title}/>
              <span className="church-page-image-label">Minha Paróquia</span>
            </div>
            <div className="church-page-heading">
              <Link className="church-page-back" to="/">← Todas as comunidades</Link>
              <span className="eyebrow">Comunidade</span>
              <h1>{church.title}</h1>
              <p>{church.description}</p>
              <div className="church-page-meta">
                <span>📍 {church.location}</span>
                {church.instagram && <a href={`https://instagram.com/${church.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">📷 {church.instagram}</a>}
                {church.phone && church.phone !== "Telefone a cadastrar" && <span>📞 {church.phone}</span>}
              </div>
              {schedules.length > 0 && (
                <div className="church-page-next-mass">
                  <span>Próximas celebrações na escala</span>
                  <strong>{schedules.slice(0,2).map(x => `${x.dayLabel || x.date} às ${x.time}`).join(" • ")}</strong>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="church-tabs-wrap">
          <div className="container church-tabs" role="tablist" aria-label="Informações da igreja">
            {TABS.map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                className={`church-tab ${currentTab === id ? "active" : ""}`}
                onClick={() => changeTab(id)}
              >
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>
        </section>

        <section className="section church-tab-section">
          <div className="container">
            {currentTab === "visao-geral" && (
              <Overview
                church={church}
                schedules={schedules}
                pastorals={pastorals}
                events={events}
                changeTab={changeTab}
              />
            )}

            {currentTab === "pastorais" && (
              <TabPanel eyebrow="Vida pastoral" title="Pastorais" intro={`Conheça as pastorais de ${church.title}. Cada pastoral possui uma página própria.`}>
                <div className="pastoral-grid church-page-pastorals">
                  {pastorals.map(p => (
                    <Link key={p.id} to={`/pastorais/${church.id}/${p.slug}`} className="pastoral-card">
                      <span className="pastoral-icon">{p.icon || "⛪"}</span>
                      <div>
                        <h3>{p.title}</h3>
                        <p>{p.description}</p>
                        {p.slug === "musicos" && <span className="music-feature-badge">🎵 Sugira músicas para as celebrações</span>}
                        <span className="pastoral-link">Acessar pastoral →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </TabPanel>
            )}

            {currentTab === "escala" && (
              <TabPanel
                eyebrow="Liturgia & Celebrações"
                title="Escala de Celebrações"
                intro={`Calendário litúrgico e escalas de celebrações de ${church.title}. Acompanhe os horários, dirigentes, ministros, equipes e coroinhas.`}
              >
                <div className="escala-page-wrapper">
                  <div className="escala-top-banner">
                    <div className="escala-banner-info">
                      <span className="escala-badge-tag">Calendário Litúrgico</span>
                      <h3>{church.title} — Calendário de Liturgia Mensal</h3>
                      <p>Escala completa de dirigentes, equipes organizadoras, ministros, instrumentistas e coroinhas.</p>
                    </div>
                  </div>

                  <div className="escala-cards-grid">
                    {schedules.length > 0 ? (
                      schedules.map(item => {
                        const isFullScale = !!(item.presider || item.organizer || item.communionMinisters || item.musicians || item.altarServers);

                        if (!isFullScale) {
                          return (
                            <article className="escala-card-simple" key={item.id}>
                              <div className="escala-simple-badge">
                                <span className="simple-day">{item.date || item.dayLabel || "Celebração"}</span>
                                <strong className="simple-time">🕒 {item.time}</strong>
                              </div>
                              <div className="escala-simple-details">
                                <h4>{item.title}</h4>
                                <small>📍 {item.location || "Na comunidade"}</small>
                              </div>
                            </article>
                          );
                        }

                        return (
                          <article className="escala-card-pro" key={item.id}>
                            <div className="escala-card-pro-head">
                              <div className="escala-card-date-col">
                                <span className="escala-day-tag">{item.dayLabel || item.date}</span>
                                <h4 className="escala-item-title">{item.title}</h4>
                              </div>
                              <div className="escala-card-time-pill">
                                🕒 {item.time}
                              </div>
                            </div>

                            <div className="escala-role-table">
                              {item.presider && (
                                <div className="escala-role-item">
                                  <span className="role-lbl">{item.presiderRole || "Dirigente"}:</span>
                                  <strong className="role-val role-highlight">{item.presider}</strong>
                                </div>
                              )}
                              {item.organizer && (
                                <div className="escala-role-item">
                                  <span className="role-lbl">Eq. Org.:</span>
                                  <span className="role-val">{item.organizer}</span>
                                </div>
                              )}
                              {item.communionMinisters && (
                                <div className="escala-role-item">
                                  <span className="role-lbl">Mt. Ext. S. Com.:</span>
                                  <span className="role-val">{item.communionMinisters}</span>
                                </div>
                              )}
                              {item.musicians && (
                                <div className="escala-role-item">
                                  <span className="role-lbl">Instrumentistas:</span>
                                  <span className="role-val role-music-val">{item.musicians}</span>
                                </div>
                              )}
                              {item.altarServers && (
                                <div className="escala-role-item">
                                  <span className="role-lbl">Coroinhas:</span>
                                  <span className="role-val">{item.altarServers}</span>
                                </div>
                              )}
                            </div>

                            {item.notes && (
                              <div className="escala-card-notes">
                                <span className="notes-icon">📌</span>
                                <span>{item.notes}</span>
                              </div>
                            )}
                          </article>
                        );
                      })
                    ) : (
                      <Empty text="Nenhuma escala cadastrada no momento."/>
                    )}
                  </div>

                  {programs.length > 0 && (
                    <div className="escala-programs-section">
                      <div className="section-divider-title">
                        <h4>Outros Encontros & Programação da Semana</h4>
                      </div>
                      <div className="timeline">
                        {programs.map(x => (
                          <article className="timeline-item" key={x.id}>
                            <div className="timeline-day">{x.date}</div>
                            <div>
                              <h3>{x.title}</h3>
                              <span>🕒 {x.time}</span>
                              <p>{x.description}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabPanel>
            )}

            {currentTab === "eventos" && (
              <TabPanel eyebrow="Participe" title="Eventos" intro="Eventos abertos à comunidade e oportunidades de participação.">
                <div className="grid cards-3">{events.length ? events.map(x => <InfoCard key={x.id} item={x} tag="Evento" onClick={() => setRegistrationItem(x.title)}/>) : <Empty text="Nenhum evento geral cadastrado."/>}</div>
              </TabPanel>
            )}
          </div>
        </section>
      </main>

      <PublicFooter context={church.title} />

      <RegistrationModal churchId={church.id} item={registrationItem} onClose={() => setRegistrationItem("")}/>
    </>
  );
}

function Overview({ church, schedules, pastorals, events, changeTab }) {
  return (
    <div className="church-overview">
      <div className="church-overview-heading">
        <span className="eyebrow">Bem-vindo</span>
        <h2>{church.title}</h2>
        <p>{church.description}</p>
      </div>
      <div className="church-overview-metrics">
        <button onClick={() => changeTab("pastorais")}><strong>{pastorals.length}</strong><span>Pastorais</span></button>
        <button onClick={() => changeTab("escala")}><strong>{schedules.length}</strong><span>Escala de Celebrações</span></button>
        <button onClick={() => changeTab("eventos")}><strong>{events.length}</strong><span>Eventos</span></button>
      </div>
      <div className="church-overview-grid">
        <article className="church-overview-block">
          <span className="eyebrow">Liturgia & Celebrações</span>
          <h3>Escala de Celebrações</h3>
          {schedules.length ? schedules.slice(0,3).map(x => (
            <div className="overview-row" key={x.id}>
              <span>{x.dayLabel || x.date}</span>
              <strong>🕒 {x.time} {x.presider ? `• ${x.presider}` : ""}</strong>
            </div>
          )) : <p>Nenhuma escala cadastrada.</p>}
          <button className="text-button" onClick={() => changeTab("escala")}>Ver escala completa →</button>
        </article>
        <article className="church-overview-block">
          <span className="eyebrow">Vida pastoral</span>
          <h3>Pastorais da comunidade</h3>
          <p>Conheça as equipes, responsáveis, encontros, eventos e avisos de cada pastoral.</p>
          <button className="text-button" onClick={() => changeTab("pastorais")}>Conhecer as pastorais →</button>
        </article>
      </div>
    </div>
  );
}

function TabPanel({ eyebrow, title, intro, children }) {
  return <div className="church-tab-panel">
    <div className="church-tab-panel-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{intro}</p>
    </div>
    {children}
  </div>;
}

function Empty({ text }) {
  return <div className="empty-state">{text}</div>;
}

function InfoCard({ item, tag, onClick, secondary=false }) {
  return <article className="card">
    <div className="card-body">
      <span className="card-tag">{tag}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <div className="meta">
        {item.date && <span>📅 {item.date}</span>}
        {item.time && <span>🕒 {item.time}</span>}
        {item.location && <span>📍 {item.location}</span>}
      </div>
      <button className={`btn ${secondary ? "btn-secondary" : "btn-primary"} full`} onClick={onClick}>{secondary ? "Quero participar" : "Inscrever-se"}</button>
    </div>
  </article>;
}
