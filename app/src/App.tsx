import { Route, Routes } from "react-router-dom";
import { AuthPage, CallbackPage, ProtectedHome, PublicOnly, RecoveryPage, RequireAuth } from "./auth/AuthRoutes";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      </Route>
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route path="/reset-password" element={<RecoveryPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<ProtectedHome />} />
      </Route>
      <Route path="*" element={<AuthPage mode="login" />} />
    </Routes>
  );
}
