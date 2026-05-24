"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Upload, Music, Image as ImageIcon, CheckCircle, AlertCircle, Loader, DollarSign, Clock, Layers, Sparkles } from "lucide-react";

export default function UploadPage() {
  // Form values
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("Afrobeats");
  const [mood, setMood] = useState("Chill");
  const [bpm, setBpm] = useState("");
  const [isDownloadable, setIsDownloadable] = useState(true);
  const [downloadType, setDownloadType] = useState("free");
  const [downloadPrice, setDownloadPrice] = useState("0.99");

  // Step state: "form" | "uploading" | "processing" | "success"
  const [step, setStep] = useState<"form" | "uploading" | "processing" | "success">("form");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<"processing" | "published" | "failed">("processing");
  const [publishedTrack, setPublishedTrack] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Artist uploaded tracks
  const [artistTracks, setArtistTracks] = useState<any[]>([]);
  const [isTracksLoading, setIsTracksLoading] = useState(true);

  // Refs
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchArtistTracks = async () => {
    try {
      setIsTracksLoading(true);
      const res = await fetch("/api/users/me/tracks");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tracks)) {
          setArtistTracks(data.tracks);
        }
      }
    } catch (err) {
      console.error("Failed to fetch artist tracks:", err);
    } finally {
      setIsTracksLoading(false);
    }
  };

  useEffect(() => {
    fetchArtistTracks();
  }, []);

  // Polling for transcoding status
  useEffect(() => {
    if (step !== "processing" || !trackId) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/tracks/${trackId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "published") {
            setProcessingStatus("published");
            setPublishedTrack(data);
            setStep("success");
            clearInterval(intervalId);
            fetchArtistTracks(); // refresh list
          } else if (data.status === "failed") {
            setProcessingStatus("failed");
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.error("Error polling track status:", err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [step, trackId]);

  const handleAudioChange = (file: File) => {
    const allowedExts = [".mp3", ".wav", ".flac", ".aac", ".m4a"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExts.includes(ext)) {
      alert("Invalid audio format. Please upload MP3, WAV, FLAC, or AAC.");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      alert("Audio file exceeds maximum size limit (200MB).");
      return;
    }
    setAudioFile(file);
    if (!title) {
      // Auto-populate title from file name (sans extension)
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf("."));
      setTitle(nameWithoutExt.replace(/[-_]/g, " "));
    }
  };

  const handleCoverChange = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid image format. Please upload JPG, PNG, or WEBP.");
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAudioChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      alert("Please select an audio file first.");
      return;
    }
    if (!title.trim()) {
      alert("Please provide a track title.");
      return;
    }

    setError(null);
    setStep("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("audio", audioFile);
    if (coverFile) {
      formData.append("cover", coverFile);
    }
    formData.append("title", title);
    formData.append("description", description);
    formData.append("genre", genre);
    formData.append("mood", mood);
    if (bpm) {
      formData.append("bpm", bpm);
    }
    formData.append("isDownloadable", isDownloadable ? "true" : "false");
    formData.append("downloadType", downloadType);
    if (isDownloadable && downloadType === "paid") {
      formData.append("downloadPrice", downloadPrice);
    }

    // Use XMLHttpRequest to track progress
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/tracks", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 202) {
        try {
          const res = JSON.parse(xhr.responseText);
          setTrackId(res.trackId);
          setStep("processing");
          setProcessingStatus("processing");
        } catch (err) {
          setError("Failed to parse server response.");
          setStep("form");
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          setError(res.error || "Upload failed");
        } catch (err) {
          setError("An error occurred during upload.");
        }
        setStep("form");
      }
    };

    xhr.onerror = () => {
      setError("Network connection issue. Upload failed.");
      setStep("form");
    };

    xhr.send(formData);
  };

  const resetForm = () => {
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    setTitle("");
    setDescription("");
    setGenre("Afrobeats");
    setMood("Chill");
    setBpm("");
    setIsDownloadable(true);
    setDownloadType("free");
    setDownloadPrice("0.99");
    setStep("form");
    setTrackId(null);
    setPublishedTrack(null);
    setError(null);
  };

  return (
    <div
      style={{
        background: "var(--ek-void)",
        minHeight: "100%",
        padding: "40px",
        color: "var(--ek-text-primary)",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500 }}>
            Creator Studio
          </h1>
          <p style={{ fontSize: 14, color: "var(--ek-text-secondary)", marginTop: 4 }}>
            Upload and manage your audio catalogs
          </p>
        </div>

        {/* Outer Split Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, alignItems: "start" }}>
          
          {/* Main Area: Upload Wizard */}
          <div
            style={{
              background: "var(--ek-raised)",
              border: "1px solid var(--ek-border)",
              borderRadius: 24,
              padding: 32,
            }}
          >
            {/* STEP 1: Upload Form */}
            {step === "form" && (
              <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                
                {/* Drag and Drop Audio area */}
                {!audioFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleAudioDrop}
                    onClick={() => audioInputRef.current?.click()}
                    style={{
                      border: "2px dashed var(--ek-border-mid)",
                      borderRadius: 16,
                      padding: "48px 24px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "rgba(255,255,255,0.01)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ek-gold)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--ek-border-mid)")}
                  >
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept=".mp3,.wav,.flac,.aac,.m4a"
                      style={{ display: "none" }}
                      onChange={(e) => e.target.files?.[0] && handleAudioChange(e.target.files[0])}
                    />
                    <Upload size={32} style={{ color: "var(--ek-text-secondary)", margin: "0 auto 16px" }} />
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                      Drag & Drop Audio File
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--ek-text-tertiary)" }}>
                      WAV, FLAC, MP3, or AAC up to 200MB
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "var(--ek-surface)",
                      border: "1px solid var(--ek-border-mid)",
                      borderRadius: 16,
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Music size={20} style={{ color: "var(--ek-gold)" }} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {audioFile.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ek-text-tertiary)" }}>
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAudioFile(null)}
                      style={{
                        fontSize: 12,
                        color: "var(--ek-text-secondary)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Split Metadata/Cover section */}
                <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 24 }}>
                  
                  {/* Artwork Upload preview */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ek-text-secondary)", marginBottom: 8 }}>
                      Cover Art
                    </label>
                    <div
                      onClick={() => coverInputRef.current?.click()}
                      style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        borderRadius: 12,
                        border: "1px solid var(--ek-border-mid)",
                        background: "var(--ek-surface)",
                        cursor: "pointer",
                        overflow: "hidden",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: "none" }}
                        onChange={(e) => e.target.files?.[0] && handleCoverChange(e.target.files[0])}
                      />
                      {coverPreview ? (
                        <Image
                          src={coverPreview}
                          alt="Cover preview"
                          fill
                          unoptimized
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <>
                          <ImageIcon size={20} style={{ color: "var(--ek-text-tertiary)", marginBottom: 6 }} />
                          <span style={{ fontSize: 10, color: "var(--ek-text-tertiary)" }}>Upload JPG/PNG</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ek-text-secondary)", marginBottom: 6 }}>
                        Track Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter track name"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{
                          width: "100%",
                          background: "var(--ek-surface)",
                          border: "1px solid var(--ek-border-mid)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "var(--ek-text-primary)",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ek-text-secondary)", marginBottom: 6 }}>
                          Genre
                        </label>
                        <select
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          style={{
                            width: "100%",
                            background: "var(--ek-surface)",
                            border: "1px solid var(--ek-border-mid)",
                            borderRadius: 8,
                            padding: "10px 12px",
                            fontSize: 13,
                            color: "var(--ek-text-primary)",
                            outline: "none",
                          }}
                        >
                          <option>Afrobeats</option>
                          <option>Alternative</option>
                          <option>Hip Hop</option>
                          <option>R&B</option>
                          <option>Amapiano</option>
                          <option>Highlife</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ek-text-secondary)", marginBottom: 6 }}>
                          Mood
                        </label>
                        <select
                          value={mood}
                          onChange={(e) => setMood(e.target.value)}
                          style={{
                            width: "100%",
                            background: "var(--ek-surface)",
                            border: "1px solid var(--ek-border-mid)",
                            borderRadius: 8,
                            padding: "10px 12px",
                            fontSize: 13,
                            color: "var(--ek-text-primary)",
                            outline: "none",
                          }}
                        >
                          <option>Chill</option>
                          <option>Hype</option>
                          <option>Moody</option>
                          <option>Romantic</option>
                          <option>High Energy</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Additional Settings */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, borderTop: "1px solid var(--ek-border-dim)", paddingTop: 20 }}>
                  
                  {/* Description & BPM */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ek-text-secondary)", marginBottom: 6 }}>
                        Description
                      </label>
                      <textarea
                        placeholder="Write something about this track..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        style={{
                          width: "100%",
                          background: "var(--ek-surface)",
                          border: "1px solid var(--ek-border-mid)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "var(--ek-text-primary)",
                          outline: "none",
                          resize: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ek-text-secondary)", marginBottom: 6 }}>
                        BPM (Beats Per Minute)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 120"
                        value={bpm}
                        onChange={(e) => setBpm(e.target.value)}
                        style={{
                          width: "100%",
                          background: "var(--ek-surface)",
                          border: "1px solid var(--ek-border-mid)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "var(--ek-text-primary)",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* Download Settings */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 40 }}>
                      <input
                        type="checkbox"
                        id="isDownloadable"
                        checked={isDownloadable}
                        onChange={(e) => setIsDownloadable(e.target.checked)}
                        style={{
                          width: 16,
                          height: 16,
                          accentColor: "var(--ek-gold)",
                          cursor: "pointer",
                        }}
                      />
                      <label htmlFor="isDownloadable" style={{ fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                        Allow listeners to download raw file
                      </label>
                    </div>

                    {isDownloadable && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ek-text-secondary)", marginBottom: 6 }}>
                            Download Tier
                          </label>
                          <select
                            value={downloadType}
                            onChange={(e) => setDownloadType(e.target.value)}
                            style={{
                              width: "100%",
                              background: "var(--ek-surface)",
                              border: "1px solid var(--ek-border-mid)",
                              borderRadius: 8,
                              padding: "10px 12px",
                              fontSize: 13,
                              color: "var(--ek-text-primary)",
                              outline: "none",
                            }}
                          >
                            <option value="free">Free Download</option>
                            <option value="paid">Paid Download</option>
                            <option value="premium-only">Premium Subscriber Only</option>
                          </select>
                        </div>

                        {downloadType === "paid" && (
                          <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ek-text-secondary)", marginBottom: 6 }}>
                              Price (USD)
                            </label>
                            <div style={{ position: "relative" }}>
                              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ek-text-secondary)" }}>
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0.00"
                                value={downloadPrice}
                                onChange={(e) => setDownloadPrice(e.target.value)}
                                style={{
                                  width: "100%",
                                  background: "var(--ek-surface)",
                                  border: "1px solid var(--ek-border-mid)",
                                  borderRadius: 8,
                                  padding: "10px 12px 10px 28px",
                                  fontSize: 13,
                                  color: "var(--ek-text-primary)",
                                  outline: "none",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {error && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: 8,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      color: "#ef4444",
                    }}
                  >
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!audioFile || !title.trim()}
                  style={{
                    background: audioFile && title.trim() ? "var(--ek-gold)" : "var(--ek-surface)",
                    color: audioFile && title.trim() ? "#0f0f0f" : "var(--ek-text-muted)",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "14px 28px",
                    borderRadius: 99,
                    border: "none",
                    cursor: audioFile && title.trim() ? "pointer" : "default",
                    transition: "all 0.2s ease",
                    marginTop: 12,
                  }}
                >
                  Publish Track
                </button>

              </form>
            )}

            {/* STEP 2: Uploading Progress */}
            {step === "uploading" && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Upload size={48} style={{ color: "var(--ek-gold)", margin: "0 auto 24px", animation: "bounce 2s infinite" }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                  Uploading Files
                </h3>
                <p style={{ fontSize: 13, color: "var(--ek-text-secondary)", marginBottom: 32 }}>
                  Transferring your high-quality files securely...
                </p>

                {/* Progress bar */}
                <div style={{ maxWidth: 400, margin: "0 auto" }}>
                  <div
                    style={{
                      height: 8,
                      background: "var(--ek-surface)",
                      borderRadius: 99,
                      overflow: "hidden",
                      border: "1px solid var(--ek-border-dim)",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${uploadProgress}%`,
                        background: "var(--ek-gold)",
                        transition: "width 0.1s ease",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--ek-text-secondary)" }}>
                    <span>Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Background Transcoding Poller */}
            {step === "processing" && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                {processingStatus === "processing" ? (
                  <>
                    <div style={{ display: "inline-flex", padding: 20, background: "rgba(201,168,76,0.1)", borderRadius: "50%", marginBottom: 24, border: "1px solid rgba(201,168,76,0.2)" }}>
                      <Loader size={32} style={{ color: "var(--ek-gold)", animation: "spin 2s linear infinite" }} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                      Processing Track
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--ek-text-secondary)", lineHeight: 1.6, maxWidth: 440, margin: "0 auto 24px" }}>
                      Your track is being processed. We are transcoding to standard HLS streaming chunks, MP3 codecs, and compiling track data.
                    </p>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ek-text-tertiary)" }}>
                      This usually takes less than a minute. You can safely stay on this page.
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle size={48} style={{ color: "#ef4444", margin: "0 auto 24px" }} />
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                      Transcoding Failed
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--ek-text-secondary)", marginBottom: 32 }}>
                      The system failed to transcode your audio file. Please verify it is a valid audio format and try again.
                    </p>
                    <button
                      onClick={resetForm}
                      style={{
                        background: "var(--ek-surface)",
                        border: "1px solid var(--ek-border-mid)",
                        borderRadius: 99,
                        padding: "10px 24px",
                        fontSize: 13,
                        color: "var(--ek-text-primary)",
                        cursor: "pointer",
                      }}
                    >
                      Go Back
                    </button>
                  </>
                )}
              </div>
            )}

            {/* STEP 4: Success Screen */}
            {step === "success" && publishedTrack && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <CheckCircle size={48} style={{ color: "var(--ek-emerald)", margin: "0 auto 24px" }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  Publish Successful!
                </h3>
                <p style={{ fontSize: 13, color: "var(--ek-text-secondary)", marginBottom: 32 }}>
                  Your track is live and streaming in high-fidelity HLS audio.
                </p>

                {/* Preview Mini Card */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: "var(--ek-surface)",
                    border: "1px solid var(--ek-border-mid)",
                    borderRadius: 16,
                    padding: 16,
                    textAlign: "left",
                    maxWidth: 400,
                    margin: "0 auto 32px",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      overflow: "hidden",
                      position: "relative",
                      background: "var(--ek-raised)",
                    }}
                  >
                    {publishedTrack.coverArtUrl ? (
                      <Image
                        src={publishedTrack.coverArtUrl.startsWith("http") || publishedTrack.coverArtUrl.startsWith("/") ? publishedTrack.coverArtUrl : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tracks/${publishedTrack.coverArtUrl}`}
                        alt={publishedTrack.title}
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Music size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{publishedTrack.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ek-text-secondary)" }}>{genre}</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
                  <Link href={`/track/${publishedTrack.slug}`}>
                    <span
                      style={{
                        background: "var(--ek-gold)",
                        color: "#0f0f0f",
                        fontWeight: 600,
                        fontSize: 13,
                        padding: "10px 24px",
                        borderRadius: 99,
                        cursor: "pointer",
                      }}
                    >
                      View Page
                    </span>
                  </Link>

                  <button
                    onClick={resetForm}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--ek-border-mid)",
                      borderRadius: 99,
                      padding: "10px 24px",
                      fontSize: 13,
                      color: "var(--ek-text-primary)",
                      cursor: "pointer",
                    }}
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Area: Guidelines */}
          <div
            style={{
              background: "var(--ek-raised)",
              border: "1px solid var(--ek-border)",
              borderRadius: 24,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} style={{ color: "var(--ek-gold)" }} /> Guidelines
              </h3>
              <p style={{ fontSize: 12, color: "var(--ek-text-secondary)", lineHeight: 1.5 }}>
                Ensure your audio files are pre-rendered at high sample rates (minimum 44.1kHz). Lower qualities will degrade during adaptive bitrate HLS packaging.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Layers size={14} style={{ color: "var(--ek-gold)" }} /> Storage & DRM
              </h3>
              <p style={{ fontSize: 12, color: "var(--ek-text-secondary)", lineHeight: 1.5 }}>
                All master files are stored inside encrypted secure vaults. Stream delivery is restricted dynamically to signed HLS tokens.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Section: Uploads Catalog List */}
        <div
          style={{
            marginTop: 48,
            background: "var(--ek-raised)",
            border: "1px solid var(--ek-border)",
            borderRadius: 24,
            padding: 32,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Your Uploads Catalog</h2>
              <p style={{ fontSize: 12, color: "var(--ek-text-secondary)", marginTop: 4 }}>
                Review live deployment statuses of your uploaded master tracks
              </p>
            </div>
            <button
              onClick={fetchArtistTracks}
              style={{
                fontSize: 12,
                color: "var(--ek-gold)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Refresh List
            </button>
          </div>

          {isTracksLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ek-text-secondary)" }}>
              Loading catalog...
            </div>
          ) : artistTracks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ek-text-tertiary)", fontSize: 13, fontStyle: "italic" }}>
              No tracks uploaded yet. Start publishing by selecting an audio file above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {artistTracks.map((track) => {
                let statusColor = "var(--ek-text-secondary)";
                let statusBg = "var(--ek-surface)";
                let statusLabel = track.status;

                if (track.status === "published") {
                  statusColor = "var(--ek-emerald)";
                  statusBg = "rgba(16, 185, 129, 0.1)";
                  statusLabel = "Published";
                } else if (track.status === "processing") {
                  statusColor = "var(--ek-gold)";
                  statusBg = "rgba(201, 168, 76, 0.1)";
                  statusLabel = "Processing";
                } else if (track.status === "failed") {
                  statusColor = "#ef4444";
                  statusBg = "rgba(239, 68, 68, 0.1)";
                  statusLabel = "Failed";
                }

                return (
                  <div
                    key={track.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--ek-surface)",
                      border: "1px solid var(--ek-border-dim)",
                      borderRadius: 14,
                      padding: "12px 20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          overflow: "hidden",
                          position: "relative",
                          background: "var(--ek-raised)",
                        }}
                      >
                        {track.coverArtUrl ? (
                          <Image
                            src={track.coverArtUrl.startsWith("http") || track.coverArtUrl.startsWith("/") ? track.coverArtUrl : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tracks/${track.coverArtUrl}`}
                            alt={track.title}
                            fill
                            unoptimized
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Music size={16} />
                          </div>
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {track.title}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ek-text-secondary)", display: "flex", gap: 8 }}>
                          <span>{track.genre || "Alternative"}</span>
                          <span>•</span>
                          <span>{track.mood || "Chill"}</span>
                          {track.bpm && (
                            <>
                              <span>•</span>
                              <span>{track.bpm} BPM</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      {/* Price settings label */}
                      <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--ek-text-secondary)" }}>
                        {track.isDownloadable
                          ? track.downloadType === "free"
                            ? "Free DL"
                            : track.downloadType === "premium-only"
                            ? "Premium DL"
                            : `$${track.downloadPrice}`
                          : "No DL"}
                      </span>

                      {/* Status Badge */}
                      <span
                        style={{
                          background: statusBg,
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "4px 12px",
                          borderRadius: 99,
                          border: `1px solid ${statusColor}20`,
                          textTransform: "uppercase",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
