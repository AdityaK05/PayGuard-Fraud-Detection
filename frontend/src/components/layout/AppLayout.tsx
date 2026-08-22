import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import SentinelSidebar from "./SentinelSidebar"

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sentinel-green font-mono text-[11px] animate-pulse">
        [INITIALIZING SUBSYSTEMS...]
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="relative min-h-screen">
      <SentinelSidebar />
      <main className="ml-[240px] p-8 relative z-10 font-sans">
        <Outlet />
      </main>
    </div>
  )
}
