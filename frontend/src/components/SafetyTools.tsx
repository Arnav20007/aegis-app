import { Phone, Share2, Mic, MicOff, Camera, ShieldAlert } from "lucide-react";

interface SafetyToolsProps {
  showNotification?: (msg: string) => void;
  onFakeCall: () => void;
  onShareLocation: () => void;
  onRecordAudio: () => void;
  onTakePhoto: () => void;
  onSuperEmergency?: () => void;
  voiceListening?: boolean;
  onToggleVoiceListening?: () => void;
  lastVoiceKeyword?: string | null;
  onSimulateVoiceDistress?: (keyword: string) => void;
}

export default function SafetyTools({ 
  onFakeCall, 
  onShareLocation, 
  onRecordAudio, 
  onTakePhoto,
  onSuperEmergency,
  voiceListening = false,
  onToggleVoiceListening,
  lastVoiceKeyword,
  onSimulateVoiceDistress
}: SafetyToolsProps) {
  const actions = [
    { icon: Phone,  color: "var(--system-green)",  label: "Fake Call",      desc: "Simulate call",    handler: onFakeCall },
    { icon: Share2, color: "var(--system-blue)",   label: "Share Location", desc: "Send coordinates", handler: onShareLocation },
    { icon: Mic,    color: "var(--system-red)",    label: "Record Audio",   desc: "Capture voice",    handler: onRecordAudio },
    { icon: Camera, color: "var(--system-yellow)", label: "Take Photo",     desc: "Quick snapshot",   handler: onTakePhoto },
  ];

  return (
    <div className="surface-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0 }}>Quick Actions</h3>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Instant Hardware</span>
      </div>

      {/* VOICE DISTRESS ACOUSTIC GUARDIAN CARD */}
      <div style={{
        marginBottom: "12px",
        padding: "11px 13px",
        borderRadius: "10px",
        background: voiceListening ? "rgba(239, 68, 68, 0.08)" : "var(--bg-subtle)",
        border: `1px solid ${voiceListening ? "rgba(239, 68, 68, 0.3)" : "var(--border-color)"}`,
        transition: "all 0.2s ease"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              background: voiceListening ? "rgba(239, 68, 68, 0.2)" : "rgba(100, 116, 139, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {voiceListening ? <Mic size={14} color="var(--system-red)" /> : <MicOff size={14} color="var(--text-secondary)" />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: voiceListening ? "var(--system-red)" : "var(--text-primary)" }}>
                {voiceListening ? "🎙️ Acoustic SOS Trigger: ACTIVE" : "🎙️ Acoustic Voice Trigger: OFF"}
              </p>
              <p style={{ margin: 0, fontSize: "10px", color: "var(--text-secondary)" }}>
                Say: <strong>"Help"</strong> • <strong>"Bachao"</strong> • <strong>"Madad"</strong>
              </p>
            </div>
          </div>
          {onToggleVoiceListening && (
            <button
              onClick={onToggleVoiceListening}
              style={{
                background: voiceListening ? "var(--system-red)" : "var(--bg-surface)",
                color: voiceListening ? "white" : "var(--text-primary)",
                border: `1px solid ${voiceListening ? "transparent" : "var(--border-color)"}`,
                borderRadius: "6px",
                fontSize: "10.5px",
                fontWeight: "600",
                padding: "4px 9px",
                cursor: "pointer"
              }}
            >
              {voiceListening ? "Stop" : "Enable"}
            </button>
          )}
        </div>

        {/* Live Detected Keyword Toast Badge or Test Simulation Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--border-color)" }}>
          <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "500" }}>Test Trigger:</span>
          {onSimulateVoiceDistress && (
            <>
              <button
                onClick={() => onSimulateVoiceDistress("Bachao! Bachao!")}
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "var(--system-red)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "4px",
                  padding: "2px 7px",
                  fontSize: "10px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
                title="Test trigger with 'Bachao Bachao'"
              >
                🗣️ "Bachao"
              </button>
              <button
                onClick={() => onSimulateVoiceDistress("Help! Help!")}
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "var(--system-red)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "4px",
                  padding: "2px 7px",
                  fontSize: "10px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
                title="Test trigger with 'Help Help'"
              >
                🗣️ "Help"
              </button>
            </>
          )}
          {lastVoiceKeyword && (
            <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--system-green)", fontWeight: "600" }}>
              ✓ Heard: "{lastVoiceKeyword}"
            </span>
          )}
        </div>
      </div>

      {/* SUPER EMERGENCY BUTTON */}
      {onSuperEmergency && (
        <button
          onClick={onSuperEmergency}
          style={{
            width: "100%",
            marginBottom: "12px",
            padding: "12px 14px",
            background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
            border: "1px solid #DC2626",
            borderRadius: "12px",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
            transition: "all 0.15s ease",
            textAlign: "left"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(239, 68, 68, 0.5)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(239, 68, 68, 0.35)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ShieldAlert size={18} color="#FFFFFF" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", letterSpacing: "0.2px" }}>
                ⚡ SUPER SOS ESCALATION
              </p>
              <p style={{ margin: 0, fontSize: "11px", opacity: 0.9 }}>
                Call Police (112) + SMS Parents & Emergency Contacts
              </p>
            </div>
          </div>
          <span style={{
            fontSize: "10px",
            background: "rgba(0,0,0,0.25)",
            padding: "3px 8px",
            borderRadius: "6px",
            fontWeight: "700"
          }}>
            1-TAP
          </span>
        </button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {actions.map(({ icon: Icon, color, label, desc, handler }) => (
          <button
            key={label}
            onClick={handler}
            className="custom-button"
            style={{ 
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "12px 14px",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-color)",
              borderRadius: "11px",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--bg-surface-hover)";
              e.currentTarget.style.borderColor = "var(--border-highlight)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "var(--bg-subtle)";
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ 
              width: "28px", 
              height: "28px", 
              borderRadius: "7px", 
              background: "var(--bg-surface)", 
              boxShadow: "var(--shadow-sm)",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <p style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>{label}</p>
              <p style={{ fontSize: "10.5px", color: "var(--text-secondary)", margin: 0 }}>{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
