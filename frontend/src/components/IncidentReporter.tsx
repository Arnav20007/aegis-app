import React, { useState } from "react";
import { Send } from "lucide-react";

interface IncidentReporterProps {
  userLocation: { x: number; y: number };
  hazards: any[];
  onReportHazard: (hazard: any) => void;
}

export default function IncidentReporter({ userLocation, hazards, onReportHazard }: IncidentReporterProps) {
  const [category, setCategory] = useState("suspicious_activity");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReportHazard({
      category,
      description,
      x: userLocation.x,
      y: userLocation.y,
      timestamp: new Date().toISOString()
    });
    setDescription("");
  };

  return (
    <div className="surface-card">
      <h3 style={{ marginBottom: "16px" }}>Report Hazard</h3>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        <select 
          className="custom-input"
          value={category} 
          onChange={e => setCategory(e.target.value)}
          style={{ appearance: "none" }}
        >
          <option value="suspicious_activity">Suspicious Activity</option>
          <option value="poor_lighting">Poor Lighting</option>
          <option value="no_cellular">No Signal</option>
          <option value="harassment">Harassment</option>
        </select>
        
        <textarea 
          placeholder="Details (optional)" 
          className="custom-input"
          style={{ resize: "none", height: "60px" }}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        
        <button type="submit" className="custom-button" style={{ background: "rgba(255, 204, 0, 0.2)", color: "var(--system-yellow)", justifyContent: "center" }}>
          <Send size={16} /> Mark Location
        </button>
      </form>

      {hazards.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
          <span className="text-caption" style={{ color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Recent Reports</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {hazards.slice(-2).reverse().map((h, i) => (
              <div key={i} style={{ padding: "8px 12px", background: "var(--bg-surface-elevated)", borderRadius: "8px", borderLeft: "3px solid var(--system-yellow)" }}>
                <p className="text-small" style={{ textTransform: "capitalize" }}>{h.category.replace("_", " ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
