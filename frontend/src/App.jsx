import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";

import LoginPage from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import Home from "./pages/Home";
import DepositForm from "./pages/DepositForm";
import DepositQR from "./pages/DepositQR";
import DepositHistory from "./pages/DepositHistory";
import WithdrawForm from "./pages/WithdrawForm";
import WithdrawConfirm from "./components/WithdrawConfirm";
import WithdrawOTP from "./components/WithdrawOTP";
import WithdrawStatus from "./components/WithdrawStatus";
import TotpSetup from "./components/TotpSetup";
import UsersPage from "./pages/UsersPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected — admin + superadmin */}
          <Route element={<ProtectedRoute roles={["admin", "superadmin"]} />}>
            <Route index element={<Home />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/deposit" element={<DepositForm />} />
            <Route path="/deposit/qr" element={<DepositQR />} />
            <Route path="/deposit/history" element={<DepositHistory />} />
            <Route path="/withdraw" element={<WithdrawForm />} />
            <Route path="/withdraw/confirm" element={<WithdrawConfirm />} />
            <Route path="/withdraw/otp" element={<WithdrawOTP />} />
            <Route path="/withdraw/status" element={<WithdrawStatus />} />
            <Route path="/settings/2fa" element={<TotpSetup />} />
          </Route>
          <Route element={<ProtectedRoute roles={["superadmin"]} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
