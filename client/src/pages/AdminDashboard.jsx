import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const TYPES = {
  event: "Evento",
  activity: "Atividade / Serviço",
  notice: "Aviso",
  group: "Grupo",
  schedule: "Horário",
  program: "Programação"
};

const COLLECTIONS = {
  events: "event",
  activities: "activity",
  notices: "notice",
  groups: "group",
  schedules: "schedule",
  programs: "program"
};

const emptyForm = {
  type: "event",
  churchId: "",
  pastoralId: "",
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  category: ""
};

const emptyPastoralForm = {
  description:"",
  coordinator:"",
  phone:"",
  whatsapp:"",
  email:"",
  meetingDay:"",
  meetingTime:"",
  location:""
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState("");
  const [fatalError, setFatalError] = useState("");

  const [pastoralChurchId, setPastoralChurchId] = useState("");
  const [pastoralId, setPastoralId] = useState("");
  const [pastoralForm, setPastoralForm] = useState(emptyPastoralForm);

  async function load() {
    try {
      setFatalError("");
      const me = await api.me();
      setUser(me);
      const d = await api.adminData();
      const safeData = {
        ...d,
        churches: Array.isArray(d.churches) ? d.churches : [],
        pastorals: Array.isArray(d.pastorals) ? d.pastorals : [],
        events: Array.isArray(d.events) ? d.events : [],
        activities: Array.isArray(d.activities) ? d.activities : [],
        notices: Array.isArray(d.notices) ? d.notices : [],
        groups: Array.isArray(d.groups) ? d.groups : [],
        schedules: Array.isArray(d.schedules) ? d.schedules : [],
        programs: Array.isArray(d.programs) ? d.programs : [],
        registrations: Array.isArray(d.registrations) ? d.registrations : [],
        contacts: Array.isArray(d.contacts) ? d.contacts : []
      };
      setData(safeData);

      const firstChurch = safeData.churches[0]?.id || "";
      setForm(f => ({ ...f, churchId: f.churchId || firstChurch }));

      setPastoralChurchId(current => current || firstChurch);
      const currentChurch = pastoralChurchId || firstChurch;
      const firstPastoral = safeData.pastorals.find(p => p.churchId === currentChurch);
      const desiredId = pastoralId || firstPastoral?.id || "";
      setPastoralId(desiredId);
      const selected = safeData.pastorals.find(p => p.id === desiredId);
      if (selected) setPastoralForm(toPastoralForm(selected));
    } catch (err) {
      if (err.status === 401) {
        window.location.href = "/admin";
      } else {
        setFatalError(err.message || "Não foi possível carregar o dashboard.");
      }
    }
  }

  useEffect(() => { load(); }, []);

  const content = useMemo(() => {
    if (!data) return [];
    return Object.entries(COLLECTIONS).flatMap(([collection, type]) =>
      (data[collection] || []).map(item => ({ ...item, _type: type }))
    );
  }, [data]);

  if (fatalError) {
    return (
      <div className="admin-status-page">
        <div className="admin-status-card">
          <span className="brand-mark">!</span>
          <h1>Erro ao carregar o dashboard</h1>
          <p>{fatalError}</p>
          <button className="btn btn-primary" onClick={load}>Tentar novamente</button>
          <button className="btn btn-secondary" style={{marginLeft:8}} onClick={async()=>{await api.logout().catch(()=>{}); window.location.href="/admin";}}>Voltar ao login</button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="center-message">Carregando área administrativa...</div>;

  const churchName = id => data.churches.find(c => c.id === id)?.title || "-";
  const pastoralName = id => data.pastorals.find(p => p.id === id)?.title || "Geral da igreja";
  const formPastorals = data.pastorals.filter(p => p.churchId === form.churchId);
  const editPastorals = data.pastorals.filter(p => p.churchId === pastoralChurchId);

  async function submit(e) {
    e.preventDefault();
    setFeedback("");
    try {
      await api.addContent({ ...form, pastoralId: form.pastoralId || "" });
      setFeedback("Conteúdo cadastrado com sucesso.");
      setForm({ ...emptyForm, churchId: data.churches[0]?.id || "" });
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function remove(type, id) {
    if (!window.confirm("Deseja excluir este conteúdo?")) return;
    try {
      await api.deleteContent(type, id);
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function savePastoral(e) {
    e.preventDefault();
    if (!pastoralId) return;
    setFeedback("");
    try {
      await api.updatePastoral(pastoralId, pastoralForm);
      setFeedback("Dados da pastoral atualizados com sucesso.");
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  function changePastoralChurch(id) {
    setPastoralChurchId(id);
    const first = data.pastorals.find(p => p.churchId === id);
    setPastoralId(first?.id || "");
    setPastoralForm(first ? toPastoralForm(first) : emptyPastoralForm);
  }

  function changePastoral(id) {
    setPastoralId(id);
    const selected = data.pastorals.find(p => p.id === id);
    setPastoralForm(selected ? toPastoralForm(selected) : emptyPastoralForm);
  }

  async function logout() {
    await api.logout().catch(() => {});
    window.location.href = "/admin";
  }

  async function reset() {
    if (!window.confirm("Restaurar os conteúdos de demonstração?")) return;
    try {
      const result = await api.resetContent();
      setFeedback(result.message);
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand admin-brand"><span className="brand-mark">+</span><span>InfoGreja+ Admin</span></div>
        <nav className="sidebar-nav">
          <a href="#dashboard">📊 Dashboard</a>
          <a href="#cadastro">➕ Conteúdo</a>
          <a href="#pastorais-admin">⛪ Pastorais</a>
          <a href="#conteudos">🗂 Conteúdos</a>
          <a href="#inscricoes">📝 Inscrições</a>
          <a href="#mensagens">✉️ Mensagens</a>
          <a href="/">🌐 Ver site</a>
        </nav>
        <button className="sidebar-logout" onClick={logout}>Sair</button>
      </aside>

      <main className="admin-main">
        <section id="dashboard">
          <div className="admin-top">
            <div>
              <span className="eyebrow">InfoGreja+ • área protegida</span>
              <h1>Dashboard</h1>
              <p className="admin-user">Conectado como {user?.email}</p>
            </div>
            <button className="btn btn-secondary" onClick={reset}>Restaurar conteúdo demo</button>
          </div>

          <div className="dashboard-cards infogreja-metrics">
            <Metric label="Igrejas" value={data.churches.length}/>
            <Metric label="Pastorais" value={data.pastorals.length}/>
            <Metric label="Conteúdos" value={content.length}/>
            <Metric label="Inscrições" value={data.registrations.length}/>
            <Metric label="Mensagens" value={data.contacts.length}/>
          </div>
        </section>

        {feedback && <div className="admin-feedback">{feedback}</div>}

        <section className="admin-section" id="cadastro">
          <div className="panel">
            <div className="panel-heading">
              <span className="eyebrow">Novo conteúdo</span>
              <h2>Cadastrar para uma igreja ou pastoral</h2>
              <p>Use “Geral da igreja” para conteúdo da unidade. Se escolher uma pastoral, o conteúdo aparecerá apenas na página dela.</p>
            </div>
            <form className="admin-form" onSubmit={submit}>
              <label>Igreja
                <select value={form.churchId} onChange={e => setForm({...form, churchId:e.target.value, pastoralId:""})}>
                  {data.churches.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label>Pastoral
                <select value={form.pastoralId} onChange={e => setForm({...form, pastoralId:e.target.value})}>
                  <option value="">Geral da igreja</option>
                  {formPastorals.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </label>
              <label>Tipo
                <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                  {Object.entries(TYPES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label>Título<input required value={form.title} onChange={e => setForm({...form, title:e.target.value})}/></label>
              <label>Descrição<textarea rows="3" value={form.description} onChange={e => setForm({...form, description:e.target.value})}/></label>
              <label>Data / Dia<input value={form.date} onChange={e => setForm({...form, date:e.target.value})}/></label>
              <label>Horário<input value={form.time} onChange={e => setForm({...form, time:e.target.value})}/></label>
              <label>Local<input value={form.location} onChange={e => setForm({...form, location:e.target.value})}/></label>
              <label>Categoria<input placeholder="atividade, serviço, curso..." value={form.category} onChange={e => setForm({...form, category:e.target.value})}/></label>
              <button className="btn btn-primary">Salvar conteúdo</button>
            </form>
          </div>
        </section>

        <section className="admin-section" id="pastorais-admin">
          <div className="panel">
            <div className="panel-heading">
              <span className="eyebrow">Dados pastorais</span>
              <h2>Contato e organização das pastorais</h2>
              <p>Atualize responsável, contato, local e encontro regular de cada pastoral.</p>
            </div>

            <form className="admin-form pastoral-admin-form" onSubmit={savePastoral}>
              <label>Igreja
                <select value={pastoralChurchId} onChange={e => changePastoralChurch(e.target.value)}>
                  {data.churches.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label>Pastoral
                <select value={pastoralId} onChange={e => changePastoral(e.target.value)}>
                  {editPastorals.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </label>
              <label>Descrição
                <textarea rows="3" value={pastoralForm.description} onChange={e=>setPastoralForm({...pastoralForm,description:e.target.value})}/>
              </label>
              <label>Responsável / Coordenador<input value={pastoralForm.coordinator} onChange={e=>setPastoralForm({...pastoralForm,coordinator:e.target.value})}/></label>
              <label>Telefone<input value={pastoralForm.phone} onChange={e=>setPastoralForm({...pastoralForm,phone:e.target.value})}/></label>
              <label>WhatsApp<input placeholder="55 + DDD + número" value={pastoralForm.whatsapp} onChange={e=>setPastoralForm({...pastoralForm,whatsapp:e.target.value})}/></label>
              <label>E-mail<input type="email" value={pastoralForm.email} onChange={e=>setPastoralForm({...pastoralForm,email:e.target.value})}/></label>
              <label>Dia do encontro<input value={pastoralForm.meetingDay} onChange={e=>setPastoralForm({...pastoralForm,meetingDay:e.target.value})}/></label>
              <label>Horário do encontro<input value={pastoralForm.meetingTime} onChange={e=>setPastoralForm({...pastoralForm,meetingTime:e.target.value})}/></label>
              <label>Local<input value={pastoralForm.location} onChange={e=>setPastoralForm({...pastoralForm,location:e.target.value})}/></label>
              <button className="btn btn-primary">Salvar dados da pastoral</button>
            </form>
          </div>
        </section>

        <section className="admin-section" id="conteudos">
          <div className="panel">
            <div className="panel-heading"><span className="eyebrow">Gerenciamento</span><h2>Conteúdos cadastrados</h2></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Igreja</th><th>Pastoral</th><th>Tipo</th><th>Título</th><th>Data</th><th>Ação</th></tr></thead>
                <tbody>
                  {content.length ? content.map(x => (
                    <tr key={`${x._type}-${x.id}`}>
                      <td>{churchName(x.churchId)}</td>
                      <td>{pastoralName(x.pastoralId)}</td>
                      <td><span className="table-tag">{TYPES[x._type]}</span></td>
                      <td><strong>{x.title}</strong></td>
                      <td>{x.date || "-"}</td>
                      <td><button className="danger-btn" onClick={() => remove(x._type, x.id)}>Excluir</button></td>
                    </tr>
                  )) : <tr><td colSpan="6">Nenhum conteúdo cadastrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="admin-section" id="inscricoes">
          <div className="panel">
            <div className="panel-heading"><span className="eyebrow">Participantes</span><h2>Inscrições recebidas</h2></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Igreja</th><th>Pastoral</th><th>Evento/Atividade</th><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Data</th></tr></thead>
                <tbody>
                  {data.registrations.length ? [...data.registrations].reverse().map(r => (
                    <tr key={r.id}>
                      <td>{churchName(r.churchId)}</td>
                      <td>{pastoralName(r.pastoralId)}</td>
                      <td><strong>{r.item}</strong></td>
                      <td>{r.name}</td><td>{r.phone}</td><td>{r.email}</td>
                      <td>{r.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : "-"}</td>
                    </tr>
                  )) : <tr><td colSpan="7">Nenhuma inscrição recebida.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="admin-section" id="mensagens">
          <div className="panel">
            <div className="panel-heading"><span className="eyebrow">Contato</span><h2>Mensagens recebidas</h2></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Igreja</th><th>Pastoral</th><th>Nome</th><th>E-mail</th><th>Mensagem</th><th>Data</th></tr></thead>
                <tbody>
                  {data.contacts.length ? [...data.contacts].reverse().map(m => (
                    <tr key={m.id}>
                      <td>{churchName(m.churchId)}</td>
                      <td>{pastoralName(m.pastoralId)}</td>
                      <td>{m.name}</td><td>{m.email}</td><td>{m.message}</td>
                      <td>{m.createdAt ? new Date(m.createdAt).toLocaleString("pt-BR") : "-"}</td>
                    </tr>
                  )) : <tr><td colSpan="6">Nenhuma mensagem recebida.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function toPastoralForm(p) {
  return {
    description:p.description || "",
    coordinator:p.coordinator || "",
    phone:p.phone || "",
    whatsapp:p.whatsapp || "",
    email:p.email || "",
    meetingDay:p.meetingDay || "",
    meetingTime:p.meetingTime || "",
    location:p.location || ""
  };
}

function Metric({ label, value }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong></article>;
}
