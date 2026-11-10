import { beforeEach, describe, expect, it, vi } from "vitest";
import { exchangeEmailCode, sendPasswordReset, signInWithEmail, signOut, signUpWithEmail, updatePassword } from "./authService";

const mockAuth = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  getSupabase: () => ({ auth: mockAuth }),
}));

describe("Supabase Auth actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("signs up with email verification redirected to the app callback", async () => {
    mockAuth.signUp.mockResolvedValue({ data: { user: { email: "owner@example.com" }, session: null }, error: null });
    const result = await signUpWithEmail(" Owner@Example.com ", "a-secure-test-password");
    expect(result).toEqual({ email: "owner@example.com", verificationRequired: true });
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "a-secure-test-password",
      options: { emailRedirectTo: window.location.origin + "/app/auth/callback" },
    });
  });

  it("signs in with email and password and returns the server user", async () => {
    const user = { id: "user-1", email: "owner@example.com" };
    mockAuth.signInWithPassword.mockResolvedValue({ data: { user }, error: null });
    await expect(signInWithEmail("OWNER@example.com", "a-secure-test-password")).resolves.toEqual(user);
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({ email: "owner@example.com", password: "a-secure-test-password" });
  });

  it("signs out only the current local session", async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });
    await signOut();
    expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("sends password recovery to the app reset route", async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    await sendPasswordReset("Owner@example.com");
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith("owner@example.com", { redirectTo: window.location.origin + "/app/reset-password" });
  });

  it("exchanges a one-time email code and updates a password through Auth", async () => {
    const user = { id: "user-1", email: "owner@example.com" };
    mockAuth.exchangeCodeForSession.mockResolvedValue({ data: { user }, error: null });
    mockAuth.updateUser.mockResolvedValue({ data: { user }, error: null });
    await expect(exchangeEmailCode("single-use-code")).resolves.toEqual(user);
    await expect(updatePassword("a-new-secure-password")).resolves.toBeUndefined();
    expect(mockAuth.exchangeCodeForSession).toHaveBeenCalledWith("single-use-code");
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: "a-new-secure-password" });
  });
});
