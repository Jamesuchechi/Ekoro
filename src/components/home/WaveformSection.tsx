"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, MessageCircle } from "lucide-react";

interface WaveformComment {
  id: number;
  user: string;
  initials: string;
  text: string;
  timePercent: number;
  timestamp: string;
  color: string;
}

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  time: string;
  isMe?: boolean;
}

const INITIAL_COMMENTS: WaveformComment[] = [
  { id: 1, user: "Seyi V.", initials: "SV", text: "That intro sample is crazy! 🤯", timePercent: 12, timestamp: "0:25", color: "#5b8dee" },
  { id: 2, user: "Femi A.", initials: "FA", text: "Tems' vocals entering here — goosebumps every time.", timePercent: 36, timestamp: "1:15", color: "#c9a84c" },
  { id: 3, user: "Elena K.", initials: "EK", text: "Best bridge of 2026. That transition is flawless.", timePercent: 62, timestamp: "2:10", color: "#4caf7d" },
  { id: 4, user: "DJ Bass", initials: "DB", text: "This drop goes absolutely wild in the club 🔥", timePercent: 80, timestamp: "2:55", color: "#a855f7" },
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: 1, user: "BurnerFan", text: "Ekoro's direct payout model is a game-changer for indie artists.", time: "17:01" },
  { id: 2, user: "audiophile99", text: "Is anyone listening to the Wizkid FLAC master? The dynamic range is so wide.", time: "17:03" },
  { id: 3, user: "jessica_r", text: "Just tipped Rema. He's hosting a listening party on Ekoro tomorrow!", time: "17:04" },
  { id: 4, user: "NaijaBeats", text: "Anyone have demos to share? Love checking out the WIP section 👀", time: "17:05" },
];

export default function WaveformSection() {
  const [comments, setComments] = useState<WaveformComment[]>(INITIAL_COMMENTS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [newComment, setNewComment] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [commentPos, setCommentPos] = useState(45);
  const [activeComment, setActiveComment] = useState<number | null>(null);
  const [playhead, setPlayhead] = useState(38);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const waveBars = Array.from({ length: 80 }, (_, i) => {
    const h = Math.abs(Math.sin(i * 0.14) * 65) + Math.abs(Math.cos(i * 0.09) * 28) + 8;
    return Math.min(h, 95);
  });

  const handleWaveClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveRef.current) return;
    const rect = waveRef.current.getBoundingClientRect();
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    setPlayhead(pct);
    setCommentPos(pct);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const mins = Math.floor((commentPos / 100) * 3.5);
    const secs = Math.round(((commentPos / 100) * 3.5 * 60) % 60);
    const ts = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: "You",
        initials: "ME",
        text: newComment,
        timePercent: commentPos,
        timestamp: ts,
        color: "#c9a84c",
      },
    ]);
    setNewComment("");
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const now = new Date();
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: "You",
        text: chatInput,
        time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`,
        isMe: true,
      },
    ]);
    setChatInput("");
  };

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 0,
        borderBottom: "1px solid var(--ek-border)",
      }}
    >
      {/* Left: Waveform */}
      <div style={{ padding: "32px 40px", borderRight: "1px solid var(--ek-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(91,141,238,0.12)",
              border: "1px solid rgba(91,141,238,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageCircle size={13} style={{ color: "var(--ek-blue)" }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ek-text-tertiary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Interactive timeline
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                color: "var(--ek-text-primary)",
                lineHeight: 1,
              }}
            >
              Waveform soundboard
            </h2>
          </div>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "var(--ek-text-tertiary)",
              fontStyle: "italic",
            }}
          >
            Click the wave to pin a comment
          </span>
        </div>

        {/* Interactive waveform */}
        <div
          ref={waveRef}
          onClick={handleWaveClick}
          style={{
            position: "relative",
            height: 90,
            background: "var(--ek-surface)",
            border: "1px solid var(--ek-border)",
            borderRadius: 12,
            cursor: "crosshair",
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          {/* Wave bars */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5px",
              height: "100%",
              padding: "10px 8px",
            }}
          >
            {waveBars.map((h, i) => {
              const pct = (i / waveBars.length) * 100;
              const isPlayed = pct < playhead;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: 2,
                    height: `${h}%`,
                    background: isPlayed
                      ? "var(--ek-gold)"
                      : "var(--ek-border-mid)",
                    opacity: isPlayed ? 0.9 : 0.5,
                    transition: "background 0.1s ease",
                  }}
                />
              );
            })}
          </div>

          {/* Playhead */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${playhead}%`,
              width: 1.5,
              background: "var(--ek-gold)",
              opacity: 0.8,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--ek-gold)",
                position: "absolute",
                top: -4,
                left: -3.25,
              }}
            />
          </div>

          {/* Comment pins */}
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                position: "absolute",
                bottom: 6,
                left: `${c.timePercent}%`,
                transform: "translateX(-50%)",
              }}
              onMouseEnter={() => setActiveComment(c.id)}
              onMouseLeave={() => setActiveComment(null)}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: c.color + "33",
                  border: `1.5px solid ${c.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 7,
                  fontWeight: 500,
                  color: c.color,
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                  transform: activeComment === c.id ? "scale(1.3)" : "scale(1)",
                }}
              >
                {c.initials}
              </div>

              {activeComment === c.id && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 26,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--ek-ink)",
                    border: "1px solid var(--ek-border-mid)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    width: 200,
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: c.color,
                      }}
                    >
                      {c.user}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--ek-text-tertiary)",
                      }}
                    >
                      {c.timestamp}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--ek-text-secondary)",
                      lineHeight: 1.4,
                    }}
                  >
                    {c.text}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Timeline ticks */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--ek-text-muted)",
            marginBottom: 20,
            padding: "0 2px",
          }}
        >
          {["0:00", "0:45", "1:30", "2:15", "3:00", "3:30"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        {/* Comment input */}
        <form
          onSubmit={handleAddComment}
          style={{
            display: "flex",
            gap: 8,
            background: "var(--ek-surface)",
            border: "1px solid var(--ek-border-mid)",
            borderRadius: 12,
            padding: "4px 4px 4px 14px",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--ek-border-hi)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--ek-border-mid)")
          }
        >
          <input
            type="text"
            placeholder={`Drop a note at ${Math.floor((commentPos / 100) * 3.5)}:${Math.round(((commentPos / 100) * 3.5 * 60) % 60).toString().padStart(2, "0")}…`}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "var(--ek-text-primary)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 6px",
              borderLeft: "1px solid var(--ek-border)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ek-text-tertiary)",
              }}
            >
              pos: {commentPos}%
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={commentPos}
              onChange={(e) => setCommentPos(Number(e.target.value))}
              style={{
                width: 60,
                accentColor: "var(--ek-gold)",
                cursor: "pointer",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: "var(--ek-gold)",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 500,
              color: "#0f0f0f",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Send size={12} />
            Drop note
          </button>
        </form>

        {/* Comment list */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: c.color + "22",
                  border: `1px solid ${c.color}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  fontWeight: 500,
                  color: c.color,
                  flexShrink: 0,
                }}
              >
                {c.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ek-text-primary)" }}>
                    {c.user}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: c.color,
                      background: c.color + "18",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    @ {c.timestamp}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--ek-text-secondary)", lineHeight: 1.4 }}>
                  {c.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Community lounge chat */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div
          style={{
            padding: "32px 24px 16px",
            borderBottom: "1px solid var(--ek-border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(76,175,125,0.12)",
              border: "1px solid rgba(76,175,125,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageSquare size={13} style={{ color: "var(--ek-green)" }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ek-text-tertiary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {chatMessages.length} online
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                color: "var(--ek-text-primary)",
                lineHeight: 1,
              }}
            >
              Community lounge
            </h2>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.isMe ? "flex-end" : "flex-start",
              }}
            >
              {!msg.isMe && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ek-text-tertiary)",
                    marginBottom: 3,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {msg.user} · {msg.time}
                </div>
              )}
              <div
                style={{
                  background: msg.isMe ? "var(--ek-gold-dim)" : "var(--ek-surface)",
                  border: `1px solid ${msg.isMe ? "var(--ek-gold)22" : "var(--ek-border)"}`,
                  borderRadius: msg.isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "var(--ek-text-primary)",
                  maxWidth: "88%",
                  lineHeight: 1.45,
                }}
              >
                {msg.text}
              </div>
              {msg.isMe && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ek-text-muted)",
                    marginTop: 3,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {msg.time}
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={handleSendChat}
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--ek-border)",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Post a message…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{
              flex: 1,
              background: "var(--ek-surface)",
              border: "1px solid var(--ek-border-mid)",
              borderRadius: 99,
              padding: "8px 14px",
              fontSize: 13,
              color: "var(--ek-text-primary)",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--ek-border-hi)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--ek-border-mid)")}
          />
          <button
            type="submit"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--ek-green)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              flexShrink: 0,
              transition: "background 0.2s ease",
            }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </section>
  );
}
