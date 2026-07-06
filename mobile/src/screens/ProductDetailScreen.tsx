import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from "react-native";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { useCart } from "../CartContext";
import { Product, productApi, imageUrl } from "../api";
import ErrorState from "../components/ErrorState";
import { SkeletonBox } from "../components/Skeleton";

export default function ProductDetailScreen({ route, navigation }: any) {
  const { branding } = useAuth();
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addItem } = useCart();

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    productApi.get(productId)
      .then((r) => setProduct(r.data))
      .catch(() => setError("Couldn't load this product."))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.warmBeige, padding: 20 }}>
        <SkeletonBox height={220} style={{ marginBottom: 20 }} />
        <SkeletonBox height={28} width="70%" style={{ marginBottom: 12 }} />
        <SkeletonBox height={20} width="40%" />
      </View>
    );
  }

  if (error || !product) {
    return <ErrorState message={error || "Product not found."} onRetry={load} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageBox}>
        {product.image_url ? (
          <Image source={{ uri: imageUrl(product.image_url) || "" }} style={styles.productImage} />
        ) : (
          <Text style={{ fontSize: 64 }}>📦</Text>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={[styles.price, { color: branding.secondary_color }]}>${Number(product.price).toFixed(2)}</Text>
        {product.rating_count > 0 && (
          <Text style={styles.rating}>⭐ {Number(product.rating_average).toFixed(1)} ({product.rating_count} reviews)</Text>
        )}
        <TouchableOpacity onPress={() => navigation.navigate("SellerDetail", { companyId: product.company_id })}>
          <Text style={[styles.seller, { color: branding.secondary_color }]}>Sold by {product.company?.name} →</Text>
        </TouchableOpacity>
        <Text style={styles.desc}>{product.description}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaItem}>📦 Stock: {product.stock_quantity}</Text>
          <Text style={styles.metaItem}>🚚 {product.order_method}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: branding.primary_color }, !product.is_available && styles.disabled]}
          disabled={!product.is_available}
          onPress={() => {
            const added = addItem(product);
            if (added) navigation.navigate("Main", { screen: "Cart" });
          }}
        >
          <Text style={styles.addBtnText}>{product.is_available ? "Add to Cart" : "Unavailable"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmBeige },
  imageBox: { height: 220, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  productImage: { width: "100%", height: "100%" },
  content: { padding: 20 },
  name: { fontSize: 24, fontWeight: "700", color: colors.deepNavy },
  price: { fontSize: 28, fontWeight: "700", marginTop: 8 },
  rating: { color: colors.mutedBlue, marginTop: 4 },
  seller: { marginTop: 12, fontWeight: "500" },
  desc: { color: colors.textMuted, marginTop: 16, lineHeight: 22 },
  meta: { flexDirection: "row", gap: 16, marginTop: 16 },
  metaItem: { color: colors.textMuted, fontSize: 13 },
  addBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  addBtnText: { color: colors.white, fontWeight: "600", fontSize: 16 },
  disabled: { opacity: 0.5 },
});
