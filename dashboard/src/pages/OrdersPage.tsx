import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { sellerApi, Order } from "../api";
import ConfirmDialog from "../ConfirmDialog";
import EmptyState from "../components/EmptyState";
import CustomerInfo from "../components/CustomerInfo";
import { TableSkeleton } from "../components/Skeleton";
import { useToast } from "../Toast";
import { colors } from "../theme";

const STATUS_ACTIONS: Record<string, string[]> = {
  Pending: ["Seller Accepted", "Seller Rejected"],
  "Awaiting Payment": [],
  Paid: ["Processing"],
  Processing: ["Ready for Pickup", "Ready for Delivery", "Out for Delivery", "Completed"],
  "Ready for Pickup": ["Completed"],
  "Ready for Delivery": ["Out for Delivery", "Completed"],
  "Out for Delivery": ["Completed"],
};

export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; status: string } | null>(null);

  const load = () => sellerApi.orders().then((r) => setOrders(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const applyStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await sellerApi.updateOrderStatus(id, status);
      toast(`Order updated to ${status === "Seller Accepted" ? "Awaiting Payment" : status}`);
      load();
    } catch {
      toast("Could not update order status", "error");
    } finally {
      setUpdating(null);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: 28, color: colors.deepNavy, marginBottom: 24 }}>Order Management</h2>
        <TableSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div>
      <ConfirmDialog
        open={!!confirmAction}
        title="Reject order?"
        message="The customer will not be charged. This order will be cancelled."
        confirmLabel="Reject Order"
        danger
        onConfirm={() => confirmAction && applyStatus(confirmAction.orderId, confirmAction.status)}
        onCancel={() => setConfirmAction(null)}
      />

      <h2 style={{ fontSize: 28, color: colors.deepNavy, marginBottom: 24 }}>Order Management</h2>
      {orders.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No orders received yet"
          message="Orders from customers will show up here. Make sure your products are listed and available."
          actionLabel="View Products"
          onAction={() => window.location.href = "/products"}
        />
      ) : (
        orders.map((o) => (
          <div key={o.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Link to={`/orders/${o.id}`} style={{ fontWeight: 600, color: colors.deepNavy, fontSize: 16 }}>
                  Order #{o.id.slice(0, 8)} →
                </Link>
                <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>{new Date(o.created_at).toLocaleString()}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={`badge badge-${o.status === "Completed" ? "completed" : o.status === "Cancelled" ? "cancelled" : "pending"}`}>{o.status}</span>
                <p style={{ fontWeight: 700, marginTop: 8, fontSize: 18 }}>${Number(o.total_price).toFixed(2)}</p>
              </div>
            </div>
            <div style={{ margin: "16px 0", padding: "12px 0", borderTop: `1px solid ${colors.warmBeige}` }}>
              {o.items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                  <span>{item.product?.name || "Product"} × {item.quantity}</span>
                  <span>${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {o.delivery_address && <p style={{ fontSize: 13, color: colors.textMuted }}>📍 {o.delivery_address}</p>}
            <CustomerInfo customer={o.customer} compact />
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {(STATUS_ACTIONS[o.status] || []).map((action) => (
                <button
                  key={action}
                  className={action.includes("Reject") ? "btn-danger" : "btn-primary"}
                  style={{ fontSize: 13 }}
                  disabled={updating === o.id}
                  onClick={() => action === "Seller Rejected" ? setConfirmAction({ orderId: o.id, status: action }) : applyStatus(o.id, action)}
                >
                  {updating === o.id ? "Updating..." : action}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
