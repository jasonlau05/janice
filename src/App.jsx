import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────── Google Fonts ─────────── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lato:wght@300;400;700&display=swap');
    @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
    @keyframes candleGrow {
      0%   { transform: scaleY(0); opacity: 0; }
      70%  { transform: scaleY(1.1); opacity: 1; }
      100% { transform: scaleY(1); opacity: 1; }
    }
    @keyframes candleTip {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(var(--tip-angle)); }
    }
    @keyframes flameDance {
      0%,100% { transform: scaleX(1)   scaleY(1)    rotate(-3deg); }
      33%     { transform: scaleX(0.8) scaleY(1.15) rotate(4deg);  }
      66%     { transform: scaleX(1.1) scaleY(0.88) rotate(-1deg); }
    }
    @keyframes flameIn {
      0%   { opacity:0; transform: scale(0.2); }
      100% { opacity:1; transform: scale(1);   }
    }
    @keyframes slideInRight {
      from { opacity:0; transform:translateX(60px); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes slideInLeft {
      from { opacity:0; transform:translateX(-60px); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes ageNum {
      0%   { opacity:0; transform:scale(0.5) rotate(-8deg); }
      60%  { opacity:1; transform:scale(1.15) rotate(2deg); }
      100% { opacity:1; transform:scale(1) rotate(0deg); }
    }
    @keyframes glassFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes glassPopIn {
      0%   { opacity: 0; transform: scale(0.85) translateY(18px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes glassSheen {
      0%   { transform: translateX(-120%) rotate(8deg); }
      100% { transform: translateX(220%) rotate(8deg); }
    }
  `}</style>
);

/* ─────────── Design tokens ─────────── */
const T = {
  deep:    "#2D1B4E",
  violet:  "#5B3A8A",
  lavender:"#C4A8E8",
  lilac:   "#E8D5F5",
  blush:   "#FFB3D1",
  cream:   "#F7F0FF",
  gold:    "#F5C842",
  white:   "#FFFFFF",
};

/* ─────────── Petal shapes ─────────── */
const PETAL_SHAPES = [
  "M10,0 C15,5 15,15 10,20 C5,15 5,5 10,0Z",
  "M10,2 C14,0 18,6 16,10 C18,14 14,20 10,18 C6,20 2,14 4,10 C2,6 6,0 10,2Z",
  "M10,0 Q20,5 10,20 Q0,5 10,0Z",
  "M10,1 C14,1 19,5 19,10 C19,15 14,19 10,19 C6,19 1,15 1,10 C1,5 6,1 10,1Z",
];
const PETAL_COLORS = [T.lavender, T.blush, "#DDA0DD", "#E8B4E8", "#F0C0F0", T.gold];

/* ─────────── Floating petals (with depth + scroll) ─────────── */
function FloatingPetals() {
  const petals = useRef(
    Array.from({ length: 28 }, (_, i) => {
      // depth: 0 = far background, 1 = near foreground
      const depth = Math.random();
      const layer = depth < 0.4 ? "back" : depth < 0.75 ? "mid" : "front";
      const layerCfg = {
        back:  { size: [6, 11],  speed: [0.12, 0.22], opacity: [0.15, 0.28], blur: 2.2, scrollMult: 0.3 },
        mid:   { size: [11, 18], speed: [0.28, 0.45], opacity: [0.3, 0.48],  blur: 0.8, scrollMult: 0.7 },
        front: { size: [18, 30], speed: [0.5, 0.85],  opacity: [0.45, 0.7], blur: 0,   scrollMult: 1.3 },
      }[layer];
      const [sMin, sMax] = layerCfg.size;
      const [vMin, vMax] = layerCfg.speed;
      const [oMin, oMax] = layerCfg.opacity;
      return {
        id: i,
        x: Math.random() * 100,
        startY: Math.random() * 120,
        size: sMin + Math.random() * (sMax - sMin),
        speed: vMin + Math.random() * (vMax - vMin),
        rotate: Math.random() * 360,
        rotateSpeed: (Math.random() - 0.5) * (layer === "front" ? 2.2 : layer === "mid" ? 1.3 : 0.6),
        shape: PETAL_SHAPES[Math.floor(Math.random() * PETAL_SHAPES.length)],
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
        opacity: oMin + Math.random() * (oMax - oMin),
        blur: layerCfg.blur,
        layer,
        scrollMult: layerCfg.scrollMult,
        driftAmp: 2 + Math.random() * (layer === "front" ? 5 : 3),
        driftFreq: 0.3 + Math.random() * 0.4,
        driftPhase: Math.random() * Math.PI * 2,
      };
    })
  ).current;

  const [positions, setPositions] = useState(() =>
    petals.map(p => ({ y: p.startY, rot: p.rotate, t: 0 }))
  );

  // track scroll velocity (in vh-equivalent units per second, smoothed)
  const scrollState = useRef({ lastY: typeof window !== "undefined" ? window.scrollY : 0, velocity: 0 });

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight || 1;
      const dy = y - scrollState.current.lastY;
      scrollState.current.lastY = y;
      // convert px delta to "% of viewport height" so it scales like the drift speed
      scrollState.current.velocity += (dy / vh) * 100;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let frame; let last = performance.now();
    const animate = (now) => {
      const dt = (now - last) / 1000; last = now;

      // decay accumulated scroll velocity each frame so it acts like a brief kick, not a permanent offset
      const kick = scrollState.current.velocity;
      scrollState.current.velocity *= 0.82;

      setPositions(prev => prev.map((pos, i) => {
        const p = petals[i];
        // ambient upward drift, always present
        let ny = pos.y - p.speed * dt * 12;
        // scroll-driven push: scrolling down sweeps petals upward (same direction as content
        // scrolling past them), scaled by depth so front petals react more than back ones
        ny -= kick * p.scrollMult * 0.5;
        let nt = pos.t + dt;
        if (ny < -15) ny = 110;
        if (ny > 115) ny = -10;
        return { y: ny, rot: pos.rot + p.rotateSpeed * dt * 30 + kick * p.scrollMult * 0.6, t: nt };
      }));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [petals]);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {petals.map((p, i) => {
        const sway = Math.sin(positions[i].t * p.driftFreq + p.driftPhase) * p.driftAmp;
        return (
          <svg key={p.id} viewBox="0 0 20 20" width={p.size} height={p.size} style={{
            position: "absolute",
            left: `calc(${p.x}% + ${sway}px)`,
            top: `${positions[i].y}%`,
            transform: `rotate(${positions[i].rot}deg)`,
            opacity: p.opacity,
            filter: p.blur ? `blur(${p.blur}px)` : "none",
          }}>
            <path d={p.shape} fill={p.color} />
          </svg>
        );
      })}
    </div>
  );
}

/* ─────────── Scroll-reveal hook ─────────── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, dir = "up", style = {} }) {
  const [ref, visible] = useScrollReveal();
  const tx = dir === "left" ? "-40px" : dir === "right" ? "40px" : "0px";
  const ty = dir === "up" ? "40px" : dir === "down" ? "-40px" : "0px";
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translate(0,0)" : `translate(${tx},${ty})`,
      transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─────────── Flower SVG ─────────── */
function Flower({ size = 60, cx = T.lavender, cc = T.gold, style = {} }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={style}>
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <ellipse key={i} cx="40" cy="22" rx="9" ry="16" fill={cx} opacity="0.85"
          transform={`rotate(${deg} 40 40)`} />
      ))}
      <circle cx="40" cy="40" r="11" fill={cc} />
      <circle cx="40" cy="40" r="7" fill="#FFF8DC" />
    </svg>
  );
}

/* ─────────── Ice cream SVG ─────────── */
function IceCream({ flavor = "strawberry", size = 80 }) {
  const flavors = {
    strawberry: { scoop1: "#FFB3D1", scoop2: "#FF85B0", cone: "#D4956A" },
    lavender:   { scoop1: "#C4A8E8", scoop2: "#9B72CF", cone: "#D4956A" },
    vanilla:    { scoop1: "#FFF5CC", scoop2: "#FFE680", cone: "#C4845A" },
  };
  const c = flavors[flavor] || flavors.strawberry;
  return (
    <svg viewBox="0 0 60 90" width={size} height={size * 1.5}>
      <polygon points="30,88 12,44 48,44" fill={c.cone} />
      <line x1="12" y1="44" x2="30" y2="88" stroke="#B07550" strokeWidth="0.8" opacity="0.4" />
      <line x1="48" y1="44" x2="30" y2="88" stroke="#B07550" strokeWidth="0.8" opacity="0.4" />
      <circle cx="30" cy="38" r="16" fill={c.scoop1} />
      <circle cx="19" cy="28" r="13" fill={c.scoop2} />
      <circle cx="41" cy="28" r="13" fill={c.scoop1} />
      <circle cx="30" cy="18" r="13" fill={c.scoop2} />
      {[[22,14,30],[35,10,-20],[26,8,10],[38,19,45],[17,22,-30]].map(([x,y,r],i)=>(
        <rect key={i} x={x-3} y={y-1} width="6" height="2.5" rx="1"
          fill={[T.gold,"#FF6B9D","#7ED8F0","#FFD700","#B084CC"][i]}
          transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </svg>
  );
}

/* ─────────── BIRTHDAY CAKE (HTML/CSS) ─────────── */
const CANDLE_COLORS = [
  "#C4A8E8","#FFB3D1","#F5C842","#9B72CF","#FF85B0",
  "#7ED8F0","#DDA0DD","#FFD700","#B084CC","#FF6B9D",
  "#E8B4E8","#FFC0CB","#9370DB","#F0C0F0","#FFE680",
  "#BA55D3","#FF69B4","#DAA520","#8B5CF6","#F472B6",
];

// Per-candle tilt angles & horizontal offsets — seeded so they're stable
const MAX_CANDLES = 20;
const CANDLE_META = Array.from({ length: MAX_CANDLES }, (_, i) => {
  // simple deterministic pseudo-random from index
  const r1 = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  const r2 = Math.sin(i * 269.5 + 183.3) * 43758.5453;
  const frac1 = r1 - Math.floor(r1);
  const frac2 = r2 - Math.floor(r2);
  // tilt: some candles fall left, some right, some stay upright
  const tiltSign = frac1 < 0.35 ? -1 : frac1 < 0.65 ? 0 : 1;
  const tiltMag  = frac2 * 38 + 12; // 12–50 degrees when tilting
  return {
    tilt: tiltSign === 0 ? 0 : tiltSign * tiltMag,
    jitter: (frac1 - 0.5) * 4, // slight horizontal nudge in px within slot
    flameDur: 0.9 + frac2 * 0.6,
    flameDelay: frac1 * 0.4,
  };
});

function Candle({ color, isNew, index, animKey }) {
  const meta = CANDLE_META[index];
  const candleH = 26;
  return (
    // Outer wrapper: rotates the whole candle (body+flame) around its base
    <div
      key={`${animKey}-${index}`}
      style={{
        width: "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transformOrigin: "50% 100%",
        animation: isNew
          ? `candleTip 0.55s cubic-bezier(0.34,1.3,0.64,1) ${isNew ? "0.15s" : "0s"} both`
          : "none",
        // CSS custom property so the keyframe can reference it
        ["--tip-angle"]: `${meta.tilt}deg`,
        transform: isNew ? "rotate(0deg)" : `rotate(${meta.tilt}deg)`,
        flexShrink: 0,
      }}
    >
      {/* flame */}
      <div style={{
        width: "12px",
        height: "16px",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        animation: isNew ? `flameIn 0.3s ease ${isNew ? "0.5s" : "0s"} both` : "none",
        opacity: isNew ? 0 : 1,
      }}>
        {/* outer flame */}
        <div style={{
          position: "absolute",
          bottom: 0,
          width: "10px",
          height: "15px",
          borderRadius: "50% 50% 30% 30% / 60% 60% 40% 40%",
          background: "#FFA500",
          opacity: 0.9,
          transformOrigin: "50% 100%",
          animation: `flameDance ${meta.flameDur}s ease-in-out ${meta.flameDelay}s infinite`,
        }} />
        {/* inner flame */}
        <div style={{
          position: "absolute",
          bottom: "2px",
          width: "6px",
          height: "10px",
          borderRadius: "50% 50% 30% 30% / 60% 60% 40% 40%",
          background: "#FFE55C",
          opacity: 0.95,
          transformOrigin: "50% 100%",
          animation: `flameDance ${meta.flameDur * 0.8}s ease-in-out ${meta.flameDelay + 0.1}s infinite`,
        }} />
      </div>
      {/* wick */}
      <div style={{ width: "1.5px", height: "5px", background: "#666", flexShrink: 0 }} />
      {/* candle body */}
      <div style={{
        width: "10px",
        height: `${candleH}px`,
        background: color,
        borderRadius: "2px 2px 1px 1px",
        flexShrink: 0,
        transformOrigin: "50% 100%",
        position: "relative",
        animation: isNew ? `candleGrow 0.4s cubic-bezier(0.34,1.4,0.64,1) both` : "none",
        overflow: "hidden",
      }}>
        {/* two white stripes */}
        <div style={{ position:"absolute", left:0, right:0, top:"5px",  height:"2px", background:"rgba(255,255,255,0.45)", borderRadius:"1px" }} />
        <div style={{ position:"absolute", left:0, right:0, top:"11px", height:"2px", background:"rgba(255,255,255,0.45)", borderRadius:"1px" }} />
      </div>
    </div>
  );
}

function BirthdayCake({ candleCount, animKey }) {
  // Candles sit on top of tier2 (the top tier).
  // We distribute them evenly using flexbox — no coordinate math needed.
  const DOTS_T1 = ["#C4A8E8","#FFB3D1","#F5C842","#9B72CF","#FF85B0"];
  const DOTS_T2 = ["#7ED8F0","#DDA0DD","#FFD700","#B084CC"];

  const tierBase = {
    borderRadius: "10px",
    position: "relative",
    flexShrink: 0,
  };

  function Drips({ count, color }) {
    return (
      <div style={{ position:"absolute", top:0, left:0, right:0, display:"flex", justifyContent:"space-evenly", pointerEvents:"none" }}>
        {Array.from({length: count}, (_,i) => (
          <div key={i} style={{
            width: "7px",
            height: `${8 + Math.sin(i * 1.9) * 3}px`,
            background: color,
            borderRadius: "0 0 4px 4px",
            opacity: 0.85,
            marginTop: "-1px",
          }} />
        ))}
      </div>
    );
  }

  function Dots({ colors }) {
    return (
      <div style={{ display:"flex", justifyContent:"space-evenly", alignItems:"center", height:"100%", paddingTop:"12px" }}>
        {colors.map((c,i) => (
          <div key={i} style={{ width:"7px", height:"7px", borderRadius:"50%", background:c, opacity:0.9 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0, userSelect:"none" }}>

      {/* candle row — sits above the cake */}
      <div style={{
        width: "160px",
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "flex-end",
        minHeight: "60px",
        paddingBottom: "2px",
        overflow: "visible",
        position: "relative",
        zIndex: 2,
      }}>
        {Array.from({ length: MAX_CANDLES }, (_, i) => (
          <div key={i} style={{
            opacity: i < candleCount ? 1 : 0,
            transition: "opacity 0.1s",
            display: "flex",
            alignItems: "flex-end",
          }}>
            <Candle
              color={CANDLE_COLORS[i % CANDLE_COLORS.length]}
              isNew={i === candleCount - 1}
              index={i}
              animKey={animKey}
            />
          </div>
        ))}
      </div>

      {/* tier 2 — top */}
      <div style={{ ...tierBase, width:"160px", height:"44px", background:"#9B72CF", zIndex:1 }}>
        <Drips count={7} color="white" />
        <Dots colors={DOTS_T2} />
      </div>

      {/* tier 1 — bottom */}
      <div style={{ ...tierBase, width:"210px", height:"52px", background:"#7B4FA8", marginTop:"-2px", zIndex:0 }}>
        <Drips count={9} color="white" />
        <Dots colors={DOTS_T1} />
      </div>

      {/* plate */}
      <div style={{ width:"230px", height:"14px", background:"#E8D5F5", borderRadius:"50%", marginTop:"2px", opacity:0.7 }} />
    </div>
  );
}

/* ─────────── AGE CAROUSEL ─────────── */
const AGES = Array.from({ length: 20 }, (_, i) => i + 1); // ages 1–20, change as needed

function AgeCarousel() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState("right"); // slide-in direction
  const [animKey, setAnimKey] = useState(0);
  const total = AGES.length;

  const go = useCallback((next, direction) => {
    setDir(direction);
    setCurrent(next);
    setAnimKey(k => k + 1);
  }, []);

  const prev = () => go((current - 1 + total) % total, "left");
  const next = () => go((current + 1) % total, "right");

  const age = AGES[current];
  const slideAnim = dir === "right" ? "slideInRight" : "slideInLeft";

  return (
    <section style={{ padding: "100px 24px 80px", position: "relative", zIndex: 1 }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.78rem", letterSpacing: "0.3em", textTransform: "uppercase", color: T.violet, marginBottom: "16px", opacity: 0.75 }}>
            ✦ through the years ✦
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4.5vw, 3rem)", fontWeight: 700, color: T.deep, margin: 0 }}>
            Every age, every smile
          </h2>
          <p style={{ fontFamily: "'Lato', sans-serif", fontWeight: 300, color: T.violet, fontSize: "1rem", marginTop: "12px", opacity: 0.8 }}>
            Arrow through the years — a candle lights up for each one.
          </p>
        </div>
      </Reveal>

      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "40px",
        alignItems: "center",
      }}>
        {/* LEFT: cake */}
        <Reveal dir="left">
          <div style={{
            background: `linear-gradient(160deg, ${T.cream} 0%, ${T.lilac} 100%)`,
            borderRadius: "28px",
            padding: "36px 24px 28px",
            border: `1px solid ${T.lilac}`,
            boxShadow: `0 8px 40px ${T.lavender}28`,
            textAlign: "center",
            position: "relative",
          }}>
            {/* age badge */}
            <div key={`age-${animKey}`} style={{
              position: "absolute",
              top: "16px",
              right: "20px",
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.violet}, ${T.lavender})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 16px ${T.violet}44`,
              animation: "ageNum 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
                fontSize: age >= 10 ? "1.1rem" : "1.4rem",
                color: T.white,
                lineHeight: 1,
              }}>{age}</span>
            </div>

            <BirthdayCake candleCount={age} animKey={animKey} />

            <div style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "0.8rem",
              color: T.violet,
              opacity: 0.65,
              marginTop: "12px",
              letterSpacing: "0.1em",
            }}>
              {age} candle{age !== 1 ? "s" : ""} for {age} wonderful year{age !== 1 ? "s" : ""}
            </div>
          </div>
        </Reveal>

        {/* RIGHT: photo + nav */}
        <Reveal dir="right">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* photo card */}
            <div key={`photo-${animKey}`} style={{
              background: `linear-gradient(135deg, ${T.lilac}88 0%, ${T.lavender}44 100%)`,
              border: `2px dashed ${T.lavender}`,
              borderRadius: "20px",
              aspectRatio: "4/3",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              position: "relative",
              overflow: "hidden",
              animation: `${slideAnim} 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
            }}>
              {/* age watermark */}
              <div style={{
                position: "absolute",
                bottom: "12px",
                left: "16px",
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
                fontSize: "4rem",
                color: T.lavender,
                opacity: 0.18,
                lineHeight: 1,
                userSelect: "none",
              }}>
                {age}
              </div>

              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke={T.lavender} strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.85rem", color: T.violet, opacity: 0.7, letterSpacing: "0.05em" }}>
                Age {age}
              </span>
            </div>

            {/* nav controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                onClick={prev}
                aria-label="Previous year"
                style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  border: `1.5px solid ${T.lavender}`,
                  background: T.white,
                  color: T.violet,
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s, transform 0.15s",
                  boxShadow: `0 2px 12px ${T.lavender}22`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.lilac; e.currentTarget.style.transform = "scale(1.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.white; e.currentTarget.style.transform = "scale(1)"; }}
              >
                ←
              </button>

              {/* dot track */}
              <div style={{ flex: 1, display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center" }}>
                {AGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i, i > current ? "right" : "left")}
                    aria-label={`Go to age ${AGES[i]}`}
                    style={{
                      width: i === current ? "20px" : "7px",
                      height: "7px",
                      borderRadius: "4px",
                      border: "none",
                      background: i === current ? T.violet : T.lavender,
                      opacity: i === current ? 1 : 0.45,
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>

              <button
                onClick={next}
                aria-label="Next year"
                style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  border: `1.5px solid ${T.lavender}`,
                  background: T.white,
                  color: T.violet,
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s, transform 0.15s",
                  boxShadow: `0 2px 12px ${T.lavender}22`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.lilac; e.currentTarget.style.transform = "scale(1.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.white; e.currentTarget.style.transform = "scale(1)"; }}
              >
                →
              </button>
            </div>

            {/* keyboard hint */}
            <div style={{ textAlign: "center", fontFamily: "'Lato', sans-serif", fontSize: "0.72rem", color: T.violet, opacity: 0.45, letterSpacing: "0.05em" }}>
              use ← → arrow keys too
            </div>
          </div>
        </Reveal>
      </div>

      {/* keyboard nav */}
      <KeyboardNav onPrev={prev} onNext={next} />

      <style>{`
        @media (max-width: 640px) {
          .carousel-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function KeyboardNav({ onPrev, onNext }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft")  onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPrev, onNext]);
  return null;
}

/* ─────────── Photo placeholder ─────────── */
function PhotoSlot({ label = "Add a photo here" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          background: `linear-gradient(135deg, ${T.lilac}88 0%, ${T.lavender}44 100%)`,
          border: `2px dashed ${T.lavender}`,
          borderRadius: "20px",
          aspectRatio: "4/3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          color: T.violet,
          fontFamily: "'Lato', sans-serif",
          fontSize: "0.85rem",
          letterSpacing: "0.05em",
          cursor: "pointer",
          transition: "transform 0.25s ease, border-color 0.25s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = T.blush; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = T.lavender; }}
      >
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke={T.lavender} strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span style={{ opacity: 0.8 }}>{label}</span>
      </div>

      <GlassModal open={open} onClose={() => setOpen(false)}>
        <div style={{
          background: `linear-gradient(135deg, ${T.lilac}aa 0%, ${T.lavender}55 100%)`,
          border: `2px dashed ${T.lavender}`,
          borderRadius: "18px",
          aspectRatio: "4/3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          color: T.violet,
          marginBottom: "20px",
        }}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke={T.violet} strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.9rem", opacity: 0.85 }}>Drop the real photo in here</span>
        </div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.3rem", color: T.deep, margin: "0 0 8px", textAlign: "center" }}>
          {label}
        </h3>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.9rem", color: T.violet, opacity: 0.7, textAlign: "center", margin: 0 }}>
          Tap to preview once a photo is added here.
        </p>
      </GlassModal>
    </>
  );
}

/* ─────────── Comment placeholder ─────────── */
function CommentSlot({ name = "Someone special", placeholder = "Leave a birthday message here…" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          background: `linear-gradient(135deg, ${T.white} 0%, ${T.cream} 100%)`,
          borderRadius: "20px",
          padding: "28px 32px",
          border: `1px solid ${T.lilac}`,
          boxShadow: `0 4px 24px ${T.lavender}33`,
          position: "relative",
          cursor: "pointer",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 10px 32px ${T.lavender}55`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 24px ${T.lavender}33`; }}
      >
        <Flower size={28} cx={T.blush} cc={T.gold} style={{ position: "absolute", top: -12, right: 20 }} />
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.lavender}, ${T.blush})`,
            border: `2px solid ${T.white}`,
            boxShadow: `0 2px 8px ${T.lavender}66`,
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: T.deep, fontSize: "1rem" }}>{name}</div>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.75rem", color: T.violet, opacity: 0.7 }}>Birthday wish</div>
          </div>
        </div>
        <p style={{ fontFamily: "'Lato', sans-serif", color: T.violet, opacity: 0.55, fontStyle: "italic", lineHeight: 1.7, margin: 0, fontSize: "0.95rem" }}>
          {placeholder}
        </p>
      </div>

      <GlassModal open={open} onClose={() => setOpen(false)}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.lavender}, ${T.blush})`,
            border: `2px solid ${T.white}`,
            boxShadow: `0 2px 12px ${T.lavender}66`,
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: T.deep, fontSize: "1.2rem" }}>{name}</div>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.78rem", color: T.violet, opacity: 0.7 }}>Birthday wish</div>
          </div>
        </div>
        <p style={{ fontFamily: "'Lato', sans-serif", color: T.violet, opacity: 0.7, fontStyle: "italic", lineHeight: 1.8, margin: 0, fontSize: "1.05rem" }}>
          {placeholder}
        </p>
      </GlassModal>
    </>
  );
}

/* ─────────── Divider ─────────── */
function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "0 auto", maxWidth: "340px" }}>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${T.lavender})` }} />
      <Flower size={26} cx={T.lavender} cc={T.gold} />
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${T.lavender})` }} />
    </div>
  );
}

/* ─────────── Liquid Glass Modal ─────────── */
function GlassModal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: `radial-gradient(circle at 50% 40%, ${T.deep}55, ${T.deep}99)`,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "glassFadeIn 0.3s ease both",
      }}
    >
      {/* drifting glass blobs behind the card for extra depth */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-10%", left: "8%", width: "260px", height: "260px",
          borderRadius: "50%", background: `${T.lavender}33`, filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "-8%", right: "10%", width: "300px", height: "300px",
          borderRadius: "50%", background: `${T.blush}2e`, filter: "blur(50px)",
        }} />
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: "480px",
          width: "100%",
          maxHeight: "85vh",
          overflow: "auto",
          borderRadius: "28px",
          padding: "2px",
          background: `linear-gradient(135deg, ${T.white}55, ${T.lavender}33 40%, ${T.white}22 70%, ${T.blush}33)`,
          boxShadow: `0 24px 70px ${T.deep}55, 0 2px 0 ${T.white}66 inset`,
          animation: "glassPopIn 0.4s cubic-bezier(0.2,0.9,0.3,1.1) both",
        }}
      >
        {/* the actual glass surface */}
        <div style={{
          position: "relative",
          borderRadius: "26px",
          background: `linear-gradient(160deg, ${T.white}cc 0%, ${T.cream}b3 55%, ${T.lilac}99 100%)`,
          backdropFilter: "blur(22px) saturate(160%)",
          WebkitBackdropFilter: "blur(22px) saturate(160%)",
          border: `1px solid ${T.white}88`,
          padding: "36px 32px 32px",
          overflow: "hidden",
        }}>
          {/* sheen sweep */}
          <div style={{
            position: "absolute",
            top: 0, left: 0,
            width: "60%",
            height: "100%",
            background: `linear-gradient(75deg, transparent 30%, ${T.white}55 48%, ${T.white}33 52%, transparent 70%)`,
            animation: "glassSheen 2.8s ease-in-out 0.3s 1",
            pointerEvents: "none",
          }} />
          {/* top specular highlight edge */}
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
            background: `linear-gradient(to right, transparent, ${T.white}, transparent)`,
            opacity: 0.9,
          }} />

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: `1px solid ${T.white}aa`,
              background: `${T.white}55`,
              backdropFilter: "blur(8px)",
              color: T.violet,
              fontSize: "1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s, transform 0.15s",
              zIndex: 2,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.white}99`; e.currentTarget.style.transform = "scale(1.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${T.white}55`; e.currentTarget.style.transform = "scale(1)"; }}
          >
            ✕
          </button>

          <div style={{ position: "relative", zIndex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── HERO ─────────── */
function Hero() {
  const [scroll, setScroll] = useState(0);
  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 24px", position: "relative", overflow: "hidden" }}>
      {[
        { top:"8%",  left:"5%",  size:72, cx:T.lavender, cc:T.gold },
        { top:"12%", right:"6%", size:56, cx:T.blush,    cc:T.gold },
        { bottom:"18%", left:"8%", size:48, cx:"#DDA0DD", cc:T.gold },
        { bottom:"12%", right:"5%", size:66, cx:T.lavender, cc:T.blush },
        { top:"40%", left:"2%", size:36, cx:T.blush, cc:T.gold },
        { top:"38%", right:"2%", size:40, cx:T.lavender, cc:T.gold },
      ].map((f, i) => (
        <Flower key={i} size={f.size} cx={f.cx} cc={f.cc} style={{
          position: "absolute", top: f.top, left: f.left, right: f.right, bottom: f.bottom,
          transform: `translateY(${scroll*(0.06+i*0.02)}px) rotate(${scroll*0.04*(i%2?1:-1)}deg)`,
          opacity: 0.5, pointerEvents: "none",
        }} />
      ))}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"0.8rem", letterSpacing:"0.35em", textTransform:"uppercase", color:T.violet, marginBottom:"20px", opacity:0.85 }}>
          ✦ A special celebration ✦
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(3.2rem,10vw,7.5rem)", fontWeight:900, lineHeight:1.05, margin:"0 0 10px", background:`linear-gradient(135deg,${T.deep},${T.violet},${T.lavender})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Happy</h1>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:"clamp(3.5rem,11vw,8rem)", fontWeight:700, lineHeight:1.05, margin:"0 0 10px", background:`linear-gradient(135deg,${T.violet},${T.lavender},${T.blush})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Birthday</h1>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.8rem,9vw,6.5rem)", fontWeight:900, lineHeight:1.1, margin:"0 0 36px", background:`linear-gradient(135deg,${T.lavender},${T.deep})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>to you! 🎂</h1>
        <p style={{ fontFamily:"'Lato',sans-serif", fontWeight:300, fontSize:"clamp(1rem,2.5vw,1.3rem)", color:T.violet, maxWidth:"480px", margin:"0 auto 48px", lineHeight:1.75 }}>
          A page made with love, flowers, and way too much ice cream — just for you.
        </p>
        <div style={{ display:"flex", gap:"20px", justifyContent:"center", flexWrap:"wrap" }}>
          <IceCream flavor="strawberry" size={72} />
          <IceCream flavor="lavender"   size={72} />
          <IceCream flavor="vanilla"    size={72} />
        </div>
        <div style={{ marginTop:"60px", display:"flex", flexDirection:"column", alignItems:"center", gap:"6px", opacity:0.55 }}>
          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"0.75rem", letterSpacing:"0.2em", color:T.violet, textTransform:"uppercase" }}>Scroll down</div>
          <div style={{ fontSize:"1.2rem", animation:"bounce 1.8s ease-in-out infinite" }}>↓</div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── ABOUT ─────────── */
function About() {
  return (
    <section style={{ padding:"100px 24px", maxWidth:"900px", margin:"0 auto", textAlign:"center", position:"relative", zIndex:1 }}>
      <Divider />
      <div style={{ margin:"60px 0" }}>
        <Reveal>
          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"0.78rem", letterSpacing:"0.3em", textTransform:"uppercase", color:T.violet, marginBottom:"16px", opacity:0.75 }}>✦ the birthday girl ✦</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2rem,5vw,3.4rem)", fontWeight:700, color:T.deep, margin:"0 0 24px", lineHeight:1.2 }}>
            Here's to the most<br /><em style={{ color:T.violet }}>wonderful</em> sister
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p style={{ fontFamily:"'Lato',sans-serif", fontWeight:300, fontSize:"1.15rem", color:T.violet, lineHeight:1.85, maxWidth:"580px", margin:"0 auto 32px", opacity:0.9 }}>
            Today is all about you — your laughter, your kindness, and all the little things that make you so incredibly you. May this year be filled with flowers in bloom, sweet moments, and every colour of purple the sky can hold. 💜
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <div style={{ display:"inline-flex", gap:"12px", flexWrap:"wrap", justifyContent:"center", marginTop:"8px" }}>
            {["🌸 Flower lover","💜 Purple queen","🍦 Ice cream addict","✨ Pure magic"].map(tag => (
              <span key={tag} style={{ fontFamily:"'Lato',sans-serif", fontSize:"0.85rem", background:`linear-gradient(135deg,${T.lilac},${T.cream})`, color:T.violet, border:`1px solid ${T.lavender}88`, padding:"7px 18px", borderRadius:"50px", letterSpacing:"0.04em" }}>{tag}</span>
            ))}
          </div>
        </Reveal>
      </div>
      <Divider />
    </section>
  );
}

/* ─────────── MEMORIES ─────────── */
function Memories() {
  const photos = ["Our favourite memory","That one adventure","Laughing so hard it hurt","A perfect day together","Pure joy","Sisters forever"];
  return (
    <section style={{ padding:"80px 24px", maxWidth:"1100px", margin:"0 auto", position:"relative", zIndex:1 }}>
      <Reveal>
        <div style={{ textAlign:"center", marginBottom:"60px" }}>
          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"0.78rem", letterSpacing:"0.3em", textTransform:"uppercase", color:T.violet, marginBottom:"16px", opacity:0.75 }}>✦ memories ✦</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.9rem,4.5vw,3rem)", fontWeight:700, color:T.deep, margin:0 }}>Our favourite moments</h2>
        </div>
      </Reveal>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"24px" }}>
        {photos.map((label,i) => (
          <Reveal key={i} delay={i*0.08} dir={i%2===0?"left":"right"}>
            <PhotoSlot label={label} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────── ICE CREAM ─────────── */
function IceCreamSection() {
  const items = [
    { flavor:"strawberry", name:"Strawberry Bliss",  desc:"Sweet, rosy, and impossible to resist — just like you." },
    { flavor:"lavender",   name:"Lavender Dream",    desc:"Soft, purple, and magical. Your signature flavour." },
    { flavor:"vanilla",    name:"Golden Vanilla",    desc:"Classic and timeless. The perfect kind of sweetness." },
  ];
  return (
    <section style={{ padding:"100px 24px", background:`linear-gradient(180deg,transparent 0%,${T.lilac}44 30%,${T.cream} 60%,${T.lilac}44 100%)`, position:"relative", zIndex:1 }}>
      <div style={{ maxWidth:"900px", margin:"0 auto", textAlign:"center" }}>
        <Reveal>
          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"0.78rem", letterSpacing:"0.3em", textTransform:"uppercase", color:T.violet, marginBottom:"16px", opacity:0.75 }}>✦ sweet treats ✦</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.9rem,4.5vw,3rem)", fontWeight:700, color:T.deep, margin:"0 0 12px" }}>Your flavours of the year</h2>
          <p style={{ fontFamily:"'Lato',sans-serif", fontWeight:300, color:T.violet, fontSize:"1.05rem", lineHeight:1.7, maxWidth:"440px", margin:"0 auto 60px", opacity:0.85 }}>Because every birthday deserves all the scoops.</p>
        </Reveal>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"36px", justifyItems:"center" }}>
          {items.map((item,i) => (
            <Reveal key={i} delay={i*0.12} dir="up">
              <div style={{ background:T.white, borderRadius:"28px", padding:"40px 28px 32px", border:`1px solid ${T.lilac}`, boxShadow:`0 8px 40px ${T.lavender}28`, width:"100%", textAlign:"center", transition:"transform 0.3s ease,box-shadow 0.3s ease" }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow=`0 18px 50px ${T.lavender}44`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 8px 40px ${T.lavender}28`;}}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:"20px" }}>
                  <IceCream flavor={item.flavor} size={70} />
                </div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.25rem", fontWeight:700, color:T.deep, margin:"0 0 12px" }}>{item.name}</h3>
                <p style={{ fontFamily:"'Lato',sans-serif", fontSize:"0.9rem", color:T.violet, opacity:0.8, lineHeight:1.65, margin:0 }}>{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── MESSAGES ─────────── */
function Messages() {
  const slots = [
    { name:"Your bestie",      placeholder:"Write the most heartfelt thing you can think of here…" },
    { name:"Mum & Dad",        placeholder:"All the love from home — fill this in!" },
    { name:"Add your message", placeholder:"Your birthday wish goes right here…" },
    { name:"A secret admirer", placeholder:"Something sweet and maybe a little mysterious?" },
  ];
  return (
    <section style={{ padding:"100px 24px", maxWidth:"860px", margin:"0 auto", position:"relative", zIndex:1 }}>
      <Reveal>
        <div style={{ textAlign:"center", marginBottom:"60px" }}>
          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"0.78rem", letterSpacing:"0.3em", textTransform:"uppercase", color:T.violet, marginBottom:"16px", opacity:0.75 }}>✦ birthday messages ✦</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.9rem,4.5vw,3rem)", fontWeight:700, color:T.deep, margin:0 }}>Words from the heart</h2>
        </div>
      </Reveal>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:"28px" }}>
        {slots.map((slot,i) => (
          <Reveal key={i} delay={i*0.1} dir={i%2===0?"left":"right"}>
            <CommentSlot name={slot.name} placeholder={slot.placeholder} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────── FOOTER ─────────── */
function Footer() {
  return (
    <footer style={{ padding:"80px 24px 60px", textAlign:"center", background:`linear-gradient(180deg,transparent 0%,${T.deep} 100%)`, position:"relative", zIndex:1, marginTop:"40px" }}>
      <Reveal>
        <div style={{ display:"flex", justifyContent:"center", gap:"20px", marginBottom:"32px" }}>
          {[T.lavender,T.blush,T.gold,T.lavender,T.blush].map((c,i)=>(
            <Flower key={i} size={36+(i===2?10:0)} cx={c} cc={i===2?T.white:T.gold} style={{ opacity:0.7 }} />
          ))}
        </div>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:"clamp(1.5rem,4vw,2.4rem)", fontWeight:400, color:T.cream, margin:"0 0 16px" }}>
          "Here's to you — always and forever."
        </h3>
        <p style={{ fontFamily:"'Lato',sans-serif", fontWeight:300, color:T.lavender, fontSize:"0.95rem", opacity:0.8, margin:"0 0 40px", letterSpacing:"0.05em" }}>
          Made with 💜 flowers & ice cream
        </p>
        <div style={{ width:"60px", height:"1px", background:T.lavender, margin:"0 auto", opacity:0.4 }} />
      </Reveal>
    </footer>
  );
}

/* ─────────── SCROLL PROGRESS BAR ─────────── */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      setProgress(Math.min(1, Math.max(0, el.scrollTop / (el.scrollHeight - el.clientHeight))));
    };
    window.addEventListener("scroll", update);
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, height:"3px", zIndex:100, background:`${T.lilac}55` }}>
      <div style={{ height:"100%", width:`${progress*100}%`, background:`linear-gradient(to right,${T.violet},${T.lavender},${T.blush})`, transition:"width 0.1s linear", borderRadius:"0 2px 2px 0" }} />
    </div>
  );
}

/* ─────────── ROOT ─────────── */
export default function App() {
  return (
    <div style={{ background:`linear-gradient(180deg,${T.cream} 0%,${T.white} 30%,${T.cream} 60%,${T.lilac}66 100%)`, minHeight:"100vh", position:"relative" }}>
      <FontLoader />
      <ScrollProgress />
      <FloatingPetals />
      <Hero />
      <About />
      <AgeCarousel />
      <Memories />
      <IceCreamSection />
      <Messages />
      <Footer />
    </div>
  );
}