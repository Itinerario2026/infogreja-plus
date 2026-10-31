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
        setError("Nenhuma música encontrada com esse termo. Você pode digitar manualmente abaixo.");
      }
    } catch (err) {
      setError("Erro ao pesquisar músicas online. Preencha manualmente abaixo.");
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
      setSuccess(res.message || "Sugestão enviada com sucesso!");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog music-modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Pastoral de Música</span>
            <h2>Sugerir Música para Celebração</h2>
            <small>{churchTitle || "Comunidade"}</small>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {success ? (
          <div className="modal-success">
            <span className="success-icon">🎵</span>
            <h3>Muito obrigado pela sugestão!</h3>
            <p>{success}</p>
          </div>
        ) : (
          <div className="music-modal-content">
            <div className="music-modal-tabs">
              <button
                type="button"
                className={`music-tab-btn ${activeTab === "search" ? "active" : ""}`}
                onClick={() => setActiveTab("search")}
              >
                🔍 Buscar música online (com áudio e capa)
              </button>
              <button
                type="button"
                className={`music-tab-btn ${activeTab === "manual" ? "active" : ""}`}
                onClick={() => setActiveTab("manual")}
              >
                ✏️ Digitar dados / Anexar foto
              </button>
            </div>

            {activeTab === "search" && (
              <div className="music-search-section">
                <form className="music-search-form" onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Ex: Segura na Mão de Deus, Ninguém Te Ama Como Eu..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={searching}>
                    {searching ? "Buscando..." : "Buscar"}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="music-results-list">
                    <span className="results-caption">Clique em uma música para selecioná-la:</span>
                    {searchResults.map(track => (
                      <div className="music-track-item" key={track.id}>
                        {track.image && (
                          <img src={track.image} alt={track.title} className="track-cover-mini" />
                        )}
                        <div className="track-info">
                          <strong>{track.title}</strong>
                          <span>{track.artist}</span>
                          {track.audioUrl && (
                            <div className="track-audio-bar">
                              <button
                                type="button"
                                className="track-play-btn"
                                onClick={() => toggleAudio(track.audioUrl)}
                              >
                                {playingAudio === track.audioUrl ? "⏸ Pausar prévia" : "▶ Ouvir prévia (30s)"}
                              </button>
                              {playingAudio === track.audioUrl && (
                                <audio src={track.audioUrl} autoPlay onEnded={() => setPlayingAudio(null)} />
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary select-track-btn"
                          onClick={() => selectTrack(track)}
                        >
                          Usar esta música ✓
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={submit} className="music-suggestion-form">
              {form.title && (
                <div className="selected-track-badge">
                  {form.image && <img src={form.image} alt="Capa" className="selected-track-img" />}
                  <div>
                    <span className="selected-label">Música selecionada:</span>
                    <strong>{form.title}</strong>
                    {form.artist && <span> • {form.artist}</span>}
                  </div>
                  {form.audioUrl && (
                    <button
                      type="button"
                      className="track-play-btn small"
                      onClick={() => toggleAudio(form.audioUrl)}
                    >
                      {playingAudio === form.audioUrl ? "⏸ Pausar" : "▶ Ouvir"}
                    </button>
                  )}
                  {playingAudio === form.audioUrl && (
                    <audio src={form.audioUrl} autoPlay onEnded={() => setPlayingAudio(null)} />
                  )}
                </div>
              )}

              <div className="music-form-row">
                <label className="form-field-flex">
                  <span>Nome da música *</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Noites Traiçoeiras"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </label>

                <label className="form-field-flex">
                  <span>Cantor / Artista / Compositor</span>
                  <input
                    type="text"
                    placeholder="Ex: Padre Marcelo Rossi, Anjos de Resgate..."
                    value={form.artist}
                    onChange={e => setForm({ ...form, artist: e.target.value })}
                  />
                </label>
              </div>

              <div className="music-form-row">
                <label className="form-field-flex">
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

                <label className="form-field-flex">
                  <span>Seu nome (opcional)</span>
                  <input
                    type="text"
                    placeholder="Seu nome ou ministério"
                    value={form.suggestedBy}
                    onChange={e => setForm({ ...form, suggestedBy: e.target.value })}
                  />
                </label>
              </div>

              {/* Upload de foto da música / partitura */}
              <div className="music-photo-upload-row">
                <label className="music-photo-label">
                  <span>Foto da música / capa / partitura (opcional):</span>
                  <div className="photo-actions-wrap">
                    <label className="btn btn-secondary photo-file-btn">
                      📷 Escolher foto
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
                        className="btn btn-outline-danger"
                        onClick={() => setForm({ ...form, image: "" })}
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                </label>
                {form.image && (
                  <div className="preview-custom-image">
                    <img src={form.image} alt="Prévia" />
                  </div>
                )}
              </div>

              <label className="form-field-block">
                <span>Observação ou motivo da sugestão</span>
                <textarea
                  rows="2"
                  placeholder="Ex: Muito propícia para a celebração das 19h no domingo..."
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                />
              </label>

              {error && <div className="error-text">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Enviando sugestão..." : "Enviar Sugestão de Música 🎵"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
