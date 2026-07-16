/**
 * PayGuard – Profile Page
 */

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Mail, Shield, Calendar, Save } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { formatDate } from "@/lib/utils"

export default function ProfilePage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] flex items-center justify-center text-2xl font-bold text-white mb-3">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {user?.name}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] capitalize">
            {user?.role}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              <User className="w-4 h-4" />
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              className="input-field opacity-60"
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                <Shield className="w-4 h-4" />
                Role
              </label>
              <input
                type="text"
                value={user?.role || ""}
                className="input-field opacity-60 capitalize"
                disabled
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                <Calendar className="w-4 h-4" />
                Member Since
              </label>
              <input
                type="text"
                value={user?.created_at ? formatDate(user.created_at) : "—"}
                className="input-field opacity-60"
                disabled
              />
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary w-full mt-4">
            <Save className="w-4 h-4" />
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
