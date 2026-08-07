import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import Sidebar from "./Sidebar"

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--page-bg)" }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--t1)" }} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <Sidebar />
      <main style={{ marginLeft: 220, padding: "28px 32px", position: "relative", zIndex: 1 }}>
        <Outlet />
      </main>
    </div>
  )
}
