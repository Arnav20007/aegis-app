import { useState, useRef, useEffect } from "react";
import { Camera, X, Download, RotateCcw, ZoomIn } from "lucide-react";

interface CameraCaptureProps {
  onClose: () => void;
}

export default function CameraCapture({ onClose }: CameraCaptureProps) {
  const [state, setState] = useState<"idle" | "live" | "captured" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flash, setFlash] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    // Stop any existing stream
    streamRef.current?.getTracks().forEach(t => t.stop());
    setState("idle");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setState("live");
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.name === "NotAllowedError" ? "Camera permission denied." : "Could not access camera.");
    }
  };

  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    if (facingMode === "user") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    const url = c.toDataURL("image/png");
    setPhotoUrl(url);
    streamRef.current?.getTracks().forEach(t => t.stop());
    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    setState("captured");
  };

  const downloadPhoto = () => {
    if (!photoUrl) return;
    const a = document.createElement("a");
    a.href = photoUrl;
    a.download = `aegis-photo-${new Date().toISOString().slice(0,19)}.png`;
    a.click();
  };

  const retake = () => {
    setPhotoUrl(null);
    startCamera(facingMode);
  };

  useEffect(() => {
    startCamera();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:99999, background:"#000", display:"flex", flexDirection:"column" }}>
      
      {/* Top bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:2, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", background:"linear-gradient(to bottom,rgba(0,0,0,0.7),transparent)" }}>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"white" }}><X size={28} /></button>
        <span style={{ color:"white", fontWeight:"600", fontSize:"16px" }}>
          {state === "captured" ? "Photo" : "Camera"}
        </span>
        {state === "live" && (
          <button onClick={flipCamera} style={{ background:"none", border:"none", cursor:"pointer", color:"white" }}><RotateCcw size={24} /></button>
        )}
        {state === "captured" && (
          <button onClick={() => {}} style={{ background:"none", border:"none", cursor:"pointer", color:"white" }}><ZoomIn size={24} /></button>
        )}
      </div>

      {/* Flash overlay */}
      {flash && <div style={{ position:"absolute", inset:0, background:"white", zIndex:3, opacity:0.8 }} />}

      {/* Live video */}
      {state === "live" && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width:"100%", height:"100%", objectFit:"cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
        />
      )}

      {/* Captured photo */}
      {state === "captured" && photoUrl && (
        <img src={photoUrl} alt="Captured" style={{ width:"100%", height:"100%", objectFit:"contain", background:"#000" }} />
      )}

      {/* Error state */}
      {state === "error" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", color:"white" }}>
          <Camera size={48} style={{ opacity:0.4 }} />
          <p style={{ fontSize:"16px", textAlign:"center", padding:"0 32px" }}>{errorMsg}</p>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display:"none" }} />

      {/* Bottom controls */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"32px 40px 48px", background:"linear-gradient(to top,rgba(0,0,0,0.8),transparent)", display:"flex", justifyContent:"space-around", alignItems:"center" }}>
        
        {state === "live" && (
          <>
            <div style={{ width:"48px" }} />
            {/* Shutter button */}
            <button onClick={takePhoto} style={{ width:"76px", height:"76px", borderRadius:"50%", background:"white", border:"5px solid rgba(255,255,255,0.3)", cursor:"pointer" }} />
            <div style={{ width:"48px" }} />
          </>
        )}

        {state === "captured" && (
          <>
            <button onClick={retake} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"12px", padding:"12px 24px", color:"white", fontSize:"15px", cursor:"pointer", fontWeight:"500" }}>
              Retake
            </button>
            <button onClick={downloadPhoto} style={{ background:"#0A84FF", border:"none", borderRadius:"12px", padding:"12px 24px", color:"white", fontSize:"15px", cursor:"pointer", fontWeight:"600", display:"flex", alignItems:"center", gap:"8px" }}>
              <Download size={18} /> Save Photo
            </button>
          </>
        )}

        {state === "error" && (
          <button onClick={() => startCamera()} style={{ background:"#0A84FF", border:"none", borderRadius:"12px", padding:"14px 32px", color:"white", fontSize:"15px", cursor:"pointer", fontWeight:"600" }}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
