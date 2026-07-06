import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useToast } from "../Toast";
import { colors } from "../theme";

export default function LoginPage() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("seller@nexzoneo.com");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast("Signed in successfully");
    } catch {
      toast("Invalid credentials. Try seller@nexzoneo.com / demo123", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${colors.deepNavy} 0%, ${colors.softRoyalBlue} 100%)`,
    }}>
      <div className="card" style={{ width: 400, padding: 40 }}>
        <h1 style={{ color: colors.deepNavy, marginBottom: 8 }}>Nexzoneo</h1>
        <p style={{ color: colors.textMuted, marginBottom: 32 }}>Seller Dashboard Login</p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginTop: 6 }} required />
          </label>
          <label style={{ display: "block", marginBottom: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginTop: 6 }} required />
          </label>
          <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
