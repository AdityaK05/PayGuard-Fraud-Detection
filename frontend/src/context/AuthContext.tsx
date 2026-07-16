/**
 * PayGuard – Authentication Context
 * ====================================
 * Provides auth state (user, tokens) and methods (login, register, logout)
 * to the entire React component tree.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import api from "@/lib/api"

interface User {
  id: number
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string, role?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("payguard_user")
    const token = localStorage.getItem("payguard_access_token")
    if (stored && token) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.clear()
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password })
    const { user: userData, tokens } = data

    localStorage.setItem("payguard_access_token", tokens.access_token)
    localStorage.setItem("payguard_refresh_token", tokens.refresh_token)
    localStorage.setItem("payguard_user", JSON.stringify(userData))
    setUser(userData)
  }, [])

  const register = useCallback(
    async (email: string, name: string, password: string, role = "user") => {
      const { data } = await api.post("/auth/register", {
        email,
        name,
        password,
        role,
      })
      const { user: userData, tokens } = data

      localStorage.setItem("payguard_access_token", tokens.access_token)
      localStorage.setItem("payguard_refresh_token", tokens.refresh_token)
      localStorage.setItem("payguard_user", JSON.stringify(userData))
      setUser(userData)
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem("payguard_access_token")
    localStorage.removeItem("payguard_refresh_token")
    localStorage.removeItem("payguard_user")
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
