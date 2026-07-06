import React, { useCallback, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl,
} from "react-native";
import * as Location from "expo-location";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { useCart } from "../CartContext";
import { Product, productApi, imageUrl } from "../api";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { ProductGridSkeleton } from "../components/Skeleton";

export default function HomeScreen({ navigation }: any) {
  const { branding } = useAuth();
  const { items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat?: number; lon?: number }>({});

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat: number | undefined;
      let lon: number | undefined;
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lon = loc.coords.longitude;
        setLocation({ lat, lon });
      }
      const [prods, cats] = await Promise.all([
        productApi.list({ lat, lon }),
        productApi.categories(),
      ]);
      setProducts(prods.data);
      setCategories(cats.data);
    } catch {
      setError("Couldn't load products. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const logoUri = imageUrl(branding.logo_url);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: branding.primary_color }]}>
        <View style={styles.headerTop}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.headerLogo} resizeMode="contain" />
          ) : null}
          <Text style={styles.greeting}>{branding.welcome_text}</Text>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate("Cart")}>
            <Text style={styles.cartText}>🛒 {items.length > 0 ? `(${items.length})` : ""}</Text>
          </TouchableOpacity>
        </View>
        {!location.lat && <Text style={styles.locationHint}>📍 Enable location for nearby results</Text>}
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryChip}
            onPress={() => navigation.navigate("Search", { categoryId: item.id })}
          >
            <Text style={styles.categoryText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ProductGridSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No products available"
          message="Check back soon — sellers are adding new items."
          actionLabel="Search Products"
          onAction={() => navigation.navigate("Search")}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={branding.primary_color} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
            >
              <View style={styles.productImage}>
                {item.image_url ? (
                  <Image source={{ uri: imageUrl(item.image_url) || "" }} style={styles.productImageFile} />
                ) : (
                  <Text style={{ fontSize: 32 }}>📦</Text>
                )}
              </View>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.productSeller}>{item.company?.name}</Text>
              {item.rating_count > 0 && (
                <Text style={styles.productRating}>⭐ {Number(item.rating_average).toFixed(1)}</Text>
              )}
              <Text style={[styles.productPrice, { color: branding.secondary_color }]}>${Number(item.price).toFixed(2)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmBeige },
  header: { padding: 20, paddingTop: 16 },
  headerTop: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  headerLogo: { width: 32, height: 32, borderRadius: 6, marginRight: 10 },
  greeting: { flex: 1, color: colors.white, fontSize: 18, fontWeight: "600" },
  locationHint: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 8 },
  cartBtn: { backgroundColor: "rgba(255,255,255,0.2)", padding: 10, borderRadius: 8 },
  cartText: { fontSize: 18 },
  categories: { maxHeight: 50, marginVertical: 12 },
  categoryChip: { backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  categoryText: { color: colors.deepNavy, fontSize: 13, fontWeight: "500" },
  productCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 12, margin: 6, maxWidth: "47%" },
  productImage: { height: 80, backgroundColor: colors.warmBeige, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 8, overflow: "hidden" },
  productImageFile: { width: "100%", height: "100%" },
  productName: { fontWeight: "600", color: colors.deepNavy, fontSize: 14 },
  productSeller: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  productRating: { fontSize: 11, color: colors.mutedBlue, marginTop: 2 },
  productPrice: { fontWeight: "700", marginTop: 6, fontSize: 16 },
});
