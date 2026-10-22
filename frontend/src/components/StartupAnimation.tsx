import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Shield, FileText, CheckCircle2, Sparkles, Lock, ArrowRight } from 'lucide-react';

interface StartupAnimationProps {
  onComplete: () => void;
  duration?: number; // Total duration in milliseconds (default 2100ms ~ 2 sec)
}

const TELEMETRY_STAGES = [
  { threshold: 0, text: 'INITIALIZING ENCRYPTED VAULT...' },
  { threshold: 30, text: 'VERIFYING NEURAL CLASSIFIER...' },
  { threshold: 65, text: 'ESTABLISHING SECURE GATEWAY...' },
  { threshold: 92, text: 'DOCUVAULT READY • ACCESS GRANTED' },
];

export default function StartupAnimation({ onComplete, duration = 2100 }: StartupAnimationProps) {
  const shouldReduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(TELEMETRY_STAGES[0].text);

  const finish = useCallback(() => {
    setTimeout(() => {
      onComplete();
    }, 380);
  }, [onComplete]);

  // Smooth 2-second progression timer
  useEffect(() => {
    if (shouldReduceMotion) {
      // Instant / short duration for reduced motion preference
      const timer = setTimeout(finish, 600);
      return () => clearTimeout(timer);
    }

    const intervalTime = 25; // 25ms tick
    const totalSteps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentPct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setProgress(currentPct);

      // Update telemetry stage
      for (let i = TELEMETRY_STAGES.length - 1; i >= 0; i--) {
        if (currentPct >= TELEMETRY_STAGES[i].threshold) {
          setStatusText(TELEMETRY_STAGES[i].text);
          break;
        }
      }

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        finish();
      }
    }, intervalTime);

    // Escape key listener to skip animation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearInterval(timer);
        finish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, finish, shouldReduceMotion]);

  return (
    <motion.div
      className="startup-splash-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.04,
        filter: 'blur(8px)',
        transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#0F1115',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Ambient background glow layers */}
      <div className="startup-ambient-glow" />
      <div className="startup-grid-pattern" />

      {/* Cyber Corner Decals */}
      <div className="startup-corner startup-corner-tl">
        <span className="startup-micro-code">SYS_INIT // SECURE_PORTAL</span>
        <span className="startup-micro-sub">ENCRYPTION: AES-256-GCM</span>
      </div>
      <div className="startup-corner startup-corner-tr">
        <span className="startup-micro-code">NODE: 0x7F-ACAD</span>
        <span className="startup-micro-sub">STATE: VERIFYING</span>
      </div>
      <div className="startup-corner startup-corner-bl">
        <span className="startup-micro-sub">COLLEGE DOCUMENT REPOSITORY</span>
      </div>

      {/* Skip button in top right */}
      <motion.button
        className="startup-skip-btn"
        onClick={finish}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Skip intro (Esc)"
        aria-label="Skip intro animation"
      >
        <span>Skip</span>
        <ArrowRight size={13} />
      </motion.button>

      {/* Main Animated Content */}
      <div className="startup-content-container">
        {/* Emblem Hero Container with Rotating Rings */}
        <div className="startup-emblem-wrapper">
          {/* Outer Pulsing Radial Ring */}
          <motion.div
            className="startup-outer-pulse-ring"
            animate={{
              scale: [1, 1.28, 1],
              opacity: [0.35, 0.05, 0.35],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Orbiting Dashed Ring */}
          <motion.div
            className="startup-orbit-ring"
            animate={{ rotate: 360 }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Counter-Orbiting Dot Accent */}
          <motion.div
            className="startup-orbit-ring-reverse"
            animate={{ rotate: -360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Central Hex / Squircle Emblem Card */}
          <motion.div
            className="startup-emblem-card"
            initial={{ scale: 0.65, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.175, 0.885, 0.32, 1.275], // bouncy spring
            }}
          >
            {/* Holographic Laser Scan Line */}
            <motion.div
              className="startup-laser-scan"
              animate={{
                top: ['-20%', '120%'],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                repeatDelay: 0.4,
                ease: 'easeInOut',
              }}
            />

            {/* Glowing Icon Ensemble */}
            <div className="startup-emblem-icon-cluster">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.4 }}
              >
                <Shield
                  size={46}
                  className="startup-icon-shield"
                  strokeWidth={2}
                />
              </motion.div>

              <motion.div
                className="startup-icon-file-overlap"
                initial={{ scale: 0, y: 10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.45, ease: 'backOut' }}
              >
                <FileText size={22} className="startup-icon-file" strokeWidth={2.4} />
              </motion.div>

              {/* Sparkle micro-particle */}
              <motion.div
                className="startup-sparkle-dot"
                animate={{
                  scale: [0.8, 1.25, 0.8],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <Sparkles size={14} color="#DDF477" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Brand Name Typography Reveal */}
        <motion.div
          className="startup-brand-block"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5, ease: 'easeOut' }}
        >
          <div className="startup-title-row">
            <h1 className="startup-title">
              Docu<span className="startup-title-accent">Vault</span>
            </h1>
            <motion.span
              className="startup-badge"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.3 }}
            >
              <Lock size={11} strokeWidth={2.4} />
              <span>v2.4</span>
            </motion.span>
          </div>

          <p className="startup-subtitle">
            ACADEMIC DOCUMENT VAULT &bull; AI CLASSIFICATION
          </p>
        </motion.div>

        {/* 2-Second Progress Bar & Realtime Telemetry */}
        <motion.div
          className="startup-progress-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          {/* Progress Bar Container */}
          <div className="startup-progress-track">
            <motion.div
              className="startup-progress-fill"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
            {/* Glowing tip of progress line */}
            <div
              className="startup-progress-glow-tip"
              style={{ left: `${progress}%` }}
            />
          </div>

          {/* Telemetry Status Row */}
          <div className="startup-status-row">
            <div className="startup-status-text-wrap">
              <motion.span
                key={statusText}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`startup-status-text ${progress >= 92 ? 'ready' : ''}`}
              >
                {progress >= 92 ? (
                  <CheckCircle2 size={13} className="startup-status-icon-ready" />
                ) : (
                  <span className="startup-status-pulse-dot" />
                )}
                {statusText}
              </motion.span>
            </div>

            <span className="startup-pct-counter">{progress}%</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Security Assurance Tag */}
      <motion.div
        className="startup-footer-note"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <span>Zero-Knowledge Encryption &bull; Role-Based College Access &bull; ISO/IEC 27001 Aligned</span>
      </motion.div>
    </motion.div>
  );
}
