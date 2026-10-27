import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import RegistrationModal from "../components/RegistrationModal";
import { api } from "../services/api";

export default function PastoralPage() {
  const { churchId, pastoralSlug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [registrationItem, setRegistrationItem] = useState("");
  const [contact, setContact] = useState({ name:"", email:"", message:"" });
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    api.publicData().then(setData).catch(err => setError(err.message));
  }, []);

  const church = useMemo(() => data?.churches.find(c => c.id === churchId), [data, churchId]);
  const pastoral = useMemo(
    () => data?.pastorals?.find(p => p.churchId === churchId && p.slug === pastoralSlug),
    [data, churchId, pastoralSlug]
  );

  if (error) return <div className="center-message">{error}</div>;
  if (!data) return <div className="center-message">Carregando pastoral...</div>;
  if (!church || !pastoral) return <div className="center-message">Pastoral não encontrada. <Link to="/">Voltar ao Minha Paróquia</Link></div>;

  const filter = items => (items || []).filter(x => x.churchId === church.id && x.pastoralId === pastoral.id);
  const events = filter(data.events);
  const activities = filter(data.activities);
  const notices = filter(data.notices);
  const groups = filter(data.groups);
  const schedules = filter(data.schedules);
  const programs = filter(data.programs);

  async function sendContact(e) {
    e.preventDefault();
    setFeedback("");
    try {
      const result = await api.contact({
        churchId: church.id,
        pastoralId: pastoral.id,
        ...contact,
        message: `[${pastoral.title}] ${contact.message}`
      });
      setFeedback(result.message);
      setContact({ name:"", email:"", message:"" });
    } catch (err) {
      setFeedback(err.message);
    }
  }

  const hasWhatsapp = pastoral.whatsapp && /^\d+$/.test(pastoral.whatsapp);

  return (
    <>
      <PublicHeader />
      <main className="pastoral-page">
        <section className="pastoral-hero">
          <div className="container pastoral-hero-grid">
            <div>
              <Link className="pastoral-back" to={`/igrejas/${church.id}?aba=pastorais`}>← Voltar para {church.title}</Link>
              <span className="pastoral-big-icon">{pastoral.icon || "⛪"}</span>
              <span className="eyebrow light">Pastoral • {church.title}</span>
              <h1>{pastoral.title}</h1>
              <p>{pastoral.description}</p>
              <div className="pastoral-hero-actions">
                <a href="#agenda" className="btn btn-light">Ver agenda</a>
                <a href="#contato-pastoral" className="btn btn-light-outline">Contato</a>
              </div>
            </div>
            <div className="pastoral-profile">
              <div><span>Responsável</span><strong>{pastoral.coordinator || "A cadastrar"}</strong></div>
              <div><span>Encontro</span><strong>{pastoral.meetingDay || "A definir"} • {pastoral.meetingTime || "A definir"}</strong></div>
              <div><span>Local</span><strong>{pastoral.location || "A definir"}</strong></div>
              <div><span>Telefone</span><strong>{pastoral.phone || "A cadastrar"}</strong></div>
            </div>
          </div>
        </section>

        <section className="pastoral-mini-nav">
          <div className="container">
            <a href="#agenda">📅 Agenda</a>
            <a href="#eventos-pastoral">🎟 Eventos</a>
            <a href="#atividades-pastoral">🤝 Atividades</a>
            <a href="#grupos-pastoral">👥 Grupos</a>
            <a href="#avisos-pastoral">📢 Avisos</a>
            <a href="#contato-pastoral">💬 Contato</a>
          </div>
        </section>

        <PastoralSection id="agenda" eyebrow="Organização" title="Agenda e programação">
          <div className="pastoral-agenda-grid">
            <div className="panel pastoral-info-panel">
              <span className="eyebrow">Encontro regular</span>
              <h3>{pastoral.meetingDay || "A definir"}</h3>
              <p>{pastoral.meetingTime || "A definir"} • {pastoral.location || "Local a definir"}</p>
            </div>
            <div className="timeline pastoral-timeline">
              {programs.length ? programs.map(x => <article className="timeline-item" key={x.id}><div className="timeline-day">{x.date}</div><div><h3>{x.title}</h3><span>{x.time}</span><p>{x.description}</p></div></article>) : <Empty text="A programação específica desta pastoral será publicada aqui."/>}
            </div>
          </div>
          {schedules.length > 0 && <div className="schedule-grid pastoral-schedules">{schedules.map(x => <article className="schedule-card" key={x.id}><span>{x.date}</span><strong>{x.title}</strong><b>{x.time}</b><small>{x.location}</small></article>)}</div>}
        </PastoralSection>

        <PastoralSection id="eventos-pastoral" alt eyebrow="Participe" title="Eventos">
          <div className="grid cards-3">
            {events.length ? events.map(x => <PastoralCard key={x.id} item={x} tag="Evento" button="Inscrever-se" onClick={() => setRegistrationItem(x.title)}/>) : <Empty text="Nenhum evento cadastrado para esta pastoral ainda."/>}
          </div>
        </PastoralSection>

        <PastoralSection id="atividades-pastoral" eyebrow="Serviço" title="Atividades">
          <div className="grid cards-3">
            {activities.length ? activities.map(x => <PastoralCard key={x.id} item={x} tag={x.category || "Atividade"} button="Quero participar" onClick={() => setRegistrationItem(x.title)} secondary/>) : <Empty text="Nenhuma atividade cadastrada para esta pastoral ainda."/>}
          </div>
        </PastoralSection>

        <PastoralSection id="grupos-pastoral" alt eyebrow="Caminhe junto" title="Grupos e equipes">
          <div className="grid cards-3">
            {groups.length ? groups.map(x => <article className="group-card" key={x.id}><span className="group-icon">👥</span><h3>{x.title}</h3><p>{x.description}</p><small>{x.date} {x.time && `• ${x.time}`}</small></article>) : <Empty text="Nenhum grupo específico cadastrado para esta pastoral ainda."/>}
          </div>
        </PastoralSection>

        <PastoralSection id="avisos-pastoral" eyebrow="Fique por dentro" title="Avisos">
          <div className="notice-grid">
            {notices.length ? notices.map(x => <article className="notice" key={x.id}><span>📢</span><div><h3>{x.title}</h3><p>{x.description}</p></div></article>) : <Empty text="Nenhum aviso cadastrado para esta pastoral ainda."/>}
          </div>
        </PastoralSection>

        <section className="section pastoral-contact" id="contato-pastoral">
          <div className="container pastoral-contact-grid">
            <div>
              <span className="eyebrow light">Contato da pastoral</span>
              <h2>{pastoral.title}</h2>
              <div className="pastoral-contact-list">
                <span>👤 {pastoral.coordinator || "Responsável a cadastrar"}</span>
                <span>📞 {pastoral.phone || "Telefone a cadastrar"}</span>
                {pastoral.email && <span>✉️ {pastoral.email}</span>}
              </div>
              <div className="contact-actions">
                {hasWhatsapp && <a className="btn whatsapp-btn" target="_blank" rel="noreferrer" href={`https://wa.me/${pastoral.whatsapp}`}>💬 WhatsApp</a>}
                {pastoral.email && <a className="btn btn-light" href={`mailto:${pastoral.email}`}>✉️ E-mail</a>}
              </div>
            </div>
            <form className="public-contact-form" onSubmit={sendContact}>
              <label>Nome<input required value={contact.name} onChange={e=>setContact({...contact,name:e.target.value})}/></label>
              <label>E-mail<input type="email" required value={contact.email} onChange={e=>setContact({...contact,email:e.target.value})}/></label>
              <label>Mensagem<textarea rows="4" required value={contact.message} onChange={e=>setContact({...contact,message:e.target.value})}/></label>
              <button className="btn btn-light">Enviar mensagem</button>
              {feedback && <small>{feedback}</small>}
            </form>
          </div>
        </section>
      </main>

      <PublicFooter context={`${pastoral.title} • ${church.title}`} />

      <RegistrationModal churchId={church.id} pastoralId={pastoral.id} item={registrationItem} onClose={() => setRegistrationItem("")}/>
    </>
  );
}

function PastoralSection({ id, alt=false, eyebrow, title, children }) {
  return <section className={`section ${alt ? "alt" : ""}`} id={id}>
    <div className="container">
      <div className="section-heading">
        <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
        <p>Informações específicas desta pastoral.</p>
      </div>
      {children}
    </div>
  </section>;
}

function Empty({ text }) {
  return <div className="empty-state">{text}</div>;
}

function PastoralCard({ item, tag, button, onClick, secondary=false }) {
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
      <button className={`btn ${secondary ? "btn-secondary" : "btn-primary"} full`} onClick={onClick}>{button}</button>
    </div>
  </article>;
}
