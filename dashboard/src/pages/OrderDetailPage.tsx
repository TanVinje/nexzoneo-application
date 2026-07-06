import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { sellerApi, Order } from "../api";
import ConfirmDialog from "../ConfirmDialog";
import { useToast } from "../Toast";
import { SkeletonBox } from "../components/Skeleton";
import { colors } from "../theme";

const STATUS_ACTIONS: Record<string, string[]> = {
  Pending: ["Seller Accepted", "Seller Rejected"],
  Paid: ["Processing"],
  Processing: ["Ready for Pickup", "Ready for Delivery", "Out for Delivery", "Completed"],
  "Ready for Pickup": ["Completed"],
  "Ready for Delivery": ["Out for Delivery", "Completed"],
  "Out for Delivery": ["Completed"],
};

const TIMELINE = ["Pending", "Awaiting Payment", "Paid", "Processing", "Completed"];

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const load = () => {
    if (!orderId) return;
    sellerApi.order(orderId).then((r) => setOrder(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [orderId]);

  const applyStatus = async (status: string) => {
    if (!orderId) return;
    setUpdating(true);
    try {
      await sellerApi.updateOrderStatus(orderId, status);
      toast(`Order updated to ${status === "Seller Accepted" ? "Awaiting Payment" : status}`);
      load();
    } catch {
      toast("Could not update order", "error");
    } finally {
      setUpdating(false);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div>
        <SkeletonBox height={32} width={200} style={{ marginBottom: 24 }} />
        <div className="card"><SkeletonBox height={120} /></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <p>Order not found.</p>
        <Link to="/orders">← Back to orders</Link>
      </div>
    );
  }

  const currentIdx = TIMELINE.findIndex((s) => order.status.includes(s) || order.status === s);

  return (
    <div>
      <ConfirmDialog
        open={!!confirmAction}
        title="Reject order?"
        message="The customer will not be charged. This order will be cancelled."
        confirmLabel="Reject Order"
        danger
        onConfirm={() => confirmAction && applyStatus(confirmAction)}
        onCancel={() => setConfirmAction(null)}
      />

      <Link to="/orders" style={{ color: colors.softRoyalBlue, fontSize: 14 }}>← Back to orders</Link>
      <h2 style={{ fontSize: 28, color: colors.deepNavy, margin: "16px 0 24px" }}>Order #{order.id.slice(0, 8)}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <div className="card">
          <h3 style={{ color: colors.deepNavy, marginBottom: 16 }}>Status</h3>
          <p style={{ fontSize: 24, fontWeight: 700, color: colors.softRoyalBlue }}>{order.status}</p>
          <p style={{ color: colors.textMuted, marginTop: 4 }}>Payment: {order.payment_status}</p>
          <p style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>{new Date(order.created_at).toLocaleString()}</p>

          <div style={{ marginTop: 24 }}>
            {TIMELINE.map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 6,
                  background: i <= currentIdx ? colors.softRoyalBlue : colors.warmBeige,
                }} />
                <span style={{ color: i <= currentIdx ? colors.deepNavy : colors.textMuted, fontWeight: i <= currentIdx ? 600 : 400 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ color: colors.deepNavy, marginBottom: 16 }}>Customer</h3>
          {order.customer ? (
            <>
              <p style={{ fontWeight: 600, fontSize: 16 }}>{order.customer.name}</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>
                <a href={`mailto:${order.customer.email}`} style={{ color: colors.softRoyalBlue }}>{order.customer.email}</a>
              </p>
              {order.customer.phone && (
                <p style={{ fontSize: 14, marginTop: 8 }}>
                  <a href={`tel:${order.customer.phone}`} style={{ color: colors.softRoyalBlue }}>📞 {order.customer.phone}</a>
                </p>
              )}
            </>
          ) : (
            <p style={{ color: colors.textMuted }}>Customer details unavailable</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ color: colors.deepNavy, marginBottom: 16 }}>Delivery</h3>
          <p style={{ fontSize: 14 }}><strong>Method:</strong> {order.order_method}</p>
          {order.delivery_address && (
            <p style={{ fontSize: 14, marginTop: 8, color: colors.textMuted }}>📍 {order.delivery_address}</p>
          )}
          <p style={{ fontSize: 22, fontWeight: 700, color: colors.deepNavy, marginTop: 20 }}>
            Total: ${Number(order.total_price).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ color: colors.deepNavy, marginBottom: 16 }}>Items</h3>
        {order.items.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${colors.warmBeige}` }}>
            <span>{item.product?.name || "Product"} × {item.quantity}</span>
            <span>${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
        {(STATUS_ACTIONS[order.status] || []).map((action) => (
          <button
            key={action}
            className={action.includes("Reject") ? "btn-danger" : "btn-primary"}
            disabled={updating}
            onClick={() => action === "Seller Rejected" ? setConfirmAction(action) : applyStatus(action)}
          >
            {updating ? "Updating..." : action}
          </button>
        ))}
      </div>
    </div>
  );
}
