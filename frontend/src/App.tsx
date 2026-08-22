/**
 * PayGuard – Main App Router
 */

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import AppLayout from "./components/layout/AppLayout"

import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import DashboardPage from "@/pages/DashboardPage"
import HistoryPage from "@/pages/HistoryPage"
import ReviewQueuePage from "@/pages/ReviewQueuePage"
import SettingsPage from "@/pages/SettingsPage"
import NewTransactionPage from "@/pages/NewTransactionPage"
import NotFoundPage from "@/pages/NotFoundPage"

import SentinelShell from "./components/layout/SentinelShell"

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<SentinelShell />}>
              {/* Public Routes */}
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected App Routes */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/scan" element={<NewTransactionPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/review" element={<ReviewQueuePage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Legacy or admin routes can be mapped if needed, keeping simple for now */}
              </Route>

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
