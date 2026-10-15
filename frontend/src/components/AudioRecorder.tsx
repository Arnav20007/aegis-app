import { useState, useRef, useEffect } from "react";
import { Mic, Square, Download, X, Play, Pause, AlertCircle, RotateCcw } from "lucide-react";

interface AudioRecorderProps {
  onClose: () => void;
}

export default function AudioRecorder({ onClose }: AudioRecorderProps) {
  const [phase, setPhase]     = useState<"requesting"|"recording"|"stopped"|"error">("requesting");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string|null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [playing, setPlaying] = useState(false);
  const [bars, setBars]       = useState<number[]>(Array(40).fill(4));

  const mrRef        = useRef<MediaRecorder|null>(null);
  const streamRef    = useRef<MediaStream|null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const timerRef     = useRef<number|null>(null);
  const audioRef     = useRef<HTMLAudioElement|null>(null);
  const animFrameRef = useRef<number|null>(null);
  const analyserRef  = useRef<AnalyserNode|null>(null);

  const startRecording = async () => {
    setPhase("requesting");
    setSeconds(0);
    setAudioUrl(null);
    setPlaying(false);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analysis for live responsive waveform
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Select supported MIME type
      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options = { mimeType: "audio/webm;codecs=opus" };
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          options = { mimeType: "audio/webm" };
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options = { mimeType: "audio/mp4" };
        }
      }

      const mr = new MediaRecorder(stream, options);
      mrRef.current = mr;

      mr.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const mime = mr.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
        ctx.close().catch(() => {});
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setBars(Array(40).fill(4));
        setPhase("stopped");
      };

      mr.start(100);
      setPhase("recording");

      // Count up timer
      timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000);

      // Sensitive live audio bars
      const draw = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        setBars(Array.from({ length: 40 }, (_, i) => {
          const val = data[Math.floor(i * data.length / 40)] || 0;
          return Math.max(4, Math.min(76, (val / 255) * 110));
        }));
        animFrameRef.current = requestAnimationFrame(draw);
      };
      draw();

    } catch (err: any) {
      setPhase("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Microphone permission denied. Click the lock/settings icon in your browser address bar to allow microphone.");
      } else if (err.name === "NotFoundError") {
        setErrorMsg("No microphone device found on this system.");
      } else {
        setErrorMsg(`Microphone error: ${err.message}`);
      }
    }
  };

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stop = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    mrRef.current?.stop();
  };

  const download = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `aegis-voice-note-${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.webm`;
    a.click();
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"380px", background:"var(--bg-surface)", border:"1px solid var(--border-color)", borderRadius:"24px", padding:"28px 24px 32px", display:"flex", flexDirection:"column", alignItems:"center", gap:"20px", boxShadow:"0 20px 60px rgba(0,0,0,0.8)" }}>

        {/* Header */}
        <div style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h2 style={{ fontSize:"16px", display:"flex", alignItems:"center", gap:"8px", margin:0 }}>
            {phase === "recording" && <span style={{ width:10, height:10, background:"var(--system-red)", borderRadius:"50%", display:"inline-block", animation:"recPulse 1s infinite" }} />}
            {phase === "recording" ? "Recording Voice..." : phase === "stopped" ? "Voice Note Saved" : "Voice Recorder"}
          </h2>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-secondary)" }}><X size={20} /></button>
        </div>

        {/* Error state */}
        {phase === "error" && (
          <div style={{ width:"100%", background:"rgba(255,77,109,0.1)", border:"1px solid rgba(255,77,109,0.3)", borderRadius:"12px", padding:"16px", display:"flex", gap:"12px" }}>
            <AlertCircle size={20} color="var(--system-red)" style={{ flexShrink:0, marginTop:2 }} />
            <p style={{ fontSize:"13px", color:"var(--text-primary)", lineHeight:"1.6", margin:0 }}>{errorMsg}</p>
          </div>
        )}

        {/* Waveform */}
        {phase !== "error" && (
          <div style={{ width:"100%", height:"80px", background:"var(--bg-primary)", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:"3px", padding:"0 12px", overflow:"hidden" }}>
            {bars.map((h, i) => (
              <div key={i} style={{ width:"4px", height:`${h}px`, borderRadius:"2px", background: phase === "recording" ? "var(--system-red)" : "var(--system-blue)", transition: phase === "recording" ? "height 0.06s ease" : "none" }} />
            ))}
          </div>
        )}

        {/* Timer */}
        {(phase === "recording" || phase === "stopped") && (
          <span style={{ fontSize:"48px", fontWeight:"800", fontVariantNumeric:"tabular-nums", color: phase === "recording" ? "var(--system-red)" : "var(--text-primary)", letterSpacing:"2px" }}>
            {fmt(seconds)}
          </span>
        )}

        {/* Requesting */}
        {phase === "requesting" && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"12px" }}>
            <Mic size={36} color="var(--text-secondary)" />
            <p style={{ fontSize:"13px", color:"var(--text-secondary)", margin:0 }}>Accessing microphone...</p>
          </div>
        )}

        {/* Stop button */}
        {phase === "recording" && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
            <button onClick={stop} style={{ width:"64px", height:"64px", borderRadius:"20px", background:"var(--system-red)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(255,77,109,0.5)" }}>
              <Square size={24} color="white" />
            </button>
            <span style={{ fontSize:"12px", color:"var(--text-secondary)" }}>Tap to stop</span>
          </div>
        )}

        {/* Playback + download + Record Again */}
        {phase === "stopped" && audioUrl && (
          <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:"12px" }}>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setPlaying(false)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={togglePlay} className="custom-button" style={{ flex:1, justifyContent:"center" }}>
                {playing ? <Pause size={16}/> : <Play size={16}/>} {playing ? "Pause" : "Listen Back"}
              </button>
              <button onClick={download} className="custom-button button-critical" style={{ flex:1, justifyContent:"center" }}>
                <Download size={16}/> Save Voice
              </button>
            </div>
            <button
              onClick={startRecording}
              className="custom-button"
              style={{ width:"100%", justifyContent:"center", background:"none", border:"1px solid var(--border-color)", color:"var(--text-secondary)", fontSize:"12px" }}
            >
              <RotateCcw size={14} /> Record Another Take
            </button>
          </div>
        )}

        {/* Error retry button */}
        {phase === "error" && (
          <button onClick={startRecording} className="custom-button button-critical" style={{ width:"100%", justifyContent:"center" }}>
            Retry Microphone Access
          </button>
        )}
      </div>

      <style>{`
        @keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
