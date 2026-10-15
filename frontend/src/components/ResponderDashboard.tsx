import React, { useState, useEffect } from "react";
import { 
  Siren, Shield, Radio, MessageSquare, Send, CheckCircle2, 
  Car, HeartHandshake, Activity, Clock
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  priority: "Primary" | "Secondary";
}

interface ResponderDashboardProps {
  isEmergencyActive: boolean;
  onDeactivateSOS: () => void;
  userLocation: { x: number; y: number };
  responderLocation: { x: number; y: number; active: boolean; name: string } | null;
  setResponderLocation: (loc: { x: number; y: number; active: boolean; name: string } | null) => void;
  operatorChat: { sender: "user" | "operator"; text: string; time: string }[];
  setOperatorChat: React.Dispatch<React.SetStateAction<{ sender: "user" | "operator"; text: string; time: string }[]>>;
  userName?: string;
  userProfile?: any;
  contacts?: Contact[];
  gps?: { lat: number; lng: number; accuracy: number } | null;
}

export default function ResponderDashboard({
  isEmergencyActive,
  onDeactivateSOS,
  userLocation,
  responderLocation,
  setResponderLocation,
  operatorChat,
  setOperatorChat,
  userName = "Active Citizen",
  userProfile,
  contacts = [],
  gps,
}: ResponderDashboardProps) {
  const [inputText, setInputText] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "dispatched" | "en_route" | "arrived">("idle");
  const [activeUnit, setActiveUnit] = useState<string>("Patrol Cruiser #204");
  const [etaSeconds, setEtaSeconds] = useState<number>(120);

  const [logs, setLogs] = useState<string[]>([
    "System Boot: Aegis Central Dispatch v2.4 initialized.",
    "Storage: Emergency records database connected & ready.",
    "Security: Encrypted authentication channel established.",
    "Radio Telemetry: Monitoring 402.1 MHz high-gain distress beacon.",
    "Network: 14 regional response beacons active across district."
  ]);

  // Log updater
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Sync with emergency active state
  useEffect(() => {
    if (isEmergencyActive) {
      setDispatchStatus("dispatched");
      setEtaSeconds(120);
      addLog(`🚨 CRITICAL: Incoming SOS broadcast registered for ${userName}.`);
      addLog(`Telemetry Fix: Lat ${gps?.lat?.toFixed(5) || userLocation.y.toFixed(5)}, Lng ${gps?.lng?.toFixed(5) || userLocation.x.toFixed(5)} (±${gps?.accuracy || 12}m)`);
      if (contacts.length > 0) {
        addLog(`Contact Broadcast: SMS dispatch queued to ${contacts[0].name} (${contacts[0].phone})`);
      }
    } else {
      setDispatchStatus("idle");
      addLog("Status: Channel normal. All active alerts resolved.");
    }
  }, [isEmergencyActive, userName]);

  // ETA Countdown simulation when dispatched
  useEffect(() => {
    if (!isEmergencyActive || dispatchStatus === "idle" || dispatchStatus === "arrived") return;
    const interval = setInterval(() => {
      setEtaSeconds(prev => {
        if (prev <= 1) {
          setDispatchStatus("arrived");
          addLog(`✅ ARRIVAL: ${activeUnit} reached victim coordinates. Perimeter secured.`);
          return 0;
        }
        if (prev === 60) {
          setDispatchStatus("en_route");
          addLog(`PATROL UPDATE: ${activeUnit} within 500 meters of victim location.`);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isEmergencyActive, dispatchStatus, activeUnit]);

  // Dispatch custom unit
  const handleDispatchUnit = (unitName: string) => {
    setActiveUnit(unitName);
    setDispatchStatus("dispatched");
    setEtaSeconds(90);
    setResponderLocation({
      x: userLocation.x + 0.003,
      y: userLocation.y + 0.003,
      active: true,
      name: unitName
    });
    addLog(`DISPATCH: ${unitName} deployed to scene via Emergency Siren priority.`);
  };

  // Send Operator message
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg = {
      sender: "operator" as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setOperatorChat(prev => [...prev, newMsg]);
    if (!textToSend) setInputText("");
    addLog(`COMM OUT: Dispatcher text sent: "${text.substring(0, 30)}..."`);
  };

  const primaryContact = contacts.find(c => c.priority === "Primary") || contacts[0];
  const lat = gps ? gps.lat.toFixed(5) : userLocation.y.toFixed(5);
  const lng = gps ? gps.lng.toFixed(5) : userLocation.x.toFixed(5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* TOP HEADER SUMMARY BAR */}
      <div className="surface-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="icon-circle" style={{ background: isEmergencyActive ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)", color: isEmergencyActive ? "var(--system-red)" : "var(--system-green)" }}>
            <Radio size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              Dispatcher Control &amp; Incident Operations
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: isEmergencyActive ? "var(--system-red)" : "var(--system-green)", color: "white", fontWeight: "700" }}>
                {isEmergencyActive ? "CODE RED • ACTIVE DISTRESS" : "NORMAL • STANDBY"}
              </span>
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Central Monitoring Desk • Channel 402.1 MHz • Regional Command Division
            </p>
          </div>
        </div>

        {isEmergencyActive && (
          <button 
            onClick={onDeactivateSOS}
            className="custom-button button-critical"
            style={{ padding: "8px 16px", fontSize: "12px" }}
          >
            Resolve &amp; Close Incident
          </button>
        )}
      </div>

      {/* 2-COLUMN MAIN DISPATCHER GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
        
        {/* LEFT COLUMN: ACTIVE INCIDENT DOSSIER & OPERATOR CHAT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          {/* Incident Dossier Card */}
          <div className="surface-card" style={{ border: isEmergencyActive ? "2px solid var(--system-red)" : "1px solid var(--border-color)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Siren size={20} color={isEmergencyActive ? "var(--system-red)" : "var(--text-muted)"} />
                <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0 }}>
                  Incident Dossier #{isEmergencyActive ? "402-LIVE" : "STANDBY"}
                </h3>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "500" }}>
                {isEmergencyActive ? `Elapsed: 0${Math.floor((120 - etaSeconds) / 60)}:${((120 - etaSeconds) % 60).toString().padStart(2, '0')}` : "System Ready"}
              </span>
            </div>

            {/* Victim Profile Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--bg-subtle)", padding: "14px", borderRadius: "10px", marginBottom: "16px" }}>
              <div>
                <span className="text-caption" style={{ display: "block" }}>Citizen Identity</span>
                <p style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: "2px 0 0" }}>{userName}</p>
                <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0 }}>{userProfile?.email || "Authenticated User"}</p>
              </div>

              <div>
                <span className="text-caption" style={{ display: "block" }}>Medical Profile</span>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--system-red)", margin: "2px 0 0" }}>
                  Blood: {userProfile?.blood_type || "O+"}
                </p>
                <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0 }}>
                  {userProfile?.medical_notes || "No acute allergies noted"}
                </p>
              </div>

              <div>
                <span className="text-caption" style={{ display: "block" }}>GPS Telemetry</span>
                <p style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-primary)", margin: "2px 0 0" }}>
                  {lat}, {lng}
                </p>
                <p style={{ fontSize: "11px", color: "var(--system-green)", margin: 0 }}>
                  ±{gps?.accuracy || 15}m browser fix
                </p>
              </div>

              <div>
                <span className="text-caption" style={{ display: "block" }}>Primary Emergency Contact</span>
                <p style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-primary)", margin: "2px 0 0" }}>
                  {primaryContact ? `${primaryContact.name} (${primaryContact.relation})` : "Self-Reporting"}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>
                  {primaryContact ? primaryContact.phone : "No contacts enrolled"}
                </p>
              </div>
            </div>

            {/* Quick Dispatch Unit Buttons */}
            <div>
              <span className="text-caption" style={{ display: "block", marginBottom: "8px" }}>
                Emergency First-Responder Deployment
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                {[
                  { name: "Patrol Cruiser #204", role: "Police QRT", icon: Car, color: "var(--system-blue)" },
                  { name: "Ambulance EMS-09", role: "Paramedic", icon: Activity, color: "var(--system-red)" },
                  { name: "Motor Patrol Delta", role: "Rapid Scout", icon: Shield, color: "var(--system-green)" },
                ].map(unit => (
                  <button
                    key={unit.name}
                    onClick={() => handleDispatchUnit(unit.name)}
                    disabled={!isEmergencyActive}
                    className="custom-button"
                    style={{
                      flex: "1 1 calc(33% - 8px)",
                      padding: "8px 10px",
                      fontSize: "11.5px",
                      opacity: isEmergencyActive ? 1 : 0.5,
                      border: activeUnit === unit.name && dispatchStatus !== "idle" ? `1.5px solid ${unit.color}` : "1px solid var(--border-color)",
                      background: activeUnit === unit.name && dispatchStatus !== "idle" ? "var(--bg-surface-elevated)" : "var(--bg-subtle)"
                    }}
                  >
                    <unit.icon size={14} color={unit.color} />
                    <span>{unit.name}</span>
                  </button>
                ))}
              </div>

              {/* Status Banner */}
              {isEmergencyActive ? (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: dispatchStatus === "arrived" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                  border: dispatchStatus === "arrived" ? "1px solid var(--system-green)" : "1px solid var(--system-yellow)",
                  color: dispatchStatus === "arrived" ? "var(--system-green)" : "var(--system-yellow)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {dispatchStatus === "arrived" ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    <span style={{ fontSize: "12.5px", fontWeight: "700" }}>
                      {dispatchStatus === "arrived" 
                        ? `${responderLocation?.name || activeUnit} ARRIVED AT SCENE` 
                        : `${responderLocation?.name || activeUnit} EN ROUTE (ETA: ${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s)`}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "600" }}>
                    {dispatchStatus === "arrived" ? "Perimeter Secured" : "Siren Priority High"}
                  </span>
                </div>
              ) : (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "var(--bg-subtle)", border: "1px dashed var(--border-color)", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                  All patrol units currently on routine grid standby. Awaiting distress frequency trigger.
                </div>
              )}
            </div>
          </div>

          {/* Victim Direct Comms Chat */}
          <div className="surface-card" style={{ padding: "18px", display: "flex", flexDirection: "column", height: "320px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={16} color="var(--system-blue)" />
                <h4 style={{ fontSize: "13.5px", fontWeight: "700", margin: 0 }}>Direct Dispatcher-Victim Communications</h4>
              </div>
              <span style={{ fontSize: "10.5px", color: isEmergencyActive ? "var(--system-green)" : "var(--text-secondary)", fontWeight: "600" }}>
                {isEmergencyActive ? "● Secure Channel Open" : "Channel Idle"}
              </span>
            </div>

            {/* Quick pre-set responses */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px", overflowX: "auto", paddingBottom: "4px" }}>
              {[
                "Hold position, patrol is 2 mins away.",
                "Are you in a safe shelter?",
                "Medical team briefed with your blood type.",
                "Stay on this line, help is arriving."
              ].map((quickText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(quickText)}
                  disabled={!isEmergencyActive}
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "14px",
                    padding: "4px 9px",
                    fontSize: "10.5px",
                    whiteSpace: "nowrap",
                    cursor: isEmergencyActive ? "pointer" : "not-allowed",
                    color: "var(--text-secondary)"
                  }}
                >
                  + {quickText}
                </button>
              ))}
            </div>

            {/* Chat message history */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
              {operatorChat.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px", margin: "auto" }}>
                  {isEmergencyActive ? "No communications recorded yet. Send instruction above." : "Activate emergency to establish real-time victim audio/text channel."}
                </div>
              ) : (
                operatorChat.map((msg, i) => {
                  const isOp = msg.sender === "operator";
                  return (
                    <div 
                      key={i} 
                      style={{
                        alignSelf: isOp ? "flex-end" : "flex-start",
                        background: isOp ? "var(--bg-surface-elevated)" : "rgba(239, 68, 68, 0.12)",
                        border: isOp ? "1px solid var(--border-color)" : "1px solid rgba(239, 68, 68, 0.25)",
                        borderRadius: "10px",
                        padding: "8px 12px",
                        maxWidth: "80%"
                      }}
                    >
                      <p style={{ fontSize: "12px", color: "var(--text-primary)", margin: 0 }}>{msg.text}</p>
                      <span style={{ fontSize: "9.5px", color: "var(--text-muted)", display: "block", textAlign: "right", marginTop: "3px" }}>
                        {isOp ? "Dispatcher" : userName} • {msg.time}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input bar */}
            <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={isEmergencyActive ? "Type instruction to victim..." : "Activate emergency to engage chat..."}
                disabled={!isEmergencyActive}
                style={{
                  flex: 1,
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                disabled={!isEmergencyActive || !inputText.trim()}
                className="custom-button button-critical"
                style={{ padding: "8px 14px", fontSize: "12px" }}
              >
                <Send size={13} /> Send
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: OPERATIONS TERMINAL & REGIONAL METRICS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          {/* Dispatcher Fleet Stats */}
          <div className="surface-card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", padding: "18px" }}>
            <div>
              <span className="text-caption">Active Units</span>
              <p style={{ fontSize: "26px", fontWeight: "800", color: "var(--system-green)", margin: "2px 0 0" }}>14</p>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>Grid patrol deployed</p>
            </div>
            <div>
              <span className="text-caption">Avg Response Time</span>
              <p style={{ fontSize: "26px", fontWeight: "800", color: "var(--system-blue)", margin: "2px 0 0" }}>3.2m</p>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>911 SLA target &lt; 5m</p>
            </div>
          </div>

          {/* System Operations Live Console */}
          <div className="surface-card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px", minHeight: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)", marginBottom: "10px" }}>
              <Radio size={15} color="var(--system-yellow)" />
              <h4 style={{ fontSize: "13.5px", fontWeight: "700", margin: 0 }}>Live Telemetry &amp; System Log Console</h4>
            </div>

            <div style={{
              flex: 1,
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "12px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "11px",
              color: "var(--text-primary)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              maxHeight: "240px"
            }}>
              {logs.map((log, idx) => (
                <div key={idx} style={{ color: log.includes("CRITICAL") || log.includes("ALERT") ? "var(--system-red)" : log.includes("ARRIVAL") ? "var(--system-green)" : "var(--text-secondary)" }}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Helplines Matrix */}
          <div className="surface-card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <HeartHandshake size={15} color="var(--system-red)" />
              <h4 style={{ fontSize: "13px", fontWeight: "600", margin: 0 }}>Emergency Command Hotline Matrix</h4>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "National Emergency", num: "112", color: "var(--system-red)" },
                { label: "Police Central Dispatch", num: "100", color: "var(--system-blue)" },
                { label: "Ambulance EMS Core", num: "108", color: "var(--system-green)" },
                { label: "Women Safety Helpline", num: "1091", color: "var(--system-purple)" }
              ].map(h => (
                <div key={h.num} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 10px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", display: "block" }}>{h.label}</span>
                  <a href={`tel:${h.num}`} style={{ fontSize: "14px", fontWeight: "800", color: h.color, textDecoration: "none" }}>{h.num}</a>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
