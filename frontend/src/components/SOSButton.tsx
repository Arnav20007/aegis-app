import { useState, useRef, useEffect, useCallback } from "react";
import { AlertTriangle, XOctagon, CheckCircle, Volume2, VolumeX, ShieldAlert, PhoneCall } from "lucide-react";

interface SOSButtonProps {
  isActive: boolean;
  onTriggerSOS: () => void;
  onCancelSOS: () => void;
  onCallPolice?: () => void;
}

type SOSState = "idle" | "holding" | "confirming" | "active";

const HOLD_DURATION_MS  = 3000;
const CONFIRM_COUNTDOWN = 5;
const UPDATE_MS         = 50;

// ─── Audio helpers ───────────────────────────────────────────────────────────

function playCrispBeep(frequency = 600, duration = 0.12) {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx  = new AC();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close().catch(() => {}), duration * 1000 + 200);
  } catch {}
}

function startRealisticSiren(): { stop: () => void } | null {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    const ctx        = new AC();
    const osc1       = ctx.createOscillator();
    const osc2       = ctx.createOscillator();
    const filter     = ctx.createBiquadFilter();
    const masterGain = ctx.createGain();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    osc1.type = "sine";
    osc2.type = "triangle";
    masterGain.gain.setValueAtTime(0.3, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    let high = true;
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.setValueAtTime(440, ctx.currentTime);

    // ── Resume context first (critical for non-gesture triggers like voice / 1-click) ──
    const startOscillators = () => {
      const interval = window.setInterval(() => {
        if (ctx.state === "closed") { window.clearInterval(interval); return; }
        const t  = ctx.currentTime;
        const f1 = high ? 660 : 880;
        const f2 = high ? 330 : 440;
        osc1.frequency.exponentialRampToValueAtTime(f1, t + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(f2, t + 0.1);
        high = !high;
      }, 600);

      osc1.start();
      osc2.start();

      // Voice announcement
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance("Emergency SOS broadcasting. Authorities notified.");
          u.rate   = 0.95;
          u.pitch  = 1.0;
          u.volume = 0.9;
          window.speechSynthesis.speak(u);
        } catch {}
      }

      return interval;
    };

    let intervalId: number | null = null;

    // Resume audio context (handles both suspended and running states)
    ctx.resume().then(() => {
      intervalId = startOscillators();
    }).catch(() => {
      // Fallback: try to start anyway
      intervalId = startOscillators();
    });

    return {
      stop: () => {
        if (intervalId !== null) window.clearInterval(intervalId);
        if ("speechSynthesis" in window) { try { window.speechSynthesis.cancel(); } catch {} }
        try {
          if (ctx.state !== "closed") {
            masterGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            setTimeout(() => {
              try { osc1.stop(); } catch {}
              try { osc2.stop(); } catch {}
              ctx.close().catch(() => {});
            }, 120);
          }
        } catch {}
      }
    };
  } catch {
    return null;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SOSButton({ isActive, onTriggerSOS, onCancelSOS, onCallPolice }: SOSButtonProps) {
  const [sosState,        setSosState]        = useState<SOSState>(isActive ? "active" : "idle");
  const [holdProgress,    setHoldProgress]    = useState(0);
  const [confirmSecsLeft, setConfirmSecsLeft] = useState(CONFIRM_COUNTDOWN);
  const [sirenMuted,      setSirenMuted]      = useState(false);

  const holdRef      = useRef<number | null>(null);
  const confirmRef   = useRef<number | null>(null);
  const sirenRef     = useRef<{ stop: () => void } | null>(null);
  const sirenMutedRef = useRef(sirenMuted);
  sirenMutedRef.current = sirenMuted;

  // ── Reliable siren stopper ─────────────────────────────────────────────────
  const stopSiren = useCallback(() => {
    if (sirenRef.current) {
      sirenRef.current.stop();
      sirenRef.current = null;
    }
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  }, []);

  // ── Sync with parent isActive prop ────────────────────────────────────────
  // When isActive flips true externally (1-click / voice trigger), transition to active
  // AND start the siren so the acoustic alert always fires.
  useEffect(() => {
    if (isActive && sosState !== "active") {
      setSosState("active");
      // Cancel any lingering confirmation countdown
      if (confirmRef.current !== null) {
        window.clearInterval(confirmRef.current);
        confirmRef.current = null;
      }
      // Start siren using ref to get current muted state (avoids stale closure)
      if (!sirenRef.current && !sirenMutedRef.current) {
        sirenRef.current = startRealisticSiren();
      }
    } else if (!isActive && sosState === "active") {
      stopSiren();
      setSosState("idle");
      setHoldProgress(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopSiren();
      window.clearInterval(holdRef.current!);
      window.clearInterval(confirmRef.current!);
    };
  }, [stopSiren]);

  // ── Siren mute/unmute toggle ───────────────────────────────────────────────
  const toggleSiren = () => {
    if (sirenMuted) {
      // Unmute: restart siren only if SOS is still active
      setSirenMuted(false);
      if (sosState === "active") {
        sirenRef.current = startRealisticSiren();
      }
    } else {
      // Mute: stop siren audio but keep SOS active
      setSirenMuted(true);
      stopSiren();
    }
  };

  // ── Hold-to-arm ───────────────────────────────────────────────────────────
  const handleMouseDown = () => {
    if (sosState !== "idle") return;
    setSosState("holding");
    setHoldProgress(0);
    playCrispBeep(480, 0.08);
    let progress = 0;
    holdRef.current = window.setInterval(() => {
      progress += (UPDATE_MS / HOLD_DURATION_MS) * 100;
      if (progress >= 100) {
        window.clearInterval(holdRef.current!);
        setHoldProgress(100);
        playCrispBeep(780, 0.2);
        startConfirmation();
      } else {
        setHoldProgress(progress);
      }
    }, UPDATE_MS);
  };

  const handleMouseUpOrLeave = () => {
    if (sosState !== "holding") return;
    window.clearInterval(holdRef.current!);
    setSosState("idle");
    setHoldProgress(0);
  };

  // ── Confirm countdown ─────────────────────────────────────────────────────
  const startConfirmation = () => {
    setSosState("confirming");
    setConfirmSecsLeft(CONFIRM_COUNTDOWN);
    playCrispBeep(600, 0.15);
    let secs = CONFIRM_COUNTDOWN;
    confirmRef.current = window.setInterval(() => {
      secs -= 1;
      setConfirmSecsLeft(secs);
      if (secs > 0) {
        playCrispBeep(600 + (CONFIRM_COUNTDOWN - secs) * 60, 0.12);
      } else {
        window.clearInterval(confirmRef.current!);
        setSosState("active");
        if (!sirenMuted) {
          sirenRef.current = startRealisticSiren();
        }
        onTriggerSOS();
      }
    }, 1000);
  };

  const handleCancelConfirm = () => {
    window.clearInterval(confirmRef.current!);
    setSosState("idle");
    setHoldProgress(0);
    setConfirmSecsLeft(CONFIRM_COUNTDOWN);
    playCrispBeep(350, 0.12);
  };

  const handleSendNow = () => {
    window.clearInterval(confirmRef.current!);
    setSosState("active");
    if (!sirenMuted) {
      sirenRef.current = startRealisticSiren();
    }
    onTriggerSOS();
  };

  // ── CANCEL / DEACTIVATE — the main fix ────────────────────────────────────
  const handleCancelEmergency = () => {
    // 1. Stop all audio immediately and synchronously
    stopSiren();
    setSirenMuted(false);
    // 2. Reset local state immediately (don't wait for parent prop to flip)
    setSosState("idle");
    setHoldProgress(0);
    setConfirmSecsLeft(CONFIRM_COUNTDOWN);
    // 3. Notify parent (will flip isActive → false, which the useEffect handles gracefully)
    onCancelSOS();
  };

  // ─── ACTIVE STATE ──────────────────────────────────────────────────────────
  if (sosState === "active") {
    return (
      <div
        className="surface-card"
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          border: "2px solid var(--system-red)",
          background: "linear-gradient(180deg, rgba(255, 77, 109, 0.16) 0%, var(--bg-surface) 100%)",
          boxShadow: "0 8px 32px rgba(255, 77, 109, 0.25)",
          borderRadius: "16px",
          position: "relative",
          flexShrink: 0,
          minHeight: "fit-content"
        }}
      >
        {/* Pulsing beacon header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ position: "relative", display: "flex", width: "12px", height: "12px" }}>
              <span style={{
                animation: "beaconPing 1.5s cubic-bezier(0,0,0.2,1) infinite",
                position: "absolute", display: "inline-flex",
                height: "100%", width: "100%",
                borderRadius: "50%", background: "var(--system-red)", opacity: 0.75
              }} />
              <span style={{
                position: "relative", display: "inline-flex",
                borderRadius: "50%", height: "12px", width: "12px",
                background: "var(--system-red)"
              }} />
            </span>
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: "700", color: "var(--system-red)", letterSpacing: "0.5px", margin: 0 }}>
                DISTRESS BEACON ACTIVE
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Channel 402.1 • Responders Alerted</span>
            </div>
          </div>
          <div style={{
            padding: "4px 8px",
            background: "rgba(255,77,109,0.25)", border: "1px solid var(--system-red)",
            borderRadius: "6px", fontSize: "10px", fontWeight: "700", color: "var(--system-red)"
          }}>LIVE</div>
        </div>

        {/* Siren control banner */}
        <div style={{
          background: "var(--bg-subtle)", border: "1px solid var(--border-color)",
          borderRadius: "10px", padding: "12px 14px", marginBottom: "14px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: sirenMuted ? "rgba(255,255,255,0.06)" : "rgba(255,77,109,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: sirenMuted ? "var(--text-secondary)" : "var(--system-red)"
            }}>
              {sirenMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: "600", margin: 0 }}>
                {sirenMuted ? "Siren Muted" : "Acoustic Beacon"}
              </p>
              <p style={{ fontSize: "10px", color: "var(--text-secondary)", margin: 0 }}>
                {sirenMuted ? "Stealth mode active" : "Dual-tone harmonic audible"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSiren}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)",
              color: "var(--text-primary)", padding: "6px 12px",
              borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer"
            }}
          >
            {sirenMuted ? "🔊 Unmute" : "🔇 Silence"}
          </button>
        </div>

        {/* Dedicated Quick Call Police button */}
        {onCallPolice && (
          <button
            onClick={onCallPolice}
            style={{
              background: "linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)",
              color: "#FFFFFF",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "10px",
              boxShadow: "0 4px 14px rgba(29, 78, 216, 0.4)",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.0)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <PhoneCall size={16} /> CALL NEAREST POLICE (112)
          </button>
        )}

        {/* Deactivate button — prominent, solid red, impossible to miss */}
        <button
          onClick={handleCancelEmergency}
          style={{
            background: "linear-gradient(135deg, #FF4264 0%, #D92547 100%)",
            color: "#FFFFFF",
            border: "none",
            padding: "14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.15s ease",
            letterSpacing: "0.3px",
            boxShadow: "0 4px 16px rgba(255, 66, 100, 0.4)"
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.0)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          <XOctagon size={18} /> STOP SIREN &amp; DEACTIVATE
        </button>

        <style>{`
          @keyframes beaconPing {
            75%, 100% { transform: scale(2.2); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // ─── CONFIRMING STATE ──────────────────────────────────────────────────────
  if (sosState === "confirming") {
    return (
      <div
        className="surface-card"
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "24px 20px",
          border: "1px solid rgba(255,77,109,0.4)",
          background: "linear-gradient(180deg, rgba(255,77,109,0.08) 0%, var(--bg-surface) 100%)",
          borderRadius: "16px",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <AlertTriangle size={15} color="var(--system-red)" />
          <h2 style={{ fontSize: "14px", fontWeight: "700", color: "var(--system-red)", letterSpacing: "0.5px", margin: 0 }}>
            ARMING DISTRESS SIGNAL
          </h2>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "20px", textAlign: "center" }}>
          Broadcasting starts in {confirmSecsLeft}s. Tap abort if accidental.
        </p>

        <div style={{ position: "relative", width: "100px", height: "100px", marginBottom: "20px" }}>
          <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-color)" strokeWidth="5" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="var(--system-red)" strokeWidth="5"
              strokeDasharray="264"
              strokeDashoffset={264 - (264 * (confirmSecsLeft / CONFIRM_COUNTDOWN))}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px", fontWeight: "800", color: "var(--text-primary)"
          }}>
            {confirmSecsLeft}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
          <button
            onClick={handleCancelConfirm}
            style={{
              flex: 1, background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-color)", color: "var(--text-primary)",
              padding: "10px", borderRadius: "8px", fontWeight: "600", fontSize: "12px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}
          >
            <XOctagon size={14} /> Abort
          </button>
          <button
            onClick={handleSendNow}
            style={{
              flex: 1, background: "var(--system-red)", border: "none", color: "white",
              padding: "10px", borderRadius: "8px", fontWeight: "700", fontSize: "12px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}
          >
            Send Now
          </button>
        </div>
      </div>
    );
  }

  // ─── IDLE / HOLDING STATE ─────────────────────────────────────────────────
  const isHolding = sosState === "holding";
  return (
    <div
      className="surface-card"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "24px 20px", borderRadius: "16px",
        background: "linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-primary) 100%)",
        position: "relative",
        border: isHolding ? "1px solid rgba(255,77,109,0.5)" : "1px solid var(--border-color)",
        transition: "border 0.2s ease",
        flexShrink: 0
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <ShieldAlert size={16} color="var(--system-red)" />
        <h2 style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px", margin: 0 }}>
          EMERGENCY DISPATCH
        </h2>
      </div>
      <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "22px", textAlign: "center" }}>
        Press &amp; hold 3 seconds to broadcast coordinates
      </p>

      <div style={{ position: "relative", width: "136px", height: "136px", marginBottom: "22px" }}>
        <svg width="136" height="136" style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
          <circle cx="68" cy="68" r="62" fill="none" stroke="var(--border-color)" strokeWidth="5" />
          <circle
            cx="68" cy="68" r="62" fill="none"
            stroke="var(--system-red)" strokeWidth="5"
            strokeDasharray="390"
            strokeDashoffset={390 - (390 * holdProgress) / 100}
            strokeLinecap="round"
            style={{ transition: isHolding ? "stroke-dashoffset 0.05s linear" : "stroke-dashoffset 0.3s ease-out" }}
          />
        </svg>

        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUpOrLeave}
          style={{
            position: "absolute", inset: "10px",
            borderRadius: "50%",
            background: isHolding
              ? "radial-gradient(circle, rgba(255,77,109,0.3) 0%, rgba(255,77,109,0.1) 100%)"
              : "radial-gradient(circle, rgba(255,77,109,0.12) 0%, var(--bg-surface) 100%)",
            border: "1.5px solid rgba(255,77,109,0.5)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s ease",
            transform: isHolding ? "scale(0.95)" : "scale(1)",
            boxShadow: isHolding ? "0 0 25px rgba(255,77,109,0.5)" : "var(--shadow-sm)",
            userSelect: "none"
          }}
        >
          <span style={{ fontSize: "24px", fontWeight: "900", color: "var(--system-red)", letterSpacing: "1px" }}>SOS</span>
          <span style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-secondary)", marginTop: "2px" }}>
            {isHolding ? `${Math.round((HOLD_DURATION_MS * (100 - holdProgress)) / 10000) / 10}s` : "HOLD 3s"}
          </span>
        </button>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: "6px",
        background: "var(--bg-subtle)", padding: "6px 12px",
        borderRadius: "14px", border: "1px solid var(--border-color)"
      }}>
        <CheckCircle size={12} color="var(--system-green)" />
        <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "500" }}>
          False-Alarm Filter Active
        </span>
      </div>
    </div>
  );
}
