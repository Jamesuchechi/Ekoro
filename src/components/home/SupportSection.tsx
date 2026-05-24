"use client";

import React, { useState } from "react";
import { DollarSign, Coins, CheckCircle2, Loader2, Zap, Globe, Shield } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";

const PRESETS = ["3", "5", "10", "20"];

export default function SupportSection() {
  const { currentTrack } = usePlayerStore();
  const [tipAmount, setTipAmount] = useState("10");
  const [customTip, setCustomTip] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(customTip || tipAmount);
    if (isNaN(amt) || amt <= 0) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setCustomTip("");
      setMessage("");
      setTimeout(() => setSuccess(false), 5000);
    }, 1600);
  };

  const displayAmount = parseFloat(customTip || tipAmount);
  const artistShare = (displayAmount * 0.92).toFixed(2);

  return (
    <section
      style={{
        padding: "32px 40px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 40,
        borderBottom: "1px solid var(--ek-border)",
        background: "var(--ek-ink)",
      }}
    >
      {/* Left: Philosophy + stats */}
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--ek-gold)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Bandcamp philosophy
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 3vw, 40px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--ek-text-primary)",
            marginBottom: 16,
          }}
        >
          Support{" "}
          <em style={{ color: "var(--ek-gold)", fontStyle: "italic" }}>
            {currentTrack?.artist || "the artist"}
          </em>{" "}
          <br />
          the right way.
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--ek-text-secondary)",
            lineHeight: 1.7,
            maxWidth: 420,
            marginBottom: 32,
          }}
        >
          Streaming platforms pay{" "}
          <strong style={{ color: "var(--ek-text-primary)" }}>$0.003</strong> per stream.
          On Ekoro, every cent of your tip goes{" "}
          <strong style={{ color: "var(--ek-text-primary)" }}>directly</strong> to the artist&rsquo;s wallet — no label cuts, no quarterly delays, just music.
        </p>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {[
            { icon: Coins, label: "To artist", value: "92%", color: "var(--ek-gold)" },
            { icon: Globe, label: "Platform fee", value: "8%", color: "var(--ek-text-secondary)" },
            { icon: Shield, label: "Via Stripe", value: "Secure", color: "var(--ek-green)" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              style={{
                background: "var(--ek-surface)",
                border: "1px solid var(--ek-border)",
                borderRadius: 12,
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <Icon size={14} style={{ color, marginBottom: 6 }} />
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  color,
                  fontWeight: 400,
                  marginBottom: 2,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--ek-text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* What streaming pays comparison */}
        <div
          style={{
            background: "var(--ek-surface)",
            border: "1px solid var(--ek-border)",
            borderRadius: 12,
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ek-text-tertiary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Equivalent stream count
          </div>
          {[
            { platform: "Spotify", rate: 0.004, color: "#1DB954" },
            { platform: "Apple Music", rate: 0.008, color: "#fa243c" },
            { platform: "Ekoro tip ($5)", rate: 5, color: "var(--ek-gold)", isTip: true },
          ].map(({ platform, rate, color, isTip }) => {
            const streams = isTip ? "Direct" : `${Math.round(5 / rate).toLocaleString()} streams`;
            return (
              <div
                key={platform}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--ek-border)",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--ek-text-secondary)" }}>{platform}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: isTip ? color : "var(--ek-text-tertiary)",
                    fontWeight: isTip ? 500 : 400,
                  }}
                >
                  {isTip ? "= $4.60 to artist" : `≈ ${streams} = $5`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Tip form */}
      <div>
        <div
          style={{
            background: "var(--ek-surface)",
            border: "1px solid var(--ek-border-mid)",
            borderRadius: 20,
            padding: "28px 28px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background accent */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "radial-gradient(circle, var(--ek-gold-glow) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ek-text-primary)",
                  marginBottom: 4,
                }}
              >
                Support{" "}
                <span style={{ color: "var(--ek-gold)" }}>
                  {currentTrack?.artist || "this artist"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ek-text-secondary)" }}>
                Choose an amount or enter your own
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Preset amounts */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {PRESETS.map((val) => {
                  const isActive = tipAmount === val && !customTip;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setTipAmount(val); setCustomTip(""); }}
                      style={{
                        padding: "11px 0",
                        borderRadius: 10,
                        border: `1px solid ${isActive ? "var(--ek-gold)" : "var(--ek-border-mid)"}`,
                        background: isActive ? "var(--ek-gold-dim)" : "var(--ek-raised)",
                        color: isActive ? "var(--ek-gold)" : "var(--ek-text-secondary)",
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      ${val}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <DollarSign
                  size={14}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--ek-text-tertiary)",
                  }}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Custom amount"
                  value={customTip}
                  onChange={(e) => { setCustomTip(e.target.value); setTipAmount(""); }}
                  style={{
                    width: "100%",
                    background: "var(--ek-raised)",
                    border: "1px solid var(--ek-border-mid)",
                    borderRadius: 10,
                    padding: "11px 14px 11px 32px",
                    fontSize: 14,
                    color: "var(--ek-text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-body)",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--ek-gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--ek-border-mid)")}
                />
              </div>

              {/* Message */}
              <textarea
                rows={2}
                placeholder="Leave a message of support (shown on community board)…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--ek-raised)",
                  border: "1px solid var(--ek-border-mid)",
                  borderRadius: 10,
                  padding: "11px 14px",
                  fontSize: 13,
                  color: "var(--ek-text-primary)",
                  outline: "none",
                  fontFamily: "var(--font-body)",
                  resize: "none",
                  marginBottom: 12,
                  lineHeight: 1.5,
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--ek-gold)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--ek-border-mid)")}
              />

              {/* Artist share preview */}
              {!isNaN(displayAmount) && displayAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--ek-gold-glow)",
                    border: "1px solid var(--ek-gold)22",
                    borderRadius: 10,
                    marginBottom: 14,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "var(--ek-text-secondary)" }}>
                    Artist receives
                  </span>
                  <span style={{ color: "var(--ek-gold)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                    ${artistShare}
                  </span>
                </div>
              )}

              {/* Submit */}
              {success ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: "var(--ek-green-dim)",
                    border: "1px solid var(--ek-green)44",
                    borderRadius: 12,
                    padding: "13px",
                    color: "var(--ek-green)",
                    fontSize: 13,
                    fontWeight: 500,
                    animation: "fadeUp 0.4s ease",
                  }}
                >
                  <CheckCircle2 size={16} />
                  Support sent! It&rsquo;s live on the patron feed.
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: loading ? "var(--ek-raised)" : "var(--ek-gold)",
                    border: "none",
                    borderRadius: 12,
                    padding: "13px",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: loading ? "var(--ek-text-secondary)" : "#0f0f0f",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s ease",
                  }}
                >
                  {loading ? (
                    <Loader2 size={16} style={{ animation: "spinSlow 1s linear infinite" }} />
                  ) : (
                    <Coins size={16} />
                  )}
                  {loading ? "Processing…" : `Send $${isNaN(displayAmount) ? "—" : displayAmount.toFixed(2)} directly`}
                </button>
              )}
            </form>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 12,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ek-text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              <span>Powered by Stripe Identity</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--ek-green)" }}>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--ek-green)",
                    display: "block",
                    animation: "pulseDot 2s ease infinite",
                  }}
                />
                Gateway online
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
