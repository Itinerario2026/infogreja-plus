import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import RegistrationModal from "../components/RegistrationModal";
import { api } from "../services/api";

const TABS = [
  {
    id: "visao-geral",
    label: "Visão geral",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    )
  },
  {
    id: "pastorais",
    label: "Pastorais",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    )
  },
  {
    id: "escala",
    label: "Escala",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    )
  },
  {
    id: "eventos",
    label: "Eventos",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    )
  },
  {
    id: "mensagens",
    label: "Mensagens",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    )
  }
];

const generalByChurch = (items, churchId) =>
  (items || []).filter(item => item.churchId === churchId && !item.pastoralId);

export default function ChurchPage() {
  const { churchId } = useParams();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [registrationItem, setRegistrationItem] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "", subject: "Dúvida geral", message: "" });
  const [feedback, setFeedback] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const rawTab = params.get("aba");
  const requestedTab = (rawTab === "horarios" || rawTab === "programacao")
    ? "escala"
    : (rawTab === "contato")
    ? "mensagens"
    : rawTab;
  const currentTab = TABS.some(t => t.id === requestedTab) ? requestedTab : "visao-geral";

  useEffect(() => {
    api.publicData().then(setData).catch(err => setError(err.message));
  }, []);

  const church = useMemo(() => data?.churches.find(c => c.id === churchId), [data, churchId]);

  if (error) return <div className="center-message">{error}</div>;
  if (!data) return <div className="center-message">Carregando comunidade...</div>;
  if (!church) return <div className="center-message">Comunidade não encontrada. <Link to="/">Voltar às Comunidades</Link></div>;

  const schedules = generalByChurch(data.schedules, church.id);
  const programs = generalByChurch(data.programs, church.id);
  const events = generalByChurch(data.events, church.id);
  const pastorals = (data.pastorals || []).filter(p => p.churchId === church.id);

  function changeTab(tab) {
    setParams({ aba: tab });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function sendContact(e) {
    e.preventDefault();
    setFeedback("");
    setSendingMsg(true);
    try {
      const fullMessage = `${contact.subject ? `[Assunto: ${contact.subject}]\n` : ""}${contact.phone ? `[Telefone/WhatsApp: ${contact.phone}]\n` : ""}${contact.message}`;
      const result = await api.contact({
        churchId: church.id,
        name: contact.name,
        email: contact.email,
        message: fullMessage
      });
      setFeedback(result.message || "Mensagem enviada com sucesso para a administração da comunidade!");
      setContact({ name: "", email: "", phone: "", subject: "Dúvida geral", message: "" });
    } catch (err) {
      setFeedback(err.message || "Erro ao enviar mensagem.");
    } finally {
      setSendingMsg(false);
    }
  }

  // Dividir a escala em Coluna Esquerda (Quartas-feiras / Dias de semana) e Direita (Domingos / Fins de semana)
  const weekdaySchedules = schedules.filter(s => {
    const txt = `${s.dayLabel || ""} ${s.title || ""} ${s.notes || ""}`.toLowerCase();
    return txt.includes("quarta") || txt.includes("quinta") || txt.includes("terça") || txt.includes("sexta");
  });

  const sundaySchedules = schedules.filter(s => {
    const txt = `${s.dayLabel || ""} ${s.title || ""} ${s.notes || ""}`.toLowerCase();
    return txt.includes("domingo") || txt.includes("sábado") || txt.includes("sabado");
  });

  const leftCol = weekdaySchedules.length > 0 ? weekdaySchedules : schedules.filter((_, idx) => idx % 2 === 0);
  const rightCol = sundaySchedules.length > 0 ? sundaySchedules : schedules.filter((_, idx) => idx % 2 !== 0);

  return (
    <>
      <PublicHeader />
      <main className="church-page">
        <section className="church-page-hero">
          <div className="church-page-hero-pattern"></div>
          <div className="container church-page-hero-grid">
            <div className="church-page-image">
              <img src={church.image?.replace("assets/img/", "/") || "/igreja1.svg"} alt={church.title}/>
              <span className="church-page-image-label">Comunidade</span>
            </div>
            <div className="church-page-heading">
              <div className="church-page-back-row">
                <Link className="church-page-back" to="/">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  <span>Todas as comunidades</span>
                </Link>
              </div>
              <span className="eyebrow community-eyebrow">Comunidade</span>
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
                  <strong>{schedules.slice(0, 2).map(x => `${x.dayLabel || x.date || x.title} às ${x.time}`).join(" • ")}</strong>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="church-tabs-wrap">
          <div className="container church-tabs-shell">
            <nav className="church-tabs" role="tablist" aria-label="Navegação da comunidade">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`church-tab ${currentTab === tab.id ? "active" : ""}`}
                  onClick={() => changeTab(tab.id)}
                >
                  <span className="church-tab-icon">{tab.icon}</span>
                  <span className="church-tab-text">{tab.label}</span>
                </button>
              ))}
            </nav>
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
                  {pastorals.map(p => {
                    const pTitle = (p.title === "Pascol" || p.slug === "pascol") ? "PASCOM" : p.title;
                    const pSlug = (p.slug === "pascol") ? "pascom" : p.slug;
                    return (
                      <Link key={p.id} to={`/pastorais/${church.id}/${pSlug}`} className="pastoral-card">
                        <span className="pastoral-icon">{p.icon || "⛪"}</span>
                        <div>
                          <h3>{pTitle}</h3>
                          <p>{p.description}</p>
                          {pSlug === "musicos" && <span className="music-feature-badge">🎵 Sugira músicas para as celebrações</span>}
                          <span className="pastoral-link">Acessar pastoral →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </TabPanel>
            )}

            {currentTab === "escala" && (
              <TabPanel
                eyebrow="Liturgia & Celebrações"
                title="Escala de Celebrações"
                intro={`Calendário litúrgico e escalas de celebrações de ${church.title}. Acompanhe os horários, dirigentes, ministros, equipes e coroinhas.`}
              >
                <div className="folha-liturgia-actions">
                  <button type="button" className="btn-print-escala" onClick={() => window.print()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Imprimir Folha Litúrgica
                  </button>
                </div>

                <div className="folha-liturgia-container">
                  <div className="folha-liturgia-paper">
                    <header className="folha-liturgia-header">
                      <h2 className="folha-liturgia-church-name">Comunidade {church.title}</h2>
                      <h3 className="folha-liturgia-month-title">
                        Calendário De Liturgia Mensal — Mês de {schedules[0]?.month || "Outubro 2026"}
                      </h3>
                    </header>

                    {schedules.length > 0 ? (
                      <div className="folha-liturgia-columns">
                        {/* Coluna 1: Quartas / Dias de semana */}
                        <div className="folha-liturgia-col">
                          {leftCol.map(item => (
                            <article key={item.id} className="folha-liturgia-item">
                              <h4 className="folha-item-title-underlined">
                                {item.dayLabel || item.date} — às {item.time}
                              </h4>
                              <div className="folha-item-fields">
                                {item.presider && (
                                  <div className="folha-field-row">
                                    <span className="folha-field-label">{item.presiderRole || "Dirigente"}:</span>
                                    <span className="folha-field-val folha-field-presider">{item.presider}.</span>
                                  </div>
                                )}
                                {item.organizer && (
                                  <div className="folha-field-row">
                                    <span className="folha-field-label">Eq. Org.:</span>
                                    <span className="folha-field-val">{item.organizer}.</span>
                                  </div>
                                )}
                                {item.communionMinisters && (
                                  <div className="folha-field-row">
                                    <span className="folha-field-label">Mt. Ext. S. Com.:</span>
                                    <span className="folha-field-val">{item.communionMinisters}.</span>
                                  </div>
                                )}
                                {item.musicians && (
                                  <div className="folha-field-row">
                                    <span className="folha-field-label">Instrumentistas:</span>
                                    <span className="folha-field-val">{item.musicians}</span>
                                  </div>
                                )}
                                {item.altarServers && (
                                  <div className="folha-field-row">
                                    <span className="folha-field-label">Coroinhas:</span>
                                    <span className="folha-field-val">{item.altarServers}.</span>
                                  </div>
                                )}
                                {item.notes && (
                                  <div className="folha-item-notes-block">
                                    {item.notes.split("•").map((notePart, nIdx) => (
                                      <span key={nIdx} className="folha-note-red">{notePart.trim()}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>

                        {/* Coluna 2: Domingos / Fins de semana */}
                        <div className="folha-liturgia-col">
                          {rightCol.map(item => (
                            <article key={item.id} className="folha-liturgia-item">
                              <h4 className="folha-item-title-underlined">
                                {item.dayLabel || item.date} — às {item.time}
                              </h4>
                              <div className="folha-item-fields">
                                {item.presider && (
                                  <div className="folha-field-row">
                                    <span className="folha-field-label">{item.presiderRole || "Presidente"}:</span>
                                    <span className="folha-field-val folha-field-presider">{item.presider}.</span>
                                  </div>
                                )}
                                {item.organizer && (
                                  <div className="folha-field-row">
                                    <span className="folha-field-label">Eq. Org.:</span>
                                    <span className="folha-field-val">{item.organizer}.</span>
                                  </div>
                                )}
                                {item.communionMinisters && (
                                  <div className="folha-field-row">
                                    <span className="folha-field-label">Mt. Ext. S. Com.:</span>
                                    <span className="folha-field-val">{item.communionMinisters}.</span>
                                  </div>
                                )}
                                {item.musicians && (
                                  <div className="folha-field-row">
                                    <span className="folha-field-label">Instrumentistas:</span>
                                    <span className="folha-field-val">{item.musicians}</span>
                                  </div>
                                )}
                                {item.altarServers && (
                                  <div className="folha-field-row">
                                    <span className="folha-field-label">Coroinhas:</span>
                                    <span className="folha-field-val">{item.altarServers}.</span>
                                  </div>
                                )}
                                {item.notes && (
                                  <div className="folha-item-notes-block">
                                    {item.notes.split("•").map((notePart, nIdx) => (
                                      <span key={nIdx} className="folha-note-red">{notePart.trim()}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Empty text="Nenhuma escala cadastrada para esta comunidade no momento."/>
                    )}
                  </div>
                </div>

                {programs.length > 0 && (
                  <div className="escala-programs-section" style={{ marginTop: "40px" }}>
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
              </TabPanel>
            )}

            {currentTab === "eventos" && (
              <TabPanel eyebrow="Participe" title="Eventos" intro="Eventos abertos à comunidade e oportunidades de participação.">
                <div className="grid cards-3">
                  {events.length ? events.map(x => <InfoCard key={x.id} item={x} tag="Evento" onClick={() => setRegistrationItem(x.title)}/>) : <Empty text="Nenhum evento geral cadastrado."/>}
                </div>
              </TabPanel>
            )}

            {currentTab === "mensagens" && (
              <TabPanel
                eyebrow="Comunicação Direta"
                title={`Mensagens para ${church.title}`}
                intro={`Envie sua mensagem, dúvida, intenção ou sugestão diretamente para a administração da ${church.title}.`}
              >
                <div className="church-message-panel-grid">
                  <div className="church-message-form-col">
                    <div className="message-form-card">
                      <div className="message-form-header">
                        <h3>Fale com a Administração</h3>
                        <p>Sua mensagem é recebida no painel administrativo exclusivo da comunidade <strong>{church.title}</strong>.</p>
                      </div>

                      {feedback && (
                        <div className={`form-feedback-banner ${feedback.includes("sucesso") || feedback.includes("recebida") ? "success" : "info"}`}>
                          {feedback}
                        </div>
                      )}

                      <form onSubmit={sendContact} className="community-contact-form">
                        <div className="form-group">
                          <label htmlFor="msg-name">Seu Nome Completo *</label>
                          <input
                            id="msg-name"
                            type="text"
                            required
                            placeholder="Ex: Maria de Fátima"
                            value={contact.name}
                            onChange={e => setContact({ ...contact, name: e.target.value })}
                          />
                        </div>

                        <div className="form-row-2">
                          <div className="form-group">
                            <label htmlFor="msg-email">Seu E-mail *</label>
                            <input
                              id="msg-email"
                              type="email"
                              required
                              placeholder="seuemail@exemplo.com"
                              value={contact.email}
                              onChange={e => setContact({ ...contact, email: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="msg-phone">Telefone / WhatsApp</label>
                            <input
                              id="msg-phone"
                              type="tel"
                              placeholder="(11) 99999-9999"
                              value={contact.phone}
                              onChange={e => setContact({ ...contact, phone: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="msg-subject">Assunto</label>
                          <select
                            id="msg-subject"
                            value={contact.subject}
                            onChange={e => setContact({ ...contact, subject: e.target.value })}
                          >
                            <option value="Dúvida geral">Dúvida geral sobre a comunidade</option>
                            <option value="Intenção de Missa">Intenção de Missa / Celebração</option>
                            <option value="Participação em Pastoral">Quero participar de uma pastoral</option>
                            <option value="Dízimo e Contribuições">Dízimo e Contribuições</option>
                            <option value="Agendamento ou Secretaria">Atendimento / Secretaria</option>
                            <option value="Sugestão ou Elogio">Sugestão ou Elogio</option>
                            <option value="Outro assunto">Outro assunto</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="msg-text">Sua Mensagem *</label>
                          <textarea
                            id="msg-text"
                            rows="5"
                            required
                            placeholder={`Escreva aqui sua mensagem para a coordenação de ${church.title}...`}
                            value={contact.message}
                            onChange={e => setContact({ ...contact, message: e.target.value })}
                          />
                        </div>

                        <button type="submit" className="btn btn-primary submit-message-btn" disabled={sendingMsg}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                          {sendingMsg ? "Enviando mensagem..." : "Enviar Mensagem para a Administração"}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="church-message-info-col">
                    <div className="church-contact-channels-card">
                      <span className="eyebrow">Atendimento Local</span>
                      <h4>Canais de {church.title}</h4>
                      <p>Você também pode buscar informações diretamente pelos meios da comunidade:</p>

                      <ul className="church-contact-list">
                        <li>
                          <strong>📍 Endereço:</strong>
                          <span>{church.location}</span>
                        </li>
                        {church.phone && church.phone !== "Telefone a cadastrar" && (
                          <li>
                            <strong>📞 Telefone:</strong>
                            <span>{church.phone}</span>
                          </li>
                        )}
                        {church.whatsapp && (
                          <li>
                            <strong>💬 WhatsApp:</strong>
                            <a href={`https://wa.me/${church.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="contact-link-whatsapp">
                              Conversar no WhatsApp →
                            </a>
                          </li>
                        )}
                        {church.instagram && (
                          <li>
                            <strong>📷 Instagram:</strong>
                            <a href={`https://instagram.com/${church.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                              {church.instagram}
                            </a>
                          </li>
                        )}
                      </ul>

                      <div className="admin-routing-notice">
                        <span className="notice-icon">🛡️</span>
                        <div>
                          <strong>Destino exclusivo</strong>
                          <small>As mensagens enviadas por aqui são direcionadas especificamente para a liderança desta comunidade.</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
        <button onClick={() => changeTab("mensagens")}><strong>✉️</strong><span>Mensagens</span></button>
      </div>
      <div className="church-overview-grid">
        <article className="church-overview-block">
          <span className="eyebrow">Liturgia & Celebrações</span>
          <h3>Escala de Celebrações</h3>
          {schedules.length ? schedules.slice(0, 3).map(x => (
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
  return (
    <div className="church-tab-panel">
      <div className="church-tab-panel-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{intro}</p>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <div className="empty-state">{text}</div>;
}

function InfoCard({ item, tag, onClick, secondary = false }) {
  return (
    <article className="card">
      <div className="card-body">
        <span className="card-tag">{tag}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="meta">
          {item.date && <span>📅 {item.date}</span>}
          {item.time && <span>🕒 {item.time}</span>}
          {item.location && <span>📍 {item.location}</span>}
        </div>
        <button className={`btn ${secondary ? "btn-secondary" : "btn-primary"} full`} onClick={onClick}>
          {secondary ? "Quero participar" : "Inscrever-se"}
        </button>
      </div>
    </article>
  );
}
