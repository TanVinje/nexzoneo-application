import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking,
} from "react-native";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { apiErrorMessage, Order, orderApi } from "../api";
import ErrorState from "../components/ErrorState";
import { notifyOrderUpdate } from "../notifications";

const STEPS = ["Pending", "Awaiting Payment", "Paid", "Processing", "Completed"];

const STATUS_MESSAGES: Record<string, string> = {
  "Awaiting Payment": "Your order was accepted — payment is now due.",
  Paid: "Payment received! The seller is preparing your order.",
  Processing: "Your order is being prepared.",
  Completed: "Your order is complete. Enjoy!",
  Cancelled: "Your order was cancelled.",
};

export default function OrderStatusScreen({ route, navigation }: any) {
  const { branding } = useAuth();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const lastStatus = useRef<string | null>(null);

  const load = async () => {
    try {
      const [orderRes, configRes] = await Promise.all([
        orderApi.get(orderId),
        orderApi.paymentConfig(orderId).catch(() => ({ data: { stripe_enabled: false } })),
      ]);
      const data = orderRes.data;
      if (lastStatus.current && lastStatus.current !== data.status) {
        const msg = STATUS_MESSAGES[data.status];
        if (msg) await notifyOrderUpdate("Order update", msg);
      }
      lastStatus.current = data.status;
      setOrder(data);
      setStripeEnabled(configRes.data.stripe_enabled);
      setError("");
    } catch {
      setError("Couldn't load order status.");
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const paySimulated = async () => {
    setPaying(true);
    try {
      await orderApi.pay(orderId);
      await load();
      await notifyOrderUpdate("Payment successful", "Your payment was processed.");
    } catch (err) {
      Alert.alert("Payment failed", apiErrorMessage(err, "Could not process payment. Please try again."));
    } finally {
      setPaying(false);
    }
  };

  const payWithStripe = async () => {
    setPaying(true);
    try {
      const { data } = await orderApi.checkout(orderId);
      const supported = await Linking.canOpenURL(data.checkout_url);
      if (!supported) {
        Alert.alert("Error", "Cannot open payment page on this device.");
        return;
      }
      await Linking.openURL(data.checkout_url);
      Alert.alert(
        "Complete payment",
        "Finish payment in your browser, then return here. This screen will update automatically.",
      );
    } catch (err) {
      Alert.alert("Payment failed", apiErrorMessage(err, "Could not start checkout. Please try again."));
    } finally {
      setPaying(false);
    }
  };

  if (error && !order) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!order) return <ActivityIndicator style={{ flex: 1 }} color={branding.primary_color} />;

  const currentStep = STEPS.findIndex((s) => order.status.includes(s) || order.status === s);

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.statusCard, { backgroundColor: branding.primary_color }]}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <Text style={styles.status}>{order.status}</Text>
        <Text style={styles.payment}>Payment: {order.payment_status}</Text>
        {order.order_method && (
          <Text style={styles.payment}>{order.order_method === "pickup" ? "🏪 Pickup" : "🚚 Delivery"}</Text>
        )}
      </View>

      <View style={styles.timeline}>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.step}>
            <View style={[styles.dot, i <= currentStep && { backgroundColor: branding.secondary_color }]} />
            <Text style={[styles.stepText, i <= currentStep && styles.stepTextActive]}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.itemsCard}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text>{item.product?.name} × {item.quantity}</Text>
            <Text>${(Number(item.unit_price) * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        {order.subtotal != null && (
          <View style={styles.itemRow}>
            <Text style={styles.feeLabel}>Subtotal</Text>
            <Text>${Number(order.subtotal).toFixed(2)}</Text>
          </View>
        )}
        {order.delivery_fee != null && (
          <View style={styles.itemRow}>
            <Text style={styles.feeLabel}>Delivery fee</Text>
            <Text>
              {order.order_method === "pickup" || Number(order.delivery_fee) === 0
                ? "Free"
                : `$${Number(order.delivery_fee).toFixed(2)}`}
            </Text>
          </View>
        )}
        {order.tax_amount != null && Number(order.tax_amount) > 0 && (
          <View style={styles.itemRow}>
            <Text style={styles.feeLabel}>Tax</Text>
            <Text>${Number(order.tax_amount).toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={[styles.totalValue, { color: branding.secondary_color }]}>${Number(order.total_price).toFixed(2)}</Text>
        </View>
      </View>

      {order.delivery_address && order.order_method === "delivery" && (
        <View style={styles.addressCard}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>📍 {order.delivery_address}</Text>
        </View>
      )}

      {order.status === "Awaiting Payment" && (
        <>
          {stripeEnabled ? (
            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: branding.primary_color }]}
              onPress={payWithStripe}
              disabled={paying}
            >
              <Text style={styles.payBtnText}>{paying ? "Opening checkout..." : "Pay with Card"}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.payBtn, { backgroundColor: colors.success }]} onPress={paySimulated} disabled={paying}>
              <Text style={styles.payBtnText}>{paying ? "Processing..." : "Pay Now (Demo)"}</Text>
            </TouchableOpacity>
          )}
          {stripeEnabled && (
            <Text style={styles.payNote}>Secure payment powered by Stripe. Return here after paying.</Text>
          )}
        </>
      )}

      {order.status === "Completed" && (
        <TouchableOpacity
          style={[styles.rateBtn, { backgroundColor: branding.secondary_color }]}
          onPress={() => navigation.navigate("Rating", {
            orderId: order.id,
            companyId: order.company_id,
            productIds: order.items.map((i) => i.product_id || i.product?.id).filter(Boolean),
            productNames: order.items.map((i) => i.product?.name || "Product"),
          })}
        >
          <Text style={styles.rateBtnText}>Rate Products & Seller</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmBeige, padding: 16 },
  statusCard: { borderRadius: 12, padding: 20, alignItems: "center" },
  statusLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  status: { color: colors.white, fontSize: 24, fontWeight: "700", marginTop: 4 },
  payment: { color: "rgba(255,255,255,0.8)", marginTop: 4 },
  timeline: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginTop: 16 },
  step: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.warmBeige, marginRight: 12 },
  stepText: { color: colors.textMuted, fontSize: 14 },
  stepTextActive: { color: colors.deepNavy, fontWeight: "600" },
  itemsCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginTop: 16 },
  addressCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginTop: 16 },
  addressText: { color: colors.textMuted, lineHeight: 20 },
  sectionTitle: { fontWeight: "600", color: colors.deepNavy, marginBottom: 12 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  feeLabel: { color: colors.textMuted },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.warmBeige, paddingTop: 12, marginTop: 8 },
  totalLabel: { fontWeight: "600" },
  totalValue: { fontWeight: "700", fontSize: 18 },
  payBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16 },
  payBtnText: { color: colors.white, fontWeight: "600", fontSize: 16 },
  payNote: { textAlign: "center", fontSize: 12, color: colors.textMuted, marginTop: 10 },
  rateBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16, marginBottom: 32 },
  rateBtnText: { color: colors.white, fontWeight: "600", fontSize: 16 },
});
