import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Shield, Home, Map as MapIcon, Bell, Users, FileText, Activity, Settings, 
  Heart, Sun, MapPin, Share2, TrendingUp, ChevronRight, X, LogIn, Navigation, 
  Plus, CheckCircle2, AlertTriangle, Radio, Download, ShieldAlert, PhoneCall, 
  LifeBuoy, Eye, RefreshCw, XOctagon, MessageSquare, Phone, Moon, Zap, Edit3, Save, Mic, MicOff
} from "lucide-react";
import SOSButton from "./components/SOSButton";
import SafetyMap from "./components/SafetyMap";
import SafetyTools from "./components/SafetyTools";
import ContactsManager, { Contact } from "./components/ContactsManager";
import FakeCallOverlay from "./components/FakeCallOverlay";
import AudioRecorder from "./components/AudioRecorder";
import CameraCapture from "./components/CameraCapture";
import EmergencyLiveChat from "./components/EmergencyLiveChat";
import ResponderDashboard from "./components/ResponderDashboard";
import * as api from "./api";

interface GpsCoords {
  lat: number; 
  lng: number; 
  accuracy: number;
  speed: number | null; 
  heading: number | null; 
  timestamp: number;
}

interface AlertRecord {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string | null;
  status: "active" | "resolved";
  last_x: number | null;
  last_y: number | null;
}

interface HazardRecord {
  id: number;
  category: string;
  description: string;
  x: number;
  y: number;
  reported_at: string;
}

// ---------- Login / Register Screen ----------
function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bloodType, setBloodType] = useState("O+");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const friendlyError = (err: any): string => {
    const msg: string = err?.message || "";
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("ECONNREFUSED"))
      return "Cannot reach server. Make sure the backend is running on port 8000.";
    if (msg.includes("401") || msg.includes("Incorrect"))
      return "Wrong email or password. Please try again.";
    if (msg.includes("400") || msg.includes("already registered"))
      return "This email is already registered. Try signing in instead.";
    if (msg.includes("422"))
      return "Please fill all required fields correctly.";
    return msg || "Something went wrong. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (isRegister) {
        await api.register(name, email, password, {
          blood_type: bloodType,
          medical_notes: medicalNotes || undefined,
          phone: phone || undefined,
        });
        await api.login(email, password);
        onLogin(name);
      } else {
        await api.login(email, password);
        try {
          const me = await api.getMe();
          onLogin(me.name);
        } catch {
          // getMe failed but token is saved — proceed with email prefix as name
          onLogin(email.split("@")[0]);
        }
      }
    } catch (err: any) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // Quick demo: register+login a demo account automatically (for viva/presentation)
  const handleQuickDemo = async () => {
    setLoading(true); setError("");
    const demoEmail = "demo@aegis.local";
    const demoPass = "demo1234";
    const demoName = "Arnav (Demo)";
    try {
      try { await api.register(demoName, demoEmail, demoPass, { blood_type: "O+" }); } catch { /* already exists */ }
      await api.login(demoEmail, demoPass);
      onLogin(demoName);
    } catch (err: any) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="surface-card" style={{ width: "440px", padding: "40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <div className="icon-circle" style={{ background: "var(--system-red)", color: "white" }}><Shield size={22} /></div>
          <div>
            <h1 style={{ fontSize: "22px", letterSpacing: "0.5px" }}>AEGIS</h1>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Emergency Response Platform</p>
          </div>
        </div>

        <h2 style={{ marginBottom: "4px", fontSize: "18px" }}>{isRegister ? "Create Safety Profile" : "Secure Sign In"}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
          {isRegister ? "Join the protected emergency network" : "Welcome back. Monitoring active."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Register-only fields */}
          {isRegister && (
            <>
              <input
                placeholder="Full Name *"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                placeholder="Phone Number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value)}
                  style={{ ...inputStyle, flex: "1" }}
                >
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bt => (
                    <option key={bt} value={bt}>Blood: {bt}</option>
                  ))}
                </select>
                <input
                  placeholder="Allergies / Medical notes"
                  value={medicalNotes}
                  onChange={e => setMedicalNotes(e.target.value)}
                  style={{ ...inputStyle, flex: "2" }}
                />
              </div>
            </>
          )}

          {/* Email */}
          <input
            type="email"
            placeholder="Email Address *"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          {/* Password with show/hide toggle */}
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password *"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ ...inputStyle, paddingRight: "48px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              style={{
                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-secondary)", fontSize: "12px", fontWeight: "600", padding: "2px 4px"
              }}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px", padding: "10px 14px",
              color: "var(--system-red)", fontSize: "13px", lineHeight: "1.4"
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "var(--system-red)", color: "white", border: "none",
              borderRadius: "8px", padding: "14px", fontSize: "14px", fontWeight: "600",
              cursor: loading ? "wait" : "pointer", marginTop: "4px",
              opacity: loading ? 0.7 : 1, transition: "opacity 0.15s"
            }}
          >
            {loading ? "Authenticating..." : (isRegister ? "Register & Enter Platform" : "Sign In to Terminal")}
          </button>
        </form>

        {/* Quick Demo button for viva */}
        <button
          onClick={handleQuickDemo}
          disabled={loading}
          style={{
            width: "100%", marginTop: "10px",
            background: "var(--bg-secondary, rgba(0,0,0,0.05))",
            border: "1px dashed var(--border-color)",
            color: "var(--text-secondary)", borderRadius: "8px",
            padding: "10px", fontSize: "13px", fontWeight: "500",
            cursor: "pointer"
          }}
        >
          ⚡ Quick Demo Login (for presentation)
        </button>

        <p style={{ textAlign: "center", marginTop: "18px", fontSize: "13px", color: "var(--text-secondary)" }}>
          {isRegister ? "Already registered? " : "New to AEGIS? "}
          <span
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{ color: "var(--system-red)", cursor: "pointer", fontWeight: "500" }}
          >
            {isRegister ? "Sign In" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}


// ---------- Main App Component ----------
export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("aegis_theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("aegis_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  const [loggedIn, setLoggedIn] = useState(api.isLoggedIn());
  const [userName, setUserName] = useState("User");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentView, setCurrentView] = useState("dashboard");
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [activeAlertId, setActiveAlertId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Real Data Collections
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", relation: "Parent", phone: "", priority: "Primary" as "Primary" | "Secondary" });

  const [alertsList, setAlertsList] = useState<AlertRecord[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const [hazardsList, setHazardsList] = useState<HazardRecord[]>([]);
  const [hazardForm, setHazardForm] = useState({ category: "suspicious_activity", description: "" });
  const [hazardSubmitting, setHazardSubmitting] = useState(false);

  // GPS Live State
  const [gps, setGps] = useState<GpsCoords | null>(null);
  const [lastKnownGps, setLastKnownGps] = useState<GpsCoords | null>(null);
  const [trackHistory, setTrackHistory] = useState<GpsCoords[]>([]);
  const [trackingOn, setTrackingOn] = useState(false);

  // Voice Distress Acoustic Trigger State
  const [voiceListening, setVoiceListening] = useState<boolean>(() => {
    return localStorage.getItem("aegis_voice_guardian") !== "false";
  });
  const [lastVoiceKeyword, setLastVoiceKeyword] = useState<string | null>(null);
  const voiceListeningRef = useRef<boolean>(voiceListening);
  voiceListeningRef.current = voiceListening;
  const lastVoiceTriggerRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);

  // Offline / Network resilience
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setToastMsg("✅ Back online — queued alerts will retry automatically.");
      flushOfflineQueue();
    };
    const goOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Overlays
  const [activeCall, setActiveCall] = useState<{ name: string; initials: string; color: string; audioContext: AudioContext | null; subtitle?: string } | null>(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [simulatedSmsModal, setSimulatedSmsModal] = useState<{
    recipients: string;
    message: string;
    callRecipient?: string;
  } | null>(null);
  const [simulatedDirectCall, setSimulatedDirectCall] = useState<{
    name: string;
    phone: string;
    relation?: string;
  } | null>(null);

  // Dispatcher Simulated State
  const [responderLocation, setResponderLocation] = useState<{ x: number; y: number; active: boolean; name: string } | null>(null);
  const [operatorChat, setOperatorChat] = useState<{ sender: "user" | "operator"; text: string; time: string }[]>([]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Load User & Contacts
  const loadContacts = useCallback(() => {
    setContactsLoading(true);
    api.getContacts()
      .then(data => setContacts(data))
      .catch(() => setToastMsg("Could not fetch contacts"))
      .finally(() => setContactsLoading(false));
  }, []);

  const loadAlerts = useCallback(() => {
    setAlertsLoading(true);
    api.getMyAlerts()
      .then(data => {
        setAlertsList(data);
        const active = data.find((a: AlertRecord) => a.status === "active");
        if (active) {
          setIsEmergencyActive(true);
          setActiveAlertId(active.id);
        } else {
          setIsEmergencyActive(false);
          setActiveAlertId(null);
        }
      })
      .catch(() => {})
      .finally(() => setAlertsLoading(false));
  }, []);

  const loadHazards = useCallback(() => {
    api.getHazards()
      .then(data => setHazardsList(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    api.getMe()
      .then(me => {
        setUserName(me.name);
        setUserProfile(me);
      })
      .catch((err) => {
        // If token expired or invalid, force re-login
        if (err?.message?.includes("401") || err?.message?.toLowerCase().includes("unauthorized") || err?.message?.toLowerCase().includes("not authenticated")) {
          api.logout();
          setLoggedIn(false);
        }
      });
    loadContacts();
    loadAlerts();
    loadHazards();
  }, [loggedIn, loadContacts, loadAlerts, loadHazards]);

  // Nickname extraction helper
  const extractNickname = (raw: string, relation?: string) => {
    const match = raw.match(/\(([^)]+)\)/);
    if (match) return match[1].trim();
    if (relation && relation.trim() && !["other", "test", "parent", "sibling"].includes(relation.toLowerCase())) {
      return relation.trim();
    }
    return raw.replace(/\s*\([^)]*\)/, "").trim() || raw;
  };

  const triggerCall = useCallback((nameOrNickname: string, color = "#3B82F6", subtitle?: string) => {
    const nickname = extractNickname(nameOrNickname);
    const fullName = nameOrNickname.replace(/\s*\([^)]*\)/, "").trim();
    const initials = nickname.charAt(0).toUpperCase();
    const AudioContextConstructor = window.AudioContext ?? (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;
    const audioContext = AudioContextConstructor ? new AudioContextConstructor() : null;
    // Resume during the click handler so Chrome treats the ringtone as user-initiated audio.
    void audioContext?.resume().catch(() => {});
    setActiveCall({ 
      name: nickname, 
      initials, 
      color, 
      audioContext,
      subtitle: subtitle || (fullName !== nickname ? `${fullName} • Mobile` : "Aegis Emergency Responder")
    });
  }, []);

  // 1-Click Alert All Handler
  const handleAlertAll = useCallback(() => {
    if (contacts.length === 0) {
      setToastMsg("No contacts enrolled to alert!");
      return;
    }
    const nicknames = contacts.map(c => extractNickname(c.name, c.relation)).join(", ");
    const lat = gps ? gps.lat.toFixed(5) : "25.4358";
    const lng = gps ? gps.lng.toFixed(5) : "81.8463";
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    
    // Batch phone numbers for SMS
    const allPhones = contacts.map(c => c.phone.replace(/[\s\-()]/g, "")).join(",");
    const emergencyText = `🚨 AEGIS 1-CLICK ALL ALERT: Immediate distress broadcast to ${nicknames}! Live GPS: ${mapsUrl}`;
    
    // Broadcast notification toast
    setToastMsg(`⚡ 1-Click Alert Dispatched to all contacts: ${nicknames}!`);
    
    // Copy exact SMS to clipboard for laptop presentation convenience
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`To: ${allPhones}\nMessage: ${emergencyText}`).catch(() => {});
    }

    // Open batch SMS trigger on mobile devices (fallback modal handles desktop)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const smsLink = `sms:${allPhones}?body=${encodeURIComponent(emergencyText)}`;
      try { window.open(smsLink, "_blank"); } catch {}
    }

    // Resolve Primary contact for rescue call
    const primary = contacts.find(c => c.priority === "Primary") || contacts[0];
    const primaryNick = extractNickname(primary.name, primary.relation);
    const primaryFull = primary.name.replace(/\s*\([^)]*\)/, "").trim();

    // Show simulated SMS & call confirmation modal (ideal for laptop viva/demo)
    setSimulatedSmsModal({
      recipients: nicknames,
      message: emergencyText,
      callRecipient: primaryNick
    });

    // Also trigger instant fake rescue call from Primary contact (e.g. Father)
    setTimeout(() => {
      triggerCall(primaryNick, "#22C55E", `${primaryFull} • Incoming Rescue Call`);
    }, 1400);
  }, [contacts, gps, triggerCall]);


  const handleShareLocation = useCallback(async () => {
    const showError = () => setToastMsg("Could not get location. Allow location access.");
    if (!navigator.geolocation) { showError(); return; }

    setToastMsg("Getting high-precision GPS coordinates...");
    const sharePosition = async (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      const text = `🚨 AEGIS EMERGENCY: I need immediate assistance! Current GPS location: ${mapsUrl}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: "Emergency Location Broadcast – AEGIS", text, url: mapsUrl });
          setToastMsg("Location broadcasted via native share sheet!");
          return;
        } catch { /* cancelled */ }
      }
      try {
        await navigator.clipboard.writeText(text);
        setToastMsg(`📋 Copied emergency link! (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      } catch {
        setToastMsg(`Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    };
    const fallbackToNetworkLocation = () => {
      navigator.geolocation.getCurrentPosition(
        sharePosition,
        showError,
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      sharePosition,
      (error) => {
        if (error.code === error.TIMEOUT) {
          setToastMsg("High-accuracy GPS timed out. Trying network location...");
          fallbackToNetworkLocation();
          return;
        }
        showError();
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  }, []);

  const handleLocationUpdate = useCallback((coords: GpsCoords) => {
    setGps(coords);
    setLastKnownGps(coords); // persist last known even if GPS drops
    setTrackHistory(prev => [...prev.slice(-50), coords]);
  }, []);

  // Offline queue retry — sends any queued alerts once network is restored
  const flushOfflineQueue = useCallback(async () => {
    try {
      const queue = JSON.parse(localStorage.getItem("aegis_offline_queue") || "[]");
      if (queue.length === 0) return;
      for (const item of queue) {
        try { await api.triggerSOS(item.lng, item.lat); } catch {}
      }
      localStorage.removeItem("aegis_offline_queue");
      loadAlerts();
    } catch {}
  }, []);

  // SOS Triggers — with offline fallback architecture
  const handleTriggerSOS = async () => {
    const lat = gps ? gps.lat : (lastKnownGps ? lastKnownGps.lat : 25.4358);
    const lng = gps ? gps.lng : (lastKnownGps ? lastKnownGps.lng : 81.8463);
    const isGpsFallback = !gps && lastKnownGps;

    if (!isOnline) {
      // OFFLINE FALLBACK: queue alert locally + fire SMS immediately
      const queuedAlert = { lat, lng, timestamp: Date.now(), status: "queued" };
      try {
        const queue = JSON.parse(localStorage.getItem("aegis_offline_queue") || "[]");
        queue.push(queuedAlert);
        localStorage.setItem("aegis_offline_queue", JSON.stringify(queue));
      } catch {}

      setIsEmergencyActive(true);
      setToastMsg("📵 Offline — Alert queued. SMS fallback fired. Will auto-retry when connected.");

      // Fire SMS to primary contact immediately as the real fallback
      const primary = contacts.find(c => c.priority === "Primary") || contacts[0];
      if (primary) {
        const nick = extractNickname(primary.name, primary.relation);
        const smsBody = `🚨 AEGIS SOS from ${userName} to ${nick}: I need immediate help! ${isGpsFallback ? "Last known GPS" : "GPS"}: https://www.google.com/maps?q=${lat},${lng}`;
        try { window.open(`sms:${primary.phone}?body=${encodeURIComponent(smsBody)}`, "_blank"); } catch {}
      }
      return;
    }

    try {
      const alert = await api.triggerSOS(lng, lat);
      setActiveAlertId(alert.id);
      setIsEmergencyActive(true);
      loadAlerts();
      const gpsModeMsg = isGpsFallback ? " (using last known GPS)" : "";
      setToastMsg(`🚨 SOS ACTIVATED! Emergency telemetry broadcasted to Nearest Police (112) & Family.${gpsModeMsg}`);

      // Auto-escalate Police (112) Helpline on mobile devices, or show gateway modal on laptop
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        setTimeout(() => {
          try { window.location.href = "tel:112"; } catch {}
        }, 1200);
      } else {
        const primary = contacts.find(c => c.priority === "Primary") || contacts[0];
        const primaryNick = primary ? extractNickname(primary.name, primary.relation) : "Guardian";
        setSimulatedSmsModal({
          recipients: `Nearest Police Dispatch (112) & ${primaryNick}`,
          message: `🚨 AEGIS IMMEDIATE SOS from ${userName}! Live Coordinates: https://www.google.com/maps?q=${lat},${lng}. Priority assistance requested.`,
          callRecipient: "Nearest Police Control Room (112)"
        });
      }

      // Flush any queued offline alerts now that we're back online
      flushOfflineQueue();
    } catch (err: any) {
      // Network failed even though navigator.onLine said true — treat as offline
      setIsEmergencyActive(true);
      const primary = contacts.find(c => c.priority === "Primary") || contacts[0];
      if (primary) {
        const smsBody = `🚨 AEGIS SOS from ${userName}: I need immediate help! GPS: https://www.google.com/maps?q=${lat},${lng}`;
        try { window.open(`sms:${primary.phone}?body=${encodeURIComponent(smsBody)}`, "_blank"); } catch {}
      }
      setToastMsg("⚠️ Server unreachable — Fired SMS to primary guardian and queued Police line.");
    }
  };

  const handleCancelSOS = async () => {
    try {
      if (activeAlertId) {
        await api.resolveAlert(activeAlertId);
      }
      setIsEmergencyActive(false);
      setActiveAlertId(null);
      loadAlerts();
      setToastMsg("Emergency resolved and logged.");
    } catch {
      setIsEmergencyActive(false);
    }
  };

  // SUPER EMERGENCY: Trigger SOS, alert Parents (Father, Mother) & contacts with GPS, and prompt Police (112)
  const handleSuperEmergency = useCallback(async () => {
    const lat = gps ? gps.lat.toFixed(5) : (lastKnownGps ? lastKnownGps.lat.toFixed(5) : "25.4358");
    const lng = gps ? gps.lng.toFixed(5) : (lastKnownGps ? lastKnownGps.lng.toFixed(5) : "81.8463");
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    // 1. Trigger backend SOS alert or offline queue
    handleTriggerSOS();

    // 2. Identify parents/emergency contacts
    const targets = contacts.length > 0 ? contacts : [
      { id: 999, name: "Father", relation: "Father", phone: "112", priority: "Primary" as const }
    ];
    const targetNicknames = targets.map(c => extractNickname(c.name, c.relation)).join(", ");
    const allPhones = targets.map(c => c.phone.replace(/[\s\-()]/g, "")).join(",");

    const smsBody = `🚨 CRITICAL EMERGENCY SOS: I am in severe danger and calling Emergency Services! Live GPS location: ${mapsUrl}`;
    
    setToastMsg(`🚨 SUPER ESCALATION: Notified ${targetNicknames} & Launching Police (112) Line!`);

    // Copy to clipboard for laptop presentation convenience
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`EMERGENCY SMS DISPATCH\nRecipients: ${targetNicknames} (${allPhones})\nMessage: ${smsBody}\nAction: Calling 112 (Police)`).catch(() => {});
    }

    // Open SMS with location for all parents/contacts on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const smsUri = `sms:${allPhones}?body=${encodeURIComponent(smsBody)}`;
      try { window.open(smsUri, "_blank"); } catch {}
    }

    // Show simulated modal on screen (with call indication)
    setSimulatedSmsModal({
      recipients: `${targetNicknames}`,
      message: smsBody,
      callRecipient: "Police & Emergency Control (112)"
    });

    // Trigger phone call to Police 112 on mobile devices
    if (isMobile) {
      setTimeout(() => {
        try { window.location.href = "tel:112"; } catch {}
      }, 1000);
    }
  }, [gps, lastKnownGps, handleTriggerSOS, contacts]);

  // Toggle Voice Distress Acoustic Guardian
  const toggleVoiceListening = useCallback(() => {
    setVoiceListening(prev => {
      const next = !prev;
      localStorage.setItem("aegis_voice_guardian", String(next));
      setToastMsg(next ? "🎙️ Voice SOS Guardian Activated: Listening for 'Help' & 'Bachao'..." : "🔇 Voice SOS Guardian Deactivated.");
      return next;
    });
  }, []);

  // Viva / Simulation voice distress trigger (e.g. for testing without mic or in noisy room)
  const handleSimulateVoiceDistress = useCallback((keyword: string) => {
    setLastVoiceKeyword(keyword);
    setToastMsg(`🚨 Acoustic Distress Detected: "${keyword}"! Activating Super SOS...`);
    handleSuperEmergency();
  }, [handleSuperEmergency]);

  // Ambient Voice Distress Listener (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    if (!voiceListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
      return;
    }

    let isMounted = true;
    let recognition: any = null;

    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // Accurately captures English ("help", "police", "emergency") & Hindi ("bachao", "madad")
      recognitionRef.current = recognition;

      const DISTRESS_KEYWORDS = [
        "help",
        "bachao",
        "bachaao",
        "madad",
        "emergency",
        "police",
        "save me",
        "chodo"
      ];

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        transcript = transcript.toLowerCase().trim();

        // Check if any emergency keyword is present
        const matched = DISTRESS_KEYWORDS.find(keyword => transcript.includes(keyword));
        if (matched) {
          const now = Date.now();
          // Prevent rapid multi-firing: 8 second cooldown
          if (now - lastVoiceTriggerRef.current > 8000) {
            lastVoiceTriggerRef.current = now;
            setLastVoiceKeyword(matched);
            setToastMsg(`🚨 Voice Distress Triggered! Heard "${matched.toUpperCase()}"! Launching Super SOS...`);
            handleSuperEmergency();
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setToastMsg("⚠️ Microphone permission required for Voice Distress Guardian.");
          setVoiceListening(false);
        }
      };

      recognition.onend = () => {
        // Automatically restart to keep ambient monitoring active
        if (isMounted && voiceListeningRef.current) {
          setTimeout(() => {
            if (isMounted && voiceListeningRef.current) {
              try { recognition.start(); } catch {}
            }
          }, 400);
        }
      };

      try {
        recognition.start();
      } catch {}
    } catch (e) {
      console.warn("Speech recognition initialization error:", e);
    }

    return () => {
      isMounted = false;
      if (recognition) {
        try { recognition.abort(); } catch {}
      }
    };
  }, [voiceListening, handleSuperEmergency]);

  // Contact Creation
  const handleCreateContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    try {
      const created = await api.addContact(newContact);
      setContacts(prev => [...prev, created]);
      setShowAddContactModal(false);
      setNewContact({ name: "", relation: "Parent", phone: "", priority: "Primary" });
      setToastMsg(`Contact "${created.name}" saved to database!`);
    } catch (err: any) {
      setToastMsg(`Error: ${err.message}`);
    }
  };

  const handleDeleteContact = async (id: string | number) => {
    try {
      await api.deleteContact(Number(id));
      setContacts(prev => prev.filter(c => String(c.id) !== String(id)));
      setToastMsg("Contact removed.");
    } catch {
      setToastMsg("Failed to remove contact.");
    }
  };

  // Hazard Reporting
  const handleReportHazardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHazardSubmitting(true);
    try {
      const lat = gps ? gps.lat : 25.4358;
      const lng = gps ? gps.lng : 81.8463;
      const created = await api.reportHazard({
        category: hazardForm.category,
        description: hazardForm.description,
        x: lng,
        y: lat
      });
      setHazardsList(prev => [created, ...prev]);
      setHazardForm({ category: "suspicious_activity", description: "" });
      setToastMsg("Hazard reported to community safety registry!");
    } catch (err: any) {
      setToastMsg(`Failed to report: ${err.message}`);
    } finally {
      setHazardSubmitting(false);
    }
  };

  // CSV Export for Reports
  const exportAlertsCSV = () => {
    if (alertsList.length === 0) {
      setToastMsg("No alert records available to export.");
      return;
    }
    const headers = "Alert ID,User ID,Status,Start Time,End Time,Longitude,Latitude\n";
    const rows = alertsList.map(a => 
      `${a.id},${a.user_id},${a.status},"${a.start_time}","${a.end_time || 'N/A'}",${a.last_x || ''},${a.last_y || ''}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aegis-incident-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setToastMsg("Exported incident records to CSV!");
  };

  if (!loggedIn) {
    return <LoginScreen onLogin={(name) => { setUserName(name); setLoggedIn(true); }} />;
  }

  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  // ---------------- VIEW 1: Live Tracking ----------------
  const LiveTrackingView = () => (
    <div className="pane-feed" style={{ padding: 0, gap: 0, position: "relative" }}>
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <SafetyMap isEmergencyActive={isEmergencyActive} onLocationUpdate={handleLocationUpdate} trackingActive={trackingOn} />
      </div>

      <div style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border-color)", padding: "16px 24px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setTrackingOn(t => !t)}
            style={{ background: trackingOn ? "var(--system-red)" : "var(--system-green)", color: "white", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Navigation size={16} /> {trackingOn ? "Stop Tracking" : "Start Live GPS"}
          </button>
          {trackingOn && (
            <span style={{ fontSize: "12px", color: "var(--system-green)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--system-green)", display: "inline-block" }} />
              {isOnline ? "SATELLITE ACTIVE" : "OFFLINE DEAD-RECKONING"}
            </span>
          )}
        </div>

        {/* Viva Test Demo: Simulate Walk / Movement */}
        <button
          onClick={() => {
            const baseLat = gps ? gps.lat : (lastKnownGps ? lastKnownGps.lat : 25.4358);
            const baseLng = gps ? gps.lng : (lastKnownGps ? lastKnownGps.lng : 81.8463);
            const offsetLat = (Math.random() - 0.5) * 0.0006;
            const offsetLng = (Math.random() - 0.5) * 0.0006;
            const simulated: GpsCoords = {
              lat: baseLat + offsetLat,
              lng: baseLng + offsetLng,
              accuracy: 5,
              speed: 1.4, // ~5 km/h walking speed
              heading: Math.floor(Math.random() * 360),
              timestamp: Date.now()
            };
            handleLocationUpdate(simulated);
            setToastMsg(`🚶 Simulated Step Logged: ${simulated.lat.toFixed(5)}, ${simulated.lng.toFixed(5)}`);
          }}
          className="custom-button"
          style={{ fontSize: "12px", padding: "8px 12px", gap: "6px" }}
          title="Simulate walking step to verify real-time telemetry breadcrumbs without moving outdoors"
        >
          <span>🚶</span> Simulate Step / Movement
        </button>

        {gps ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>COORDINATES</p>
              <p style={{ fontSize: "13px", fontWeight: "600" }}>{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>PRECISION</p>
              <p style={{ fontSize: "13px", fontWeight: "600", color: gps.accuracy < 20 ? "var(--system-green)" : gps.accuracy < 100 ? "var(--system-yellow)" : "var(--system-red)" }}>±{gps.accuracy}m</p>
            </div>
            {gps.speed != null && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>VELOCITY</p>
                <p style={{ fontSize: "13px", fontWeight: "600" }}>{(gps.speed * 3.6).toFixed(1)} km/h</p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>WAYPOINTS</p>
              <p style={{ fontSize: "13px", fontWeight: "600" }}>{trackHistory.length}</p>
            </div>
          </>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Click "Start Live GPS" or "Simulate Step" to test telemetry.</p>
        )}

        {trackHistory.length > 1 && (
          <button onClick={() => { setTrackHistory([]); setToastMsg("Telemetry cache cleared."); }} style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", cursor: "pointer" }}>
            Clear Trail
          </button>
        )}
      </div>

      {trackHistory.length > 0 && (
        <div style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border-color)", maxHeight: "180px", overflowY: "auto", padding: "16px 24px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px" }}>TELEMETRY LOG ({trackHistory.length} Waypoints Logged)</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ color: "var(--text-secondary)", textAlign: "left" }}>
                <th style={{ padding: "4px 12px" }}>Timestamp</th>
                <th style={{ padding: "4px 12px" }}>Latitude</th>
                <th style={{ padding: "4px 12px" }}>Longitude</th>
                <th style={{ padding: "4px 12px" }}>Accuracy</th>
                <th style={{ padding: "4px 12px" }}>Speed</th>
              </tr>
            </thead>
            <tbody>
              {[...trackHistory].reverse().map((p, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border-color)", color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  <td style={{ padding: "6px 12px" }}>{new Date(p.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: "6px 12px" }}>{p.lat.toFixed(6)}</td>
                  <td style={{ padding: "6px 12px" }}>{p.lng.toFixed(6)}</td>
                  <td style={{ padding: "6px 12px" }}>±{p.accuracy}m</td>
                  <td style={{ padding: "6px 12px" }}>{p.speed != null ? `${(p.speed * 3.6).toFixed(1)} km/h` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ---------------- VIEW 2: Alerts History ----------------
  const AlertsView = () => (
    <div className="pane-feed">
      <div className="surface-card" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Incident & Alert Archive</h2>
            <p className="text-small" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
              Official record of all distress signals broadcasted from this terminal.
            </p>
          </div>
          <button onClick={loadAlerts} className="custom-button">
            <RefreshCw size={14} /> Refresh Records
          </button>
        </div>

        {alertsLoading ? (
          <p style={{ color: "var(--text-secondary)" }}>Querying emergency database...</p>
        ) : alertsList.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
            <CheckCircle2 size={40} color="var(--system-green)" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-primary)" }}>Clean Safety Record</p>
            <p className="text-small">No historical SOS alerts recorded for user {userName}.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {alertsList.map(a => {
              const isActive = a.status === "active";
              return (
                <div 
                  key={a.id} 
                  className="surface-card" 
                  style={{ 
                    background: "var(--bg-primary)", 
                    padding: "16px 20px", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    borderLeft: isActive ? "4px solid var(--system-red)" : "4px solid var(--system-green)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div className="icon-circle" style={{ background: isActive ? "rgba(255, 77, 109, 0.2)" : "rgba(34, 197, 94, 0.2)", color: isActive ? "var(--system-red)" : "var(--system-green)" }}>
                      {isActive ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    </div>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: "600" }}>
                        Emergency Incident #{a.id}
                        <span style={{ marginLeft: "10px", fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: isActive ? "rgba(255,77,109,0.2)" : "rgba(34,197,94,0.2)", color: isActive ? "var(--system-red)" : "var(--system-green)", fontWeight: "700" }}>
                          {isActive ? "ACTIVE DISTRESS" : "RESOLVED"}
                        </span>
                      </p>
                      <p className="text-small" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
                        Triggered: {new Date(a.start_time).toLocaleString()} 
                        {a.end_time && ` • Resolved: ${new Date(a.end_time).toLocaleTimeString()}`}
                      </p>
                      {a.last_x != null && a.last_y != null && (
                        <p className="text-small" style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                          Last Recorded Position: ({a.last_y.toFixed(5)}, {a.last_x.toFixed(5)})
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    {isActive ? (
                      <button 
                        onClick={() => api.resolveAlert(a.id).then(() => { loadAlerts(); setToastMsg(`Alert #${a.id} resolved.`); })}
                        className="custom-button button-critical"
                      >
                        Resolve Alert
                      </button>
                    ) : (
                      <span className="text-small" style={{ color: "var(--system-green)" }}>Case Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ---------------- VIEW 3: Trusted Contacts Manager ----------------
  const ContactsView = () => (
    <div className="pane-feed">
      <div className="surface-card" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Trusted Safety Network</h2>
            <p className="text-small" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
              Verified emergency contacts notified instantaneously during SOS protocol activation.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {contacts.length > 0 && (
              <button onClick={handleAlertAll} className="custom-button button-critical" style={{ background: "linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)", borderColor: "#EF4444" }}>
                <Zap size={15} /> ⚡ 1-Click Alert All
              </button>
            )}
            <button onClick={() => setShowAddContactModal(true)} className="custom-button">
              <Plus size={16} /> Add Contact
            </button>
          </div>
        </div>

        {contactsLoading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading your trusted contacts...</p>
        ) : contacts.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)" }}>
            <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ fontSize: "15px", fontWeight: "500" }}>No Emergency Contacts Enrolled</p>
            <p className="text-small" style={{ marginTop: "4px" }}>Add parents, guardians, or local emergency services.</p>
            <button onClick={() => setShowAddContactModal(true)} className="custom-button button-critical" style={{ marginTop: "16px" }}>
              + Add First Contact
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {contacts.map(c => {
              const nickname = extractNickname(c.name, c.relation);
              const fullName = c.name.replace(/\s*\([^)]*\)/, "").trim() || c.name;
              return (
                <div 
                  key={c.id} 
                  className="surface-card" 
                  style={{ 
                    background: "var(--bg-primary)", 
                    padding: "16px 20px", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center" 
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div className="icon-circle" style={{ background: c.priority === "Primary" ? "rgba(255, 77, 109, 0.2)" : "rgba(59, 130, 246, 0.2)", color: c.priority === "Primary" ? "var(--system-red)" : "var(--system-blue)", fontWeight: "700" }}>
                      {nickname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: "600" }}>
                        {nickname}
                        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: c.priority === "Primary" ? "rgba(255, 77, 109, 0.15)" : "rgba(59,130,246,0.15)", color: c.priority === "Primary" ? "var(--system-red)" : "var(--system-blue)", marginLeft: "8px" }}>
                          {c.priority} Responder
                        </span>
                      </p>
                      <p className="text-small" style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                        {fullName !== nickname ? `${fullName} • ` : ""}{c.phone} • {c.relation}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button onClick={() => triggerCall(nickname, c.priority === "Primary" ? "#FF4D6D" : "#3B82F6", `${fullName} • Mobile`)} className="custom-button" title={`Simulate Fake Call from ${nickname}`}>
                      <Phone size={14} color="var(--system-green)" /> Test Call
                    </button>
                    <button 
                      onClick={() => {
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        if (isMobile) {
                          window.location.href = `tel:${c.phone}`;
                        } else {
                          setSimulatedDirectCall({ name: nickname, phone: c.phone, relation: c.relation });
                        }
                      }} 
                      className="custom-button" 
                      style={{ color: "var(--system-blue)", borderColor: "rgba(59,130,246,0.3)" }} 
                      title={`Call ${nickname}`}
                    >
                      <PhoneCall size={14} /> Call
                    </button>
                    <button 
                      onClick={() => {
                        const msg = `🚨 AEGIS EMERGENCY to ${nickname}: Immediate assistance requested. Live location broadcast.`;
                        if (navigator.clipboard) navigator.clipboard.writeText(`To: ${c.phone}\n${msg}`).catch(() => {});
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        if (isMobile) {
                          window.open(`sms:${c.phone}?body=${encodeURIComponent(msg)}`, "_blank");
                        } else {
                          setSimulatedSmsModal({ recipients: `${nickname} (${c.phone})`, message: msg });
                        }
                      }} 
                      className="custom-button" 
                      style={{ color: "var(--system-yellow)", borderColor: "rgba(250,204,21,0.3)" }} 
                      title={`Send Emergency SMS to ${nickname}`}
                    >
                      <MessageSquare size={14} /> SMS
                    </button>
                    <button onClick={() => handleDeleteContact(c.id)} className="custom-button" style={{ color: "var(--system-red)", borderColor: "rgba(255,77,109,0.3)" }} title="Remove Contact">
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ---------------- VIEW 4: Safety Hub (Incidents & Helplines) ----------------
  const SafetyHubView = () => (
    <div className="pane-feed">
      {/* 1. Helplines Quick Access */}
      <div className="surface-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <LifeBuoy size={18} color="var(--system-red)" /> National Emergency Hotlines
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { num: "112", label: "National Emergency", sub: "Police, Fire, Ambulance", color: "var(--system-red)" },
            { num: "100", label: "Police Control", sub: "Law enforcement dispatch", color: "var(--system-blue)" },
            { num: "1091", label: "Women Safety", sub: "24x7 Dedicated helpline", color: "var(--system-yellow)" },
            { num: "102", label: "Medical Emergency", sub: "Immediate ambulance", color: "var(--system-green)" },
          ].map(h => (
            <div key={h.num} className="surface-card" style={{ background: "var(--bg-primary)", padding: "14px" }}>
              <span style={{ fontSize: "22px", fontWeight: "800", color: h.color }}>{h.num}</span>
              <p style={{ fontSize: "13px", fontWeight: "600", marginTop: "4px" }}>{h.label}</p>
              <p className="text-small" style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{h.sub}</p>
              <button 
                onClick={() => triggerCall(`${h.label} (${h.num})`, h.color)}
                className="custom-button" 
                style={{ width: "100%", marginTop: "10px", padding: "6px 10px", fontSize: "11px" }}
              >
                Simulate Call
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Hazard Report & Community Registry */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
        {/* Report Hazard Form */}
        <div className="surface-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={16} color="var(--system-yellow)" /> Report Community Hazard
          </h3>
          <form onSubmit={handleReportHazardSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label className="text-caption" style={{ color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Hazard Category</label>
              <select 
                value={hazardForm.category}
                onChange={e => setHazardForm(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
              >
                <option value="suspicious_activity">Suspicious Activity</option>
                <option value="poor_lighting">Poor / No Street Lighting</option>
                <option value="harassment">Harassment / Unsafe Zone</option>
                <option value="road_obstruction">Road Block / Accident</option>
                <option value="medical_danger">Medical / Biological Hazard</option>
              </select>
            </div>
            <div>
              <label className="text-caption" style={{ color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Description (Optional)</label>
              <textarea 
                placeholder="Details about the situation or exact landmark..."
                value={hazardForm.description}
                onChange={e => setHazardForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px", color: "var(--text-primary)", fontSize: "13px", outline: "none", resize: "none" }}
              />
            </div>
            <div style={{ background: "var(--bg-primary)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <p className="text-small" style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                Auto-stamping current telemetry: {gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : "Prayagraj (Civil Lines)"}
              </p>
            </div>
            <button 
              type="submit" 
              disabled={hazardSubmitting}
              className="custom-button"
              style={{ background: "rgba(250,204,21,0.2)", color: "var(--system-yellow)", border: "1px solid rgba(250,204,21,0.3)" }}
            >
              {hazardSubmitting ? "Logging..." : "Log Hazard to Aegis Registry"}
            </button>
          </form>
        </div>

        {/* Community Hazards List */}
        <div className="surface-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Eye size={16} color="var(--system-blue)" /> Community Hazard Registry ({hazardsList.length})
          </h3>
          {hazardsList.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No community hazards reported nearby.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "320px", overflowY: "auto" }}>
              {hazardsList.map((h, i) => (
                <div key={i} style={{ background: "var(--bg-primary)", padding: "12px 14px", borderRadius: "8px", borderLeft: "3px solid var(--system-yellow)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "13px", fontWeight: "600", textTransform: "capitalize" }}>
                      {h.category.replace(/_/g, " ")}
                    </p>
                    <span className="text-small" style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                      {new Date(h.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {h.description && (
                    <p className="text-small" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
                      {h.description}
                    </p>
                  )}
                  <p className="text-small" style={{ color: "var(--system-blue)", fontSize: "10px", marginTop: "4px" }}>
                    Coords: ({h.y.toFixed(4)}, {h.x.toFixed(4)})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ---------------- VIEW 5: Reports & Medical Profile ----------------
  const ReportsView = () => (
    <div className="pane-feed">
      <div className="surface-card" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Safety Audit & Incident Reports</h2>
            <p className="text-small" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
              Compliant documentation for university submission and legal emergency verification.
            </p>
          </div>
          <button onClick={exportAlertsCSV} className="custom-button button-critical">
            <Download size={16} /> Export Incident Records (CSV)
          </button>
        </div>

        {/* User Medical Badge */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", marginBottom: "24px" }}>
          <div className="surface-card" style={{ background: "var(--bg-primary)", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Heart size={16} color="var(--system-red)" /> Emergency Medical Profile
            </h3>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: "rgba(255, 77, 109, 0.2)", border: "1px solid var(--system-red)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "10px", color: "var(--system-red)" }}>BLOOD</span>
                <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--system-red)" }}>{userProfile?.blood_type || "O+"}</span>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: "600" }}>{userName}</p>
                <p className="text-small" style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                  Medical Conditions / Notes: {userProfile?.medical_notes || "No acute allergies noted. Donor authorized."}
                </p>
                <p className="text-small" style={{ color: "var(--system-green)", fontSize: "11px", marginTop: "4px" }}>
                  • Securely stored & encrypted
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card" style={{ background: "var(--bg-primary)", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", marginBottom: "12px" }}>Incident Summary</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="text-small" style={{ color: "var(--text-secondary)" }}>Total Distress Signals Logged:</span>
              <span style={{ fontWeight: "700" }}>{alertsList.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="text-small" style={{ color: "var(--text-secondary)" }}>Active Incidents:</span>
              <span style={{ fontWeight: "700", color: isEmergencyActive ? "var(--system-red)" : "var(--system-green)" }}>
                {alertsList.filter(a => a.status === "active").length}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-small" style={{ color: "var(--text-secondary)" }}>Registered Safety Contacts:</span>
              <span style={{ fontWeight: "700" }}>{contacts.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------- VIEW 6: Analytics ----------------
  const AnalyticsView = () => {
    const totalAlerts = alertsList.length;
    const resolvedAlerts = alertsList.filter(a => a.status !== "active").length;
    const activeAlerts = alertsList.filter(a => a.status === "active").length;
    const totalHazards = hazardsList.length;
    const totalContacts = contacts.length;
    const primaryContacts = contacts.filter(c => c.priority === "Primary").length;

    // Hazard category breakdown from actual community reports
    const hazardCats: Record<string, number> = {};
    hazardsList.forEach((h: any) => {
      const cat = h.category || "unknown";
      hazardCats[cat] = (hazardCats[cat] || 0) + 1;
    });
    const hazardEntries = Object.entries(hazardCats).sort((a, b) => b[1] - a[1]);
    const hazardColors = ["var(--system-yellow)", "var(--system-blue)", "var(--system-red)", "var(--system-green)", "var(--system-yellow)"];

    return (
      <div className="pane-feed">
        <div className="surface-card" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>Your Safety Summary</h2>
          <p className="text-small" style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            Live metrics based on your actual alerts, hazard reports, and trusted network.
          </p>

          {/* Real Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div className="surface-card" style={{ background: "var(--bg-primary)", padding: "18px" }}>
              <p className="text-small" style={{ color: "var(--text-secondary)" }}>Total SOS Alerts</p>
              <p style={{ fontSize: "32px", fontWeight: "800", color: "var(--system-red)", marginTop: "4px" }}>
                {totalAlerts}
              </p>
              <p className="text-small" style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-secondary)" }}>
                {activeAlerts > 0 ? `${activeAlerts} currently active` : resolvedAlerts > 0 ? `All ${resolvedAlerts} resolved` : "No alerts triggered yet"}
              </p>
            </div>
            <div className="surface-card" style={{ background: "var(--bg-primary)", padding: "18px" }}>
              <p className="text-small" style={{ color: "var(--text-secondary)" }}>Community Hazards Reported</p>
              <p style={{ fontSize: "32px", fontWeight: "800", color: "var(--system-yellow)", marginTop: "4px" }}>
                {totalHazards}
              </p>
              <p className="text-small" style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-secondary)" }}>
                {totalHazards === 0 ? "No hazards submitted yet" : `${hazardEntries[0]?.[0]?.replace(/_/g, " ") || "Various"} most common`}
              </p>
            </div>
            <div className="surface-card" style={{ background: "var(--bg-primary)", padding: "18px" }}>
              <p className="text-small" style={{ color: "var(--text-secondary)" }}>Trusted Safety Network</p>
              <p style={{ fontSize: "32px", fontWeight: "800", color: "var(--system-blue)", marginTop: "4px" }}>
                {totalContacts}
              </p>
              <p className="text-small" style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-secondary)" }}>
                {totalContacts === 0 ? "No contacts enrolled" : `${primaryContacts} primary · ${totalContacts - primaryContacts} secondary`}
              </p>
            </div>
          </div>

          {/* Alert Status Breakdown */}
          <div className="surface-card" style={{ background: "var(--bg-primary)", padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "16px" }}>Alert History Breakdown</h3>
            {totalAlerts === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-secondary)" }}>
                <p style={{ fontSize: "13px" }}>No alerts have been triggered yet.</p>
                <p style={{ fontSize: "11px", marginTop: "4px" }}>Your alert history will appear here after your first SOS.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Resolved / Closed", count: resolvedAlerts, color: "var(--system-green)" },
                  { label: "Currently Active", count: activeAlerts, color: "var(--system-red)" },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>{item.label}</span>
                      <span style={{ fontWeight: "700", color: item.color }}>{item.count} of {totalAlerts}</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg-surface-elevated)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: totalAlerts > 0 ? `${Math.round((item.count / totalAlerts) * 100)}%` : "0%", height: "100%", background: item.color, borderRadius: "4px", transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hazard Category Breakdown — real data */}
          <div className="surface-card" style={{ background: "var(--bg-primary)", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "16px" }}>Reported Hazard Categories</h3>
            {hazardEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-secondary)" }}>
                <p style={{ fontSize: "13px" }}>No community hazards reported yet.</p>
                <p style={{ fontSize: "11px", marginTop: "4px" }}>Use Safety Hub → Report Hazard to log unsafe areas near you.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {hazardEntries.map(([cat, count], i) => {
                  const pct = Math.round((count / totalHazards) * 100);
                  return (
                    <div key={cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span style={{ textTransform: "capitalize" }}>{cat.replace(/_/g, " ")}</span>
                        <span style={{ fontWeight: "700" }}>{count} report{count > 1 ? "s" : ""} ({pct}%)</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "var(--bg-surface-elevated)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: hazardColors[i % hazardColors.length], borderRadius: "4px", transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---------------- VIEW 7: Comprehensive User Profile & Medical Settings ----------------
  const SettingsView = () => {
    const primaryContact = contacts.find(c => c.priority === "Primary") || contacts[0];
    
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
      name: userProfile?.name || userName || "",
      phone: userProfile?.phone || "+91 98390 00000",
      age: userProfile?.age || 21,
      gender: userProfile?.gender || "Female",
      address: userProfile?.address || "Prayagraj, Uttar Pradesh, India",
      blood_type: userProfile?.blood_type || "O+",
      allergies: userProfile?.allergies || "No known acute drug allergies (NKDA)",
      chronic_conditions: userProfile?.chronic_conditions || "Asthma (Mild, carries inhaler)",
      medications: userProfile?.medications || "Albuterol as needed",
      medical_notes: userProfile?.medical_notes || "Emergency donor authorized. Contact primary family guardian on dispatch.",
      emergency_notes: userProfile?.emergency_notes || "Prefers communication in Hindi or English. Trusted keyholder is Father."
    });

    // Keep synced when userProfile changes
    useEffect(() => {
      if (userProfile) {
        setFormData({
          name: userProfile.name || userName || "",
          phone: userProfile.phone || "+91 98390 00000",
          age: userProfile.age || 21,
          gender: userProfile.gender || "Female",
          address: userProfile.address || "Prayagraj, Uttar Pradesh, India",
          blood_type: userProfile.blood_type || "O+",
          allergies: userProfile.allergies || "No known acute drug allergies (NKDA)",
          chronic_conditions: userProfile.chronic_conditions || "Asthma (Mild, carries inhaler)",
          medications: userProfile.medications || "Albuterol as needed",
          medical_notes: userProfile.medical_notes || "Emergency donor authorized. Contact primary family guardian on dispatch.",
          emergency_notes: userProfile.emergency_notes || "Prefers communication in Hindi or English. Trusted keyholder is Father."
        });
      }
    }, []);

    const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const updated = await api.updateProfile(formData);
        setUserProfile(updated);
        setUserName(updated.name);
        setIsEditing(false);
        setToastMsg("✅ Profile & Medical details saved successfully!");
      } catch (err) {
        setToastMsg("⚠️ Failed to update profile on server.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="pane-feed">
        <div className="surface-card" style={{ padding: "26px" }}>
          
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Responder Profile & Medical Passport</h2>
              <p className="text-small" style={{ color: "var(--text-secondary)", margin: "4px 0 0" }}>
                Complete personal safety identity, blood group, allergies, medications, and live responder dispatch details.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="custom-button"
                style={{ color: isEditing ? "var(--system-yellow)" : "var(--system-blue)", borderColor: isEditing ? "var(--system-yellow)" : "rgba(59,130,246,0.3)" }}
              >
                <Edit3 size={14} /> {isEditing ? "Cancel Edit" : "Edit Details"}
              </button>
              <button 
                onClick={() => { api.logout(); setLoggedIn(false); }}
                className="custom-button"
                style={{ color: "var(--system-red)", borderColor: "rgba(255, 66, 100, 0.3)" }}
              >
                <LogIn size={14} /> Sign Out
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
              
              {/* LEFT COLUMN: Personal Identity & Emergency Medical Card */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* 1. Identity Badge */}
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                    <div style={{ 
                      width: "60px", 
                      height: "60px", 
                      borderRadius: "14px", 
                      background: "linear-gradient(135deg, rgba(255, 66, 100, 0.35) 0%, rgba(59, 130, 246, 0.35) 100%)", 
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: "22px", 
                      fontWeight: "800",
                      color: "white"
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          required
                          style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "6px 10px", borderRadius: "6px", color: "var(--text-primary)", fontWeight: "700", marginBottom: "6px" }}
                          placeholder="Full Name"
                        />
                      ) : (
                        <h3 style={{ fontSize: "17px", fontWeight: "700", margin: "0 0 2px" }}>{formData.name}</h3>
                      )}
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 4px" }}>
                        {userProfile?.email || "Enrolled Safety Guardian"}
                      </p>
                      <span style={{ fontSize: "10.5px", padding: "2px 7px", borderRadius: "5px", background: "rgba(16, 185, 129, 0.15)", color: "var(--system-green)", fontWeight: "600" }}>
                        ● Active Protection Passport
                      </span>
                    </div>
                  </div>

                  {/* Personal details grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
                    <div>
                      <span className="text-caption" style={{ display: "block", marginBottom: "2px" }}>Mobile Phone</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px" }}
                        />
                      ) : (
                        <p style={{ fontSize: "13px", fontWeight: "600", margin: 0 }}>{formData.phone}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-caption" style={{ display: "block", marginBottom: "2px" }}>Age & Gender</span>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input
                            type="number"
                            value={formData.age}
                            onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                            style={{ width: "60px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px" }}
                          />
                          <select
                            value={formData.gender}
                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                            style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "4px 6px", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px" }}
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      ) : (
                        <p style={{ fontSize: "13px", fontWeight: "600", margin: 0 }}>{formData.age} yrs • {formData.gender}</p>
                      )}
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <span className="text-caption" style={{ display: "block", marginBottom: "2px" }}>Primary Residence / Safehouse Address</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                          style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px" }}
                        />
                      ) : (
                        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0 }}>{formData.address}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Medical Passport */}
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Heart size={16} color="var(--system-red)" />
                      <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0 }}>Emergency Medical Credentials</h3>
                    </div>
                    <span style={{ fontSize: "10.5px", color: "var(--system-red)", background: "rgba(255,66,100,0.1)", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                      BROADCASTED ON SOS
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "16px", marginBottom: "16px" }}>
                    {/* Blood Group */}
                    <div style={{ 
                      borderRadius: "12px", 
                      background: "rgba(255, 66, 100, 0.1)", 
                      border: "1px solid rgba(255, 66, 100, 0.3)", 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      justifyContent: "center",
                      padding: "12px"
                    }}>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "600" }}>BLOOD GROUP</span>
                      {isEditing ? (
                        <select
                          value={formData.blood_type}
                          onChange={e => setFormData({ ...formData, blood_type: e.target.value })}
                          style={{ marginTop: "4px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "var(--system-red)", fontWeight: "900", fontSize: "16px", padding: "2px" }}
                        >
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: "26px", fontWeight: "900", color: "var(--system-red)", lineHeight: 1.1 }}>
                          {formData.blood_type}
                        </span>
                      )}
                    </div>

                    {/* Allergies & Chronic Conditions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <span className="text-caption" style={{ display: "block", marginBottom: "2px" }}>Known Allergies</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.allergies}
                            onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                            style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px" }}
                          />
                        ) : (
                          <p style={{ fontSize: "12.5px", color: "var(--text-primary)", fontWeight: "600", margin: 0 }}>
                            {formData.allergies}
                          </p>
                        )}
                      </div>
                      <div>
                        <span className="text-caption" style={{ display: "block", marginBottom: "2px" }}>Chronic Conditions / History</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.chronic_conditions}
                            onChange={e => setFormData({ ...formData, chronic_conditions: e.target.value })}
                            style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px" }}
                          />
                        ) : (
                          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0 }}>
                            {formData.chronic_conditions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medications & Medical notes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                    <div>
                      <span className="text-caption" style={{ display: "block", marginBottom: "2px" }}>Current Medications</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.medications}
                          onChange={e => setFormData({ ...formData, medications: e.target.value })}
                          style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px" }}
                        />
                      ) : (
                        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0 }}>{formData.medications}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-caption" style={{ display: "block", marginBottom: "2px" }}>Emergency Instructions & Donor Consent</span>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={formData.medical_notes}
                          onChange={e => setFormData({ ...formData, medical_notes: e.target.value })}
                          style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "6px 8px", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", resize: "none" }}
                        />
                      ) : (
                        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>{formData.medical_notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Emergency Dispatch & Responder Settings */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* 1. Primary Guardian Link */}
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0 }}>Primary Guardian Link</h3>
                    <span style={{ fontSize: "11px", color: "var(--system-green)", fontWeight: "700" }}>AUTO-CALL FIRST</span>
                  </div>
                  {primaryContact ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-primary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: "700", fontSize: "13px" }}>
                          {extractNickname(primaryContact.name, primaryContact.relation)} ({primaryContact.relation})
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                          {primaryContact.phone}
                        </p>
                      </div>
                      <span style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(255,66,100,0.15)", color: "var(--system-red)", fontSize: "11px", fontWeight: "700" }}>
                        Primary
                      </span>
                    </div>
                  ) : (
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>No primary contact registered. Add in Contacts view.</p>
                  )}

                  <div style={{ marginTop: "12px" }}>
                    <span className="text-caption" style={{ display: "block", marginBottom: "4px" }}>Emergency Responder Notes</span>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={formData.emergency_notes}
                        onChange={e => setFormData({ ...formData, emergency_notes: e.target.value })}
                        style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "6px 8px", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", resize: "none" }}
                      />
                    ) : (
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>{formData.emergency_notes}</p>
                    )}
                  </div>
                </div>

                {/* 2. Safety Dispatch Sequence */}
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px" }}>🛡️ Safety Dispatch Sequence</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { step: "1", label: "Online + Live GPS", desc: "Coordinates & alert instantly streamed to responders", ok: isOnline && !!gps, color: "var(--system-green)" },
                      { step: "2", label: "Online (Weak GPS)", desc: "Last-known location cached & broadcasted automatically", ok: isOnline && !gps && !!lastKnownGps, color: "var(--system-yellow)" },
                      { step: "3", label: "Offline Fallback", desc: "Instant SMS dispatched with location link; queued for server sync", ok: !isOnline, color: "var(--system-red)" },
                    ].map(s => (
                      <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px", borderRadius: "8px", background: s.ok ? `${s.color}15` : "transparent", border: `1px solid ${s.ok ? s.color + "40" : "var(--border-color)"}` }}>
                        <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: s.ok ? s.color : "var(--bg-surface-elevated)", color: s.ok ? "white" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800", flexShrink: 0 }}>{s.step}</span>
                        <div>
                          <p style={{ fontSize: "12px", fontWeight: "600", margin: 0 }}>{s.label}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "2px 0 0" }}>{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Accidental Trigger Protection */}
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>Accidental Trigger Protection</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: "500", margin: 0 }}>Hold-to-Arm Duration</p>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>Prevents accidental pocket triggers</p>
                      </div>
                      <span style={{ padding: "4px 10px", background: "rgba(59, 130, 246, 0.15)", color: "var(--system-blue)", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                        3.0s
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid var(--border-color)" }}>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: "500", margin: 0 }}>Abort Grace Window</p>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>Countdown window to cancel</p>
                      </div>
                      <span style={{ padding: "4px 10px", background: "rgba(16, 185, 129, 0.15)", color: "var(--system-green)", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                        5.0s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save Button when in edit mode */}
                {isEditing && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="custom-button button-critical"
                    style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "13px", gap: "8px" }}
                  >
                    <Save size={16} /> {saving ? "Saving Details..." : "Save Profile & Medical Changes"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };


  return (
    <div className="layout-app">

      {/* ── Offline / Weak Network Banner ─────────────────────────── */}
      {!isOnline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 99998,
          background: "linear-gradient(90deg, #7C2D12 0%, #991B1B 100%)",
          color: "white", padding: "10px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: "13px", fontWeight: "600", boxShadow: "0 2px 12px rgba(0,0,0,0.4)"
        }}>
          <span>📵 You're offline — SOS will fire SMS to your primary contact automatically.</span>
          {contacts.find(c => c.priority === "Primary") && (
            <a
              href={`tel:${contacts.find(c => c.priority === "Primary")!.phone}`}
              style={{ color: "#FCA5A5", fontWeight: "700", textDecoration: "none", fontSize: "12px", border: "1px solid #FCA5A5", borderRadius: "6px", padding: "3px 10px" }}
            >
              📞 Call {extractNickname(contacts.find(c => c.priority === "Primary")!.name, contacts.find(c => c.priority === "Primary")!.relation)} Now
            </a>
          )}
        </div>
      )}

      {/* ── GPS Fallback Warning ───────────────────────────────────── */}
      {isOnline && !gps && lastKnownGps && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 99997,
          background: "linear-gradient(90deg, #78350F 0%, #92400E 100%)",
          color: "white", padding: "8px 20px",
          display: "flex", alignItems: "center", gap: "10px",
          fontSize: "12px", fontWeight: "600"
        }}>
          <span>📍 Live GPS unavailable — using last known location from {new Date(lastKnownGps.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>
        </div>
      )}

      {/* 1. Real Fake Call Overlay (iOS reproduction) */}
      {activeCall && (
        <FakeCallOverlay
          callerName={activeCall.name}
          callerInitials={activeCall.initials}
          callerColor={activeCall.color}
          callerSubtitle={activeCall.subtitle}
          audioContext={activeCall.audioContext}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {/* 2. Audio Recorder Overlay with Web Audio Waveform */}
      {showAudioRecorder && <AudioRecorder onClose={() => setShowAudioRecorder(false)} />}

      {/* 3. Real Camera Capture Overlay */}
      {showCamera && <CameraCapture onClose={() => setShowCamera(false)} />}

      {/* 4. Live Emergency WebSocket Dispatcher Chat */}
      {showLiveChat && activeAlertId && (
        <EmergencyLiveChat 
          alertId={activeAlertId} 
          userName={userName} 
          onClose={() => setShowLiveChat(false)} 
        />
      )}

      {/* 5. Add Contact Modal */}
      {showAddContactModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="surface-card" style={{ width: "380px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px" }}>Add Trusted Contact</h3>
              <button onClick={() => setShowAddContactModal(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input 
                placeholder="Full Name / Nickname (e.g. Rajesh Singh (Father))"
                value={newContact.name}
                onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                required
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)", outline: "none" }}
              />
              <select
                value={newContact.relation}
                onChange={e => setNewContact(prev => ({ ...prev, relation: e.target.value }))}
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)", outline: "none" }}
              >
                <option value="Father">Relationship: Father</option>
                <option value="Mother">Relationship: Mother</option>
                <option value="Sister">Relationship: Sister</option>
                <option value="Brother">Relationship: Brother</option>
                <option value="Parent">Relationship: Parent</option>
                <option value="Sibling">Relationship: Sibling</option>
                <option value="Spouse">Relationship: Spouse</option>
                <option value="Friend">Relationship: Friend</option>
                <option value="Doctor">Relationship: Doctor</option>
                <option value="Guardian">Relationship: Guardian</option>
                <option value="Other">Relationship: Other</option>
              </select>
              <input 
                placeholder="Mobile / Phone (e.g. +91 98390 12345)"
                value={newContact.phone}
                onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                required
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)", outline: "none" }}
              />
              <select
                value={newContact.priority}
                onChange={e => setNewContact(prev => ({ ...prev, priority: e.target.value as "Primary" | "Secondary" }))}
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)", outline: "none" }}
              >
                <option value="Primary">Priority: Primary (Immediate Call/SMS)</option>
                <option value="Secondary">Priority: Secondary (Secondary broadcast)</option>
              </select>
              <button type="submit" className="custom-button button-critical" style={{ marginTop: "10px" }}>
                Save Contact
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Laptop Presentation / Simulated SMS Dispatch Modal */}
      {simulatedSmsModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="surface-card" style={{ maxWidth: "480px", width: "100%", padding: "26px", border: "1px solid var(--system-green)", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>📱</span>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "var(--system-green)" }}>
                    SMS & Call Gateway Simulation
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                    Laptop presentation mode — message copied to clipboard
                  </p>
                </div>
              </div>
              <button onClick={() => setSimulatedSmsModal(null)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: "var(--bg-subtle)", borderRadius: "10px", padding: "14px", border: "1px solid var(--border-color)", marginBottom: "14px" }}>
              <p style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)", margin: "0 0 6px" }}>
                DISPATCH RECIPIENTS:
              </p>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 10px" }}>
                {simulatedSmsModal.recipients}
              </p>

              <p style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)", margin: "0 0 6px" }}>
                MESSAGE PAYLOAD:
              </p>
              <div style={{ background: "var(--bg-primary)", padding: "10px", borderRadius: "8px", fontSize: "12px", fontFamily: "monospace", color: "var(--text-primary)", lineHeight: 1.4, wordBreak: "break-word" }}>
                {simulatedSmsModal.message}
              </div>
            </div>

            {simulatedSmsModal.callRecipient && (
              <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>📞</span>
                <p style={{ fontSize: "12px", color: "var(--system-blue)", margin: 0, fontWeight: "500" }}>
                  Active Voice Line Escalation: <strong>{simulatedSmsModal.callRecipient}</strong>
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(simulatedSmsModal.message).catch(() => {});
                  setToastMsg("📋 Message re-copied to clipboard!");
                }}
                className="custom-button"
                style={{ fontSize: "12px", padding: "8px 14px" }}
              >
                Copy Text
              </button>
              <button
                onClick={() => setSimulatedSmsModal(null)}
                className="custom-button button-critical"
                style={{ fontSize: "12px", padding: "8px 16px" }}
              >
                Dismiss / Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Laptop Direct Call Simulation Modal */}
      {simulatedDirectCall && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="surface-card" style={{ maxWidth: "420px", width: "100%", padding: "26px", border: "1px solid var(--system-blue)", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PhoneCall size={20} color="var(--system-blue)" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "var(--system-blue)" }}>
                    Direct Voice Call
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                    Laptop presentation mode
                  </p>
                </div>
              </div>
              <button onClick={() => setSimulatedDirectCall(null)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: "var(--bg-subtle)", borderRadius: "10px", padding: "16px", border: "1px solid var(--border-color)", textAlign: "center", marginBottom: "16px" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)", color: "white", fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                {simulatedDirectCall.name.charAt(0).toUpperCase()}
              </div>
              <p style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px" }}>
                {simulatedDirectCall.name}
              </p>
              <p style={{ fontSize: "13px", color: "var(--system-blue)", fontWeight: "600", margin: "0 0 6px" }}>
                {simulatedDirectCall.phone}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>
                On a smartphone, this launches your phone's native phone dialer directly.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "stretch" }}>
              <button
                onClick={() => {
                  const target = simulatedDirectCall;
                  setSimulatedDirectCall(null);
                  triggerCall(target.name, "#3B82F6", `${target.phone} • Outgoing Voice Line`);
                }}
                className="custom-button button-critical"
                style={{ flex: 1, justifyContent: "center", padding: "10px", fontSize: "12px" }}
              >
                <Phone size={14} /> Simulate In-App Audio Call
              </button>
              <button
                onClick={() => setSimulatedDirectCall(null)}
                className="custom-button"
                style={{ padding: "10px 14px", fontSize: "12px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toastMsg && (
        <div style={{ position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)", background: "var(--bg-surface-elevated)", border: "1px solid var(--system-blue)", padding: "12px 24px", borderRadius: "8px", zIndex: 9999, display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
          <Bell size={16} color="var(--system-blue)" />
          <span style={{ fontSize: "14px", fontWeight: "500" }}>{toastMsg}</span>
          <X size={16} color="var(--text-secondary)" style={{ cursor: "pointer" }} onClick={() => setToastMsg(null)} />
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="pane-nav">
        <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="icon-circle" style={{ background: "var(--system-red)", color: "white" }}><Shield size={20} /></div>
          <div>
            <h1 style={{ fontSize: "20px", letterSpacing: "1px" }}>AEGIS</h1>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Emergency Response Platform</span>
          </div>
        </div>

        <div style={{ padding: "8px 0", flexGrow: 1, display: "flex", flexDirection: "column" }}>
          {[
            { id: "dashboard", icon: Home, label: "Dashboard" },
            { id: "tracking", icon: MapIcon, label: "Live Tracking" },
            { id: "alerts", icon: Bell, label: "Alerts Archive", badge: alertsList.filter(a => a.status === "active").length > 0 ? String(alertsList.filter(a => a.status === "active").length) : undefined },
            { id: "contacts", icon: Users, label: "Trusted Contacts", badge: String(contacts.length) },
            { id: "safetyhub", icon: Heart, label: "Safety Hub" },
            { id: "reports", icon: FileText, label: "Audit Reports" },
            { id: "analytics", icon: Activity, label: "Analytics" },
            { id: "dispatcher", icon: Radio, label: "Dispatcher Console" },
            { id: "settings", icon: Settings, label: "Settings & System" },
          ].map(({ id, icon: Icon, label, badge }) => (
            <div key={id} className={`nav-link ${currentView === id ? "active" : ""}`} onClick={() => setCurrentView(id)}>
              <Icon size={18} /> {label}
              {badge && <span style={{ marginLeft: "auto", background: "var(--system-red)", color: "white", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>{badge}</span>}
            </div>
          ))}
        </div>

        {/* User Card - clickable to open Profile */}
        <div style={{ padding: "16px" }}>
          <div 
            className="surface-card" 
            onClick={() => setCurrentView("settings")}
            style={{ 
              padding: "12px", 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              marginBottom: "10px", 
              background: currentView === "settings" ? "rgba(255, 66, 100, 0.08)" : "var(--bg-subtle)",
              border: currentView === "settings" ? "1px solid rgba(255, 66, 100, 0.3)" : "1px solid var(--border-color)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={e => { if (currentView !== "settings") { (e.currentTarget as HTMLElement).style.background = "var(--bg-surface-hover)"; }}}
            onMouseLeave={e => { if (currentView !== "settings") { (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}}
          >
            <div className="icon-circle" style={{ 
              background: "linear-gradient(135deg, rgba(255, 66, 100, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)", 
              border: "1px solid var(--border-color)",
              color: "white", 
              fontWeight: "700", 
              fontSize: "13px" 
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: "600", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</p>
              <p style={{ fontSize: "10.5px", color: "var(--system-green)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--system-green)", flexShrink: 0 }}></span>
                <span>Encrypted · Online</span>
              </p>
            </div>
            <button 
              onClick={e => { e.stopPropagation(); api.logout(); setLoggedIn(false); }} 
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", flexShrink: 0, opacity: 0.5 }} 
              title="Sign out"
            >
              <LogIn size={15} color="var(--text-secondary)" />
            </button>
          </div>

          <div className="surface-card" style={{ padding: "16px", background: "var(--bg-subtle)" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", marginBottom: "8px", color: "var(--text-secondary)" }}>
              <ShieldAlert size={16} color="var(--system-blue)" /> Active Protection
            </h3>
            <p className="text-small" style={{ color: "var(--text-secondary)", marginBottom: "12px", fontSize: "12px" }}>
              False alarm mitigation active. Hold SOS 3s then 5s abort window.
            </p>
            <p className="text-small" style={{ color: "var(--system-red)", textAlign: "right", cursor: "pointer", fontSize: "12px" }} onClick={() => setCurrentView("safetyhub")}>
              Safety Protocols &rarr;
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="pane-main">
        {/* Header */}
        <div className="pane-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="icon-circle" style={{ border: "1px solid rgba(255,77,109,0.3)", color: "var(--system-red)" }}><Activity size={18} /></div>
            <div>
              <h3 style={{ fontSize: "14px" }}>AEGIS TELEMETRY CENTER</h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Real-time Emergency & Incident Protection</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {isEmergencyActive && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  onClick={handleCancelSOS}
                  style={{ 
                    background: "linear-gradient(135deg, #FF4264 0%, #D92547 100%)", 
                    color: "white", 
                    border: "none", 
                    padding: "7px 14px", 
                    borderRadius: "20px", 
                    fontSize: "12px", 
                    fontWeight: "700", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px",
                    boxShadow: "0 0 16px rgba(255, 66, 100, 0.6)"
                  }}
                  title="Deactivate emergency and stop siren sound"
                >
                  <XOctagon size={15} /> STOP SIREN / DEACTIVATE SOS
                </button>
                <button 
                  onClick={() => setShowLiveChat(true)}
                  style={{ background: "rgba(255,77,109,0.2)", border: "1px solid var(--system-red)", color: "var(--system-red)", padding: "7px 13px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Radio size={14} /> Open Dispatcher Chat
                </button>
              </div>
            )}
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setCurrentView("alerts")}>
              <Bell size={20} color="var(--text-secondary)" />
              {alertsList.filter(a => a.status === "active").length > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "var(--system-red)", width: "12px", height: "12px", borderRadius: "50%", border: "2px solid var(--bg-primary)" }} />
              )}
            </div>

            {/* Voice SOS Acoustic Trigger Badge / Toggle */}
            <button
              onClick={toggleVoiceListening}
              style={{
                background: voiceListening ? "rgba(239, 68, 68, 0.12)" : "var(--bg-surface)",
                border: `1px solid ${voiceListening ? "var(--system-red)" : "var(--border-color)"}`,
                color: voiceListening ? "var(--system-red)" : "var(--text-secondary)",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: voiceListening ? "0 0 10px rgba(239, 68, 68, 0.2)" : "var(--shadow-sm)",
                transition: "all 0.15s ease"
              }}
              title="Acoustic Voice Guardian: Listens for 'Help' and 'Bachao' to trigger SOS automatically"
            >
              {voiceListening ? (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--system-red)", display: "inline-block" }} />
                  <Mic size={14} color="var(--system-red)" />
                  <span>Voice SOS: Active</span>
                </>
              ) : (
                <>
                  <MicOff size={14} />
                  <span>Voice SOS: Off</span>
                </>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.15s ease"
              }}
              title={`Switch to ${theme === "light" ? "Dark Tactical" : "Clean Light"} theme`}
            >
              {theme === "light" ? (
                <>
                  <Moon size={14} color="var(--system-purple)" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun size={14} color="var(--system-yellow)" />
                  <span>Light</span>
                </>
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "16px", borderLeft: "1px solid var(--border-color)" }}>
              <Sun size={18} color="var(--system-yellow)" />
              <div><p style={{ fontSize: "12.5px", fontWeight: "600" }}>28°C</p><p style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>Clear Sky</p></div>
            </div>
            <div 
              style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "20px", borderLeft: "1px solid var(--border-color)", cursor: "pointer" }}
              onClick={() => setCurrentView("settings")}
              title="View Profile"
            >
              <p style={{ fontSize: "13px", fontWeight: "500" }}>{userName}</p>
              <div className="icon-circle" style={{ 
                background: "linear-gradient(135deg, rgba(255, 66, 100, 0.3) 0%, rgba(59, 130, 246, 0.25) 100%)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "white", 
                fontSize: "12px", 
                fontWeight: "700" 
              }}>{initials}</div>
            </div>
          </div>
        </div>

        {/* Content Feeds */}
        <div className="pane-content">
          {currentView === "dashboard" ? (
            <div className="pane-feed">
              <div className="surface-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Users size={16} color="var(--text-secondary)" />
                    <h3 style={{ fontSize: "15px" }}>Live Map Telemetry</h3>
                    <span className="text-small" style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>• Real OpenStreetMap</span>
                  </div>
                  <div style={{ background: isEmergencyActive ? "rgba(255,77,109,0.15)" : "rgba(34,197,94,0.15)", color: isEmergencyActive ? "var(--system-red)" : "var(--system-green)", padding: "4px 12px", borderRadius: "16px", fontSize: "12px", fontWeight: "500" }}>
                    {isEmergencyActive ? "CRITICAL • Distressing Broadcast" : "Safe • Telemetry Active"}
                  </div>
                </div>
                
                <div style={{ height: "300px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                  <SafetyMap isEmergencyActive={isEmergencyActive} onLocationUpdate={handleLocationUpdate} trackingActive={false} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-primary)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <p className="text-small" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                    <MapPin size={14} color="var(--system-red)" /> 
                    {gps ? `Current GPS: ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} (±${gps.accuracy}m)` : "MG Road, Civil Lines, Prayagraj, UP 211001, India"}
                  </p>
                  <button onClick={handleShareLocation} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "var(--system-red)", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
                    <Share2 size={14} /> Share GPS
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                {[
                  { icon: Shield, color: "var(--system-red)", title: "Total Alerts Logged", value: String(alertsList.length), sub: "Incident records", trend: true },
                  { icon: Activity, color: "var(--system-yellow)", title: "Safe Transit Hours", value: "156", sub: "15%", trend: true },
                  { icon: MapPin, color: "var(--system-green)", title: "Hazards Registered", value: String(hazardsList.length), sub: "Community verified", trend: true },
                  { icon: Users, color: "var(--system-blue)", title: "Trusted Contacts", value: String(contacts.length), sub: "Active responders", trend: false },
                ].map((stat, i) => (
                  <div key={i} className="surface-card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div className="icon-circle" style={{ background: `rgba(${stat.color === "var(--system-red)" ? "255,77,109" : stat.color === "var(--system-yellow)" ? "250,204,21" : stat.color === "var(--system-green)" ? "34,197,94" : "59,130,246"}, 0.2)` }}>
                      <stat.icon size={18} color={stat.color} />
                    </div>
                    <div>
                      <p className="text-small" style={{ color: "var(--text-secondary)" }}>{stat.title}</p>
                      <p style={{ fontSize: "20px", fontWeight: "700", marginTop: "2px" }}>{stat.value}</p>
                      <p style={{ fontSize: "11px", color: stat.trend ? "var(--system-green)" : "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                        {stat.trend && <TrendingUp size={10} />} {stat.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Alerts Feed */}
              <div className="surface-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h3>Recent Incident Logs</h3>
                  <span onClick={() => setCurrentView("alerts")} style={{ color: "var(--system-red)", fontSize: "13px", cursor: "pointer" }}>View Complete Archive</span>
                </div>
                {alertsList.slice(0, 3).map((a, i) => {
                  const isActive = a.status === "active";
                  return (
                    <div key={i} className="surface-card" style={{ background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "none", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div className="icon-circle" style={{ background: isActive ? "var(--system-red)" : "rgba(34,197,94,0.2)", color: isActive ? "white" : "var(--system-green)", fontSize: "10px", fontWeight: "bold" }}>
                          {isActive ? "SOS" : "OK"}
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: "500" }}>Incident Case #{a.id}</p>
                          <p className="text-small" style={{ color: "var(--text-secondary)" }}>
                            {new Date(a.start_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "12px", background: isActive ? "rgba(255,77,109,0.15)" : "rgba(34,197,94,0.15)", color: isActive ? "var(--system-red)" : "var(--system-green)" }}>
                          {a.status.toUpperCase()}
                        </span>
                        <ChevronRight size={16} color="var(--text-secondary)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : currentView === "tracking" ? (
            <LiveTrackingView />
          ) : currentView === "alerts" ? (
            <AlertsView />
          ) : currentView === "contacts" ? (
            <ContactsView />
          ) : currentView === "safetyhub" ? (
            <SafetyHubView />
          ) : currentView === "reports" ? (
            <ReportsView />
          ) : currentView === "analytics" ? (
            <AnalyticsView />
          ) : currentView === "dispatcher" ? (
            <div className="pane-feed" style={{ padding: "24px" }}>
              <ResponderDashboard
                isEmergencyActive={isEmergencyActive}
                onDeactivateSOS={handleCancelSOS}
                userLocation={{ x: gps ? gps.lng : 81.8463, y: gps ? gps.lat : 25.4358 }}
                responderLocation={responderLocation}
                setResponderLocation={setResponderLocation}
                operatorChat={operatorChat}
                setOperatorChat={setOperatorChat}
                userName={userName}
                userProfile={userProfile}
                contacts={contacts}
                gps={gps}
              />
            </div>
          ) : currentView === "settings" ? (
            <SettingsView />
          ) : null}

          {/* Right Action Panel — always visible, inside pane-content flex-row */}
          <div className="pane-action">
            <SOSButton 
              isActive={isEmergencyActive} 
              onTriggerSOS={handleTriggerSOS} 
              onCancelSOS={handleCancelSOS} 
              onCallPolice={() => {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                  window.location.href = "tel:112";
                } else {
                  setSimulatedDirectCall({
                    name: "Nearest Police Station / 112 PCR Dispatch",
                    phone: "112 (National Emergency Helpline)",
                    relation: "Police Control Room"
                  });
                }
              }}
            />
            <SafetyTools
              showNotification={setToastMsg}
              onFakeCall={() => {
                const primary = contacts.find(c => c.priority === "Primary") || contacts[0];
                const nick = primary ? extractNickname(primary.name, primary.relation) : "Father";
                const full = primary ? primary.name.replace(/\s*\([^)]*\)/, "").trim() : "Family Guardian";
                triggerCall(nick, "#22C55E", `${full} • Rescue Call`);
              }}
              onShareLocation={handleShareLocation}
              onRecordAudio={() => setShowAudioRecorder(true)}
              onTakePhoto={() => setShowCamera(true)}
              onSuperEmergency={handleSuperEmergency}
              voiceListening={voiceListening}
              onToggleVoiceListening={toggleVoiceListening}
              lastVoiceKeyword={lastVoiceKeyword}
              onSimulateVoiceDistress={handleSimulateVoiceDistress}
            />
            <ContactsManager 
              contacts={contacts} 
              setContacts={setContacts} 
              smsTemplate="" 
              setSmsTemplate={() => {}} 
              onOpenAddModal={() => setShowAddContactModal(true)}
              onTestCall={(name, color, subtitle) => triggerCall(name, color, subtitle)}
              onAlertAll={handleAlertAll}
              onDirectCall={(contact) => {
                const nickname = extractNickname(contact.name, contact.relation);
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                  window.location.href = `tel:${contact.phone}`;
                } else {
                  setSimulatedDirectCall({ name: nickname, phone: contact.phone, relation: contact.relation });
                }
              }}
              onSendSms={(contact) => {
                const nickname = extractNickname(contact.name, contact.relation);
                const msg = `🚨 AEGIS EMERGENCY to ${nickname}: Immediate assistance requested. Live location broadcast.`;
                if (navigator.clipboard) navigator.clipboard.writeText(`To: ${contact.phone}\n${msg}`).catch(() => {});
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                  window.open(`sms:${contact.phone}?body=${encodeURIComponent(msg)}`, "_blank");
                } else {
                  setSimulatedSmsModal({ recipients: `${nickname} (${contact.phone})`, message: msg });
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
