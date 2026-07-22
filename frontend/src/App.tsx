/**
 * PayGuard – Main App Router
 */

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import AppLayout from "./components/layout/AppLayout"

// Pages
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import DashboardPage from "./pages/DashboardPage"
import NewTransactionPage from "./pages/NewTransactionPage"
import HistoryPage from "./pages/HistoryPage"
import ProfilePage from "./pages/ProfilePage"
import NotFoundPage from "./pages/NotFoundPage"

// Admin Pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage"
import AnalyticsPage from "./pages/admin/AnalyticsPage"
import UsersPage from "./pages/admin/UsersPage"
import ModelsPage from "./pages/admin/ModelsPage"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected App Routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/new-transaction" element={<NewTransactionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin Routes (Ideally protected by role check in AppLayout, but simplified here) */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/models" element={<ModelsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
