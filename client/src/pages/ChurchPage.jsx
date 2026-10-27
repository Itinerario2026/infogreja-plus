import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import RegistrationModal from "../components/RegistrationModal";
import { api } from "../services/api";

const TABS = [
  ["visao-geral", "Visão geral", "⌂"],
  ["pastorais", "Pastorais", "⛪"],
  ["horarios", "Horários", "◷"],
  ["programacao", "Programação", "▦"],
  ["eventos", "Eventos", "★"],
  ["atividades", "Atividades", "✓"],
  ["grupos", "Grupos", "◎"],
  ["avisos", "Avisos", "!"],
  ["contato", "Contato", "✉"],
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

  const requestedTab = params.get("aba");
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
              <Link className="church-page-back" to="/">← Todas as paróquias</Link>
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
                  <span>Próximos horários</span>
                  <strong>{schedules.slice(0,2).map(x => `${x.date} às ${x.time}`).join(" • ")}</strong>
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
            {currentTab === "visao-geral" && <Overview church={church} schedules={schedules} pastorals={pastorals} events={events} notices={notices} changeTab={changeTab}/>}

            {currentTab === "pastorais" && (
              <TabPanel eyebrow="Vida pastoral" title="Pastorais" intro={`Conheça as pastorais de ${church.title}. Cada pastoral possui uma página própria.`}>
                <div className="pastoral-grid church-page-pastorals">
                  {pastorals.map(p => (
                    <Link key={p.id} to={`/pastorais/${church.id}/${p.slug}`} className="pastoral-card">
                      <span className="pastoral-icon">{p.icon || "⛪"}</span>
                      <div>
                        <h3>{p.title}</h3>
                        <p>{p.description}</p>
                        <span className="pastoral-link">Acessar pastoral →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </TabPanel>
            )}

            {currentTab === "horarios" && (
              <TabPanel eyebrow="Celebrações" title="Horários" intro="Missas, celebrações e encontros gerais desta igreja.">
                <div className="schedule-grid">
                  {schedules.length ? schedules.map(x => <article className="schedule-card" key={x.id}><span>{x.date}</span><strong>{x.title}</strong><b>{x.time}</b><small>{x.location}</small></article>) : <Empty text="Nenhum horário cadastrado."/>}
                </div>
              </TabPanel>
            )}

            {currentTab === "programacao" && (
              <TabPanel eyebrow="Agenda" title="Programação" intro="Agenda geral e programação da comunidade.">
                <div className="timeline">{programs.length ? programs.map(x => <article className="timeline-item" key={x.id}><div className="timeline-day">{x.date}</div><div><h3>{x.title}</h3><span>{x.time}</span><p>{x.description}</p></div></article>) : <Empty text="Nenhuma programação geral cadastrada."/>}</div>
              </TabPanel>
            )}

            {currentTab === "eventos" && (
              <TabPanel eyebrow="Participe" title="Eventos" intro="Eventos abertos à comunidade e oportunidades de participação.">
                <div className="grid cards-3">{events.length ? events.map(x => <InfoCard key={x.id} item={x} tag="Evento" onClick={() => setRegistrationItem(x.title)}/>) : <Empty text="Nenhum evento geral cadastrado."/>}</div>
              </TabPanel>
            )}

            {currentTab === "atividades" && (
              <TabPanel eyebrow="Serviço" title="Atividades" intro="Atividades, serviços e iniciativas desta comunidade.">
                <div className="grid cards-3">{activities.length ? activities.map(x => <InfoCard key={x.id} item={x} tag={x.category || "Atividade"} secondary onClick={() => setRegistrationItem(x.title)}/>) : <Empty text="Nenhuma atividade geral cadastrada."/>}</div>
              </TabPanel>
            )}

            {currentTab === "grupos" && (
              <TabPanel eyebrow="Caminhe junto" title="Grupos" intro="Grupos, equipes e espaços de convivência da comunidade.">
                <div className="grid cards-3">{groups.length ? groups.map(x => <article className="group-card" key={x.id}><span className="group-icon">👥</span><h3>{x.title}</h3><p>{x.description}</p><small>{x.date} {x.time && `• ${x.time}`}</small>{x.whatsapp && <a className="text-link" target="_blank" rel="noreferrer" href={`https://wa.me/${x.whatsapp}`}>Falar com responsável →</a>}</article>) : <Empty text="Nenhum grupo geral cadastrado."/>}</div>
              </TabPanel>
            )}

            {currentTab === "avisos" && (
              <TabPanel eyebrow="Fique por dentro" title="Avisos" intro="Comunicados e informações importantes desta igreja.">
                <div className="notice-grid">{notices.length ? notices.map(x => <article className="notice" key={x.id}><span>!</span><div><h3>{x.title}</h3><p>{x.description}</p></div></article>) : <Empty text="Nenhum aviso geral cadastrado."/>}</div>
              </TabPanel>
            )}

            {currentTab === "contato" && (
              <TabPanel eyebrow="Fale conosco" title="Contato" intro={`Entre em contato com ${church.title}.`}>
                <div className="church-page-contact-grid">
                  <div className="church-page-contact-info">
                    <div><span>Endereço</span><strong>{church.location}</strong></div>
                    {church.instagram && <div><span>Instagram</span><a href={`https://instagram.com/${church.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">{church.instagram}</a></div>}
                    {church.email && <div><span>E-mail</span><a href={`mailto:${church.email}`}>{church.email}</a></div>}
                    {church.phone && church.phone !== "Telefone a cadastrar" && <div><span>Telefone</span><strong>{church.phone}</strong></div>}
                    <div className="contact-actions">
                      {church.whatsapp && <a className="btn whatsapp-btn" target="_blank" rel="noreferrer" href={`https://wa.me/${church.whatsapp}`}>WhatsApp</a>}
                      {church.map && <a className="btn btn-secondary" target="_blank" rel="noreferrer" href={church.map}>Localização</a>}
                    </div>
                  </div>
                  <form className="public-contact-form church-page-contact-form" onSubmit={sendContact}>
                    <label>Nome<input required value={contact.name} onChange={e=>setContact({...contact,name:e.target.value})}/></label>
                    <label>E-mail<input type="email" required value={contact.email} onChange={e=>setContact({...contact,email:e.target.value})}/></label>
                    <label>Mensagem<textarea rows="5" required value={contact.message} onChange={e=>setContact({...contact,message:e.target.value})}/></label>
                    <button className="btn btn-primary">Enviar mensagem</button>
                    {feedback && <small>{feedback}</small>}
                  </form>
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

function Overview({ church, schedules, pastorals, events, notices, changeTab }) {
  return (
    <div className="church-overview">
      <div className="church-overview-heading">
        <span className="eyebrow">Bem-vindo</span>
        <h2>{church.title}</h2>
        <p>{church.description}</p>
      </div>
      <div className="church-overview-metrics">
        <button onClick={() => changeTab("pastorais")}><strong>{pastorals.length}</strong><span>Pastorais</span></button>
        <button onClick={() => changeTab("horarios")}><strong>{schedules.length}</strong><span>Horários</span></button>
        <button onClick={() => changeTab("eventos")}><strong>{events.length}</strong><span>Eventos</span></button>
        <button onClick={() => changeTab("avisos")}><strong>{notices.length}</strong><span>Avisos</span></button>
      </div>
      <div className="church-overview-grid">
        <article className="church-overview-block">
          <span className="eyebrow">Horários</span>
          <h3>Missas e celebrações</h3>
          {schedules.length ? schedules.slice(0,3).map(x => <div className="overview-row" key={x.id}><span>{x.date}</span><strong>{x.time}</strong></div>) : <p>Nenhum horário cadastrado.</p>}
          <button className="text-button" onClick={() => changeTab("horarios")}>Ver todos os horários →</button>
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
