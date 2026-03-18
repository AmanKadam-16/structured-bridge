"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Shield,
  Zap,
  Code2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  SlidersHorizontal,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowRight,
  Brain,
  Lock,
} from "lucide-react";
import {
  PRESETS,
  getOldWayCode,
  getNewWayCode,
  type SchemaField,
  type PresetConfig,
} from "@/lib/schemas";

// ===== TYPES =====
interface HopeResult {
  raw: string;
  parsed: unknown;
  success: boolean;
  error: string | null;
  latency: number;
}

interface EnforcementResult {
  parsed: unknown;
  success: boolean;
  error: string | null;
  latency: number;
}

interface ExtractResponse {
  hope: HopeResult;
  enforcement: EnforcementResult;
}

// ===== JSON SYNTAX HIGHLIGHTER =====
function highlightJSON(obj: unknown, indent = 0): React.ReactNode[] {
  const spaces = "  ".repeat(indent);
  const nodes: React.ReactNode[] = [];
  const key = `json-${indent}-${Math.random()}`;

  if (obj === null) {
    nodes.push(
      <span key={key} className="json-null">
        null
      </span>
    );
    return nodes;
  }

  if (typeof obj === "string") {
    nodes.push(
      <span key={key} className="json-string">
        &quot;{obj}&quot;
      </span>
    );
    return nodes;
  }

  if (typeof obj === "number") {
    nodes.push(
      <span key={key} className="json-number">
        {obj}
      </span>
    );
    return nodes;
  }

  if (typeof obj === "boolean") {
    nodes.push(
      <span key={key} className="json-boolean">
        {obj.toString()}
      </span>
    );
    return nodes;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      nodes.push(
        <span key={key} className="json-bracket">
          []
        </span>
      );
      return nodes;
    }
    nodes.push(
      <span key={`${key}-open`} className="json-bracket">
        {"[\n"}
      </span>
    );
    obj.forEach((item, i) => {
      nodes.push(<span key={`${key}-space-${i}`}>{spaces + "  "}</span>);
      nodes.push(...highlightJSON(item, indent + 1));
      if (i < obj.length - 1) {
        nodes.push(
          <span key={`${key}-comma-${i}`} className="json-comma">
            ,
          </span>
        );
      }
      nodes.push(<span key={`${key}-nl-${i}`}>{"\n"}</span>);
    });
    nodes.push(<span key={`${key}-spaces`}>{spaces}</span>);
    nodes.push(
      <span key={`${key}-close`} className="json-bracket">
        {"]"}
      </span>
    );
    return nodes;
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) {
      nodes.push(
        <span key={key} className="json-bracket">
          {"{}"}
        </span>
      );
      return nodes;
    }
    nodes.push(
      <span key={`${key}-open`} className="json-bracket">
        {"{\n"}
      </span>
    );
    entries.forEach(([k, v], i) => {
      nodes.push(<span key={`${key}-space-${i}`}>{spaces + "  "}</span>);
      nodes.push(
        <span key={`${key}-key-${i}`} className="json-key">
          &quot;{k}&quot;
        </span>
      );
      nodes.push(
        <span key={`${key}-colon-${i}`} className="json-comma">
          :{" "}
        </span>
      );
      nodes.push(...highlightJSON(v, indent + 1));
      if (i < entries.length - 1) {
        nodes.push(
          <span key={`${key}-comma-${i}`} className="json-comma">
            ,
          </span>
        );
      }
      nodes.push(<span key={`${key}-nl-${i}`}>{"\n"}</span>);
    });
    nodes.push(<span key={`${key}-spaces`}>{spaces}</span>);
    nodes.push(
      <span key={`${key}-close`} className="json-bracket">
        {"}"}
      </span>
    );
    return nodes;
  }

  nodes.push(<span key={key}>{String(obj)}</span>);
  return nodes;
}

// ===== MAIN PAGE COMPONENT =====
export default function Home() {
  const [inputText, setInputText] = useState("");
  const [activePreset, setActivePreset] = useState<PresetConfig>(PRESETS[0]);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>(
    PRESETS[0].fields.map((f) => ({ ...f }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ExtractResponse | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [codeView, setCodeView] = useState<"old" | "new">("old");
  const [copied, setCopied] = useState(false);
  const [hopeTimer, setHopeTimer] = useState(0);
  const [enforcementTimer, setEnforcementTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const selectPreset = useCallback((preset: PresetConfig) => {
    setActivePreset(preset);
    setInputText(preset.sampleText);
    setSchemaFields(preset.fields.map((f) => ({ ...f })));
    setResults(null);
  }, []);

  const toggleField = useCallback((key: string) => {
    setSchemaFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
  }, []);

  const handleExtract = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setResults(null);
    setHopeTimer(0);
    setEnforcementTimer(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setHopeTimer(elapsed);
      setEnforcementTimer(elapsed);
    }, 50);

    try {
      const enabledFieldKeys = schemaFields
        .filter((f) => f.enabled)
        .map((f) => f.key);

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          presetId: activePreset.id,
          enabledFields: enabledFieldKeys,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "API request failed");
      }

      const elapsed = Date.now() - startTime;
      data.hope.latency = elapsed;
      data.enforcement.latency = elapsed;

      setResults(data);
      setHopeTimer(elapsed);
      setEnforcementTimer(elapsed);
    } catch (err) {
      console.error("Extract error:", err);
      const elapsed = Date.now() - startTime;
      setResults({
        hope: {
          raw: "",
          parsed: null,
          success: false,
          error: `Network Error: ${(err as Error).message}`,
          latency: elapsed,
        },
        enforcement: {
          parsed: null,
          success: false,
          error: `Network Error: ${(err as Error).message}`,
          latency: elapsed,
        },
      });
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLoading(false);
      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    }
  }, [inputText, activePreset, schemaFields]);

  const copyCode = useCallback(async () => {
    const code =
      codeView === "old"
        ? getOldWayCode(activePreset.schemaName)
        : getNewWayCode(activePreset.schemaName, schemaFields);
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeView, activePreset, schemaFields]);

  return (
    <div className="min-h-screen relative">
      {/* ===== HEADER ===== */}
      <header className="pt-12 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-3 h-3 bg-black"
              style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
            />
            <span
              className="text-xs tracking-[0.3em] uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Technical Demo
            </span>
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            The Structured
            <br />
            <span className="relative inline-block">
              Bridge
              <motion.div
                className="absolute -bottom-1 left-0 h-[3px] bg-black"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              />
            </span>
          </h1>
          <p
            className="text-lg text-gray-500 max-w-xl leading-relaxed"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Bridging{" "}
            <span className="text-black font-semibold">
              Probabilistic AI
            </span>{" "}
            and{" "}
            <span className="text-black font-semibold">
              Deterministic Software
            </span>{" "}
            through OpenAI Structured Outputs.
          </p>
        </motion.div>
      </header>

      {/* ===== THE CONFLICT EXPLAINER ===== */}
      <section className="px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* The Artist */}
            <motion.div
              whileHover={{ y: -4 }}
              className="brutal-card p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 border-2 border-black flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-700" strokeWidth={2.5} />
                </div>
                <div>
                  <h3
                    className="font-bold text-sm"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    THE ARTIST
                  </h3>
                  <p className="text-xs text-gray-500">LLM</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Creative, fluent, understands nuance — but inherently{" "}
                <span className="font-semibold text-purple-700">
                  unpredictable
                </span>
                . Every response is a new improvisation.
              </p>
              <div className="mt-3 text-xs text-purple-600 font-mono font-semibold tracking-wide">
                PROBABILISTIC
              </div>
            </motion.div>

            {/* The Bridge */}
            <motion.div
              whileHover={{ y: -4 }}
              className="brutal-card p-6 bg-black/90 text-white"
              style={{
                background: "rgba(0,0,0,0.92)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white border-2 border-white flex items-center justify-center">
                  <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <h3
                    className="font-bold text-sm"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    THE BRIDGE
                  </h3>
                  <p className="text-xs text-gray-400">Structured Output</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                The OpenAI SDK&apos;s{" "}
                <span className="font-semibold text-white font-mono">
                  .parse()
                </span>{" "}
                method + Pydantic schemas force the AI into a{" "}
                <span className="font-semibold text-white">
                  deterministic contract
                </span>
                .
              </p>
              <div className="mt-3 text-xs text-gray-400 font-mono font-semibold tracking-wide">
                THE SOLUTION →
              </div>
            </motion.div>

            {/* The Accountant */}
            <motion.div
              whileHover={{ y: -4 }}
              className="brutal-card p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 border-2 border-black flex items-center justify-center">
                  <Lock
                    className="w-5 h-5 text-emerald-700"
                    strokeWidth={2.5}
                  />
                </div>
                <div>
                  <h3
                    className="font-bold text-sm"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    THE ACCOUNTANT
                  </h3>
                  <p className="text-xs text-gray-500">Enterprise Software</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Rigid, rule-based, strictly typed — demands{" "}
                <span className="font-semibold text-emerald-700">
                  predictable structures
                </span>
                . Every field must conform.
              </p>
              <div className="mt-3 text-xs text-emerald-600 font-mono font-semibold tracking-wide">
                DETERMINISTIC
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ===== DIVIDER ===== */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="section-divider" />
      </div>

      {/* ===== INPUT SECTION ===== */}
      <section className="px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Input Zone
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Feed messy, unstructured text. Watch the AI attempt to parse it.
              </p>
            </div>
            <button
              onClick={() => setShowDrawer(true)}
              className="brutal-btn-outline flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2.5} />
              Schema Editor
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-3 mb-4">
            <span
              className="text-xs text-gray-400 uppercase tracking-wide self-center mr-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Quick Presets:
            </span>
            {PRESETS.map((preset) => (
              <motion.button
                key={preset.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectPreset(preset)}
                className={`brutal-btn-outline flex items-center gap-2 ${
                  activePreset.id === preset.id
                    ? "!bg-black !text-white"
                    : ""
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste messy, unstructured text here..."
              rows={6}
              className="brutal-input w-full p-5 text-sm leading-relaxed resize-none"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-mono">
              {inputText.length} chars
            </div>
          </div>

          {/* Extract Button */}
          <div className="mt-5 flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleExtract}
              disabled={isLoading || !inputText.trim()}
              className="brutal-btn flex items-center gap-3 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                  Processing Dual Calls...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" strokeWidth={2.5} />
                  Extract Data
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </>
              )}
            </motion.button>
            <span className="text-xs text-gray-400 font-mono">
              Triggers 2 parallel API calls
            </span>
          </div>
        </motion.div>
      </section>

      {/* ===== RESULTS SECTION ===== */}
      <div ref={resultsRef}>
        <AnimatePresence>
          {(isLoading || results) && (
            <section className="px-6 pb-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="max-w-5xl mx-auto"
              >
                {/* Divider */}
                <div className="section-divider mb-10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ===== CARD 1: THE HOPE ===== */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <div className="brutal-card overflow-hidden">
                      {/* Card Header */}
                      <div className="p-5 border-b-2 border-black">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 border-2 border-black flex items-center justify-center">
                              <Sparkles
                                className="w-4 h-4 text-purple-700"
                                strokeWidth={2.5}
                              />
                            </div>
                            <div>
                              <h3
                                className="font-bold text-sm"
                                style={{ fontFamily: "var(--font-mono)" }}
                              >
                                THE HOPE
                              </h3>
                              <p className="text-[11px] text-gray-500">
                                Standard completion · temp 1.2
                              </p>
                            </div>
                          </div>
                          <div>
                            {isLoading && !results && (
                              <span className="badge-pending flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Parsing...
                              </span>
                            )}
                            {results?.hope.success && (
                              <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="badge-success flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Parsed OK
                              </motion.span>
                            )}
                            {results && !results.hope.success && (
                              <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="badge-error flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Parser Crash
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        {isLoading && !results && (
                          <div className="space-y-3">
                            <div className="shimmer-loader h-4 w-3/4 rounded" />
                            <div className="shimmer-loader h-4 w-1/2 rounded" />
                            <div className="shimmer-loader h-4 w-5/6 rounded" />
                            <div className="shimmer-loader h-4 w-2/3 rounded" />
                          </div>
                        )}

                        {results && !results.hope.success && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            {/* Error Banner */}
                            <div className="bg-red-50 border-2 border-red-800 p-4 mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle
                                  className="w-4 h-4 text-red-700"
                                  strokeWidth={2.5}
                                />
                                <span
                                  className="text-sm font-bold text-red-800"
                                  style={{ fontFamily: "var(--font-mono)" }}
                                >
                                  JSON.parse() FAILED
                                </span>
                              </div>
                              <pre className="text-xs text-red-700 font-mono whitespace-pre-wrap break-all">
                                {results.hope.error}
                              </pre>
                            </div>

                            {/* Raw output */}
                            {results.hope.raw && (
                              <div>
                                <p className="text-xs text-gray-500 mb-2 font-mono">
                                  RAW LLM OUTPUT:
                                </p>
                                <div className="bg-gray-50 border-2 border-gray-300 p-4 max-h-60 overflow-y-auto">
                                  <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-words leading-relaxed">
                                    {results.hope.raw}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {results?.hope.success && results.hope.parsed !== null && results.hope.parsed !== undefined && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <p className="text-xs text-gray-500 mb-2 font-mono">
                              PARSED (with luck):
                            </p>
                            <div className="bg-gray-50 border-2 border-gray-300 p-4 max-h-60 overflow-y-auto">
                              <pre className="text-xs leading-relaxed font-mono">
                                {highlightJSON(results.hope.parsed).map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>)}
                              </pre>
                            </div>
                            {results.hope.raw && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2 font-mono">
                                  RAW RESPONSE (included chatter):
                                </p>
                                <div className="bg-gray-50 border border-gray-200 p-3 max-h-32 overflow-y-auto">
                                  <pre className="text-[11px] text-gray-500 font-mono whitespace-pre-wrap break-words">
                                    {results.hope.raw}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>

                      {/* Timer */}
                      <div className="px-5 pb-4">
                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                          <span>client.chat.completions.create</span>
                          <span>{(hopeTimer / 1000).toFixed(2)}s</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* ===== CARD 2: THE ENFORCEMENT ===== */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div
                      className={`brutal-card overflow-hidden ${
                        isLoading && !results ? "marching-ants" : ""
                      }`}
                      style={
                        results?.enforcement.success
                          ? {
                              animation: "pulseGlow 2s ease-in-out 3",
                            }
                          : undefined
                      }
                    >
                      {/* Card Header */}
                      <div className="p-5 border-b-2 border-black">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 border-2 border-black flex items-center justify-center">
                              <Shield
                                className="w-4 h-4 text-emerald-700"
                                strokeWidth={2.5}
                              />
                            </div>
                            <div>
                              <h3
                                className="font-bold text-sm"
                                style={{ fontFamily: "var(--font-mono)" }}
                              >
                                THE ENFORCEMENT
                              </h3>
                              <p className="text-[11px] text-gray-500">
                                Structured Output · Pydantic schema
                              </p>
                            </div>
                          </div>
                          <div>
                            {isLoading && !results && (
                              <span className="badge-pending flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Enforcing...
                              </span>
                            )}
                            {results?.enforcement.success && (
                              <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="badge-success flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Strict Success
                              </motion.span>
                            )}
                            {results && !results.enforcement.success && (
                              <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="badge-error flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Error
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        {isLoading && !results && (
                          <div className="space-y-3">
                            <div className="shimmer-loader h-4 w-3/4 rounded" />
                            <div className="shimmer-loader h-4 w-1/2 rounded" />
                            <div className="shimmer-loader h-4 w-5/6 rounded" />
                            <div className="shimmer-loader h-4 w-2/3 rounded" />
                          </div>
                        )}

                        {results?.enforcement.success &&
                          results.enforcement.parsed !== null && results.enforcement.parsed !== undefined && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <p className="text-xs text-gray-500 mb-2 font-mono">
                                TYPE-SAFE OUTPUT:
                              </p>
                              <div className="bg-emerald-50/50 border-2 border-emerald-700 p-4 max-h-60 overflow-y-auto">
                                <pre className="text-xs leading-relaxed font-mono">
                                  {highlightJSON(results.enforcement.parsed).map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>)}
                                </pre>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span className="text-[11px] text-emerald-700 font-mono">
                                  100% schema-compliant · Zero runtime errors
                                </span>
                              </div>
                            </motion.div>
                          )}

                        {results && !results.enforcement.success && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div className="bg-red-50 border-2 border-red-800 p-4">
                              <pre className="text-xs text-red-700 font-mono whitespace-pre-wrap">
                                {results.enforcement.error}
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Timer */}
                      <div className="px-5 pb-4">
                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                          <span>client.chat.completions.create</span>
                          <span>{(enforcementTimer / 1000).toFixed(2)}s</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </section>
          )}
        </AnimatePresence>
      </div>

      {/* ===== DIVIDER ===== */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="section-divider" />
      </div>

      {/* ===== SDK SNIPPET SECTION ===== */}
      <section className="px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5" strokeWidth={2.5} />
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                The SDK Snippet
              </h2>
            </div>
            <button
              onClick={copyCode}
              className="brutal-btn-outline flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" strokeWidth={2.5} />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Toggle */}
          <div className="flex gap-0 mb-6">
            <button
              onClick={() => setCodeView("old")}
              className={`px-6 py-3 text-sm font-mono font-bold border-2 border-black transition-all ${
                codeView === "old"
                  ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0"
                  : "bg-white/60 text-black hover:bg-gray-100"
              }`}
            >
              ❌ The Old Way
            </button>
            <button
              onClick={() => setCodeView("new")}
              className={`px-6 py-3 text-sm font-mono font-bold border-2 border-black border-l-0 transition-all ${
                codeView === "new"
                  ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white/60 text-black hover:bg-gray-100"
              }`}
            >
              ✅ The New Way
            </button>
          </div>

          {/* Code Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={codeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="code-block overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">
                  <code>
                    {codeView === "old"
                      ? getOldWayCode(activePreset.schemaName)
                      : getNewWayCode(activePreset.schemaName, schemaFields)}
                  </code>
                </pre>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-mono">
            <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
            <span>
              Schema:{" "}
              <span className="text-black font-semibold">
                {activePreset.schemaName}
              </span>{" "}
              ·{" "}
              {schemaFields.filter((f) => f.enabled).length} fields active
            </span>
          </div>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="px-6 py-8 mt-4">
        <div className="max-w-5xl mx-auto">
          <div className="section-divider mb-6" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono">
              THE STRUCTURED BRIDGE · Built with Next.js + OpenAI SDK + Pydantic
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Presentation Demo
            </span>
          </div>
        </div>
      </footer>

      {/* ===== SCHEMA EDITOR DRAWER ===== */}
      <AnimatePresence>
        {showDrawer && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 drawer-overlay z-40"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l-2 border-black z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3
                      className="text-lg font-bold"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Live Schema Editor
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Toggle fields to reshape the AI&apos;s output contract
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>

                {/* Active Schema Name */}
                <div className="brutal-card p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2
                      className="w-4 h-4 text-gray-500"
                      strokeWidth={2.5}
                    />
                    <span className="text-xs text-gray-500 font-mono uppercase tracking-wide">
                      Active Schema
                    </span>
                  </div>
                  <span
                    className="text-lg font-bold"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {activePreset.schemaName}
                  </span>
                </div>

                {/* Field Toggles */}
                <div className="space-y-3">
                  {schemaFields.map((field) => (
                    <motion.div
                      key={field.key}
                      layout
                      className={`brutal-card p-4 cursor-pointer transition-all ${
                        !field.enabled ? "opacity-50" : ""
                      }`}
                      onClick={() => toggleField(field.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {field.enabled ? (
                            <Eye
                              className="w-4 h-4 text-emerald-600"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <EyeOff
                              className="w-4 h-4 text-gray-400"
                              strokeWidth={2.5}
                            />
                          )}
                          <div>
                            <div className="font-bold text-sm font-mono">
                              {field.key}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {field.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-gray-400 font-mono">
                            {field.type}
                          </span>
                          <div
                            className={`w-10 h-6 border-2 border-black relative transition-colors ${
                              field.enabled ? "bg-black" : "bg-gray-200"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 border border-black absolute top-[2px] transition-all ${
                                field.enabled
                                  ? "left-[18px] bg-white"
                                  : "left-[2px] bg-white"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Schema Preview */}
                <div className="mt-6">
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-3">
                    Generated Pydantic Model
                  </p>
                  <div className="code-block text-xs">
                    <pre className="whitespace-pre-wrap">
                      {`from pydantic import BaseModel\n\nclass ${activePreset.schemaName}(BaseModel):\n`}
                      {schemaFields
                        .filter((f) => f.enabled)
                        .map(
                          (f) =>
                            `    ${f.key}: ${f.type}\n`
                        )
                        .join("")}
                    </pre>
                  </div>
                </div>

                {/* Active Fields Count */}
                <div className="mt-4 text-center">
                  <span className="badge-success">
                    {schemaFields.filter((f) => f.enabled).length} /{" "}
                    {schemaFields.length} Fields Active
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
