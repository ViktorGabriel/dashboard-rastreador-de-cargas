"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  ReferenceLine,
  Label,
} from "recharts";
import {
  Flame,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  BarChart2,
  AlertTriangle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FatigueBlock {
  label: string;
  weekKey: string;
  volume_kg: number;
  sets: number;
  sessions: number;
  avg_rpe: number | null;
  avg_rir: number | null;
  fatigue_volume: number;
  fatigue_intensity: number;
  fatigue_total: number;
}

interface ScatterPoint {
  rpe: number;
  rir: number;
  volume: number;
  week: string;
  muscle: string;
}

interface FatigueRPEChartProps {
  refreshTrigger: number;
}

// ── Colour helpers ────────────────────────────────────────────────────────────

// Map fatigue_total 0-100 → colour: low=sky, medium=amber, high=rose
function fatigueColor(total: number): string {
  if (total >= 75) return "#f43f5e";
  if (total >= 50) return "#f59e0b";
  if (total >= 25) return "#38bdf8";
  return "#34d399";
}

function fatigueLabel(total: number): string {
  if (total >= 75) return "Crítico";
  if (total >= 50) return "Alto";
  if (total >= 25) return "Moderado";
  return "Baixo";
}

// Unique weeks for scatter colouring
const WEEK_PALETTE = [
  "#34d399", "#38bdf8", "#a855f7", "#f59e0b",
  "#f43f5e", "#ec4899", "#818cf8", "#14b8a6",
];

// ── Custom Tooltips ───────────────────────────────────────────────────────────

interface BlockTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: FatigueBlock; value: number; name: string }>;
  label?: string;
}

function BlockTooltip({ active, payload, label }: BlockTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = fatigueColor(d.fatigue_total);
  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/97 border border-white/10 shadow-2xl backdrop-blur-2xl text-xs space-y-2 min-w-[210px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="font-bold text-white tracking-tight">{label}</span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
        >
          {fatigueLabel(d.fatigue_total)}
        </span>
      </div>
      <div className="space-y-1 font-mono text-[11px]">
        <Row label="Fadiga Total" value={`${d.fatigue_total}/100`} color={color} />
        <Row label="↳ Volume Score" value={String(d.fatigue_volume)} color="#38bdf8" />
        <Row label="↳ Intensidade Score" value={String(d.fatigue_intensity)} color="#f59e0b" />
        <div className="pt-1 border-t border-white/5" />
        <Row label="Volume Load" value={`${d.volume_kg.toLocaleString("pt-BR")} kg`} color="#94a3b8" />
        <Row label="Séries" value={String(d.sets)} color="#94a3b8" />
        <Row label="Sessões" value={String(d.sessions)} color="#94a3b8" />
        {d.avg_rpe !== null && <Row label="RPE Médio" value={`@${d.avg_rpe}`} color="#a855f7" />}
        {d.avg_rir !== null && <Row label="RIR Médio" value={`${d.avg_rir} reps`} color="#ec4899" />}
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}:</span>
      <span className="font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScatterPoint }>;
}

function ScatterTooltip({ active, payload }: ScatterTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  // Interpret RPE/RIR relationship
  const sum = d.rpe + d.rir;
  const proximity = Math.abs(10 - sum); // ideal: RPE + RIR ≈ 10
  const isCoherent = proximity <= 1.5;
  return (
    <div className="p-3 rounded-2xl bg-slate-950/97 border border-white/10 shadow-2xl backdrop-blur-2xl text-xs space-y-1.5 min-w-[180px]">
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 mb-1.5">
        <Brain className="h-3.5 w-3.5 text-purple-400" />
        <span className="font-bold text-white">Correlação RPE/RIR</span>
      </div>
      <Row label="RPE" value={`@${d.rpe}`} color="#a855f7" />
      <Row label="RIR" value={`${d.rir} reps`} color="#ec4899" />
      <Row label="Volume" value={`${d.volume.toLocaleString("pt-BR")} kg`} color="#38bdf8" />
      <Row label="Grupo Musc." value={d.muscle} color="#94a3b8" />
      <div className="pt-1 border-t border-white/5">
        <div className={`flex items-center gap-1 text-[10px] font-bold ${isCoherent ? "text-emerald-400" : "text-amber-400"}`}>
          {isCoherent ? (
            <><Activity className="h-3 w-3" /> Coerência RPE/RIR ✓</>
          ) : (
            <><AlertTriangle className="h-3 w-3" /> Divergência {proximity.toFixed(1)} pts</>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Summary KPI bar ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  trend,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  trend?: "up" | "down" | "flat";
  color: string;
}) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div className="flex-1 p-3 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition">
          {label}
        </span>
        {trend && (
          <TrendIcon
            className="h-3.5 w-3.5"
            style={{ color }}
          />
        )}
      </div>
      <p className="text-lg font-black tabular-nums leading-none" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FatigueRPEChart({ refreshTrigger }: FatigueRPEChartProps) {
  const [blocks, setBlocks] = useState<FatigueBlock[]>([]);
  const [scatter, setScatter] = useState<ScatterPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"fatigue" | "scatter">("fatigue");

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/metrics?summary=fatigue");
        const data = await res.json();
        if (active) {
          if (data.blocks) setBlocks(data.blocks);
          if (data.scatter) setScatter(data.scatter);
        }
      } catch (err) {
        console.error("Erro ao carregar dados de fadiga:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [refreshTrigger]);



  // ── KPI derivations ─────────────────────────────────────────────────────
  const lastBlock = blocks[blocks.length - 1];
  const prevBlock = blocks[blocks.length - 2];
  const fatigueTrend: "up" | "down" | "flat" =
    !lastBlock || !prevBlock
      ? "flat"
      : lastBlock.fatigue_total > prevBlock.fatigue_total
      ? "up"
      : lastBlock.fatigue_total < prevBlock.fatigue_total
      ? "down"
      : "flat";

  const hasScatter = scatter.length > 0;
  const hasBlocks = blocks.length > 0;

  // RPE/RIR coherence: % of points where |rpe + rir - 10| <= 1.5
  const coherentCount = scatter.filter((s) => Math.abs(s.rpe + s.rir - 10) <= 1.5).length;
  const coherencePct = scatter.length > 0 ? Math.round((coherentCount / scatter.length) * 100) : null;

  // Unique weeks for scatter colours
  const uniqueWeeks = Array.from(new Set(scatter.map((s) => s.week)));
  const weekColorMap = Object.fromEntries(
    uniqueWeeks.map((w, i) => [w, WEEK_PALETTE[i % WEEK_PALETTE.length]])
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="bezel-shell">
      <div className="bezel-core p-5 sm:p-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Fadiga Acumulada & RPE vs RIR
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10 uppercase tracking-widest">
                  Periodização
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Fadiga semanal por bloco · Correlação esforço percebido vs reserva de reps
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs shadow-inner self-start sm:self-center">
            <button
              type="button"
              onClick={() => setActiveView("fatigue")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeView === "fatigue"
                  ? "bg-gradient-to-r from-rose-500/25 to-orange-500/25 text-rose-300 border border-rose-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="h-3 w-3" />
              Fadiga
            </button>
            <button
              type="button"
              onClick={() => setActiveView("scatter")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeView === "scatter"
                  ? "bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-300 border border-purple-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Brain className="h-3 w-3" />
              RPE vs RIR
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {hasBlocks && (
          <div className="flex flex-wrap gap-2">
            <KpiCard
              label="Fadiga Atual"
              value={lastBlock ? `${lastBlock.fatigue_total}/100` : "—"}
              sub={lastBlock ? `${fatigueLabel(lastBlock.fatigue_total)} • ${lastBlock.label}` : "Sem dados"}
              trend={fatigueTrend}
              color={lastBlock ? fatigueColor(lastBlock.fatigue_total) : "#64748b"}
            />
            <KpiCard
              label="Blocos Registrados"
              value={String(blocks.length)}
              sub={`${blocks.reduce((a, b) => a + b.sessions, 0)} sessões no total`}
              color="#38bdf8"
            />
            {coherencePct !== null && (
              <KpiCard
                label="Coerência RPE/RIR"
                value={`${coherencePct}%`}
                sub={`${coherentCount}/${scatter.length} séries coerentes`}
                trend={coherencePct >= 70 ? "up" : coherencePct >= 40 ? "flat" : "down"}
                color={coherencePct >= 70 ? "#34d399" : coherencePct >= 40 ? "#f59e0b" : "#f43f5e"}
              />
            )}
            {lastBlock?.avg_rpe !== null && lastBlock?.avg_rpe !== undefined && (
              <KpiCard
                label="RPE Médio Recente"
                value={`@${lastBlock.avg_rpe}`}
                sub={lastBlock.avg_rir !== null ? `RIR ${lastBlock.avg_rir} reps restantes` : "Sem RIR"}
                color="#a855f7"
              />
            )}
          </div>
        )}

        {/* Chart area */}
        <div className="h-72 w-full">
          {isLoading ? (
            <div className="h-full w-full rounded-2xl skeleton-shimmer border border-white/5 flex flex-col items-center justify-center gap-3">
              <Activity className="h-6 w-6 text-rose-400 animate-pulse" />
              <p className="text-xs font-medium text-slate-400">
                Calculando fadiga acumulada...
              </p>
            </div>
          ) : !hasBlocks ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-slate-950/30 gap-3">
              <div className="p-3 rounded-2xl bg-white/5">
                <Flame className="h-8 w-8 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Nenhum dado de periodização ainda
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Registre treinos com RPE (ex:{" "}
                  <em>&ldquo;4x8 supino 90kg @RPE8&rdquo;</em>) para gerar os
                  gráficos de fadiga e correlação de intensidade.
                </p>
              </div>
            </div>
          ) : activeView === "fatigue" ? (
            /* ── Fatigue stacked bar chart ── */
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={blocks}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={blocks.length > 8 ? 18 : 28}
              >
                <defs>
                  <linearGradient id="gradVolScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="gradIntScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#b45309" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 100]}
                  dx={-4}
                >
                  <Label
                    value="Índice 0-100"
                    angle={-90}
                    position="insideLeft"
                    offset={12}
                    style={{ fontSize: 10, fill: "#475569" }}
                  />
                </YAxis>
                <Tooltip content={<BlockTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                  formatter={(value) => (
                    <span style={{ color: "#94a3b8" }}>{value}</span>
                  )}
                />
                <ReferenceLine
                  y={75}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "Zona Crítica",
                    fill: "#f43f5e",
                    fontSize: 10,
                    position: "right",
                  }}
                />
                <ReferenceLine
                  y={50}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: "Zona Alta",
                    fill: "#f59e0b",
                    fontSize: 10,
                    position: "right",
                  }}
                />
                <Bar
                  dataKey="fatigue_volume"
                  name="Fadiga de Volume"
                  stackId="fatigue"
                  fill="url(#gradVolScore)"
                  radius={[0, 0, 4, 4]}
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {blocks.map((b) => (
                    <Cell
                      key={b.weekKey}
                      fill="url(#gradVolScore)"
                      opacity={b.fatigue_total >= 75 ? 1 : 0.85}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="fatigue_intensity"
                  name="Fadiga de Intensidade"
                  stackId="fatigue"
                  fill="url(#gradIntScore)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                >
                  {blocks.map((b) => (
                    <Cell
                      key={b.weekKey}
                      fill="url(#gradIntScore)"
                      opacity={b.fatigue_total >= 75 ? 1 : 0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            /* ── RPE vs RIR Scatter Chart ── */
            hasScatter ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    type="number"
                    dataKey="rpe"
                    name="RPE"
                    domain={[5, 10.5]}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                  >
                    <Label
                      value="RPE (Esforço Percebido)"
                      offset={-4}
                      position="insideBottom"
                      style={{ fontSize: 10, fill: "#475569" }}
                    />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="rir"
                    name="RIR"
                    domain={[-0.5, 6]}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    dx={-4}
                  >
                    <Label
                      value="RIR (Reps Restantes)"
                      angle={-90}
                      position="insideLeft"
                      offset={14}
                      style={{ fontSize: 10, fill: "#475569" }}
                    />
                  </YAxis>
                  <ZAxis
                    type="number"
                    dataKey="volume"
                    range={[40, 400]}
                    name="Volume (kg)"
                  />
                  <Tooltip content={<ScatterTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }} />

                  {/* Ideal coherence line: RPE + RIR = 10  →  RIR = 10 - RPE */}
                  <ReferenceLine
                    segment={[
                      { x: 6, y: 4 },
                      { x: 10, y: 0 },
                    ]}
                    stroke="rgba(255,255,255,0.15)"
                    strokeDasharray="5 4"
                    strokeWidth={1.5}
                    label={{
                      value: "RPE+RIR=10",
                      fill: "#475569",
                      fontSize: 9,
                      position: "insideTopRight",
                    }}
                  />
                  <Scatter
                    name="Séries"
                    data={scatter}
                    isAnimationActive
                    animationDuration={600}
                  >
                    {scatter.map((s, i) => (
                      <Cell
                        key={i}
                        fill={weekColorMap[s.week] || "#94a3b8"}
                        fillOpacity={0.75}
                        stroke={weekColorMap[s.week] || "#94a3b8"}
                        strokeOpacity={0.4}
                        strokeWidth={1}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-slate-950/30 gap-3">
                <div className="p-3 rounded-2xl bg-white/5">
                  <Brain className="h-8 w-8 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Sem dados de RPE e RIR simultaneamente
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Para gerar o gráfico de correlação, registre séries com ambos
                  RPE e RIR (ex:{" "}
                  <em>&ldquo;4x8 agachamento 100kg @RPE8 RIR2&rdquo;</em>).
                </p>
              </div>
            )
          )}
        </div>

        {/* Legend / interpretation footer */}
        {!isLoading && hasBlocks && activeView === "fatigue" && (
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { label: "Baixo (0–24)", color: "#34d399", range: "Recuperação adequada" },
              { label: "Moderado (25–49)", color: "#38bdf8", range: "Acúmulo controlado" },
              { label: "Alto (50–74)", color: "#f59e0b", range: "Monitorar descanso" },
              { label: "Crítico (75+)", color: "#f43f5e", range: "Risco de overreaching" },
            ].map((z) => (
              <div
                key={z.label}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background: `${z.color}11`, border: `1px solid ${z.color}22` }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: z.color }}
                />
                <span className="text-[10px] font-semibold" style={{ color: z.color }}>
                  {z.label}
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  · {z.range}
                </span>
              </div>
            ))}
          </div>
        )}

        {!isLoading && hasScatter && activeView === "scatter" && (
          <p className="text-[10px] text-slate-500 pt-1">
            <span className="text-slate-400 font-semibold">Linha de referência:</span> RPE +
            RIR = 10 (coerência teórica). Bolhas acima da linha = subestimação de esforço;
            abaixo = superestimação. Tamanho da bolha = volume da série (kg).
          </p>
        )}
      </div>
    </div>
  );
}
