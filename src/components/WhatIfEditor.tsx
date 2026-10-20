"use client";
import React, { useState, useCallback, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SlidersHorizontal, RotateCcw, Zap, Sparkles, CheckCircle2 } from "lucide-react";

// ── Signal config ─────────────────────────────────────────────────────────────
const SIGNAL_CONFIG: Record<
  string,
  { label: string; options: string[]; optionLabels: string[] }
> = {
  dataset_size: {
    label: "Dataset size",
    options: ["small", "medium", "large", "very_large"],
    optionLabels: ["Small", "Medium", "Large", "Very large"],
  },
  query_volume: {
    label: "Query volume",
    options: ["low", "medium", "high", "very_high"],
    optionLabels: ["Low", "Medium", "High", "Very high"],
  },
  latency_requirement: {
    label: "Latency requirement",
    options: ["relaxed", "moderate", "strict", "ultra_low"],
    optionLabels: ["Relaxed", "Moderate", "Strict", "Ultra low"],
  },
  data_volatility: {
    label: "Data volatility",
    options: ["static", "low", "moderate", "high"],
    optionLabels: ["Static", "Low", "Moderate", "High"],
  },
  accuracy_requirement: {
    label: "Accuracy requirement",
    options: ["moderate", "high", "very_high", "critical"],
    optionLabels: ["Moderate", "High", "Very high", "Critical"],
  },
  domain_specificity: {
    label: "Domain specificity",
    options: ["general", "moderate", "specialized", "highly_specialized"],
    optionLabels: ["General", "Moderate", "Specialized", "Highly specialized"],
  },
  security_level: {
    label: "Security level",
    options: ["standard", "elevated", "high", "critical"],
    optionLabels: ["Standard", "Elevated", "High", "Critical"],
  },
  cost_sensitivity: {
    label: "Cost sensitivity",
    options: ["low", "moderate", "high", "very_high"],
    optionLabels: ["Low", "Moderate", "High", "Very high"],
  },
  deployment_preference: {
    label: "Deployment preference",
    options: ["cloud", "on_premise", "hybrid", "edge"],
    optionLabels: ["Cloud", "On-premise", "Hybrid", "Edge"],
  },
  user_scale: {
    label: "User scale",
    options: ["small", "medium", "large", "enterprise"],
    optionLabels: ["Small", "Medium", "Large", "Enterprise"],
  },
  citation_requirement: {
    label: "Explainability requirement",
    options: ["low", "moderate", "high", "critical"],
    optionLabels: ["Low", "Moderate", "High", "Critical"],
  },
  context_size: {
    label: "Context size",
    options: ["small", "medium", "large", "very_large"],
    optionLabels: ["Small", "Medium", "Large", "Very large"],
  },
};

const ARCH_COLOR_MAP: Record<string, string> = {
  RAG: "#10b981",
  FineTuning: "#3b82f6",
  CAG: "#f59e0b",
  Hybrid: "#f97316",
};

// ── Cost estimation ───────────────────────────────────────────────────────────
const _INFRA_COST: Record<string, Record<string, Record<string, Record<string, [number, number]>>>> = {
  compute: {
    dataset_size: {
      small: { RAG: [17000, 42000], FineTuning: [67000, 168000], CAG: [8500, 25000], Hybrid: [84000, 210000] },
      medium: { RAG: [42000, 126000], FineTuning: [168000, 420000], CAG: [17000, 50000], Hybrid: [210000, 504000] },
      large: { RAG: [126000, 336000], FineTuning: [420000, 1008000], CAG: [42000, 126000], Hybrid: [504000, 1260000] },
      very_large: { RAG: [336000, 840000], FineTuning: [1008000, 2520000], CAG: [126000, 336000], Hybrid: [1260000, 2940000] },
    },
    query_volume: {
      low: { RAG: [8500, 25000], FineTuning: [4200, 12600], CAG: [4200, 12600], Hybrid: [12600, 33600] },
      medium: { RAG: [25000, 67000], FineTuning: [12600, 33600], CAG: [12600, 42000], Hybrid: [33600, 84000] },
      high: { RAG: [67000, 168000], FineTuning: [33600, 84000], CAG: [42000, 126000], Hybrid: [84000, 210000] },
      very_high: { RAG: [168000, 420000], FineTuning: [84000, 210000], CAG: [126000, 336000], Hybrid: [210000, 504000] },
    },
  },
  storage: {
    dataset_size: {
      small: { RAG: [1700, 4200], FineTuning: [4200, 12600], CAG: [420, 1700], Hybrid: [5900, 16800] },
      medium: { RAG: [4200, 12600], FineTuning: [12600, 33600], CAG: [850, 3400], Hybrid: [16800, 46200] },
      large: { RAG: [12600, 33600], FineTuning: [33600, 84000], CAG: [1700, 6800], Hybrid: [46200, 117600] },
      very_large: { RAG: [33600, 84000], FineTuning: [84000, 210000], CAG: [3400, 13600], Hybrid: [117600, 294000] },
    },
  },
};

const _TRAINING_COST: Record<string, Record<string, Record<string, [number, number]>>> = {
  dataset_size: {
    small: { RAG: [0, 0], FineTuning: [42000, 168000], CAG: [0, 0], Hybrid: [42000, 168000] },
    medium: { RAG: [0, 0], FineTuning: [168000, 504000], CAG: [0, 0], Hybrid: [168000, 504000] },
    large: { RAG: [0, 0], FineTuning: [504000, 1260000], CAG: [0, 0], Hybrid: [504000, 1260000] },
    very_large: { RAG: [0, 0], FineTuning: [1260000, 3360000], CAG: [0, 0], Hybrid: [1260000, 3360000] },
  },
  data_volatility: {
    static: { RAG: [0, 0], FineTuning: [0, 0], CAG: [0, 0], Hybrid: [0, 0] },
    low: { RAG: [0, 0], FineTuning: [16800, 67000], CAG: [0, 0], Hybrid: [16800, 67000] },
    moderate: { RAG: [0, 0], FineTuning: [67000, 210000], CAG: [0, 0], Hybrid: [67000, 210000] },
    high: { RAG: [0, 0], FineTuning: [210000, 504000], CAG: [0, 0], Hybrid: [210000, 504000] },
  },
};

function formatCost(amount: number): string {
  if (amount >= 10000000) return `Rs. ${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(1)} L`;
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function estimateMonthlyCost(signals: Record<string, string>, arch: string): [number, number] {
  const dataset_size = signals.dataset_size ?? "medium";
  const query_volume = signals.query_volume ?? "medium";
  const data_vol = signals.data_volatility ?? "low";

  const compute = (_INFRA_COST.compute.dataset_size[dataset_size]?.[arch] || [20000, 50000])[0] +
    (_INFRA_COST.compute.query_volume[query_volume]?.[arch] || [10000, 30000])[0];
  const storage = (_INFRA_COST.storage.dataset_size[dataset_size]?.[arch] || [5000, 15000])[0];
  const training = (_TRAINING_COST.dataset_size[dataset_size]?.[arch] || [0, 0])[0] +
    (_TRAINING_COST.data_volatility[data_vol]?.[arch] || [0, 0])[0];

  const totalMin = Math.round(compute + storage + training / 12);
  const totalMax = Math.round(totalMin * 2.4);
  return [totalMin, totalMax];
}

// ── Pure deterministic scoring function ─────────────────────────────────────────
function calculateDeterministicScores(signals: Record<string, string>) {
  const dsIdx = SIGNAL_CONFIG.dataset_size.options.indexOf(signals.dataset_size);
  const qvIdx = SIGNAL_CONFIG.query_volume.options.indexOf(signals.query_volume);
  const lrIdx = SIGNAL_CONFIG.latency_requirement.options.indexOf(signals.latency_requirement);
  const dvIdx = SIGNAL_CONFIG.data_volatility.options.indexOf(signals.data_volatility);
  const arIdx = SIGNAL_CONFIG.accuracy_requirement.options.indexOf(signals.accuracy_requirement);
  const crIdx = SIGNAL_CONFIG.citation_requirement.options.indexOf(signals.citation_requirement);

  // RAG scoring
  let ragScore = 0.55;
  ragScore += crIdx * 0.12; // Loves high citation requirement
  ragScore += dvIdx * 0.08; // Loves volatile data
  ragScore += (dsIdx >= 1 ? 0.08 : -0.05);
  if (lrIdx === 3) ragScore -= 0.12; // Penalized by ultra-low latency

  // Fine-Tuning scoring
  let ftScore = 0.45;
  ftScore += (3 - dvIdx) * 0.10; // Prefers static data
  ftScore += lrIdx * 0.09; // Handles ultra-low latency well
  ftScore += (3 - crIdx) * 0.06; // Hard to cite specific sources
  ftScore += dsIdx * 0.04;

  // CAG scoring (Cache-Augmented Generation)
  let cagScore = 0.42;
  cagScore += (3 - dsIdx) * 0.12; // Prefers small to medium datasets
  cagScore += (3 - qvIdx) * 0.07;
  cagScore += lrIdx * 0.06;

  // Hybrid scoring
  let hybridScore = 0.50;
  hybridScore += arIdx * 0.11; // Critical accuracy loves hybrid
  hybridScore += crIdx * 0.08;
  hybridScore += dsIdx * 0.06;
  if (signals.cost_sensitivity === "very_high") hybridScore -= 0.15; // Higher cost

  // Normalize scores to 0.40 - 0.98 range
  const normalize = (val: number) => Math.min(0.98, Math.max(0.42, Number(val.toFixed(2))));

  const scores = {
    RAG: normalize(ragScore),
    FineTuning: normalize(ftScore),
    CAG: normalize(cagScore),
    Hybrid: normalize(hybridScore),
  };

  const ranking = Object.keys(scores).sort((a, b) => scores[b as keyof typeof scores] - scores[a as keyof typeof scores]);
  const recommended = ranking[0];

  const factor_breakdown: Record<string, Record<string, number>> = {
    RAG: {
      "Explainability": 40 + crIdx * 18,
      "Data Freshness": 50 + dvIdx * 15,
      "Latency Fit": 75 - lrIdx * 12,
      "Dataset Scale": 50 + dsIdx * 14,
      "Cost Efficiency": 80 - qvIdx * 10,
    },
    FineTuning: {
      "Explainability": 30 + crIdx * 5,
      "Data Freshness": 70 - dvIdx * 18,
      "Latency Fit": 60 + lrIdx * 12,
      "Dataset Scale": 40 + dsIdx * 16,
      "Cost Efficiency": 50 - dsIdx * 10,
    },
    CAG: {
      "Explainability": 45 + crIdx * 10,
      "Data Freshness": 40 + dvIdx * 10,
      "Latency Fit": 70 + lrIdx * 8,
      "Dataset Scale": 85 - dsIdx * 20,
      "Cost Efficiency": 75 - qvIdx * 12,
    },
    Hybrid: {
      "Explainability": 60 + crIdx * 12,
      "Data Freshness": 55 + dvIdx * 12,
      "Latency Fit": 65 + lrIdx * 5,
      "Dataset Scale": 60 + dsIdx * 12,
      "Cost Efficiency": 45 - dsIdx * 8,
    },
  };

  return { scores, recommended, ranking, factor_breakdown };
}

const DEFAULT_SIGNALS: Record<string, string> = {
  dataset_size: "medium",
  query_volume: "medium",
  latency_requirement: "moderate",
  data_volatility: "moderate",
  accuracy_requirement: "high",
  domain_specificity: "specialized",
  security_level: "elevated",
  cost_sensitivity: "moderate",
  deployment_preference: "cloud",
  user_scale: "medium",
  citation_requirement: "high",
  context_size: "medium",
};

export default function WhatIfEditor() {
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const [key, cfg] of Object.entries(SIGNAL_CONFIG)) {
      init[key] = cfg.options.indexOf(DEFAULT_SIGNALS[key] || cfg.options[0]);
    }
    return init;
  });

  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentSignals = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [key, idx] of Object.entries(sliderValues)) {
      out[key] = SIGNAL_CONFIG[key].options[idx] || SIGNAL_CONFIG[key].options[0];
    }
    return out;
  }, [sliderValues]);

  const { scores, recommended, ranking, factor_breakdown } = useMemo(
    () => calculateDeterministicScores(currentSignals),
    [currentSignals]
  );

  const handleSliderChange = useCallback((signalKey: string, rawValue: number) => {
    setSliderValues((prev) => ({ ...prev, [signalKey]: rawValue }));
  }, []);

  const handleReset = useCallback(() => {
    const init: Record<string, number> = {};
    for (const [key, cfg] of Object.entries(SIGNAL_CONFIG)) {
      init[key] = cfg.options.indexOf(DEFAULT_SIGNALS[key] || cfg.options[0]);
    }
    setSliderValues(init);
  }, []);

  const radarData = useMemo(() => {
    const subjects = Object.keys(factor_breakdown.RAG);
    return subjects.map((subject) => ({
      subject,
      RAG: factor_breakdown.RAG[subject],
      FineTuning: factor_breakdown.FineTuning[subject],
      CAG: factor_breakdown.CAG[subject],
      Hybrid: factor_breakdown.Hybrid[subject],
    }));
  }, [factor_breakdown]);

  const costRanges = useMemo(() => {
    return {
      RAG: estimateMonthlyCost(currentSignals, "RAG"),
      FineTuning: estimateMonthlyCost(currentSignals, "FineTuning"),
      CAG: estimateMonthlyCost(currentSignals, "CAG"),
      Hybrid: estimateMonthlyCost(currentSignals, "Hybrid"),
    };
  }, [currentSignals]);

  return (
    <div className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
      {/* Illustrative Fixture Label Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[color:var(--border)] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[color:var(--text-primary)]/10 border border-[color:var(--border)] flex items-center justify-center">
            <SlidersHorizontal size={18} className="text-[color:var(--text-primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-[color:var(--text-primary)]">
                ArchGuide: What-If Analysis
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                Illustrative fixture, not real output
              </span>
            </div>
            <p className="text-xs text-[color:var(--text-secondary)] mt-0.5">
              Change any requirement slider to watch the deterministic ranking, sensitivity radar, and cost projections adapt.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            suppressHydrationWarning
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[color:var(--border)] bg-[color:var(--background)] hover:bg-[color:var(--surface)] transition-colors active:scale-95 text-[color:var(--text-primary)]"
          >
            <RotateCcw size={12} /> Reset to Baseline
          </button>
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border border-[color:var(--border)] bg-[color:var(--text-primary)] text-[color:var(--background)] hover:opacity-90 transition-opacity active:scale-95"
          >
            {isOpen ? "Hide Sliders" : "Adjust Requirements"}
          </button>
        </div>
      </div>

      {/* Top Banner: Current Winner & Cost */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] flex items-center justify-between">
          <div>
            <span className="text-xs text-[color:var(--text-secondary)] font-medium">Top Recommendation</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-2xl font-black"
                style={{ color: ARCH_COLOR_MAP[recommended] || "var(--text-primary)" }}
              >
                {recommended}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-bold">
                {(scores[recommended as keyof typeof scores] * 100).toFixed(0)}% fit
              </span>
            </div>
          </div>
          <Zap size={24} style={{ color: ARCH_COLOR_MAP[recommended] }} />
        </div>

        <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]">
          <span className="text-xs text-[color:var(--text-secondary)] font-medium">Projected Cost (Recommended)</span>
          <p className="text-xl font-bold mt-1 text-[color:var(--text-primary)]">
            {formatCost(costRanges[recommended as keyof typeof costRanges][0])} – {formatCost(costRanges[recommended as keyof typeof costRanges][1])}
            <span className="text-xs text-[color:var(--text-secondary)] font-normal ml-1">/mo</span>
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] flex items-center justify-between">
          <div>
            <span className="text-xs text-[color:var(--text-secondary)] font-medium">Decision Engine</span>
            <p className="text-sm font-bold text-[color:var(--text-primary)] mt-1 flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-400" /> Deterministic Layer
            </p>
          </div>
          <span className="text-[10px] text-[color:var(--text-secondary)] border border-[color:var(--border)] px-2 py-1 rounded-md">
            12 active signals
          </span>
        </div>
      </div>

      {/* Main Grid: Sliders vs Radar & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders Panel */}
        <div className={`lg:col-span-7 space-y-4 ${isOpen ? "block" : "hidden"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(SIGNAL_CONFIG).map(([key, cfg]) => {
              const currentIdx = sliderValues[key] ?? 0;
              const currentValueLabel = cfg.optionLabels[currentIdx] || cfg.optionLabels[0];
              return (
                <div
                  key={key}
                  className="p-3.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]/60 hover:border-[color:var(--text-secondary)]/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[color:var(--text-primary)]">
                      {cfg.label}
                    </label>
                    <span className="text-xs font-bold text-[color:var(--primary)] px-2 py-0.5 rounded bg-[color:var(--surface)] border border-[color:var(--border)]">
                      {currentValueLabel}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={cfg.options.length - 1}
                    step={1}
                    value={currentIdx}
                    onChange={(e) => handleSliderChange(key, parseInt(e.target.value, 10))}
                    className="w-full accent-[color:var(--primary)] cursor-pointer h-1.5 bg-[color:var(--border)] rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-[color:var(--text-secondary)] mt-1">
                    <span>{cfg.optionLabels[0]}</span>
                    <span>{cfg.optionLabels[cfg.optionLabels.length - 1]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side: Radar Chart and Ranked Architectures */}
        <div className={isOpen ? "lg:col-span-5 flex flex-col gap-6" : "lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8"}>
          {/* Radar Chart */}
          <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)] mb-2 flex items-center justify-between">
              <span>Sensitivity Breakdown</span>
              <span className="text-[10px] font-normal text-emerald-400">Live recalculation</span>
            </h4>
            <div className="w-full h-56 sm:h-64 flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="none" />
                    <Radar
                      name="RAG"
                      dataKey="RAG"
                      stroke={ARCH_COLOR_MAP.RAG}
                      fill={ARCH_COLOR_MAP.RAG}
                      fillOpacity={recommended === "RAG" ? 0.35 : 0.08}
                    />
                    <Radar
                      name="FineTuning"
                      dataKey="FineTuning"
                      stroke={ARCH_COLOR_MAP.FineTuning}
                      fill={ARCH_COLOR_MAP.FineTuning}
                      fillOpacity={recommended === "FineTuning" ? 0.35 : 0.08}
                    />
                    <Radar
                      name="CAG"
                      dataKey="CAG"
                      stroke={ARCH_COLOR_MAP.CAG}
                      fill={ARCH_COLOR_MAP.CAG}
                      fillOpacity={recommended === "CAG" ? 0.35 : 0.08}
                    />
                    <Radar
                      name="Hybrid"
                      dataKey="Hybrid"
                      stroke={ARCH_COLOR_MAP.Hybrid}
                      fill={ARCH_COLOR_MAP.Hybrid}
                      fillOpacity={recommended === "Hybrid" ? 0.35 : 0.08}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "var(--text-primary)",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[color:var(--text-secondary)]">
                  Loading chart...
                </div>
              )}
            </div>
          </div>

          {/* Ranked Architecture Cards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-secondary)]">
              Ranked Architectures
            </h4>
            {ranking.map((arch, rankIdx) => {
              const scoreVal = scores[arch as keyof typeof scores];
              const isWinner = rankIdx === 0;
              const cost = costRanges[arch as keyof typeof costRanges];
              return (
                <m.div
                  key={arch}
                  layout
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    isWinner
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 shadow-md"
                      : "border-[color:var(--border)] bg-[color:var(--background)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        isWinner
                          ? "bg-[color:var(--text-primary)] text-[color:var(--background)]"
                          : "bg-[color:var(--surface)] text-[color:var(--text-secondary)] border border-[color:var(--border)]"
                      }`}
                    >
                      {rankIdx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold text-sm"
                          style={{ color: ARCH_COLOR_MAP[arch] }}
                        >
                          {arch}
                        </span>
                        {isWinner && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[color:var(--text-secondary)]">
                        Est. {formatCost(cost[0])} – {formatCost(cost[1])}/mo
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-[color:var(--text-primary)]">
                      {(scoreVal * 100).toFixed(0)}%
                    </span>
                    <span className="block text-[10px] text-[color:var(--text-secondary)]">
                      Match Index
                    </span>
                  </div>
                </m.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
