/**
 * FraudGuard AI – Landing Page
 * Completely redesigned to match the deep navy & neon green aesthetic.
 */

import { Link } from "react-router-dom"
import { motion } from "framer-motion"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] overflow-hidden font-sans">
      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white tracking-wide">
              FraudGuard <span className="text-[var(--color-accent)]">AI</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-text-secondary)]">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/" className="hover:text-white transition-colors">How it works</Link>
            <Link to="/" className="hover:text-white transition-colors">About us</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="btn-outline-green text-sm px-6">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              FraudGuard AI
            </h1>
            
            <p className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-lg leading-relaxed">
              Build the future of trust around your financial 
              transactions with AI-driven fraud detection, 
              ensuring integrity and building customer confidence.
            </p>

            <Link to="/signup" className="btn-primary text-sm px-8 py-3.5 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              GET STARTED
            </Link>
          </motion.div>

          {/* Right Illustration: High Quality Generated 3D Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[500px] w-full flex items-center justify-center"
          >
            <div className="relative w-full max-w-lg aspect-square">
              {/* Decorative glows */}
              <div className="absolute inset-0 bg-[var(--color-accent)]/10 rounded-full blur-[80px]" />
              
              <div className="relative z-10 w-full h-full flex items-center justify-center transform hover:scale-105 transition-transform duration-700 ease-out">
                <img 
                  src="/landing_illustration.png" 
                  alt="FraudGuard AI Isometric Dashboard" 
                  className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,230,118,0.2)] rounded-3xl"
                />
              </div>
            </div>
          </motion.div>

        </div>
      </section>
    </div>
  )
}
