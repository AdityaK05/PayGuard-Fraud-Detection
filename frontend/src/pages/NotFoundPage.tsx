/**
 * PayGuard – 404 Not Found Page
 */

import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Shield, ArrowLeft } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="animated-gradient-bg" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-muted)] flex items-center justify-center">
            <Shield className="w-8 h-8 text-[var(--color-accent)]" />
          </div>
        </div>
        <h1 className="text-7xl font-bold gradient-text mb-2">404</h1>
        <p className="text-xl text-[var(--color-text-primary)] mb-2">Page Not Found</p>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  )
}
