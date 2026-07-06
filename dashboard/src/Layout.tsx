import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useToast } from "./Toast";
import { colors } from "./theme";

const navItems = [
  { path: "/", label: "Overview", icon: "📊" },
  { path: "/products", label: "Products", icon: "📦" },
  { path: "/orders", label: "Orders", icon: "🛒" },
  { path: "/branding", label: "Branding", icon: "🎨" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  if (!user || user.role !== "seller") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{
        width: 240, background: colors.deepNavy, color: "white",
        padding: "24px 16px", display: "flex", flexDirection: "column",
      }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Nexzoneo</h1>
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Seller Dashboard</p>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", borderRadius: 8, marginBottom: 4,
              background: location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path)) ? colors.softRoyalBlue : "transparent",
              color: "white", fontSize: 14,
            }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16 }}>
          <p style={{ fontSize: 13, marginBottom: 8 }}>{user.name}</p>
          <button onClick={() => { logout(); toast("Signed out"); }} style={{
            background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)",
            width: "100%", padding: 8,
          }}>Sign Out</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
