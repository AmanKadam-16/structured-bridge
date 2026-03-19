"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Code2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Sparkles,
  X,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";

// ===== TYPES =====
interface ExperienceEntry {
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  year: string;
}

interface ResumeData {
  full_name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
}

// ===== JSON SYNTAX HIGHLIGHTER =====
function highlightJSON(obj: unknown, indent = 0): React.ReactNode[] {
  const spaces = "  ".repeat(indent);
  const nodes: React.ReactNode[] = [];
  const key = `j-${indent}-${Math.random().toString(36).slice(2, 8)}`;

  if (obj === null) {
    return [<span key={key} className="json-null">null</span>];
  }
  if (typeof obj === "string") {
    return [<span key={key} className="json-string">&quot;{obj}&quot;</span>];
  }
  if (typeof obj === "number") {
    return [<span key={key} className="json-number">{obj}</span>];
  }
  if (typeof obj === "boolean") {
    return [<span key={key} className="json-boolean">{obj.toString()}</span>];
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return [<span key={key} className="json-bracket">[]</span>];
    }
    nodes.push(<span key={`${key}-o`} className="json-bracket">{"[\n"}</span>);
    obj.forEach((item, i) => {
      nodes.push(<span key={`${key}-s-${i}`}>{spaces + "  "}</span>);
      nodes.push(...highlightJSON(item, indent + 1));
      if (i < obj.length - 1) {
        nodes.push(<span key={`${key}-c-${i}`} className="json-comma">,</span>);
      }
      nodes.push(<span key={`${key}-n-${i}`}>{"\n"}</span>);
    });
    nodes.push(<span key={`${key}-sp`}>{spaces}</span>);
    nodes.push(<span key={`${key}-cl`} className="json-bracket">{"]"}</span>);
    return nodes;
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) {
      return [<span key={key} className="json-bracket">{"{}"}</span>];
    }
    nodes.push(<span key={`${key}-o`} className="json-bracket">{"{\n"}</span>);
    entries.forEach(([k, v], i) => {
      nodes.push(<span key={`${key}-s-${i}`}>{spaces + "  "}</span>);
      nodes.push(<span key={`${key}-k-${i}`} className="json-key">&quot;{k}&quot;</span>);
      nodes.push(<span key={`${key}-cl-${i}`} className="json-comma">{": "}</span>);
      nodes.push(...highlightJSON(v, indent + 1));
      if (i < entries.length - 1) {
        nodes.push(<span key={`${key}-c-${i}`} className="json-comma">,</span>);
      }
      nodes.push(<span key={`${key}-n-${i}`}>{"\n"}</span>);
    });
    nodes.push(<span key={`${key}-sp`}>{spaces}</span>);
    nodes.push(<span key={`${key}-cl`} className="json-bracket">{"}"}</span>);
    return nodes;
  }

  return [<span key={key}>{String(obj)}</span>];
}

// ===== MAIN PAGE =====
export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showRawJSON, setShowRawJSON] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);

    // Create preview URL
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleExtract = useCallback(async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "API request failed");
      }

      setResult(data.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* ===== HEADER ===== */}
      <header className="pt-10 pb-6 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-gray-400 font-mono uppercase tracking-wider mb-6 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={2.5} />
            Back to Bridge
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1
                className="text-3xl md:text-4xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Resume Extractor
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Upload a resume → Get a deterministic, schema-validated profile
              </p>
            </div>
          </div>

          {/* Pydantic Schema Badge */}
          <div className="flex items-center gap-3 mt-4">
            <div className="brutal-card px-4 py-2 flex items-center gap-2 !shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Shield className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
              <span className="text-[11px] font-mono font-semibold">
                CandidateProfile(BaseModel)
              </span>
            </div>
            <div className="text-[11px] font-mono text-gray-400">
              full_name · email · phone · skills[] · experience[] · education[]
            </div>
          </div>
        </motion.div>
      </header>

      {/* ===== DIVIDER ===== */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="section-divider" />
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <section className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ===== LEFT: UPLOAD ZONE + PREVIEW ===== */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-600" strokeWidth={2.5} />
                <h2 className="text-sm font-bold font-mono uppercase tracking-wide">
                  Input — The Messy Reality
                </h2>
              </div>

              {/* Drag & Drop Zone */}
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`brutal-card cursor-pointer transition-all ${
                    isDragOver
                      ? "!border-purple-600 !bg-purple-50/40 !shadow-[6px_6px_0px_0px_rgba(147,51,234,0.5)] -translate-x-1 -translate-y-1"
                      : ""
                  }`}
                  style={{ minHeight: 320 }}
                >
                  <div className="flex flex-col items-center justify-center h-full py-16 px-8">
                    <motion.div
                      animate={isDragOver ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-16 h-16 bg-gray-100 border-2 border-black flex items-center justify-center mb-6"
                    >
                      <Upload className="w-7 h-7 text-gray-600" strokeWidth={2} />
                    </motion.div>
                    <p className="text-base font-bold mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                      {isDragOver ? "Drop it here!" : "Drop your resume"}
                    </p>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      PDF, PNG, JPG, or WEBP — messy layouts welcome
                    </p>
                    <span className="brutal-btn-outline text-xs">
                      Browse Files
                    </span>
                  </div>
                </div>
              ) : (
                <div className="brutal-card overflow-hidden">
                  {/* File Header */}
                  <div className="p-4 border-b-2 border-black flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="w-4 h-4 text-purple-600" strokeWidth={2.5} />
                      ) : (
                        <FileText className="w-4 h-4 text-purple-600" strokeWidth={2.5} />
                      )}
                      <div>
                        <p className="text-sm font-bold font-mono truncate max-w-[280px]">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="w-7 h-7 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="p-4 bg-gray-50/50">
                    {previewUrl ? (
                      <div className="border-2 border-gray-200 overflow-hidden max-h-[400px] overflow-y-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Resume preview"
                          className="w-full h-auto"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <FileText className="w-12 h-12 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-mono">PDF preview not available</p>
                        <p className="text-xs mt-1">File will be sent to the AI for parsing</p>
                      </div>
                    )}
                  </div>

                  {/* Extract Button */}
                  <div className="p-4 border-t-2 border-black">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleExtract}
                      disabled={isLoading}
                      className="brutal-btn w-full flex items-center justify-center gap-3"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                          Extracting with Structured Output...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" strokeWidth={2.5} />
                          Extract &amp; Enforce Schema
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileInput}
              />
            </motion.div>

            {/* ===== RIGHT: STRUCTURED OUTPUT ===== */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                <h2 className="text-sm font-bold font-mono uppercase tracking-wide">
                  Output — The Accountant&apos;s Verdict
                </h2>
              </div>

              {/* Empty State */}
              {!isLoading && !result && !error && (
                <div
                  className="brutal-card flex flex-col items-center justify-center text-gray-400"
                  style={{ minHeight: 320 }}
                >
                  <div className="w-16 h-16 bg-gray-50 border-2 border-gray-200 flex items-center justify-center mb-4">
                    <User className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-mono font-semibold text-gray-400">
                    Candidate profile will appear here
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Upload a resume and click Extract
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="brutal-card marching-ants overflow-hidden" style={{ minHeight: 320 }}>
                  <div className="p-5 border-b-2 border-black">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 border-2 border-black flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm font-mono">ENFORCING SCHEMA</h3>
                        <p className="text-[11px] text-gray-500">
                          Structured Output · CandidateProfile
                        </p>
                      </div>
                      <span className="badge-pending flex items-center gap-1 ml-auto">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing...
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <div className="shimmer-loader h-4 w-20 rounded" />
                        <div className="shimmer-loader h-4 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="brutal-card overflow-hidden"
                >
                  <div className="p-5 border-b-2 border-black">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 border-2 border-black flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-700" strokeWidth={2.5} />
                      </div>
                      <h3 className="font-bold text-sm font-mono">EXTRACTION FAILED</h3>
                      <span className="badge-error flex items-center gap-1 ml-auto">
                        <AlertTriangle className="w-3 h-3" />
                        Error
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="bg-red-50 border-2 border-red-800 p-4">
                      <pre className="text-xs text-red-700 font-mono whitespace-pre-wrap break-words">
                        {error}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Success State — Candidate Profile Card */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="brutal-card overflow-hidden"
                    style={{ animation: "pulseGlow 2s ease-in-out 3" }}
                  >
                    {/* Card Header */}
                    <div className="p-5 border-b-2 border-black">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 border-2 border-black flex items-center justify-center">
                            <Shield className="w-4 h-4 text-emerald-700" strokeWidth={2.5} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm font-mono">CANDIDATE PROFILE</h3>
                            <p className="text-[11px] text-gray-500">
                              Structured Output · Schema-validated
                            </p>
                          </div>
                        </div>
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="badge-success flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Strict Success
                        </motion.span>
                      </div>
                    </div>

                    {/* Profile Content */}
                    <div className="p-5 space-y-5">
                      {/* Name & Contact */}
                      <div>
                        <motion.h2
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 }}
                          className="text-2xl font-bold tracking-tight mb-2"
                          style={{ fontFamily: "var(--font-sans)" }}
                        >
                          {result.full_name}
                        </motion.h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {result.email && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="flex items-center gap-1.5"
                            >
                              <Mail className="w-3.5 h-3.5" strokeWidth={2.5} />
                              {result.email}
                            </motion.span>
                          )}
                          {result.phone && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.25 }}
                              className="flex items-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5" strokeWidth={2.5} />
                              {result.phone}
                            </motion.span>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      {result.summary && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="bg-gray-50 border-2 border-gray-200 p-3"
                        >
                          <p className="text-sm text-gray-700 leading-relaxed italic">
                            &ldquo;{result.summary}&rdquo;
                          </p>
                        </motion.div>
                      )}

                      {/* Skills */}
                      {result.skills.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.35 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Code2 className="w-3.5 h-3.5 text-gray-500" strokeWidth={2.5} />
                            <span className="text-xs font-mono font-bold uppercase tracking-wide text-gray-500">
                              Skills
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              ({result.skills.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.skills.map((skill, i) => (
                              <motion.span
                                key={skill}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.35 + i * 0.03 }}
                                className="px-3 py-1 text-xs font-mono font-semibold border-2 border-black bg-white/60 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              >
                                {skill}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Experience */}
                      {result.experience.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.45 }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Briefcase className="w-3.5 h-3.5 text-gray-500" strokeWidth={2.5} />
                            <span className="text-xs font-mono font-bold uppercase tracking-wide text-gray-500">
                              Experience
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              ({result.experience.length})
                            </span>
                          </div>
                          <div className="space-y-3">
                            {result.experience.map((exp, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.45 + i * 0.08 }}
                                className="border-l-[3px] border-black pl-4 py-1"
                              >
                                <p className="text-sm font-bold">{exp.role}</p>
                                <p className="text-xs text-gray-600 font-semibold">
                                  {exp.company}
                                </p>
                                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                  {exp.duration}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                  {exp.description}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Education */}
                      {result.education.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <GraduationCap className="w-3.5 h-3.5 text-gray-500" strokeWidth={2.5} />
                            <span className="text-xs font-mono font-bold uppercase tracking-wide text-gray-500">
                              Education
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              ({result.education.length})
                            </span>
                          </div>
                          <div className="space-y-2">
                            {result.education.map((edu, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.08 }}
                                className="border-l-[3px] border-emerald-600 pl-4 py-1"
                              >
                                <p className="text-sm font-bold">{edu.degree}</p>
                                <p className="text-xs text-gray-600">{edu.institution}</p>
                                <p className="text-[11px] text-gray-400 font-mono">
                                  {edu.year}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Footer — Toggle Raw JSON */}
                    <div className="border-t-2 border-black p-4">
                      <button
                        onClick={() => setShowRawJSON(!showRawJSON)}
                        className="brutal-btn-outline w-full flex items-center justify-center gap-2"
                      >
                        <Code2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                        {showRawJSON ? "Hide Raw JSON" : "Show Raw JSON"}
                      </button>

                      <AnimatePresence>
                        {showRawJSON && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 bg-emerald-50/50 border-2 border-emerald-700 p-4 max-h-72 overflow-y-auto">
                              <pre className="text-xs leading-relaxed font-mono">
                                {highlightJSON(result as unknown as Record<string, unknown>).map((node, i) => (
                                  <React.Fragment key={i}>{node}</React.Fragment>
                                ))}
                              </pre>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span className="text-[11px] text-emerald-700 font-mono">
                                100% schema-compliant · CandidateProfile(BaseModel) ✓
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== PYDANTIC SCHEMA DISPLAY ===== */}
      <section className="px-6 pb-10">
        <div className="max-w-6xl mx-auto">
          <div className="section-divider mb-8" />
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="w-5 h-5" strokeWidth={2.5} />
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              The Enforced Schema
            </h2>
          </div>
          <div className="code-block text-xs">
            <pre className="whitespace-pre-wrap">{`# The Pydantic model that forces structure onto chaos
from pydantic import BaseModel

class ExperienceItem(BaseModel):
    company: str
    role: str
    duration: str
    description: str

class EducationItem(BaseModel):
    institution: str
    degree: str
    year: str

class CandidateProfile(BaseModel):
    full_name: str
    email: str
    phone: str
    summary: str
    skills: list[str]
    experience: list[ExperienceItem]
    education: list[EducationItem]

# Usage with OpenAI SDK
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "candidate_profile",
            "schema": CandidateProfile.model_json_schema(),
        }
    }
)`}</pre>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="section-divider mb-6" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono">
              THE STRUCTURED BRIDGE · Resume Extractor · OpenAI Structured Outputs
            </span>
            <Link
              href="/"
              className="text-xs text-gray-400 font-mono hover:text-black transition-colors"
            >
              ← Main Demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
