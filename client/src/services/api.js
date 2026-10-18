async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || "Erro ao acessar o servidor.");
    error.status = response.status;
    throw error;
  }
  return body;
}

export const api = {
  publicData: () => request("/public/data"),
  register: payload => request("/public/registrations", { method: "POST", body: JSON.stringify(payload) }),
  contact: payload => request("/public/contacts", { method: "POST", body: JSON.stringify(payload) }),
  login: payload => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  adminData: () => request("/admin/data"),
  addContent: payload => request("/admin/content", { method: "POST", body: JSON.stringify(payload) }),
  updateChurch: (id, payload) => request(`/admin/churches/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  updatePastoral: (id, payload) => request(`/admin/pastorals/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteContent: (type, id) => request(`/admin/content/${type}/${id}`, { method: "DELETE" }),
  resetContent: () => request("/admin/reset-content", { method: "POST" })
};
