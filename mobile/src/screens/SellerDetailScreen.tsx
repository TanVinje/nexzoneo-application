import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { Company, companyApi, productApi, Product, imageUrl } from "../api";
import ErrorState from "../components/ErrorState";

export default function SellerDetailScreen({ route, navigation }: any) {
  const { branding } = useAuth();
  const { companyId } = route.params;
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      companyApi.get(companyId),
      productApi.list({ company_id: companyId }),
    ])
      .then(([companyRes, productsRes]) => {
        setCompany(companyRes.data);
        setProducts(productsRes.data);
      })
      .catch(() => setError("Couldn't load seller details."))
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={branding.primary_color} />;
  if (error || !company) return <ErrorState message={error || "Seller not found."} onRetry={load} />;

  const logoUri = imageUrl(company.logo_url);

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: branding.primary_color }]}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="contain" />
        ) : (
          <Text style={styles.logo}>🏪</Text>
        )}
        <Text style={styles.name}>{company.name}</Text>
        {company.rating_count > 0 && (
          <Text style={styles.rating}>⭐ {Number(company.rating_average).toFixed(1)} ({company.rating_count})</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.desc}>{company.description}</Text>
        {company.address && <Text style={styles.address}>📍 {company.address}</Text>}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products ({products.length})</Text>
        {products.length === 0 ? (
          <Text style={styles.desc}>No products listed right now.</Text>
        ) : (
          products.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.productRow}
              onPress={() => navigation.navigate("ProductDetail", { productId: p.id })}
            >
              <View style={styles.productLeft}>
                <View style={styles.thumb}>
                  {p.image_url ? (
                    <Image source={{ uri: imageUrl(p.image_url) || "" }} style={styles.thumbImage} />
                  ) : (
                    <Text>📦</Text>
                  )}
                </View>
                <Text style={styles.productName}>{p.name}</Text>
              </View>
              <Text style={[styles.productPrice, { color: branding.secondary_color }]}>${Number(p.price).toFixed(2)} →</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmBeige },
  header: { padding: 24, alignItems: "center" },
  logo: { fontSize: 48 },
  logoImage: { width: 72, height: 72, borderRadius: 12 },
  name: { color: colors.white, fontSize: 24, fontWeight: "700", marginTop: 8 },
  rating: { color: "rgba(255,255,255,0.8)", marginTop: 4 },
  section: { backgroundColor: colors.white, margin: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { fontWeight: "600", color: colors.deepNavy, marginBottom: 8 },
  desc: { color: colors.textMuted, lineHeight: 20 },
  address: { color: colors.mutedBlue, marginTop: 8, fontSize: 13 },
  productRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.warmBeige },
  productLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  thumb: { width: 40, height: 40, backgroundColor: colors.warmBeige, borderRadius: 8, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  thumbImage: { width: "100%", height: "100%" },
  productName: { color: colors.text, flex: 1 },
  productPrice: { fontWeight: "600" },
});
