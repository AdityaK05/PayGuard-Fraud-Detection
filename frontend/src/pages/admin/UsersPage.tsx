/**
 * PayGuard – User Management Page (Admin)
 */

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Shield, ShieldCheck, ShieldAlert } from "lucide-react"
import api from "@/lib/api"

interface UserItem {
  id: number
  email: string
  name: string
  role: string
  is_active: boolean
  transaction_count: number
}

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: ShieldAlert,
  analyst: ShieldCheck,
  user: Shield,
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/admin/users")
        setUsers(data)
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-muted)] flex items-center justify-center">
          <Users className="w-5 h-5 text-[var(--color-accent)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">User Management</h3>
          <p className="text-xs text-[var(--color-text-muted)]">{users.length} registered users</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Transactions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const RoleIcon = ROLE_ICONS[u.role] || Shield
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] flex items-center justify-center text-xs font-bold text-white">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-[var(--color-text-primary)]">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-xs">{u.email}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <RoleIcon className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                          <span className="text-xs capitalize font-medium">{u.role}</span>
                        </div>
                      </td>
                      <td className="font-semibold">{u.transaction_count}</td>
                      <td>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.is_active ? "bg-[var(--color-success-muted)] text-[var(--color-success)]" : "bg-[var(--color-danger-muted)] text-[var(--color-danger)]"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
