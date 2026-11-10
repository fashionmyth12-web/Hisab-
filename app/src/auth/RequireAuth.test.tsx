import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { RequireAuth } from "./AuthRoutes";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({ auth }),
}));

describe("protected routes", () => {
  beforeEach(() => vi.resetAllMocks());

  it("redirects a visitor without a session to login and never renders protected content", async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    render(
      <MemoryRouter initialEntries={["/private-report"]}>
        <AuthProvider>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/private-report" element={<p>Private account balances</p>} />
            </Route>
            <Route path="/login" element={<p>Sign in to continue</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Sign in to continue")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Private account balances")).not.toBeInTheDocument());
  });

  it("clears an expired server-rejected session before rendering protected content", async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: "expired-token" } }, error: null });
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401, message: "JWT expired" } });
    auth.signOut.mockResolvedValue({ error: null });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    render(
      <MemoryRouter initialEntries={["/private-report"]}>
        <AuthProvider>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/private-report" element={<p>Private account balances</p>} />
            </Route>
            <Route path="/login" element={<p>Sign in to continue</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Sign in to continue")).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(screen.queryByText("Private account balances")).not.toBeInTheDocument();
  });
});
