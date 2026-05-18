import { useState, useEffect, useRef } from 'react';

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { from: null,   to: null,   desc: "Cliquez sur ▶ pour simuler un traitement de commande vocale." },
  { from: 'UI',   to: 'GW',   desc: "Audio transcrit via STT — texte transmis à l'API Gateway." },
  { from: 'GW',   to: 'Anon', desc: "Texte brut envoyé à l'Anonymizer (Stanford CoreNLP)." },
  { from: 'Anon', to: 'GW',   desc: "Entités PII masquées par tokens réversibles — texte retourné." },
  { from: 'GW',   to: 'LLM',  desc: "Prompt anonymisé soumis à Ollama (Llama 3.1) pour analyse NLU." },
  { from: 'LLM',  to: 'GW',   desc: "Plan d'action structuré retourné en JSON." },
  { from: 'GW',   to: 'Val',  desc: "JSON transmis au Validator (AJV) pour contrôle de schéma." },
  { from: 'Val',  to: 'GW',   desc: "Structure JSON validée — aucune anomalie détectée." },
  { from: 'GW',   to: 'Anon', desc: "JSON renvoyé à l'Anonymizer pour réhydratation des PII." },
  { from: 'Anon', to: 'GW',   desc: "Plan reconstruit avec les vraies données personnelles." },
  { from: 'GW',   to: 'UI',   desc: "Confirmation requise — action soumise à l'utilisateur." },
  { from: 'UI',   to: 'GW',   desc: "Utilisateur valide — autorisation accordée." },
  { from: 'GW',   to: 'MSvc', desc: "Ordre d'exécution transmis à l'Email Service." },
  { from: 'MSvc', to: 'MSrv', desc: "Requêtes IMAP/SMTP envoyées au serveur mail." },
  { from: 'MSrv', to: 'MSvc', desc: "Statut d'envoi et données retournés." },
  { from: 'MSvc', to: 'GW',   desc: "Confirmation d'exécution remontée à la Gateway." },
  { from: 'GW',   to: 'UI',   desc: "✓ Email envoyé — interface mise à jour.", success: true },
];

const MAX = STEPS.length - 1;

// ─── Layout : viewBox "0 0 314 204" ──────────────────────────────────────────

const NODES = {
  UI:   { cx: 157, cy: 20,  w: 76,  h: 28, label: 'CLIENT UI',   sub: 'React · TS',          col: '#fb7185' },
  GW:   { cx: 157, cy: 96,  w: 90,  h: 36, label: 'API GATEWAY', sub: 'BFF · Orchestrateur', col: '#818cf8' },
  Anon: { cx: 44,  cy: 178, w: 70,  h: 28, label: 'ANONYMIZER',  sub: 'Java · Stanford NLP', col: '#34d399' },
  LLM:  { cx: 124, cy: 178, w: 70,  h: 28, label: 'OLLAMA LLM',  sub: 'Llama 3.1',           col: '#c084fc' },
  Val:  { cx: 204, cy: 178, w: 70,  h: 28, label: 'VALIDATOR',   sub: 'AJV · JSON Schema',   col: '#fbbf24' },
  MSvc: { cx: 276, cy: 96,  w: 70,  h: 28, label: 'EMAIL SVC',   sub: 'TypeScript',          col: '#38bdf8' },
  MSrv: { cx: 276, cy: 178, w: 70,  h: 28, label: 'MAIL SERVER', sub: 'IMAP · SMTP',         col: '#94a3b8' },
};

// ─── Edges ────────────────────────────────────────────────────────────────────
// fwd = path A→B, bwd = path B→A

const EDGES = [
  {
    a: 'UI', b: 'GW',
    fwd: 'M 157 34 L 157 78',
    bwd: 'M 157 78 L 157 34',
  },
  {
    a: 'GW', b: 'Anon',
    fwd: 'M 157 114 Q 100 146 44 164',
    bwd: 'M 44 164 Q 100 146 157 114',
  },
  {
    a: 'GW', b: 'LLM',
    fwd: 'M 157 114 Q 140 146 124 164',
    bwd: 'M 124 164 Q 140 146 157 114',
  },
  {
    a: 'GW', b: 'Val',
    fwd: 'M 157 114 Q 180 146 204 164',
    bwd: 'M 204 164 Q 180 146 157 114',
  },
  {
    a: 'GW', b: 'MSvc',
    fwd: 'M 202 96 L 241 96',
    bwd: 'M 241 96 L 202 96',
  },
  {
    a: 'MSvc', b: 'MSrv',
    fwd: 'M 276 110 L 276 164',
    bwd: 'M 276 164 L 276 110',
  },
];

function findEdge(from, to) {
  if (!from || !to) return null;
  return EDGES.find(e => (e.a === from && e.b === to) || (e.a === to && e.b === from)) ?? null;
}

// ─── Animation constants ──────────────────────────────────────────────────────

const SPEED   = 55;   // SVG units / second
const MIN_DUR = 1.1;  // minimum cycle duration (seconds)
const N_DOTS  = 3;    // particles per edge
const STEP_MS = 2400; // ms per step

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArchitectureSimulator() {
  const [step, setStep]       = useState(0);
  const [playing, setPlaying] = useState(false);
  const [dots, setDots]       = useState([]);

  const pathRef  = useRef(null);
  const rafRef   = useRef(null);
  const raf0Ref  = useRef(null);
  const startRef = useRef(null);

  // ── Auto-play ──
  useEffect(() => {
    if (!playing) return;
    if (step >= MAX) { setPlaying(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, step]);

  // ── Tout éteindre après la dernière étape ──
  useEffect(() => {
    if (step < MAX || playing) return;
    const t = setTimeout(() => {
      if (raf0Ref.current) cancelAnimationFrame(raf0Ref.current);
      if (rafRef.current)  cancelAnimationFrame(rafRef.current);
      setDots([]);
      setStep(0);
    }, 1400);
    return () => clearTimeout(t);
  }, [step, playing]);

  const { from, to, desc, success } = STEPS[step];
  const activeEdge = findEdge(from, to);
  const activePath = activeEdge
    ? (activeEdge.a === from ? activeEdge.fwd : activeEdge.bwd)
    : null;
  const isActive  = id => id === from || id === to;
  const fromColor = from ? NODES[from].col : null;
  const toColor   = to   ? NODES[to].col   : null;
  // Particle color = blend toward destination color
  const dotColor  = toColor ?? '#818cf8';

  // ── RAF particle loop ──
  useEffect(() => {
    // Clear previous RAF
    if (raf0Ref.current)  cancelAnimationFrame(raf0Ref.current);
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    setDots([]);

    if (!activePath) return;

    // Wait one frame so the hidden <path ref> is in the DOM
    raf0Ref.current = requestAnimationFrame(() => {
      const svgPath = pathRef.current;
      if (!svgPath) return;

      const totalLen = svgPath.getTotalLength();
      const dur      = Math.max(totalLen / SPEED, MIN_DUR);

      const tick = (ts) => {
        if (!startRef.current) startRef.current = ts;
        const t = (ts - startRef.current) / 1000;

        const newDots = Array.from({ length: N_DOTS }, (_, i) => {
          const frac = ((t / dur) + i / N_DOTS) % 1;
          const pt   = svgPath.getPointAtLength(frac * totalLen);
          return { x: pt.x, y: pt.y, alpha: 0.55 + 0.45 * Math.sin((frac * Math.PI * 2) + i) };
        });

        setDots(newDots);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    });

    return () => {
      if (raf0Ref.current) cancelAnimationFrame(raf0Ref.current);
      if (rafRef.current)  cancelAnimationFrame(rafRef.current);
    };
  }, [activePath]);

  const play  = () => { if (step >= MAX) setStep(1); setPlaying(true); };
  const pause = () => setPlaying(false);
  const reset = () => { setStep(0); setPlaying(false); };
  const next  = () => { setStep(s => Math.min(s + 1, MAX)); setPlaying(false); };

  return (
    <div className="w-full flex flex-col bg-[#020617] font-sans select-none overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/70">

        <span className="font-mono text-[10px] font-bold text-slate-500 shrink-0 w-[48px] tracking-wider">
          {step === 0 ? '—/16' : `${String(step).padStart(2, '0')}/16`}
        </span>

        <div className="flex-1 h-[2px] bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${(step / MAX) * 100}%`,
              background: success
                ? 'linear-gradient(90deg,#10b981,#34d399)'
                : 'linear-gradient(90deg,#4f46e5,#818cf8)',
            }}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Btn onClick={reset} disabled={step === 0} title="Recommencer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.364-1M20 15a9 9 0 01-15.364 1"/>
            </svg>
          </Btn>
          {playing ? (
            <Btn onClick={pause} active>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            </Btn>
          ) : (
            <Btn onClick={play} primary>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </Btn>
          )}
          <Btn onClick={next} disabled={step >= MAX || playing} title="Étape suivante">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path d="M6 18l8-6-8-6v12zm10-12v12h2V6h-2z"/>
            </svg>
          </Btn>
        </div>
      </div>

      {/* ── SVG Diagram ─────────────────────────────────────────────────── */}
      <svg viewBox="0 0 314 204" xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%' }}>

        <defs>
          {/* Subtle grid */}
          <pattern id="as-grid" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(51,65,85,0.18)" strokeWidth="0.4"/>
          </pattern>

          {/* Glow filters */}
          <filter id="as-gn" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feComposite in="SourceGraphic" in2="b" operator="over"/>
          </filter>
          <filter id="as-gl" x="-40%" y="-300%" width="180%" height="700%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feComposite in="SourceGraphic" in2="b" operator="over"/>
          </filter>
          <filter id="as-gd" x="-400%" y="-400%" width="900%" height="900%">
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feComposite in="SourceGraphic" in2="b" operator="over"/>
          </filter>
        </defs>

        {/* Background */}
        <rect width="314" height="204" fill="#020617"/>
        <rect width="314" height="204" fill="url(#as-grid)"/>

        {/* ── Static dim edges ── */}
        {EDGES.map(e => {
          const isLit = activeEdge === e;
          return (
            <path
              key={`e-${e.a}-${e.b}`}
              d={e.fwd}
              stroke={isLit ? dotColor : 'rgba(51,65,85,0.3)'}
              strokeWidth={isLit ? 1 : 0.8}
              strokeDasharray={isLit ? 'none' : '3 6'}
              fill="none"
              strokeLinecap="round"
              style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
            />
          );
        })}

        {/* ── Active edge glow ── */}
        {activePath && (
          <path
            d={activePath}
            stroke={dotColor}
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            opacity="0.1"
            filter="url(#as-gl)"
          />
        )}

        {/* Hidden path for getPointAtLength */}
        {activePath && (
          <path ref={pathRef} d={activePath} fill="none" stroke="none" visibility="hidden"/>
        )}

        {/* ── Particles ── */}
        {dots.map((d, i) => (
          <g key={i}>
            {/* Glow halo */}
            <circle cx={d.x} cy={d.y} r="5" fill={dotColor}
              opacity={0.18 * d.alpha} filter="url(#as-gd)"/>
            {/* Core dot */}
            <circle cx={d.x} cy={d.y} r="2.4" fill={dotColor} opacity={d.alpha}/>
          </g>
        ))}

        {/* ── Nodes ── */}
        {Object.entries(NODES).map(([id, { cx, cy, w, h, label, sub, col }]) => {
          const active = isActive(id);
          const isGW   = id === 'GW';
          const rx     = 6;

          return (
            <g key={id}>
              {/* Outer glow ring when active */}
              {active && (
                <rect
                  x={cx - w / 2 - 4} y={cy - h / 2 - 4}
                  width={w + 8} height={h + 8} rx={rx + 3}
                  fill="none" stroke={col} strokeWidth="1"
                  opacity="0.35" filter="url(#as-gn)"
                />
              )}

              {/* Box */}
              <rect
                x={cx - w / 2} y={cy - h / 2}
                width={w} height={h} rx={rx}
                fill={active ? `${col}16` : 'rgba(10,20,38,0.97)'}
                stroke={active ? col : 'rgba(51,65,85,0.5)'}
                strokeWidth={active ? 1.3 : 0.7}
                style={{
                  filter: active ? `drop-shadow(0 0 8px ${col}40)` : 'none',
                  transition: 'all 0.3s ease',
                }}
              />

              {/* Colored left-border accent */}
              <rect
                x={cx - w / 2} y={cy - h / 2 + 4}
                width="2.5" height={h - 8} rx="1.25"
                fill={active ? col : 'rgba(51,65,85,0.25)'}
                style={{ transition: 'fill 0.3s' }}
              />

              {/* Label */}
              <text
                x={cx - w / 2 + 10} y={cy - (isGW ? 4 : 3)}
                fontSize={isGW ? '6' : '5.5'} fontWeight="700"
                fill={active ? '#f1f5f9' : '#475569'}
                style={{ transition: 'fill 0.3s', letterSpacing: '0.04em' }}>
                {label}
              </text>

              {/* Sub-label */}
              <text
                x={cx - w / 2 + 10} y={cy + (isGW ? 6 : 6)}
                fontSize="4.4"
                fill={active ? `${col}cc` : '#1e293b'}
                style={{ transition: 'fill 0.3s' }}>
                {sub}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Description bar ─────────────────────────────────────────────── */}
      <div className="px-3 py-2.5 border-t border-slate-800/70 flex items-center gap-2.5"
        style={{ minHeight: '48px' }}>

        {/* from → to badges */}
        {from && to && (
          <div className="flex items-center gap-1 shrink-0 font-mono text-[9px] font-bold">
            <span className="px-1.5 py-0.5 rounded"
              style={{ background: `${NODES[from].col}1a`, color: NODES[from].col }}>
              {from}
            </span>
            <svg viewBox="0 0 16 16" className="w-3 h-3 text-slate-600" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
            <span className="px-1.5 py-0.5 rounded"
              style={{ background: `${NODES[to].col}1a`, color: NODES[to].col }}>
              {to}
            </span>
          </div>
        )}

        {/* Description */}
        <p key={step} className="text-[11px] leading-relaxed flex-1"
          style={{ color: success ? '#34d399' : '#94a3b8' }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

function Btn({ onClick, disabled, children, title, primary, active }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="w-6 h-6 rounded flex items-center justify-center transition-all disabled:opacity-20"
      style={{
        background: primary ? '#4f46e5' : active ? '#3730a3' : 'rgba(15,23,42,1)',
        color: primary || active ? '#fff' : '#94a3b8',
        boxShadow: primary ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
      }}>
      {children}
    </button>
  );
}
