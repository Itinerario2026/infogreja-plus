import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import RegistrationModal from "../components/RegistrationModal";
import MusicSuggestionModal from "../components/MusicSuggestionModal";
import { api } from "../services/api";

export default function PastoralPage() {
  const { churchId, pastoralSlug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [registrationItem, setRegistrationItem] = useState("");
  const [contact, setContact] = useState({ name:"", email:"", message:"" });
  const [feedback, setFeedback] = useState("");
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);

  const loadData = () => {
    api.publicData().then(setData).catch(err => setError(err.message));
  };

  useEffect(() => {
    loadData();
  }, []);

  const church = useMemo(() => data?.churches?.find(c => c.id === churchId), [data, churchId]);
  const pastoral = useMemo(
    () => data?.pastorals?.find(p => p.churchId === churchId && p.slug === pastoralSlug),
    [data, churchId, pastoralSlug]
  );
  const churchApprovedMusic = useMemo(() => {
    if (!data?.music_suggestions || !church?.id) return [];
    return data.music_suggestions.filter(
      m => m.churchId === church.id && m.status === "approved"
    );
  }, [data, church?.id]);

  function toggleAudio(id) {
    setPlayingTrackId(current => current === id ? null : id);
  }

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

  const isMusicPastoral = pastoral.slug === "musicos" ||
    pastoral.title?.toLowerCase().includes("músic") ||
    pastoral.title?.toLowerCase().includes("music") ||
    pastoral.title?.toLowerCase().includes("canto");

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
              <span className="eyebrow light">Pastoral • {church.title}</span>
              <h1>{pastoral.title}</h1>
              <p>{pastoral.description}</p>
              <div className="pastoral-hero-actions">
                {isMusicPastoral && (
                  <button
                    type="button"
                    className="btn btn-primary btn-music-suggest-hero"
                    onClick={() => setMusicModalOpen(true)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                    <span>Sugerir música para a missa</span>
                  </button>
                )}
                <a href={isMusicPastoral ? "#repertorio-musical" : "#agenda"} className="btn btn-light">
                  {isMusicPastoral ? "Ver repertório" : "Ver agenda"}
                </a>
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
            {isMusicPastoral && <a href="#repertorio-musical" className="highlight-nav-music">Repertório Litúrgico</a>}
            <a href="#agenda">Agenda</a>
            <a href="#eventos-pastoral">Eventos</a>
            <a href="#atividades-pastoral">Atividades</a>
            <a href="#grupos-pastoral">Grupos</a>
            <a href="#avisos-pastoral">Avisos</a>
            <a href="#contato-pastoral">Contato</a>
          </div>
        </section>

        {isMusicPastoral && (
          <PastoralSection id="repertorio-musical" alt eyebrow="Música Sacra & Liturgia" title="Repertório das Celebrações">
            <div className="music-liturgy-header-card">
              <div className="music-liturgy-header-text">
                <p>
                  Canções selecionadas e aprovadas pela coordenação para as celebrações em {church.title}.
                  Você pode sugerir novas músicas litúrgicas para os momentos da Santa Missa.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-suggest-clean"
                onClick={() => setMusicModalOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                <span>Sugerir música para a missa</span>
              </button>
            </div>

            {churchApprovedMusic.length > 0 ? (
              <div className="music-showcase-grid">
                {churchApprovedMusic.map(m => (
                  <article className="music-card-item" key={m.id}>
                    <div className="music-card-cover-wrap">
                      <img
                        src={m.image || "/igreja1.svg"}
                        alt={m.title}
                        className="music-card-cover"
                      />
                      {m.audioUrl && (
                        <button
                          type="button"
                          className={`music-cover-play-btn ${playingTrackId === m.id ? "is-active" : ""}`}
                          title={playingTrackId === m.id ? "Pausar" : "Ouvir trecho"}
                          onClick={() => toggleAudio(m.id)}
                        >
                          {playingTrackId === m.id ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="music-card-details">
                      {m.moment && <span className="music-moment-pill">{m.moment}</span>}
                      <h4 className="music-title">{m.title}</h4>
                      {m.artist && <span className="music-artist">{m.artist}</span>}
                      {m.note && <p className="music-note">“{m.note}”</p>}
                      <div className="music-card-footer">
                        <small>Sugerido por: <strong>{m.suggestedBy || "Comunidade"}</strong></small>
                        {m.audioUrl && (
                          <button
                            type="button"
                            className="music-play-text-btn"
                            onClick={() => toggleAudio(m.id)}
                          >
                            {playingTrackId === m.id ? "Pausar" : "Ouvir trecho"}
                          </button>
                        )}
                      </div>
                      {playingTrackId === m.id && m.audioUrl && (
                        <div className="music-inline-player">
                          <audio src={m.audioUrl} autoPlay controls onEnded={() => setPlayingTrackId(null)} />
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-music-card">
                <div className="empty-music-icon-wrap">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                </div>
                <h4>Nenhuma música no repertório ainda</h4>
                <p>Envie uma sugestão de música litúrgica para ser tocada nas celebrações de {church.title}.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-empty-suggest"
                  onClick={() => setMusicModalOpen(true)}
                >
                  Enviar sugestão de música
                </button>
              </div>
            )}
          </PastoralSection>
        )}

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
                <div className="contact-detail-row"><span className="contact-meta-label">Coordenação:</span> <strong>{pastoral.coordinator || "A cadastrar"}</strong></div>
                <div className="contact-detail-row"><span className="contact-meta-label">Telefone:</span> <strong>{pastoral.phone || "A cadastrar"}</strong></div>
                {pastoral.email && <div className="contact-detail-row"><span className="contact-meta-label">E-mail:</span> <strong>{pastoral.email}</strong></div>}
              </div>
              <div className="contact-actions">
                {hasWhatsapp && <a className="btn whatsapp-btn" target="_blank" rel="noreferrer" href={`https://wa.me/${pastoral.whatsapp}`}>Conversar no WhatsApp</a>}
                {pastoral.email && <a className="btn btn-light" href={`mailto:${pastoral.email}`}>Enviar E-mail</a>}
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

      {musicModalOpen && (
        <MusicSuggestionModal
          churchId={church.id}
          pastoralId={pastoral.id}
          churchTitle={church.title}
          onClose={() => setMusicModalOpen(false)}
          onSuccess={loadData}
        />
      )}
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
