import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sellerApi, Order, Product } from "../api";
import EmptyState from "../components/EmptyState";
import { TableSkeleton } from "../components/Skeleton";
import { useOrderNotifications } from "../hooks/useOrderNotifications";
import { useToast } from "../Toast";
import { colors } from "../theme";

export default function OverviewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderBanner, setNewOrderBanner] = useState(0);

  const load = () => {
    Promise.all([sellerApi.products(), sellerApi.orders()])
      .then(([p, o]) => { setProducts(p.data); setOrders(o.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onNewOrder = useCallback((count: number) => {
    setNewOrderBanner(count);
    toast(`🔔 ${count} new order${count > 1 ? "s" : ""} received!`, "info");
    load();
  }, [toast]);

  useOrderNotifications(onNewOrder);

  const pending = orders.filter((o) => o.status === "Pending").length;
  const revenue = orders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + Number(o.total_price), 0);

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: 28, color: colors.deepNavy, marginBottom: 24 }}>Dashboard Overview</h2>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div>
      {newOrderBanner > 0 && (
        <div style={{
          background: colors.warning, color: "#78350f", padding: "12px 20px",
          borderRadius: 8, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>🔔 <strong>{newOrderBanner} new order{newOrderBanner > 1 ? "s" : ""}!</strong> Waiting for your response.</span>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => { setNewOrderBanner(0); navigate("/orders"); }}>
            View Orders
          </button>
        </div>
      )}

      <h2 style={{ fontSize: 28, color: colors.deepNavy, marginBottom: 24 }}>Dashboard Overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        {[
          { label: "Products", value: products.length, color: colors.deepNavy },
          { label: "Total Orders", value: orders.length, color: colors.softRoyalBlue },
          { label: "Pending Orders", value: pending, color: colors.warning },
          { label: "Revenue (Paid)", value: `$${revenue.toFixed(2)}`, color: colors.success },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ borderLeft: `4px solid ${stat.color}` }}>
            <p style={{ fontSize: 13, color: colors.textMuted }}>{stat.label}</p>
            <p style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: colors.deepNavy }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ color: colors.deepNavy }}>Recent Orders</h3>
          <Link to="/orders" style={{ color: colors.softRoyalBlue, fontSize: 14 }}>View all →</Link>
        </div>
        {orders.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="No orders yet"
            message="When customers place orders, they'll appear here."
            actionLabel="Manage Products"
            onAction={() => navigate("/products")}
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.warmBeige}` }}>
                {["Order", "Customer", "Status", "Payment", "Total", "Date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 0", fontSize: 12, color: colors.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr
                  key={o.id}
                  className="clickable-row"
                  onClick={() => navigate(`/orders/${o.id}`)}
                  style={{ borderBottom: `1px solid ${colors.warmBeige}` }}
                >
                  <td style={{ padding: "12px 0", fontSize: 13 }}>#{o.id.slice(0, 8)}</td>
                  <td style={{ fontSize: 13 }}>{o.customer?.name || "—"}</td>
                  <td><span className={`badge badge-${o.status === "Completed" ? "completed" : o.status === "Cancelled" ? "cancelled" : "pending"}`}>{o.status}</span></td>
                  <td style={{ fontSize: 13 }}>{o.payment_status}</td>
                  <td style={{ fontWeight: 600 }}>${Number(o.total_price).toFixed(2)}</td>
                  <td style={{ fontSize: 13, color: colors.textMuted }}>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
