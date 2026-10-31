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
  description: "",
  coordinator: "",
  phone: "",
  whatsapp: "",
  email: "",
  meetingDay: "",
  meetingTime: "",
  location: ""
};

const emptyChurchForm = {
  title: "",
  subtitle: "",
  description: "",
  location: "",
  phone: "",
  email: "",
  whatsapp: "",
  instagram: "",
  pastor: "",
  map: "",
  image: ""
};

const toChurchForm = c => ({
  title: c?.title || "",
  subtitle: c?.subtitle || "",
  description: c?.description || "",
  location: c?.location || "",
  phone: c?.phone || "",
  email: c?.email || "",
  whatsapp: c?.whatsapp || "",
  instagram: c?.instagram || "",
  pastor: c?.pastor || "",
  map: c?.map || "",
  image: c?.image || ""
});

const toPastoralForm = p => ({
  description: p?.description || "",
  coordinator: p?.coordinator || "",
  phone: p?.phone || "",
  whatsapp: p?.whatsapp || "",
  email: p?.email || "",
  meetingDay: p?.meetingDay || "",
  meetingTime: p?.meetingTime || "",
  location: p?.location || ""
});

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState("");
  const [fatalError, setFatalError] = useState("");

  // Navegação entre Visão Geral e Área Exclusiva da Comunidade
  const [selectedChurchId, setSelectedChurchId] = useState("");
  const [churchTab, setChurchTab] = useState("dados"); // "dados" | "pastorais" | "musicas" | "conteudos"

  const [churchEditId, setChurchEditId] = useState("");
  const [churchForm, setChurchForm] = useState(emptyChurchForm);

  const [pastoralChurchId, setPastoralChurchId] = useState("");
  const [pastoralId, setPastoralId] = useState("");
  const [pastoralForm, setPastoralForm] = useState(emptyPastoralForm);

  // Músicas & Sugestões (Aprovação)
  const [musicStatusFilter, setMusicStatusFilter] = useState("all");
  const [feedbackMap, setFeedbackMap] = useState({});
  const [adminPlayingAudioId, setAdminPlayingAudioId] = useState(null);

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
        contacts: Array.isArray(d.contacts) ? d.contacts : [],
        music_suggestions: Array.isArray(d.music_suggestions) ? d.music_suggestions : []
      };
      setData(safeData);

      const firstChurch = safeData.churches[0]?.id || "";
      setForm(current => ({ ...current, churchId: current.churchId || firstChurch }));

      setChurchEditId(current => {
        const desired = current || firstChurch;
        const selected = safeData.churches.find(c => c.id === desired) || safeData.churches[0];
        setChurchForm(toChurchForm(selected));
        return selected?.id || "";
      });

      setPastoralChurchId(current => {
        const desiredChurch = current || firstChurch;
        const firstPastoral = safeData.pastorals.find(p => p.churchId === desiredChurch);
        setPastoralId(currentPastoral => {
          const validCurrent = safeData.pastorals.find(p => p.id === currentPastoral && p.churchId === desiredChurch);
          const selected = validCurrent || firstPastoral;
          setPastoralForm(toPastoralForm(selected));
          return selected?.id || "";
        });
        return desiredChurch;
      });
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
          <img className="admin-status-logo" src="/logo-minha-paroquia.jpg" alt="Minha Paróquia" />
          <h1>Erro ao carregar o dashboard</h1>
          <p>{fatalError}</p>
          <button className="btn btn-primary" onClick={load}>Tentar novamente</button>
          <button className="btn btn-secondary" style={{marginLeft:8}} onClick={async()=>{await api.logout().catch(()=>{}); window.location.href="/admin";}}>Voltar ao login</button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="center-message">Carregando área administrativa...</div>;

  const currentChurch = data.churches.find(c => c.id === selectedChurchId);
  const currentChurchPastorals = (data.pastorals || []).filter(p => p.churchId === selectedChurchId);
  const currentChurchContent = content.filter(x => x.churchId === selectedChurchId);
  const currentChurchMusic = (data.music_suggestions || []).filter(m => m.churchId === selectedChurchId);
  const currentChurchPendingMusic = currentChurchMusic.filter(m => m.status === "pending").length;

  const filteredChurchMusic = currentChurchMusic.filter(m => {
    if (musicStatusFilter !== "all" && m.status !== musicStatusFilter) return false;
    return true;
  });

  const churchName = id => data.churches.find(c => c.id === id)?.title || "-";
  const pastoralName = id => data.pastorals.find(p => p.id === id)?.title || "Geral da paróquia";
  const formPastorals = data.pastorals.filter(p => p.churchId === (selectedChurchId || form.churchId));
  const editPastorals = data.pastorals.filter(p => p.churchId === (selectedChurchId || pastoralChurchId));

  const churchContentCount = id => content.filter(x => x.churchId === id).length;
  const churchPastoralCount = id => data.pastorals.filter(p => p.churchId === id).length;
  const churchMusicSuggestions = id => (data.music_suggestions || []).filter(m => m.churchId === id).length;

  function openChurchWorkspace(id, tab = "dados") {
    setSelectedChurchId(id);
    setChurchTab(tab);
    setChurchEditId(id);
    const selected = data.churches.find(c => c.id === id);
    setChurchForm(toChurchForm(selected));

    const firstPastoral = data.pastorals.find(p => p.churchId === id);
    setPastoralChurchId(id);
    setPastoralId(firstPastoral?.id || "");
    setPastoralForm(firstPastoral ? toPastoralForm(firstPastoral) : emptyPastoralForm);

    setForm(current => ({ ...current, churchId: id, pastoralId: "" }));
    setFeedback("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeChurchWorkspace() {
    setSelectedChurchId("");
    setFeedback("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChurchImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback("Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setFeedback("A imagem é muito grande. Escolha uma foto com até 12MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1400;
        const maxH = 1050;
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          if (width / height > maxW / maxH) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          } else {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const optimizedUrl = canvas.toDataURL("image/jpeg", 0.88);

        setChurchForm(prev => ({ ...prev, image: optimizedUrl }));
        setFeedback("Nova foto carregada! Clique em 'Salvar dados da paróquia' para aplicar.");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault();
    setFeedback("");
    const targetChurch = selectedChurchId || form.churchId;
    try {
      await api.addContent({ ...form, churchId: targetChurch, pastoralId: form.pastoralId || "" });
      setFeedback("Conteúdo cadastrado com sucesso.");
      setForm(current => ({ ...emptyForm, churchId: targetChurch }));
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function saveChurch(e) {
    e.preventDefault();
    const targetId = selectedChurchId || churchEditId;
    if (!targetId) return;
    setFeedback("");
    try {
      await api.updateChurch(targetId, churchForm);
      setFeedback("Dados da paróquia atualizados com sucesso.");
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

  function changePastoral(id) {
    setPastoralId(id);
    const selected = data.pastorals.find(p => p.id === id);
    setPastoralForm(selected ? toPastoralForm(selected) : emptyPastoralForm);
  }

  function toggleAdminAudio(id) {
    setAdminPlayingAudioId(current => current === id ? null : id);
  }

  async function handleApproveMusic(item) {
    const adminFeedback = feedbackMap[item.id] !== undefined ? feedbackMap[item.id] : (item.adminFeedback || "");
    try {
      await api.updateMusicSuggestion(item.id, { status: "approved", adminFeedback });
      setFeedback(`Música "${item.title}" aprovada para o repertório público com sucesso!`);
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function handleRejectMusic(item) {
    const adminFeedback = feedbackMap[item.id] !== undefined ? feedbackMap[item.id] : (item.adminFeedback || "");
    try {
      await api.updateMusicSuggestion(item.id, { status: "rejected", adminFeedback });
      setFeedback(`Música "${item.title}" marcada como recusada.`);
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function handleDeleteMusic(id) {
    if (!window.confirm("Deseja realmente excluir esta sugestão de música?")) return;
    try {
      await api.deleteMusicSuggestion(id);
      setFeedback("Sugestão de música excluída com sucesso.");
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  const musicSuggestions = data?.music_suggestions || [];
  const pendingMusicCount = musicSuggestions.filter(m => m.status === "pending").length;

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
    <div className="admin-layout minha-paroquia-admin">
      <aside className="sidebar">
        <div className="admin-brand-lockup">
          <img src="/logo-minha-paroquia.jpg" alt="Minha Paróquia" className="admin-brand-logo" />
          <div>
            <strong>Minha Paróquia</strong>
            <span>Administração</span>
          </div>
        </div>

        {/* Menu lateral dinâmico: Geral vs Comunidade Específica */}
        {selectedChurchId && currentChurch ? (
          <nav className="sidebar-nav church-workspace-nav">
            <button className="sidebar-back-action" onClick={closeChurchWorkspace}>
              ← Voltar ao painel geral
            </button>
            <div className="sidebar-church-current">
              <span className="church-edit-badge">Comunidade em edição:</span>
              <strong>{currentChurch.title}</strong>
            </div>

            <button
              className={`sidebar-nav-tab ${churchTab === "dados" ? "active" : ""}`}
              onClick={() => setChurchTab("dados")}
            >
              Dados da Paróquia & Foto
            </button>
            <button
              className={`sidebar-nav-tab ${churchTab === "pastorais" ? "active" : ""}`}
              onClick={() => setChurchTab("pastorais")}
            >
              Pastorais ({currentChurchPastorals.length})
            </button>
            <button
              className={`sidebar-nav-tab ${churchTab === "musicas" ? "active" : ""}`}
              onClick={() => setChurchTab("musicas")}
            >
              Aprovação de Músicas
              {currentChurchPendingMusic > 0 && (
                <span className="admin-nav-badge">{currentChurchPendingMusic}</span>
              )}
            </button>
            <button
              className={`sidebar-nav-tab ${churchTab === "conteudos" ? "active" : ""}`}
              onClick={() => setChurchTab("conteudos")}
            >
              Conteúdos & Agenda ({currentChurchContent.length})
            </button>

            <a href={`/igrejas/${selectedChurchId}`} target="_blank" rel="noreferrer" className="sidebar-external-link">
              Abrir página pública ↗
            </a>
          </nav>
        ) : (
          <nav className="sidebar-nav">
            <a href="#dashboard">Visão Geral</a>
            <a href="#paroquias">Comunidades ({data.churches.length})</a>
            <a href="#inscricoes">Inscrições Gerais ({data.registrations.length})</a>
            <a href="#mensagens">Mensagens Recebidas ({data.contacts.length})</a>
            <a href="/">Ver site público</a>
          </nav>
        )}

        <button className="sidebar-logout" onClick={logout}>Sair</button>
      </aside>

      <main className="admin-main">
        {feedback && <div className="admin-feedback-toast">{feedback}</div>}

        {/* ==============================================================
            CENÁRIO 1: GESTÃO EXCLUSIVA DA COMUNIDADE SELECIONADA
            ============================================================== */}
        {selectedChurchId && currentChurch ? (
          <div className="church-workspace-container">
            {/* Barra superior de navegação da comunidade */}
            <div className="church-workspace-header">
              <div className="church-workspace-title-box">
                <button className="btn-back-overview" onClick={closeChurchWorkspace}>
                  ← Voltar a todas as comunidades
                </button>
                <div className="church-title-lockup">
                  <div className="church-thumb-mini">
                    <img
                      src={currentChurch.image?.replace("assets/img/", "/") || "/igreja1.svg"}
                      alt={currentChurch.title}
                    />
                  </div>
                  <div>
                    <span className="eyebrow">Gestão Exclusiva da Comunidade</span>
                    <h1>{currentChurch.title}</h1>
                    <p>{currentChurch.location || "Endereço a cadastrar"}</p>
                  </div>
                </div>
              </div>
              <div className="church-workspace-top-actions">
                <a
                  className="btn btn-secondary"
                  href={`/igrejas/${currentChurch.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver página pública ↗
                </a>
              </div>
            </div>

            {/* Abas de navegação da comunidade */}
            <div className="church-workspace-tabs">
              <button
                type="button"
                className={`church-workspace-tab-btn ${churchTab === "dados" ? "active" : ""}`}
                onClick={() => setChurchTab("dados")}
              >
                Informações & Foto da Paróquia
              </button>
              <button
                type="button"
                className={`church-workspace-tab-btn ${churchTab === "pastorais" ? "active" : ""}`}
                onClick={() => setChurchTab("pastorais")}
              >
                Pastorais ({currentChurchPastorals.length})
              </button>
              <button
                type="button"
                className={`church-workspace-tab-btn ${churchTab === "musicas" ? "active" : ""}`}
                onClick={() => setChurchTab("musicas")}
              >
                Músicas Sugeridas
                {currentChurchPendingMusic > 0 && (
                  <span className="tab-pending-badge">{currentChurchPendingMusic}</span>
                )}
              </button>
              <button
                type="button"
                className={`church-workspace-tab-btn ${churchTab === "conteudos" ? "active" : ""}`}
                onClick={() => setChurchTab("conteudos")}
              >
                Conteúdos & Agenda ({currentChurchContent.length})
              </button>
            </div>

            {/* Conteúdo da Aba 1: Dados e Foto */}
            {churchTab === "dados" && (
              <section className="church-workspace-content-pane">
                <div className="panel">
                  <div className="panel-heading">
                    <span className="eyebrow">Informações Públicas</span>
                    <h2>Editar dados da paróquia</h2>
                    <p>Atualize nome, endereço, contatos, pároco e a foto de capa exibida no site.</p>
                  </div>

                  <form className="admin-form church-admin-form" onSubmit={saveChurch}>
                    <label>Nome público
                      <input
                        required
                        value={churchForm.title}
                        onChange={e => setChurchForm({ ...churchForm, title: e.target.value })}
                      />
                    </label>
                    <label>Subtítulo
                      <input
                        value={churchForm.subtitle}
                        onChange={e => setChurchForm({ ...churchForm, subtitle: e.target.value })}
                      />
                    </label>
                    <label className="wide-field">Descrição
                      <textarea
                        rows="3"
                        value={churchForm.description}
                        onChange={e => setChurchForm({ ...churchForm, description: e.target.value })}
                      />
                    </label>
                    <label className="wide-field">Endereço
                      <input
                        value={churchForm.location}
                        onChange={e => setChurchForm({ ...churchForm, location: e.target.value })}
                      />
                    </label>
                    <label>Telefone
                      <input
                        value={churchForm.phone}
                        onChange={e => setChurchForm({ ...churchForm, phone: e.target.value })}
                      />
                    </label>
                    <label>WhatsApp
                      <input
                        placeholder="55 + DDD + número"
                        value={churchForm.whatsapp}
                        onChange={e => setChurchForm({ ...churchForm, whatsapp: e.target.value })}
                      />
                    </label>
                    <label>E-mail
                      <input
                        type="email"
                        value={churchForm.email}
                        onChange={e => setChurchForm({ ...churchForm, email: e.target.value })}
                      />
                    </label>
                    <label>Instagram
                      <input
                        placeholder="@perfil"
                        value={churchForm.instagram}
                        onChange={e => setChurchForm({ ...churchForm, instagram: e.target.value })}
                      />
                    </label>
                    <label>Responsável / Pároco
                      <input
                        value={churchForm.pastor}
                        onChange={e => setChurchForm({ ...churchForm, pastor: e.target.value })}
                      />
                    </label>
                    <label>Link do mapa
                      <input
                        value={churchForm.map}
                        onChange={e => setChurchForm({ ...churchForm, map: e.target.value })}
                      />
                    </label>

                    <div className="wide-field church-image-manager">
                      <span className="church-image-label">Foto de Capa da Paróquia</span>
                      <div className="church-image-preview-card">
                        <div className="church-image-preview-thumb">
                          <img
                            src={churchForm.image?.replace("assets/img/", "/") || "/igreja1.svg"}
                            alt={churchForm.title || "Prévia"}
                          />
                        </div>
                        <div className="church-image-controls">
                          <p className="church-image-help">
                            Escolha uma nova foto do seu dispositivo para atualizar a imagem desta paróquia.
                          </p>
                          <div className="church-image-btn-row">
                            <label className="btn btn-secondary upload-image-btn">
                              <span>Escolher foto do computador</span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleChurchImageUpload}
                              />
                            </label>
                            {churchForm.image && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => setChurchForm({ ...churchForm, image: "" })}
                              >
                                Remover foto
                              </button>
                            )}
                          </div>
                          <label className="church-image-url-label">
                            <span>Ou cole o link de uma imagem:</span>
                            <input
                              placeholder="https://... ou /churches/exemplo.jpg"
                              value={churchForm.image}
                              onChange={e => setChurchForm({ ...churchForm, image: e.target.value })}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <button className="btn btn-primary">Salvar dados da paróquia</button>
                  </form>
                </div>
              </section>
            )}

            {/* Conteúdo da Aba 2: Pastorais desta Comunidade */}
            {churchTab === "pastorais" && (
              <section className="church-workspace-content-pane">
                <div className="panel">
                  <div className="panel-heading">
                    <span className="eyebrow">Pastorais de {currentChurch.title}</span>
                    <h2>Organização das pastorais</h2>
                    <p>Selecione uma das pastorais desta comunidade para editar responsável, contato e encontros.</p>
                  </div>

                  <form className="admin-form pastoral-admin-form" onSubmit={savePastoral}>
                    <label className="wide-field">Pastoral desta comunidade
                      <select value={pastoralId} onChange={e => changePastoral(e.target.value)}>
                        {currentChurchPastorals.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </label>

                    <label className="wide-field">Descrição
                      <textarea
                        rows="3"
                        value={pastoralForm.description}
                        onChange={e => setPastoralForm({ ...pastoralForm, description: e.target.value })}
                      />
                    </label>
                    <label>Responsável / Coordenador
                      <input
                        value={pastoralForm.coordinator}
                        onChange={e => setPastoralForm({ ...pastoralForm, coordinator: e.target.value })}
                      />
                    </label>
                    <label>Telefone
                      <input
                        value={pastoralForm.phone}
                        onChange={e => setPastoralForm({ ...pastoralForm, phone: e.target.value })}
                      />
                    </label>
                    <label>WhatsApp
                      <input
                        placeholder="55 + DDD + número"
                        value={pastoralForm.whatsapp}
                        onChange={e => setPastoralForm({ ...pastoralForm, whatsapp: e.target.value })}
                      />
                    </label>
                    <label>E-mail
                      <input
                        type="email"
                        value={pastoralForm.email}
                        onChange={e => setPastoralForm({ ...pastoralForm, email: e.target.value })}
                      />
                    </label>
                    <label>Dia do encontro regular
                      <input
                        value={pastoralForm.meetingDay}
                        onChange={e => setPastoralForm({ ...pastoralForm, meetingDay: e.target.value })}
                      />
                    </label>
                    <label>Horário do encontro
                      <input
                        value={pastoralForm.meetingTime}
                        onChange={e => setPastoralForm({ ...pastoralForm, meetingTime: e.target.value })}
                      />
                    </label>
                    <label>Local
                      <input
                        value={pastoralForm.location}
                        onChange={e => setPastoralForm({ ...pastoralForm, location: e.target.value })}
                      />
                    </label>

                    <button className="btn btn-primary">Salvar dados da pastoral</button>
                  </form>
                </div>
              </section>
            )}

            {/* Conteúdo da Aba 3: Músicas Sugeridas desta Comunidade */}
            {churchTab === "musicas" && (
              <section className="church-workspace-content-pane">
                <div className="panel music-admin-panel">
                  <div className="panel-heading">
                    <span className="eyebrow">Pastoral de Música de {currentChurch.title}</span>
                    <h2>Aprovação de Sugestões de Músicas</h2>
                    <p>Revise as canções enviadas pela comunidade para as celebrações desta paróquia.</p>
                  </div>

                  <div className="music-admin-filter-bar">
                    <div className="filter-title-group">
                      <h3>Sugestões para esta comunidade ({filteredChurchMusic.length})</h3>
                      <span className="filter-subtitle">Músicas pendentes aguardando moderação.</span>
                    </div>

                    <div className="music-filter-controls">
                      <label>Filtrar por Status:
                        <select
                          value={musicStatusFilter}
                          onChange={e => setMusicStatusFilter(e.target.value)}
                        >
                          <option value="all">Todas ({currentChurchMusic.length})</option>
                          <option value="pending">Pendentes ({currentChurchPendingMusic})</option>
                          <option value="approved">Aprovadas ({currentChurchMusic.filter(m => m.status === "approved").length})</option>
                          <option value="rejected">Recusadas ({currentChurchMusic.filter(m => m.status === "rejected").length})</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {filteredChurchMusic.length === 0 ? (
                    <div className="empty-music-admin">
                      <h4>Nenhuma sugestão encontrada</h4>
                      <p>As canções enviadas pelos fiéis na página da Pastoral de Música aparecerão aqui para aprovação.</p>
                    </div>
                  ) : (
                    <div className="music-admin-cards-grid">
                      {filteredChurchMusic.map(item => (
                        <article className={`music-admin-card status-${item.status}`} key={item.id}>
                          <div className="music-admin-card-head">
                            <div className="music-admin-card-thumb">
                              {item.image ? (
                                <img src={item.image} alt={item.title} />
                              ) : (
                                <div className="music-thumb-placeholder">Música</div>
                              )}
                            </div>
                            <div className="music-admin-card-meta">
                              <div className="meta-badge-row">
                                {item.moment && <span className="moment-tag">{item.moment}</span>}
                                <span className={`status-badge status-${item.status}`}>
                                  {item.status === "approved" ? "Aprovada" : item.status === "rejected" ? "Recusada" : "Pendente"}
                                </span>
                              </div>
                              <h4>{item.title}</h4>
                              {item.artist && <span className="artist-name">{item.artist}</span>}
                              <small className="suggester-info">
                                Enviada por: <strong>{item.suggestedBy || "Fiel"}</strong> • {item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "Recentemente"}
                              </small>
                            </div>
                          </div>

                          {item.note && (
                            <div className="music-admin-note">
                              <strong>Mensagem do fiel:</strong> “{item.note}”
                            </div>
                          )}

                          {item.image && item.image.startsWith("data:image") && (
                            <div className="music-attached-image">
                              <small>Foto / Partitura anexada:</small>
                              <a href={item.image} target="_blank" rel="noreferrer">
                                <img src={item.image} alt="Partitura / Foto" className="sheet-preview" />
                              </a>
                            </div>
                          )}

                          {item.audioUrl && (
                            <div className="music-admin-audio-player">
                              <button
                                type="button"
                                className="btn btn-secondary btn-audio-admin"
                                onClick={() => toggleAdminAudio(item.id)}
                              >
                                {adminPlayingAudioId === item.id ? "Pausar prévia" : "Ouvir trecho (30s)"}
                              </button>
                              {adminPlayingAudioId === item.id && (
                                <audio src={item.audioUrl} autoPlay controls onEnded={() => setAdminPlayingAudioId(null)} />
                              )}
                            </div>
                          )}

                          <div className="music-admin-actions-box">
                            <label className="feedback-label">
                              <span>Feedback / Observação do Administrador:</span>
                              <input
                                type="text"
                                placeholder="Ex: Aprovada para a missa de domingo..."
                                value={feedbackMap[item.id] !== undefined ? feedbackMap[item.id] : (item.adminFeedback || "")}
                                onChange={e => setFeedbackMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                              />
                            </label>

                            <div className="music-admin-decision-buttons">
                              <button
                                type="button"
                                className={`decision-btn btn-sim ${item.status === "approved" ? "is-selected" : ""}`}
                                onClick={() => handleApproveMusic(item)}
                              >
                                Sim (Aprovar)
                              </button>
                              <button
                                type="button"
                                className={`decision-btn btn-nao ${item.status === "rejected" ? "is-selected" : ""}`}
                                onClick={() => handleRejectMusic(item)}
                              >
                                Não (Recusar)
                              </button>
                              <button
                                type="button"
                                className="decision-btn btn-trash"
                                onClick={() => handleDeleteMusic(item.id)}
                                title="Excluir do sistema"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Conteúdo da Aba 4: Conteúdos e Agenda desta Comunidade */}
            {churchTab === "conteudos" && (
              <section className="church-workspace-content-pane">
                <div className="panel" style={{ marginBottom: 28 }}>
                  <div className="panel-heading">
                    <span className="eyebrow">Novo Conteúdo</span>
                    <h2>Cadastrar conteúdo para {currentChurch.title}</h2>
                    <p>Adicione eventos, atividades, avisos ou horários para esta paróquia ou suas pastorais.</p>
                  </div>
                  <form className="admin-form" onSubmit={submit}>
                    <label>Vínculo pastoral
                      <select value={form.pastoralId} onChange={e => setForm({ ...form, pastoralId: e.target.value })}>
                        <option value="">Geral da paróquia</option>
                        {currentChurchPastorals.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </label>
                    <label>Tipo
                      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                        {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </label>
                    <label>Título<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
                    <label>Descrição<textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
                    <label>Data / Dia<input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
                    <label>Horário<input value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></label>
                    <label>Local<input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></label>
                    <label>Categoria<input placeholder="atividade, serviço, curso..." value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
                    <button className="btn btn-primary">Salvar conteúdo da paróquia</button>
                  </form>
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <span className="eyebrow">Conteúdos Cadastrados</span>
                    <h2>Agenda e avisos de {currentChurch.title} ({currentChurchContent.length})</h2>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Pastoral</th>
                          <th>Tipo</th>
                          <th>Título</th>
                          <th>Data</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentChurchContent.length ? currentChurchContent.map(x => (
                          <tr key={`${x._type}-${x.id}`}>
                            <td>{pastoralName(x.pastoralId)}</td>
                            <td><span className="table-tag">{TYPES[x._type]}</span></td>
                            <td><strong>{x.title}</strong></td>
                            <td>{x.date || "-"}</td>
                            <td><button className="danger-btn" onClick={() => remove(x._type, x.id)}>Excluir</button></td>
                          </tr>
                        )) : <tr><td colSpan="5">Nenhum conteúdo cadastrado para esta comunidade ainda.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : (
          /* ==============================================================
             CENÁRIO 2: VISÃO GERAL (TODAS AS COMUNIDADES)
             ============================================================== */
          <div>
            <section id="dashboard">
              <div className="admin-top admin-top-brand">
                <div>
                  <span className="eyebrow">Minha Paróquia • Painel Geral</span>
                  <h1>Dashboard</h1>
                  <p className="admin-user">Conectado como {user?.email}</p>
                </div>
                <div className="admin-top-actions">
                  <a className="btn btn-secondary" href="/">Ver site</a>
                  <button className="btn btn-secondary" onClick={reset}>Restaurar demo</button>
                </div>
              </div>

              <div className="dashboard-cards minha-paroquia-metrics">
                <Metric label="Paróquias" value={data.churches.length} />
                <Metric label="Pastorais" value={data.pastorals.length} />
                <Metric label="Conteúdos" value={content.length} />
                <Metric label="Sugestões Música" value={`${musicSuggestions.length} (${pendingMusicCount} pend.)`} />
                <Metric label="Inscrições" value={data.registrations.length} />
                <Metric label="Mensagens" value={data.contacts.length} />
              </div>
            </section>

            <section className="admin-section" id="paroquias">
              <div className="admin-section-heading-pro">
                <div>
                  <span className="eyebrow">Gestão por Comunidade</span>
                  <h2>Selecione uma paróquia para gerenciar</h2>
                  <p>
                    Clique em qualquer uma das comunidades abaixo para abrir a área exclusiva de edição de dados,
                    pastorais, aprovação de músicas e conteúdos.
                  </p>
                </div>
              </div>

              <div className="admin-parish-grid">
                {data.churches.map(church => (
                  <article
                    className="admin-parish-card interactive-parish-card"
                    key={church.id}
                    onClick={() => openChurchWorkspace(church.id, "dados")}
                  >
                    <div className="admin-parish-image">
                      <img
                        src={church.image?.replace("assets/img/", "/") || "/igreja1.svg"}
                        alt={church.title}
                      />
                      <span>{churchPastoralCount(church.id)} pastorais</span>
                    </div>
                    <div className="admin-parish-body">
                      <h3>{church.title}</h3>
                      <p>📍 {church.location || "Endereço a cadastrar"}</p>
                      <div className="admin-parish-stats">
                        <span><strong>{churchContentCount(church.id)}</strong> conteúdos</span>
                        <span><strong>{churchMusicSuggestions(church.id)}</strong> músicas</span>
                        <span><strong>{data.registrations.filter(r => r.churchId === church.id).length}</strong> inscrições</span>
                      </div>
                      <div className="admin-parish-actions" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          className="parish-action primary-manage-btn"
                          onClick={() => openChurchWorkspace(church.id, "dados")}
                        >
                          Gerenciar Comunidade →
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-section" id="inscricoes">
              <div className="panel">
                <div className="panel-heading">
                  <span className="eyebrow">Participantes</span>
                  <h2>Inscrições recebidas</h2>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Paróquia</th>
                        <th>Pastoral</th>
                        <th>Evento / Atividade</th>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>E-mail</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.registrations.length ? [...data.registrations].reverse().map(r => (
                        <tr key={r.id}>
                          <td>{churchName(r.churchId)}</td>
                          <td>{pastoralName(r.pastoralId)}</td>
                          <td><strong>{r.item}</strong></td>
                          <td>{r.name}</td>
                          <td>{r.phone}</td>
                          <td>{r.email}</td>
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
                <div className="panel-heading">
                  <span className="eyebrow">Contato</span>
                  <h2>Mensagens recebidas</h2>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Paróquia</th>
                        <th>Pastoral</th>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Mensagem</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.contacts.length ? [...data.contacts].reverse().map(m => (
                        <tr key={m.id}>
                          <td>{churchName(m.churchId)}</td>
                          <td>{pastoralName(m.pastoralId)}</td>
                          <td>{m.name}</td>
                          <td>{m.email}</td>
                          <td>{m.message}</td>
                          <td>{m.createdAt ? new Date(m.createdAt).toLocaleString("pt-BR") : "-"}</td>
                        </tr>
                      )) : <tr><td colSpan="6">Nenhuma mensagem recebida.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong></article>;
}
