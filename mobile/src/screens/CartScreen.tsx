import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert,
} from "react-native";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { useCart } from "../CartContext";
import { apiErrorMessage, orderApi } from "../api";
import EmptyState from "../components/EmptyState";

type OrderMethod = "delivery" | "pickup";

export default function CartScreen({ navigation }: any) {
  const { user, branding } = useAuth();
  const { items, updateQuantity, removeItem, clear, total, companyId, hasMixedSellers } = useCart();
  const [address, setAddress] = useState(user?.saved_address || "");
  const [orderMethod, setOrderMethod] = useState<OrderMethod>("delivery");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.saved_address) setAddress(user.saved_address);
  }, [user?.saved_address]);

  const checkout = async () => {
    if (!companyId || items.length === 0) return;
    if (hasMixedSellers) {
      Alert.alert("Mixed sellers", "Please remove items from other sellers before checkout.");
      return;
    }
    if (orderMethod === "delivery" && !address.trim()) {
      Alert.alert("Address required", "Please enter a delivery address.");
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
      Alert.alert("Error", apiErrorMessage(err, "Could not place order. Please try again."));
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

  return (
    <View style={styles.container}>
      {hasMixedSellers && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>⚠️ Your cart has items from multiple sellers. Remove extra items to checkout.</Text>
        </View>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemSeller}>{item.product.company?.name}</Text>
              <Text style={styles.itemPrice}>${Number(item.product.price).toFixed(2)} each</Text>
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
        )}
      />
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
                {method === "delivery" ? "🚚 Delivery" : "🏪 Pickup"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {orderMethod === "delivery" && (
          <>
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput style={styles.input} placeholder="Enter your address" value={address} onChangeText={setAddress} placeholderTextColor={colors.mutedBlue} />
          </>
        )}
        {orderMethod === "pickup" && (
          <Text style={styles.pickupNote}>You'll pick up at {items[0]?.product.company?.name || "the seller's location"}.</Text>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={[styles.totalValue, { color: branding.secondary_color }]}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: branding.primary_color }, (loading || hasMixedSellers) && styles.disabled]}
          onPress={checkout}
          disabled={loading || hasMixedSellers}
        >
          <Text style={styles.checkoutText}>{loading ? "Placing Order..." : "Place Order"}</Text>
        </TouchableOpacity>
        <Text style={styles.note}>Payment will be requested after seller accepts your order.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmBeige },
  warning: { backgroundColor: "#fef3c7", padding: 12, margin: 16, marginBottom: 0, borderRadius: 8 },
  warningText: { color: "#92400e", fontSize: 13 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  itemName: { fontWeight: "600", color: colors.deepNavy },
  itemSeller: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  itemPrice: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 12 },
  qtyBtn: { fontSize: 20, color: colors.deepNavy, paddingHorizontal: 8 },
  qty: { fontSize: 16, fontWeight: "600", minWidth: 24, textAlign: "center" },
  remove: { color: colors.danger, fontSize: 18, padding: 4 },
  footer: { backgroundColor: colors.white, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  label: { fontSize: 13, fontWeight: "500", color: colors.deepNavy, marginBottom: 8, marginTop: 4 },
  methodRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  methodBtn: { flex: 1, borderWidth: 1, borderColor: colors.mutedBlue, borderRadius: 10, padding: 12, alignItems: "center" },
  methodText: { color: colors.deepNavy, fontWeight: "500" },
  methodTextActive: { color: colors.white },
  input: { borderWidth: 1, borderColor: colors.mutedBlue, borderRadius: 10, padding: 12, marginBottom: 16 },
  pickupNote: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 18 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  totalLabel: { fontSize: 18, fontWeight: "600" },
  totalValue: { fontSize: 22, fontWeight: "700" },
  checkoutBtn: { borderRadius: 12, padding: 16, alignItems: "center" },
  checkoutText: { color: colors.white, fontWeight: "600", fontSize: 16 },
  disabled: { opacity: 0.5 },
  note: { textAlign: "center", fontSize: 12, color: colors.textMuted, marginTop: 10 },
});
