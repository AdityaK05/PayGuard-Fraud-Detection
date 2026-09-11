import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import SentinelSidebar from "./SentinelSidebar"

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-pg-accent border-t-transparent animate-spin" />
          <span className="text-sm text-pg-text-muted">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="relative min-h-screen">
      <SentinelSidebar />
      <main className="ml-[240px] p-8 relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
