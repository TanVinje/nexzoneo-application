import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl,
} from "react-native";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { Product, productApi, imageUrl } from "../api";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { ProductGridSkeleton } from "../components/Skeleton";

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function SearchScreen({ navigation, route }: any) {
  const { branding } = useAuth();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const categoryId = route.params?.categoryId;
  const debouncedQuery = useDebounce(query);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const { data } = await productApi.list({ q: debouncedQuery || undefined, category_id: categoryId });
      setProducts(data);
    } catch {
      setError("Couldn't search products. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedQuery, categoryId]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search products..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={colors.mutedBlue}
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <ProductGridSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={branding.primary_color} />}
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="No products found"
              message={query ? `No results for "${query}". Try a different search.` : "Start typing to search products near you."}
              actionLabel="Browse Home"
              onAction={() => navigation.navigate("Home")}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
            >
              <View style={styles.thumb}>
                {item.image_url ? (
                  <Image source={{ uri: imageUrl(item.image_url) || "" }} style={styles.thumbImage} />
                ) : (
                  <Text style={{ fontSize: 24 }}>📦</Text>
                )}
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultSeller}>{item.company?.name}</Text>
                {item.rating_count > 0 && (
                  <Text style={styles.resultRating}>⭐ {Number(item.rating_average).toFixed(1)}</Text>
                )}
                <Text style={[styles.resultPrice, { color: branding.secondary_color }]}>${Number(item.price).toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmBeige },
  searchBar: { padding: 16 },
  input: { backgroundColor: colors.white, borderRadius: 10, padding: 12, fontSize: 16, borderWidth: 1, borderColor: colors.mutedBlue },
  resultCard: { flexDirection: "row", backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 10 },
  thumb: { width: 60, height: 60, backgroundColor: colors.warmBeige, borderRadius: 8, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  thumbImage: { width: "100%", height: "100%" },
  resultInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  resultName: { fontWeight: "600", color: colors.deepNavy },
  resultSeller: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  resultRating: { fontSize: 11, color: colors.mutedBlue, marginTop: 2 },
  resultPrice: { fontWeight: "700", marginTop: 4 },
});
