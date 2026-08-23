import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { resendVerification } from "@/lib/sharepool";

type AuthMode = "login" | "register";

export function AuthForm({
  onSuccess,
  notice,
  expired,
}: {
  onSuccess?: () => void;
  notice?: string;
  expired?: boolean;
}) {
  const { login, register, loginWithAuthToken } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [resendNotice, setResendNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [adminError, setAdminError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError("");
    setUnverified(false);

    if (mode === "register") {
      if (password !== confirm) { setError("Passwords do not match"); return; }
      setSubmitting(true);
      const res = await register(email.trim(), password);
      setSubmitting(false);
      if (res.ok) {
        setMode("login");
        setPassword("");
        setConfirm("");
        setSuccess("Account created — check your email to verify, then log in.");
      } else {
        setError(res.message || "Registration failed");
      }
    } else {
      setSubmitting(true);
      const res = await login(email.trim(), password);
      setSubmitting(false);
      if (res.ok === false) {
        if (res.reason === "unverified") {
          setUnverified(true);
          setError("Email not verified. Check your inbox or resend the link.");
        } else if (res.reason === "invalid") {
          setError("Invalid credentials. Please check and try again.");
        } else {
          setError(res.message || "Login failed");
        }
      } else {
        onSuccess?.();
      }
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResendNotice("");
    try {
      await resendVerification(email.trim());
      setResendNotice("Verification email sent — check your inbox.");
    } catch {
      setResendNotice("Failed to resend the verification email.");
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken.trim()) return;
    setAdminError("");
    const ok = await loginWithAuthToken(authToken.trim());
    if (ok) onSuccess?.();
    else setAdminError("Invalid AUTH_TOKEN.");
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">登录 / 注册</h2>
      <p className="text-sm text-muted-foreground mb-5">登录后可跨设备共享图片与文本</p>

      {expired && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Your session has expired. Log in again.
        </p>
      )}
      {notice && (
        <p className="mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}

      <div className="flex mb-4 border-b">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(""); setUnverified(false); setSuccess(""); }}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === m ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "login" ? "登录" : "注册"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
          <input
            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" autoFocus
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
          <input
            id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        {mode === "register" && (
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-foreground mb-1">Confirm password</label>
            <input
              id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}

        {mode === "login" && unverified && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p>Email not verified — check your inbox.</p>
            <button type="button" onClick={handleResend} className="mt-1 text-sm font-medium text-blue-600 hover:underline">
              Resend verification email
            </button>
            {resendNotice && <p className="mt-1 text-blue-600">{resendNotice}</p>}
          </div>
        )}

        {success && <p className="text-sm text-green-600">{success}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !email.trim() || !password.trim()}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "请稍候…" : mode === "login" ? "登录" : "创建账户"}
        </button>
      </form>

      <div className="mt-6 border-t pt-3">
        <button type="button" onClick={() => setAdminOpen(!adminOpen)} className="text-xs text-muted-foreground hover:text-foreground">
          {adminOpen ? "隐藏管理员" : "管理员"}
        </button>
        {adminOpen && (
          <form onSubmit={handleAdminSubmit} className="mt-2 flex items-center gap-2">
            <input
              type="password" value={authToken} onChange={(e) => setAuthToken(e.target.value)}
              placeholder="AUTH_TOKEN"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button type="submit" disabled={!authToken.trim()}
              className="px-3 py-2 bg-foreground text-background text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
              初始化
            </button>
          </form>
        )}
        {adminError && <p className="mt-1 text-xs text-red-600">{adminError}</p>}
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Sessions expire after 48 hours. New accounts must verify their email.
      </p>
    </div>
  );
}
