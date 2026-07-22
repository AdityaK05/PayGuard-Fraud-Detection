import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import Sidebar from "./Sidebar"

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-10 h-10 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex">
      {/* Sidebar is fixed, main content takes the rest */}
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        {/* We removed Topbar to match the screenshot cleaner look. Navigation happens entirely in Sidebar or page headers. */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
