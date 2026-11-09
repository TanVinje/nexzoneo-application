import React, { useCallback, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl, ScrollView, Platform,
} from "react-native";
import * as Location from "expo-location";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { useCart } from "../CartContext";
import { Product, productApi, imageUrl, whiteLabelApi, PublicOffer } from "../api";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { ProductGridSkeleton } from "../components/Skeleton";

const CATEGORY_ICONS: Record<string, string> = {
  "Food & Grocery": "🥗",
  Electronics: "🎧",
  Fashion: "👕",
  "Home & Garden": "🪴",
  Services: "🛠️",
};

export default function HomeScreen({ navigation }: any) {
  const { branding } = useAuth();
  const { items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat?: number; lon?: number }>({});

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      let lat: number | undefined;
      let lon: number | undefined;
      if (Platform.OS !== "web") {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            lat = loc.coords.latitude;
            lon = loc.coords.longitude;
            setLocation({ lat, lon });
          }
        } catch {
          // Location optional for demo / web
        }
      }

      const listParams: { lat?: number; lon?: number; company_id?: string } = { lat, lon };
      // Single-brand mode: pin catalog to owner company when marketplace is off
      if (!branding.marketplace_mode_enabled && branding.company_id) {
        listParams.company_id = branding.company_id;
      }

      const [prods, cats, offs] = await Promise.all([
        productApi.list(listParams),
        productApi.categories(),
        whiteLabelApi.offers().catch(() => ({ data: [] as PublicOffer[] })),
      ]);
      setProducts(prods.data);
      setCategories(cats.data);
      setOffers(offs.data);
    } catch {
      setError("Couldn't load products. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branding.marketplace_mode_enabled, branding.company_id]);

  React.useEffect(() => { load(); }, [load]);

  const logoUri = imageUrl(branding.logo_url);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const heroTitle = branding.banner_title || branding.app_name;
  const heroSubtitle = branding.banner_subtitle || branding.welcome_text || "Order pickup or delivery";

  const listHeader = (
    <View>
      <View style={[styles.hero, { backgroundColor: branding.primary_color }]}>
        <View style={styles.heroTop}>
          <View style={styles.brandRow}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.headerLogo} resizeMode="contain" />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoFallbackText}>{(branding.app_name || "N")[0]}</Text>
              </View>
            )}
            <Text style={styles.brandName}>{branding.app_name}</Text>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate("Cart")}>
            <Text style={styles.cartText}>🛒{cartCount > 0 ? ` ${cartCount}` : ""}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
        {!location.lat && (
          <Text style={styles.locationHint}>Enable location for nearby results</Text>
        )}
      </View>

      {(offers.length > 0 || true) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannerRow}
        >
          {offers.length > 0 ? (
            offers.map((offer, idx) => (
              <View
                key={`${offer.company_id}-${idx}`}
                style={[styles.bannerCard, { backgroundColor: offer.offer_color || branding.secondary_color }]}
              >
                <Text style={styles.bannerLabel}>Deal</Text>
                <Text style={styles.bannerTitle}>{offer.offer_name}</Text>
                {offer.offer_subtitle ? (
                  <Text style={styles.bannerSub}>{offer.offer_subtitle}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <View style={[styles.bannerCard, { backgroundColor: branding.secondary_color }]}>
              <Text style={styles.bannerLabel}>Pickup or delivery</Text>
              <Text style={styles.bannerTitle}>Order your favorites</Text>
              <Text style={styles.bannerSub}>
                Delivery from ${Number(branding.delivery_fee_flat || 0).toFixed(2)} · Pickup free
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <Text style={styles.sectionLabel}>Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.categoryTile}
            onPress={() => navigation.navigate("Search", { categoryId: item.id })}
          >
            <Text style={styles.categoryIcon}>{CATEGORY_ICONS[item.name] || "📦"}</Text>
            <Text style={styles.categoryText} numberOfLines={2}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabelInline}>
          {branding.marketplace_mode_enabled ? "Popular near you" : "Menu"}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Search")}>
          <Text style={[styles.seeAll, { color: branding.secondary_color }]}>See all</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ flex: 1 }}>
          {listHeader}
          <ProductGridSkeleton />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : products.length === 0 ? (
        <FlatList
          data={[]}
          ListHeaderComponent={listHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={branding.primary_color} />}
          ListEmptyComponent={
            <EmptyState
              icon="🏪"
              title="No products available"
              message="Check back soon — new items are on the way."
              actionLabel="Search"
              onAction={() => navigation.navigate("Search")}
            />
          }
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingBottom: 24 }}
          columnWrapperStyle={{ paddingHorizontal: 12 }}
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
              {branding.marketplace_mode_enabled ? (
                <Text style={styles.productSeller}>{item.company?.name}</Text>
              ) : null}
              {item.rating_count > 0 && (
                <Text style={styles.productRating}>★ {Number(item.rating_average).toFixed(1)}</Text>
              )}
              <Text style={[styles.productPrice, { color: branding.secondary_color }]}>
                ${Number(item.price).toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmBeige },
  hero: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  brandRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  headerLogo: { width: 40, height: 40, borderRadius: 8, marginRight: 10, backgroundColor: "rgba(255,255,255,0.15)" },
  logoFallback: {
    width: 40, height: 40, borderRadius: 8, marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  logoFallbackText: { color: colors.white, fontWeight: "800", fontSize: 18 },
  brandName: { color: colors.white, fontSize: 22, fontWeight: "800", letterSpacing: 0.3 },
  cartBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  cartText: { fontSize: 16, color: colors.white, fontWeight: "600" },
  heroTitle: { color: colors.white, fontSize: 26, fontWeight: "800", lineHeight: 30, marginBottom: 6 },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20 },
  locationHint: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 10 },
  bannerRow: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  bannerCard: {
    width: 260, borderRadius: 16, padding: 16, marginRight: 4,
  },
  bannerLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  bannerTitle: { color: colors.white, fontSize: 18, fontWeight: "800", marginTop: 6 },
  bannerSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4 },
  sectionLabel: {
    fontSize: 16, fontWeight: "700", color: colors.deepNavy,
    marginTop: 20, marginBottom: 10, paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, marginTop: 8, marginBottom: 10,
  },
  sectionLabelInline: { fontSize: 16, fontWeight: "700", color: colors.deepNavy },
  seeAll: { fontSize: 13, fontWeight: "600" },
  categoryRow: { paddingHorizontal: 16, paddingBottom: 4 },
  categoryTile: {
    width: 88, backgroundColor: colors.white, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8,
    alignItems: "center", marginRight: 10,
  },
  categoryIcon: { fontSize: 22, marginBottom: 6 },
  categoryText: { color: colors.deepNavy, fontSize: 11, fontWeight: "600", textAlign: "center" },
  productCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 12, margin: 6, maxWidth: "47%",
  },
  productImage: {
    height: 96, backgroundColor: colors.warmBeige, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginBottom: 8, overflow: "hidden",
  },
  productImageFile: { width: "100%", height: "100%" },
  productName: { fontWeight: "700", color: colors.deepNavy, fontSize: 14 },
  productSeller: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  productRating: { fontSize: 11, color: colors.mutedBlue, marginTop: 2 },
  productPrice: { fontWeight: "800", marginTop: 6, fontSize: 16 },
});
