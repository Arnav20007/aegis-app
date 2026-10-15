// Configure VITE_API_URL in the frontend deployment; keep localhost for development.
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

// ----- Helper -----
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(`${res.status}: ${err.detail || "Request failed"}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ----- Auth -----
export async function register(
  name: string,
  email: string,
  password: string,
  extras: { blood_type?: string; medical_notes?: string; phone?: string; age?: number; gender?: string } = {}
) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, ...extras }),
  });
  return data;
}

export async function login(email: string, password: string) {
  // FastAPI OAuth2 expects form data, not JSON
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });
  if (!res.ok) throw new Error("Invalid email or password");
  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

export async function getMe() {
  return apiFetch("/auth/me");
}

export async function updateProfile(data: any) {
  return apiFetch("/auth/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ----- Contacts -----
export async function getContacts() {
  return apiFetch("/api/contacts/");
}

export async function addContact(contact: {
  name: string; relation: string; phone: string; priority: string;
}) {
  return apiFetch("/api/contacts/", {
    method: "POST",
    body: JSON.stringify(contact),
  });
}

export async function deleteContact(id: number) {
  return apiFetch(`/api/contacts/${id}`, { method: "DELETE" });
}

// ----- Alerts (SOS) -----
export async function triggerSOS(x = 81.8463, y = 25.4358) {
  return apiFetch("/api/alerts/trigger", {
    method: "POST",
    body: JSON.stringify({ x, y }),
  });
}

export async function resolveAlert(alertId: number) {
  return apiFetch(`/api/alerts/resolve/${alertId}`, { method: "POST" });
}

export async function getActiveAlerts() {
  return apiFetch("/api/alerts/active");
}

export async function getMyAlerts() {
  return apiFetch("/api/alerts/my");
}

export async function getAlertMessages(alertId: number) {
  return apiFetch(`/api/alerts/${alertId}/messages`);
}

// ----- Hazards -----
export async function getHazards() {
  return apiFetch("/api/hazards/");
}

export async function reportHazard(hazard: { category: string; description: string; x: number; y: number }) {
  return apiFetch("/api/hazards/", {
    method: "POST",
    body: JSON.stringify(hazard),
  });
}

// ----- Health check -----
export async function healthCheck() {
  return apiFetch("/health");
}
