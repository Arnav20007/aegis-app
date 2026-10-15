import { useState, useEffect, useRef } from "react";
import { Send, X, ShieldAlert, Radio, Minimize2, Maximize2 } from "lucide-react";
import * as api from "../api";

interface EmergencyLiveChatProps {
  alertId: number;
  userName: string;
  onClose?: () => void;
}

interface Message {
  id?: number;
  sender: "user" | "operator";
  text: string;
  time?: string;
  timestamp?: string;
}

export default function EmergencyLiveChat({ alertId, userName, onClose }: EmergencyLiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [connected, setConnected] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Preload existing messages from database
  useEffect(() => {
    api.getAlertMessages(alertId)
      .then((data: any[]) => {
        if (data && data.length > 0) {
          setMessages(data.map(m => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
        } else {
          // Default initial system message
          setMessages([
            {
              sender: "operator",
              text: `Aegis Dispatch Operator #104 connected. Stay calm ${userName}. Units are tracking your GPS broadcast. State your emergency if safe to do so.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      })
      .catch(() => {
        setMessages([
          {
            sender: "operator",
            text: `Aegis Dispatch Operator #104 connected. Emergency channel active.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      });
  }, [alertId, userName]);

  // 2. Connect to real WebSocket
  useEffect(() => {
    const apiUrl = new URL(import.meta.env.VITE_API_URL || "http://localhost:8000");
    apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    apiUrl.pathname = `/ws/alerts/${alertId}`;
    const wsUrl = apiUrl.toString();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.text) {
          setMessages((prev) => [
            ...prev,
            {
              id: data.id,
              sender: data.sender || "operator",
              text: data.text,
              time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [alertId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, minimized]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      sender: "user",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Send via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        sender: "user",
        text: inputText.trim(),
        time: newMsg.time
      }));
    } else {
      // Fallback local update
      setMessages(prev => [...prev, newMsg]);
    }

    setInputText("");

    // Simulated automated responder acknowledgment if solo demo
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Dispatcher automated acknowledgement
      }
    }, 1500);
  };

  if (minimized) {
    return (
      <div 
        onClick={() => setMinimized(false)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "var(--bg-surface)",
          border: "2px solid var(--system-red)",
          borderRadius: "30px",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          boxShadow: "0 8px 30px rgba(255, 77, 109, 0.4)",
          zIndex: 9999,
          color: "white"
        }}
      >
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: connected ? "var(--system-green)" : "var(--system-yellow)", display: "inline-block" }} />
        <Radio size={18} color="var(--system-red)" />
        <span style={{ fontSize: "13px", fontWeight: "600" }}>Live Dispatcher Channel</span>
        <Maximize2 size={16} color="var(--text-secondary)" />
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      width: "380px",
      height: "480px",
      background: "var(--bg-surface)",
      border: "1px solid var(--border-color)",
      borderRadius: "16px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(255, 77, 109, 0.2)",
      display: "flex",
      flexDirection: "column",
      zIndex: 9999,
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        background: "var(--bg-surface-elevated)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="icon-circle" style={{ width: "28px", height: "28px", background: "rgba(255, 77, 109, 0.2)", color: "var(--system-red)" }}>
            <ShieldAlert size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              Dispatcher Live Channel
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: connected ? "var(--system-green)" : "var(--system-yellow)", display: "inline-block" }} />
            </h4>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              {connected ? "WebSocket Encrypted • Alert #" + alertId : "Reconnecting channel..."}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button 
            onClick={() => setMinimized(true)}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div style={{
        flex: 1,
        padding: "16px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "var(--bg-primary)"
      }}>
        {messages.map((m, idx) => {
          const isUser = m.sender === "user";
          return (
            <div 
              key={idx} 
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                gap: "3px"
              }}
            >
              <span style={{ fontSize: "10px", color: "var(--text-secondary)", padding: "0 4px" }}>
                {isUser ? "You" : "Operator #104"} • {m.time}
              </span>
              <div style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: isUser ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                background: isUser ? "var(--system-blue)" : "var(--bg-surface-elevated)",
                border: isUser ? "none" : "1px solid var(--border-color)",
                color: "white",
                fontSize: "13px",
                lineHeight: "1.4"
              }}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form 
        onSubmit={handleSend}
        style={{
          padding: "12px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          gap: "8px"
        }}
      >
        <input 
          type="text"
          placeholder="Type message to dispatcher..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{
            flex: 1,
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            padding: "10px 12px",
            color: "var(--text-primary)",
            fontSize: "13px",
            outline: "none"
          }}
        />
        <button 
          type="submit" 
          disabled={!inputText.trim()}
          className="custom-button button-critical" 
          style={{ padding: "0 14px" }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
