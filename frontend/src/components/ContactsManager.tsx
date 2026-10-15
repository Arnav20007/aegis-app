import { Phone, Plus, UserPlus, MessageSquare, PhoneCall, Zap } from "lucide-react";

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  priority: "Primary" | "Secondary";
}

export function extractNickname(name: string, relation?: string): string {
  const match = name.match(/\(([^)]+)\)/);
  if (match) return match[1].trim();
  if (relation && relation.trim() && !["other", "test"].includes(relation.toLowerCase())) {
    return relation.trim();
  }
  return name.replace(/\s*\([^)]*\)/, "").trim() || name;
}

interface ContactsManagerProps {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  smsTemplate: string;
  setSmsTemplate: (template: string) => void;
  onOpenAddModal?: () => void;
  onTestCall?: (name: string, color?: string, subtitle?: string) => void;
  onAlertAll?: () => void;
  onDirectCall?: (contact: Contact) => void;
  onSendSms?: (contact: Contact) => void;
}

export default function ContactsManager({ 
  contacts, 
  onOpenAddModal, 
  onTestCall, 
  onAlertAll,
  onDirectCall,
  onSendSms
}: ContactsManagerProps) {
  const getAvatarColor = (name: string) => {
    const colors = ["#3B82F6", "#FF4264", "#10B981", "#F59E0B", "#8B5CF6"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="surface-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0 }}>Trusted Responders</h3>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"} enrolled
          </span>
        </div>
        <button
          onClick={onOpenAddModal}
          style={{ 
            background: "rgba(255, 66, 100, 0.12)", 
            border: "1px solid rgba(255, 66, 100, 0.25)", 
            color: "var(--system-red)", 
            fontSize: "11.5px", 
            fontWeight: "600", 
            cursor: "pointer", 
            borderRadius: "7px", 
            padding: "5px 9px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {contacts.length > 0 && onAlertAll && (
        <button
          onClick={onAlertAll}
          style={{
            width: "100%",
            marginBottom: "12px",
            padding: "9px 12px",
            background: "linear-gradient(135deg, rgba(255, 66, 100, 0.14) 0%, rgba(245, 158, 11, 0.14) 100%)",
            border: "1px solid rgba(255, 66, 100, 0.35)",
            borderRadius: "9px",
            color: "var(--system-red)",
            fontWeight: "700",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(255, 66, 100, 0.08)"
          }}
          title="Broadcast emergency alert to all contacts at once"
        >
          <Zap size={14} color="var(--system-yellow)" /> ⚡ 1-Click Alert All Contacts ({contacts.length})
        </button>
      )}

      {contacts.length === 0 ? (
        <div style={{ 
          background: "var(--bg-subtle)", 
          border: "1px dashed var(--border-color)", 
          borderRadius: "10px", 
          padding: "20px 14px", 
          textAlign: "center" 
        }}>
          <UserPlus size={24} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
          <p style={{ fontSize: "12px", fontWeight: "500", margin: "0 0 2px" }}>No Contacts Enrolled</p>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>Add family or guardians for alert dispatch</p>
          <button
            onClick={onOpenAddModal}
            className="custom-button"
            style={{ marginTop: "12px", fontSize: "11px", padding: "6px 12px" }}
          >
            <Plus size={12} /> Enroll First Contact
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {contacts.map(c => {
            const nickname = extractNickname(c.name, c.relation);
            const fullName = c.name.replace(/\s*\([^)]*\)/, "").trim() || c.name;
            return (
              <div 
                key={c.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  background: "var(--bg-subtle)", 
                  padding: "10px 12px", 
                  borderRadius: "10px", 
                  border: "1px solid var(--border-color)",
                  transition: "all 0.12s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ 
                    width: "30px", 
                    height: "30px", 
                    borderRadius: "8px", 
                    background: getAvatarColor(c.name), 
                    color: "white", 
                    fontSize: "12px", 
                    fontWeight: "700",
                    display: "flex", 
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: "600", fontSize: "13px", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                      {nickname}
                      <span style={{ 
                        fontSize: "9.5px", 
                        padding: "1px 5px", 
                        background: c.priority === "Primary" ? "rgba(255, 66, 100, 0.15)" : "rgba(59, 130, 246, 0.15)", 
                        color: c.priority === "Primary" ? "var(--system-red)" : "var(--system-blue)", 
                        borderRadius: "4px",
                        fontWeight: "600"
                      }}>
                        {c.priority}
                      </span>
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>
                      {fullName !== nickname ? `${fullName} • ` : ""}{c.phone}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {onTestCall && (
                    <button
                      onClick={() => onTestCall(nickname, c.priority === "Primary" ? "#FF4264" : "#3B82F6", `${fullName} • Mobile`)}
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "7px",
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "var(--system-green)"
                      }}
                      title={`Simulate Fake Call from ${nickname}`}
                    >
                      <Phone size={13} />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onDirectCall) {
                        onDirectCall(c);
                      } else {
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        if (isMobile) window.location.href = `tel:${c.phone}`;
                      }
                    }}
                    style={{
                      background: "rgba(59, 130, 246, 0.12)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "7px",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "var(--system-blue)"
                    }}
                    title={`Call: ${nickname} (${c.phone})`}
                  >
                    <PhoneCall size={13} />
                  </button>

                  <button
                    onClick={() => {
                      if (onSendSms) {
                        onSendSms(c);
                      } else {
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        if (isMobile) {
                          window.open(`sms:${c.phone}?body=${encodeURIComponent(`🚨 AEGIS EMERGENCY ALERT to ${nickname}: I require immediate assistance.`)}`, "_blank");
                        }
                      }
                    }}
                    style={{
                      background: "rgba(250, 204, 21, 0.12)",
                      border: "1px solid rgba(250, 204, 21, 0.3)",
                      borderRadius: "7px",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "var(--system-yellow)"
                    }}
                    title={`Send Emergency SMS to ${nickname}`}
                  >
                    <MessageSquare size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
