import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Platform,
} from "react-native";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { useCart } from "../CartContext";
import { apiErrorMessage, orderApi, OrderQuote } from "../api";
import EmptyState from "../components/EmptyState";

type OrderMethod = "delivery" | "pickup";

function money(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function CartScreen({ navigation }: any) {
  const { user, branding } = useAuth();
  const { items, updateQuantity, removeItem, clear, total, companyId, hasMixedSellers } = useCart();
  const [address, setAddress] = useState(user?.saved_address || "");
  const [orderMethod, setOrderMethod] = useState<OrderMethod>("delivery");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    if (user?.saved_address) setAddress(user.saved_address);
  }, [user?.saved_address]);

  useEffect(() => {
    let cancelled = false;
    const fetchQuote = async () => {
      if (!companyId || items.length === 0 || hasMixedSellers) {
        setQuote(null);
        return;
      }
      setQuoteLoading(true);
      try {
        const { data } = await orderApi.quote({
          company_id: companyId,
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          order_method: orderMethod,
        });
        if (!cancelled) setQuote(data);
      } catch {
        if (!cancelled) {
          const subtotal = money(total);
          const tax_rate = money(branding.tax_rate_percent);
          const tax_amount = Math.round(subtotal * tax_rate) / 100;
          setQuote({
            subtotal,
            delivery_fee: 0,
            tax_amount,
            total_price: subtotal + tax_amount,
            tax_rate_percent: tax_rate,
          });
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    };
    fetchQuote();
    return () => { cancelled = true; };
  }, [companyId, items, orderMethod, hasMixedSellers, total, branding.tax_rate_percent]);

  const checkout = async () => {
    if (!companyId || items.length === 0) return;
    if (hasMixedSellers) {
      const msg = "Please remove items from other sellers before checkout.";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Mixed sellers", msg);
      return;
    }
    if (orderMethod === "delivery" && !address.trim()) {
      const msg = "Please enter a delivery address.";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Address required", msg);
      return;
    }
    setLoading(true);
    try {
      const { data } = await orderApi.create({
        company_id: companyId,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        order_method: orderMethod,
        delivery_address: orderMethod === "delivery" ? address.trim() : undefined,
      });
      clear();
      navigation.getParent()?.navigate("OrderStatus", { orderId: data.id });
    } catch (err) {
      const msg = apiErrorMessage(err, "Could not place order. Please try again.");
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Browse products and add items to get started."
          actionLabel="Browse Products"
          onAction={() => navigation.navigate("Home")}
        />
      </View>
    );
  }

  const displaySubtotal = money(quote?.subtotal, money(total));
  const displayTax = money(quote?.tax_amount);
  const displayTotal = money(quote?.total_price, displaySubtotal + displayTax);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {hasMixedSellers && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Your cart has items from multiple sellers. Remove extra items to checkout.</Text>
        </View>
      )}

      <View style={styles.itemsWrap}>
        {items.map((item) => (
          <View key={item.product.id} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              {branding.marketplace_mode_enabled ? (
                <Text style={styles.itemSeller}>{item.product.company?.name}</Text>
              ) : null}
              <Text style={styles.itemPrice}>${money(item.product.price).toFixed(2)} each</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                <Text style={styles.qtyBtn}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                <Text style={styles.qtyBtn}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.product.id)}>
              <Text style={styles.remove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.label}>How would you like to receive your order?</Text>
        <View style={styles.methodRow}>
          {(["delivery", "pickup"] as OrderMethod[]).map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.methodBtn, orderMethod === method && { backgroundColor: branding.primary_color, borderColor: branding.primary_color }]}
              onPress={() => setOrderMethod(method)}
            >
              <Text style={[styles.methodText, orderMethod === method && styles.methodTextActive]}>
                {method === "delivery" ? "Delivery" : "Pickup"}
              </Text>
              <Text style={[styles.methodHint, orderMethod === method && styles.methodTextActive]}>
                {method === "delivery" ? "To your address" : "At the store"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {orderMethod === "delivery" && (
          <View>
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor={colors.mutedBlue}
            />
            <Text style={styles.pickupNote}>
              Delivery fees are not charged yet — courier pricing comes later.
            </Text>
          </View>
        )}
        {orderMethod === "pickup" && (
          <Text style={styles.pickupNote}>
            You'll pick up at {items[0]?.product.company?.name || "the seller's location"}.
          </Text>
        )}

        <View style={styles.breakdown}>
          {quoteLoading ? (
            <ActivityIndicator color={branding.primary_color} style={{ marginVertical: 8 }} />
          ) : (
            <View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Subtotal</Text>
                <Text style={styles.breakdownValue}>${displaySubtotal.toFixed(2)}</Text>
              </View>
              {displayTax > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    Tax ({money(quote?.tax_rate_percent || branding.tax_rate_percent)}%)
                  </Text>
                  <Text style={styles.breakdownValue}>${displayTax.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.breakdownRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={[styles.totalValue, { color: branding.secondary_color }]}>
                  ${displayTotal.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: branding.primary_color }, (loading || hasMixedSellers) && styles.disabled]}
          onPress={checkout}
          disabled={loading || hasMixedSellers}
        >
          <Text style={styles.checkoutText}>{loading ? "Placing Order..." : "Place Order"}</Text>
        </TouchableOpacity>
        <Text style={styles.note}>Payment is requested after the seller accepts. Totals are calculated on the server.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmBeige },
  scrollContent: { paddingBottom: 40 },
  warning: { backgroundColor: "#fef3c7", padding: 12, margin: 16, marginBottom: 0, borderRadius: 8 },
  warningText: { color: "#92400e", fontSize: 13 },
  itemsWrap: { padding: 16, paddingBottom: 0 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  itemName: { fontWeight: "600", color: colors.deepNavy },
  itemSeller: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  itemPrice: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 12 },
  qtyBtn: { fontSize: 20, color: colors.deepNavy, paddingHorizontal: 8 },
  qty: { fontSize: 16, fontWeight: "600", minWidth: 24, textAlign: "center" },
  remove: { color: colors.danger, fontSize: 18, padding: 4 },
  footer: { backgroundColor: colors.white, padding: 20, marginTop: 8, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  label: { fontSize: 13, fontWeight: "500", color: colors.deepNavy, marginBottom: 8, marginTop: 4 },
  methodRow: { flexDirection: "row", marginBottom: 16 },
  methodBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.mutedBlue, borderRadius: 10,
    padding: 12, alignItems: "center", marginHorizontal: 5,
  },
  methodText: { color: colors.deepNavy, fontWeight: "600" },
  methodHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  methodTextActive: { color: colors.white },
  input: { borderWidth: 1, borderColor: colors.mutedBlue, borderRadius: 10, padding: 12, marginBottom: 8 },
  pickupNote: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 18 },
  breakdown: { marginBottom: 8 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  breakdownLabel: { fontSize: 14, color: colors.textMuted },
  breakdownValue: { fontSize: 14, color: colors.deepNavy, fontWeight: "500" },
  totalRow: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E9DFCC" },
  totalLabel: { fontSize: 18, fontWeight: "700", color: colors.deepNavy },
  totalValue: { fontSize: 22, fontWeight: "800" },
  checkoutBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  checkoutText: { color: colors.white, fontWeight: "600", fontSize: 16 },
  disabled: { opacity: 0.5 },
  note: { textAlign: "center", fontSize: 12, color: colors.textMuted, marginTop: 10 },
});
