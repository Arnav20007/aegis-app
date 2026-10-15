import { useState, useEffect, useRef } from "react";
import { PhoneOff, Phone, MicOff, Mic, Volume2, VolumeX, VideoOff } from "lucide-react";

interface FakeCallProps {
  callerName: string;
  callerInitials: string;
  callerColor: string;
  callerSubtitle?: string;
  audioContext?: AudioContext | null;
  onEnd: () => void;
}

type CallState = "ringing" | "active" | "ended";

// ── Realistic Ringtone via Web Audio API ───────────────────────────────────────
function createRingtone(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.45, ctx.currentTime);
  master.connect(ctx.destination);

  const scheduleRing = (startTime: number) => {
    try {
      // First tone (higher note)
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.type = "sine";
      o1.frequency.setValueAtTime(853, startTime);
      g1.gain.setValueAtTime(0, startTime);
      g1.gain.linearRampToValueAtTime(0.8, startTime + 0.04);
      g1.gain.setValueAtTime(0.8, startTime + 0.38);
      g1.gain.linearRampToValueAtTime(0, startTime + 0.42);
      o1.connect(g1); g1.connect(master);
      o1.start(startTime); o1.stop(startTime + 0.45);

      // Second tone (harmonic chime)
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = "sine";
      o2.frequency.setValueAtTime(960, startTime + 0.1);
      g2.gain.setValueAtTime(0, startTime + 0.1);
      g2.gain.linearRampToValueAtTime(0.8, startTime + 0.14);
      g2.gain.setValueAtTime(0.8, startTime + 0.48);
      g2.gain.linearRampToValueAtTime(0, startTime + 0.52);
      o2.connect(g2); g2.connect(master);
      o2.start(startTime + 0.1); o2.stop(startTime + 0.55);

      // Repeat second pulse after short gap
      const o3 = ctx.createOscillator();
      const g3 = ctx.createGain();
      o3.type = "sine";
      o3.frequency.setValueAtTime(853, startTime + 0.7);
      g3.gain.setValueAtTime(0, startTime + 0.7);
      g3.gain.linearRampToValueAtTime(0.8, startTime + 0.74);
      g3.gain.setValueAtTime(0.8, startTime + 1.08);
      g3.gain.linearRampToValueAtTime(0, startTime + 1.12);
      o3.connect(g3); g3.connect(master);
      o3.start(startTime + 0.7); o3.stop(startTime + 1.15);

      const o4 = ctx.createOscillator();
      const g4 = ctx.createGain();
      o4.type = "sine";
      o4.frequency.setValueAtTime(960, startTime + 0.8);
      g4.gain.setValueAtTime(0, startTime + 0.8);
      g4.gain.linearRampToValueAtTime(0.8, startTime + 0.84);
      g4.gain.setValueAtTime(0.8, startTime + 1.18);
      g4.gain.linearRampToValueAtTime(0, startTime + 1.22);
      o4.connect(g4); g4.connect(master);
      o4.start(startTime + 0.8); o4.stop(startTime + 1.25);
    } catch {}
  };

  scheduleRing(ctx.currentTime);
  const id = window.setInterval(() => {
    scheduleRing(ctx.currentTime);
  }, 2800);

  return id;
}

// ── Vibration ─────────────────────────────────────────────────────────────────
function startVibration() {
  if ("vibrate" in navigator) {
    const pattern = [400, 200, 400, 1800];
    const repeat = () => navigator.vibrate(pattern);
    repeat();
    return window.setInterval(repeat, 2800);
  }
  return null;
}

// ── Voice Simulation Dialogues ────────────────────────────────────────────────
const VOICE_LINES = [
  "Hey! Can you hear me? I'm waiting outside in the car right now.",
  "Where are you? Come outside immediately, we need to leave right now.",
  "I'm parked near the main entrance with my hazard lights on. Walk over to me now.",
  "Did you get my message? Pack your things and walk out, I'm right here."
];

export default function FakeCallOverlay({ callerName, callerInitials, callerColor, callerSubtitle, audioContext, onEnd }: FakeCallProps) {
  const [callState, setCallState] = useState<CallState>("ringing");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioCtxRef   = useRef<AudioContext | null>(null);
  const ringIdRef     = useRef<number | null>(null);
  const vibIdRef      = useRef<number | null>(null);
  const timerRef      = useRef<number | null>(null);
  const speechTimerRef = useRef<number | null>(null);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const stopRinging = () => {
    if (ringIdRef.current !== null) window.clearInterval(ringIdRef.current);
    if (vibIdRef.current !== null)  window.clearInterval(vibIdRef.current);
    try { navigator.vibrate?.(0); } catch {}
    try { audioCtxRef.current?.close().catch(() => {}); } catch {}
  };

  const startRingtone = () => {
    if (ringIdRef.current !== null) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioContext ?? (AudioCtx ? new AudioCtx() : null);
      if (ctx) {
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") {
          ctx.resume().then(() => {
            ringIdRef.current = createRingtone(ctx);
          }).catch(() => {});
        } else {
          ringIdRef.current = createRingtone(ctx);
        }
      }
    } catch {}
  };

  // Start ringing on mount
  useEffect(() => {
    startRingtone();
    vibIdRef.current = startVibration();
    return () => {
      stopRinging();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (speechTimerRef.current) window.clearInterval(speechTimerRef.current);
    };
  }, []);

  // Speak a line using Text-to-Speech
  const speakLine = (text: string) => {
    if (!("speechSynthesis" in window) || muted) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.volume = speaker ? 1.0 : 0.4;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend   = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Handle Answer
  const handleAnswer = () => {
    stopRinging();
    setCallState("active");

    // Speak initial line immediately
    setTimeout(() => {
      speakLine(VOICE_LINES[0]);
    }, 400);

    // Speak subsequent lines every 5 seconds to simulate conversation
    let lineIdx = 1;
    speechTimerRef.current = window.setInterval(() => {
      if (lineIdx < VOICE_LINES.length) {
        setCurrentLineIndex(lineIdx);
        speakLine(VOICE_LINES[lineIdx]);
        lineIdx += 1;
      }
    }, 5500);
  };

  // Active call duration timer
  useEffect(() => {
    if (callState !== "active") return;
    timerRef.current = window.setInterval(() => setDuration(d => d + 1), 1000);
    return () => window.clearInterval(timerRef.current!);
  }, [callState]);

  const handleDecline = () => {
    stopRinging();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setCallState("ended");
    setTimeout(onEnd, 1000);
  };

  const handleHangUp = () => {
    window.clearInterval(timerRef.current!);
    if (speechTimerRef.current) window.clearInterval(speechTimerRef.current);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setCallState("ended");
    setTimeout(onEnd, 1000);
  };

  const toggleMute = () => {
    if (!muted) {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setMuted(!muted);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─── ENDED ─────────────────────────────────────────────────────────────────
  if (callState === "ended") {
    return (
      <div style={overlay}>
        <div style={phoneScreen("#1a1a1a")}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", textAlign: "center", fontWeight: "600" }}>Call Ended</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", marginTop: "8px" }}>{fmt(duration)}</p>
        </div>
      </div>
    );
  }

  // ─── RINGING SCREEN ────────────────────────────────────────────────────────
  if (callState === "ringing") {
    return (
      <div style={overlay}>
        <div style={phoneScreen("linear-gradient(180deg,#1C1C1E 0%,#2C2C2E 100%)")}>

          {/* Status bar */}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"0 28px", marginBottom:"12px" }}>
            <span style={statusText}>{timeStr}</span>
            <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
              <span style={statusText}>5G</span>
              <span style={statusText}>🔋 98%</span>
            </div>
          </div>

          <p style={{ textAlign:"center", color:"rgba(255,255,255,0.6)", fontSize:"14px", marginBottom:"4px" }}>
            Incoming Audio Call...
          </p>

          <h1 style={{ textAlign:"center", color:"#fff", fontSize:"34px", fontWeight:"700", marginBottom:"4px" }}>
            {callerName}
          </h1>
          <p style={{ textAlign:"center", color:"rgba(255,255,255,0.6)", fontSize:"13px", marginBottom:"36px" }}>
            {callerSubtitle || "Aegis Emergency Responder"}
          </p>

          {/* Avatar with animated rings */}
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", marginBottom:"auto", position:"relative" }}>
            <div style={{ width:128, height:128, borderRadius:"50%", background:callerColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"46px", fontWeight:"700", color:"#fff", boxShadow:`0 0 40px ${callerColor}88`, position:"relative", zIndex:2 }}>
              {callerInitials}
            </div>
            <div style={{ position:"absolute", width:164, height:164, borderRadius:"50%", border:`2px solid ${callerColor}`, opacity:0.4, animation:"fakeRipple 1.8s infinite ease-out" }} />
            <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", border:`1px solid ${callerColor}`, opacity:0.2, animation:"fakeRipple 1.8s infinite ease-out 0.5s" }} />
          </div>

          {/* Bottom Call Controls: Decline and Accept */}
          <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center", padding:"0 24px 44px" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
              <button
                onClick={handleDecline}
                style={{ width:72, height:72, borderRadius:"50%", background:"#FF3B30", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(255,59,48,0.5)" }}
              >
                <PhoneOff size={32} color="#fff" />
              </button>
              <span style={{ color:"rgba(255,255,255,0.7)", fontSize:"13px", fontWeight:"500" }}>Decline</span>
            </div>

            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
              <button
                onClick={handleAnswer}
                style={{ width:72, height:72, borderRadius:"50%", background:"#34C759", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(52,199,89,0.5)", animation:"answerBounce 1s infinite" }}
              >
                <Phone size={32} color="#fff" />
              </button>
              <span style={{ color:"rgba(255,255,255,0.7)", fontSize:"13px", fontWeight:"500" }}>Accept & Listen</span>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fakeRipple {
            0% { transform: scale(0.85); opacity: 0.6; }
            100% { transform: scale(1.35); opacity: 0; }
          }
          @keyframes answerBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
        `}</style>
      </div>
    );
  }

  // ─── ACTIVE CALL SCREEN (WITH VOICE SPEAKING) ──────────────────────────────
  return (
    <div style={overlay}>
      <div style={phoneScreen("#1C1C1E")}>

        {/* Status bar */}
        <div style={{ display:"flex", justifyContent:"space-between", padding:"0 28px", marginBottom:"12px" }}>
          <span style={statusText}>{timeStr}</span>
          <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
            <span style={statusText}>5G</span>
            <span style={statusText}>🔋 98%</span>
          </div>
        </div>

        {/* Caller Info */}
        <h1 style={{ textAlign:"center", color:"#fff", fontSize:"30px", fontWeight:"700", marginBottom:"4px" }}>
          {callerName}
        </h1>
        <p style={{ textAlign:"center", color:"#34C759", fontSize:"14px", fontWeight:"600", marginBottom:"16px", fontVariantNumeric:"tabular-nums" }}>
          {fmt(duration)} {callerSubtitle ? `• ${callerSubtitle}` : ""}
        </p>

        {/* Live Speaking Simulation Banner */}
        <div style={{ margin:"0 24px 24px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"16px", padding:"14px 18px", display:"flex", flexDirection:"column", gap:"8px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:"12px", color:"#34C759", fontWeight:"600", display:"flex", alignItems:"center", gap:"6px" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background: isSpeaking ? "#34C759" : "#FACC15", display:"inline-block", animation: isSpeaking ? "pulse 0.8s infinite" : "none" }} />
              {isSpeaking ? "Caller Speaking on Speaker..." : "Caller on the line"}
            </span>
            <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)" }}>Audio Online</span>
          </div>
          <p style={{ fontSize:"13px", color:"#fff", fontStyle:"italic", lineHeight:"1.4" }}>
            "{VOICE_LINES[currentLineIndex]}"
          </p>
          <button
            onClick={() => speakLine(VOICE_LINES[currentLineIndex])}
            style={{ alignSelf:"flex-end", background:"none", border:"none", color:"#3B82F6", fontSize:"11px", cursor:"pointer", textDecoration:"underline" }}
          >
            Replay voice line
          </button>
        </div>

        {/* Avatar */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:"auto" }}>
          <div style={{ width:100, height:100, borderRadius:"50%", background:callerColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"36px", fontWeight:"700", color:"#fff", border: isSpeaking ? "3px solid #34C759" : "3px solid transparent", transition:"border 0.3s" }}>
            {callerInitials}
          </div>
        </div>

        {/* 6-Button In-Call Control Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"20px", padding:"0 28px", marginBottom:"36px" }}>
          <button onClick={toggleMute} style={callBtn(muted)}>
            {muted ? <MicOff size={24} color="#fff"/> : <Mic size={24} color="#fff"/>}
            <span style={btnLabel}>{muted ? "Muted" : "Mute"}</span>
          </button>

          <button onClick={() => {}} style={callBtn(false)}>
            <VideoOff size={24} color="#fff"/>
            <span style={btnLabel}>FaceTime</span>
          </button>

          <button onClick={() => setSpeaker(!speaker)} style={callBtn(speaker)}>
            {speaker ? <Volume2 size={24} color="#fff"/> : <VolumeX size={24} color="#fff"/>}
            <span style={btnLabel}>Speaker</span>
          </button>
        </div>

        {/* End Call Button */}
        <div style={{ display:"flex", justifyContent:"center", paddingBottom:"44px" }}>
          <button
            onClick={handleHangUp}
            style={{ width:72, height:72, borderRadius:"50%", background:"#FF3B30", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(255,59,48,0.5)" }}
          >
            <PhoneOff size={32} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 99999,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(12px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const phoneScreen = (bg: string): React.CSSProperties => ({
  width: "360px",
  height: "700px",
  background: bg,
  borderRadius: "44px",
  border: "4px solid #3A3A3C",
  boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
  display: "flex",
  flexDirection: "column",
  paddingTop: "20px",
  overflow: "hidden",
  userSelect: "none",
});

const statusText: React.CSSProperties = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "12px",
  fontWeight: "600",
};

const callBtn = (active: boolean): React.CSSProperties => ({
  background: active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)",
  border: "none",
  borderRadius: "50%",
  width: "60px",
  height: "60px",
  margin: "0 auto",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  position: "relative",
});

const btnLabel: React.CSSProperties = {
  position: "absolute",
  bottom: "-20px",
  color: "rgba(255,255,255,0.7)",
  fontSize: "11px",
  whiteSpace: "nowrap",
};
