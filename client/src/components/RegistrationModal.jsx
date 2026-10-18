import { useState } from "react";
import { api } from "../services/api";

export default function RegistrationModal({ churchId, pastoralId = "", item, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", note: "" });
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  if (!item) return null;

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setFeedback("");
    try {
      const result = await api.register({ churchId, pastoralId, item, ...form });
      setFeedback(result.message);
      setForm({ name: "", phone: "", email: "", note: "" });
    } catch (error) { setFeedback(error.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal show" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <button className="close-modal" onClick={onClose} aria-label="Fechar">×</button>
        <span className="eyebrow">Inscrição</span>
        <h3>{item}</h3>
        <form onSubmit={submit}>
          <label>Nome completo<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></label>
          <label>Telefone / WhatsApp<input required value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/></label>
          <label>E-mail<input type="email" required value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label>
          <label>Observação<textarea rows="3" value={form.note} onChange={e => setForm({...form,note:e.target.value})}/></label>
          <button className="btn btn-primary" disabled={loading}>{loading ? "Enviando..." : "Confirmar inscrição"}</button>
          {feedback && <small className="feedback">{feedback}</small>}
        </form>
      </div>
    </div>
  );
}
