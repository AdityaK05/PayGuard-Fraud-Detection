/**
 * PayGuard – Profile Page
 */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Mail, Shield, Calendar, Save, Activity, CreditCard, AlertOctagon, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { formatDate } from "@/lib/utils"

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Banner - Removed overflow-hidden to fix avatar clipping */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-48 rounded-2xl bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#0a0a0a] border border-[#222] shadow-[0_0_40px_rgba(255,255,255,0.03)]"
      >
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:20px_20px] rounded-2xl"></div>
        
        {/* Avatar properly overlapping the banner */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 20 }}
          className="absolute -bottom-12 left-8 flex items-end gap-5 z-10"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-28 h-28 rounded-full border-[6px] border-[var(--page-bg)] bg-[var(--t1)] flex items-center justify-center text-5xl font-black text-[var(--page-bg)] shadow-2xl relative overflow-hidden"
          >
            {/* Shimmer effect */}
            <motion.div 
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
            />
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </motion.div>
          
          <div className="mb-14">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="text-3xl font-black text-[var(--t1)] tracking-tight"
            >
              {user?.name}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
              className="text-[var(--t3)] font-medium capitalize flex items-center gap-2 text-sm mt-1"
            >
              <Shield className="w-4 h-4 text-white/50" /> Enterprise {user?.role} Account
            </motion.p>
          </div>
        </motion.div>
      </motion.div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Stats */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="md:col-span-1 space-y-4"
        >
          <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} className="card p-6 bg-[#0a0a0a] border-[#222] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.05] transition-all duration-500"></div>
            <div className="flex items-center gap-3 mb-3 text-[var(--t3)]">
              <Activity className="w-4 h-4 text-white" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">System Status</h3>
            </div>
            <p className="text-2xl font-black text-[var(--t1)]">Optimal</p>
            <p className="text-xs text-[var(--t3)] mt-2 font-medium">Monitoring active</p>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} className="card p-6 bg-[#0a0a0a] border-[#222] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.05] transition-all duration-500"></div>
            <div className="flex items-center gap-3 mb-3 text-[var(--t3)]">
              <CreditCard className="w-4 h-4 text-white" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Total Scans</h3>
            </div>
            <p className="text-2xl font-black text-[var(--t1)]">14,392</p>
            <p className="text-xs text-[var(--t3)] mt-2 font-medium">Across all endpoints</p>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} className="card p-6 bg-[#0a0a0a] border-[#222] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.05] transition-all duration-500"></div>
            <div className="flex items-center gap-3 mb-3 text-[var(--t3)]">
              <AlertOctagon className="w-4 h-4 text-white" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Fraud Prevented</h3>
            </div>
            <p className="text-2xl font-black text-[var(--t1)]">₹ 4.2L</p>
            <p className="text-xs text-[var(--t3)] mt-2 font-medium">In the last 30 days</p>
          </motion.div>
        </motion.div>

        {/* Right Column: Settings Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="md:col-span-2 card p-8 border-[#222] bg-[#0c0c0c]"
        >
          <div className="mb-8 border-b border-[#222] pb-5">
            <h3 className="text-sm font-black text-[var(--t1)] uppercase tracking-[0.15em]">Admin Configuration</h3>
            <p className="text-xs text-[var(--t3)] mt-1 font-medium">Manage your enterprise identity and access controls.</p>
          </div>

          <div className="space-y-6">
            <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
              <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--t3)] uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field py-3.5 text-sm font-semibold bg-[#111] border-[#333] focus:border-white transition-colors"
              />
            </motion.div>

            <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
              <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--t3)] uppercase tracking-wider mb-2">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                className="input-field py-3.5 text-sm font-semibold opacity-40 cursor-not-allowed bg-[#111] border-[#333]"
                disabled
              />
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
              <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400 }}>
                <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--t3)] uppercase tracking-wider mb-2">
                  <Shield className="w-3.5 h-3.5" /> Privilege Level
                </label>
                <div className="px-4 py-3.5 rounded-lg border border-[#333] bg-[#111] opacity-70">
                  <span className="capitalize font-semibold text-[var(--t1)] text-sm">{user?.role || "User"}</span>
                </div>
              </motion.div>
              
              <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400 }}>
                <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--t3)] uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5" /> Provisioned On
                </label>
                <div className="px-4 py-3.5 rounded-lg border border-[#333] bg-[#111] opacity-70">
                  <span className="font-semibold text-[var(--t1)] text-sm">{user?.created_at ? formatDate(user.created_at) : "—"}</span>
                </div>
              </motion.div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.01, backgroundColor: "#e5e5e5" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave} 
              className="w-full mt-8 py-4 text-xs uppercase tracking-[0.2em] font-black bg-white text-black rounded-lg shadow-lg flex items-center justify-center transition-all overflow-hidden relative"
            >
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.div
                    key="saved"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Config Synced
                  </motion.div>
                ) : (
                  <motion.div
                    key="save"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Configuration
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
