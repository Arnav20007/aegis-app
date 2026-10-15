const API_URL = "http://127.0.0.1:8000";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("aegis_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  register: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Registration failed");
    return res.json();
  },
  
  login: async (email: string, password: string) => {
    // OAuth2 expects form-urlencoded
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  },

  // Contacts
  getContacts: async () => {
    const res = await fetch(`${API_URL}/api/contacts/`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch contacts");
    return res.json();
  },

  // Alerts
  triggerAlert: async (x: number, y: number) => {
    const res = await fetch(`${API_URL}/api/alerts/trigger`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ x, y })
    });
    if (!res.ok) throw new Error("Failed to trigger alert");
    return res.json();
  },

  // Hazards
  getHazards: async () => {
    const res = await fetch(`${API_URL}/api/hazards/`, {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Failed to fetch hazards");
    return res.json();
  }
};
