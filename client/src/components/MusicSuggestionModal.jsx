import { useState } from "react";
import { api } from "../services/api";

const MOMENTS = [
  "Entrada / Acolhida",
  "Ato Penitencial",
  "Glória",
  "Salmo Responsorial",
  "Aclamação ao Evangelho",
  "Ofertório",
  "Santo",
  "Comunhão",
  "Ação de Graças / Pós-Comunhão",
  "Envio / Final",
  "Adoração ao Santíssimo",
  "Outro momento"
];

export default function MusicSuggestionModal({ churchId, pastoralId, churchTitle, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState("search"); // "search" | "manual"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);

  const [form, setForm] = useState({
    title: "",
    artist: "",
    moment: "Entrada / Acolhida",
    suggestedBy: "",
    note: "",
    image: "",
    audioUrl: "",
    externalUrl: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    try {
      const data = await api.searchMusic(searchQuery.trim());
      setSearchResults(data.results || []);
      if ((data.results || []).length === 0) {
        setError("Nenhuma música encontrada com esse termo. Você pode preencher manualmente na outra aba.");
      }
    } catch (err) {
      setError("Não foi possível buscar online no momento. Você pode preencher os dados manualmente.");
    } finally {
      setSearching(false);
    }
  }

  function selectTrack(track) {
    setForm(prev => ({
      ...prev,
      title: track.title,
      artist: track.artist,
      image: track.image || prev.image,
      audioUrl: track.audioUrl || "",
      externalUrl: track.externalUrl || ""
    }));
    setActiveTab("manual");
  }

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const maxW = 600;
        const maxH = 600;
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
        const optimizedUrl = canvas.toDataURL("image/jpeg", 0.85);

        setForm(prev => ({ ...prev, image: optimizedUrl }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function toggleAudio(url) {
    if (playingAudio === url) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(url);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Informe o nome da música.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.suggestMusic({
        churchId,
        pastoralId,
        ...form
      });
      setSuccess(res.message || "Sugestão enviada com sucesso para a coordenação de música!");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="music-modal-overlay" onClick={onClose}>
      <div className="music-modal-window" onClick={e => e.stopPropagation()}>
        <div className="music-modal-top">
          <div>
            <span className="modal-eyebrow">Pastoral de Música</span>
            <h2 className="modal-heading">Sugerir Música para as Celebrações</h2>
            <p className="modal-sub">{churchTitle || "Comunidade"}</p>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {success ? (
          <div className="modal-success-box">
            <div className="modal-success-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3>Sugestão enviada com sucesso!</h3>
            <p>{success}</p>
          </div>
        ) : (
          <div className="music-modal-body">
            <div className="music-tab-switcher">
              <button
                type="button"
                className={`tab-switch-btn ${activeTab === "search" ? "active" : ""}`}
                onClick={() => setActiveTab("search")}
              >
                Buscar no catálogo online
              </button>
              <button
                type="button"
                className={`tab-switch-btn ${activeTab === "manual" ? "active" : ""}`}
                onClick={() => setActiveTab("manual")}
              >
                Preenchimento manual / Partitura
              </button>
            </div>

            {activeTab === "search" && (
              <div className="modal-search-card">
                <form className="modal-search-row" onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Digite o título ou cantor (ex: Segura na Mão de Deus, Vida Reluz)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary btn-search-submit" disabled={searching}>
                    {searching ? "Buscando..." : "Buscar"}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="modal-search-results">
                    <span className="results-label">Resultados encontrados — clique para selecionar:</span>
                    <div className="search-tracks-scroll">
                      {searchResults.map(track => (
                        <div className="search-track-row" key={track.id}>
                          {track.image && (
                            <img src={track.image} alt={track.title} className="track-thumb" />
                          )}
                          <div className="track-meta">
                            <strong>{track.title}</strong>
                            <span>{track.artist}</span>
                            {track.audioUrl && (
                              <button
                                type="button"
                                className="btn-inline-audio"
                                onClick={() => toggleAudio(track.audioUrl)}
                              >
                                {playingAudio === track.audioUrl ? "Pausar prévia" : "Ouvir trecho (30s)"}
                              </button>
                            )}
                            {playingAudio === track.audioUrl && (
                              <audio src={track.audioUrl} autoPlay onEnded={() => setPlayingAudio(null)} />
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-select-track"
                            onClick={() => selectTrack(track)}
                          >
                            Usar canção
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={submit} className="modal-details-form">
              {form.title && (
                <div className="chosen-track-card">
                  {form.image && <img src={form.image} alt="Capa" className="chosen-track-thumb" />}
                  <div className="chosen-track-info">
                    <span className="chosen-caption">Música selecionada</span>
                    <strong>{form.title}</strong>
                    {form.artist && <span>{form.artist}</span>}
                  </div>
                  {form.audioUrl && (
                    <button
                      type="button"
                      className="btn-chosen-preview"
                      onClick={() => toggleAudio(form.audioUrl)}
                    >
                      {playingAudio === form.audioUrl ? "Pausar" : "Ouvir trecho"}
                    </button>
                  )}
                  {playingAudio === form.audioUrl && (
                    <audio src={form.audioUrl} autoPlay onEnded={() => setPlayingAudio(null)} />
                  )}
                </div>
              )}

              <div className="modal-fields-grid-2">
                <label className="clean-label">
                  <span>Nome da música *</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Como És Lindo"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </label>

                <label className="clean-label">
                  <span>Cantor / Artista / Compositor</span>
                  <input
                    type="text"
                    placeholder="Ex: Vida Reluz, Pe. Zezinho"
                    value={form.artist}
                    onChange={e => setForm({ ...form, artist: e.target.value })}
                  />
                </label>
              </div>

              <div className="modal-fields-grid-2">
                <label className="clean-label">
                  <span>Momento da celebração</span>
                  <select
                    value={form.moment}
                    onChange={e => setForm({ ...form, moment: e.target.value })}
                  >
                    {MOMENTS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>

                <label className="clean-label">
                  <span>Seu nome ou ministério (opcional)</span>
                  <input
                    type="text"
                    placeholder="Ex: Maria Clara ou Coral Santa Cecília"
                    value={form.suggestedBy}
                    onChange={e => setForm({ ...form, suggestedBy: e.target.value })}
                  />
                </label>
              </div>

              <div className="modal-photo-section">
                <div className="photo-btn-bar">
                  <label className="btn btn-secondary btn-file-picker">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <span>Anexar foto ou partitura (opcional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  {form.image && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => setForm({ ...form, image: "" })}
                    >
                      Remover foto
                    </button>
                  )}
                </div>
                {form.image && (
                  <div className="custom-photo-thumb">
                    <img src={form.image} alt="Prévia da foto" />
                  </div>
                )}
              </div>

              <label className="clean-label">
                <span>Observação para a equipe de liturgia (opcional)</span>
                <textarea
                  rows="2"
                  placeholder="Ex: Sugestão para a missa dominical das 19h..."
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                />
              </label>

              {error && <div className="modal-alert-error">{error}</div>}

              <div className="modal-btn-row">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Enviando sugestão..." : "Enviar sugestão"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

