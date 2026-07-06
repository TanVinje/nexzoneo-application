import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView,
} from "react-native";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { apiErrorMessage, ratingApi } from "../api";

function StarRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Text style={[styles.star, n <= value && styles.starActive]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function RatingScreen({ route, navigation }: any) {
  const { branding } = useAuth();
  const { companyId, productIds, productNames } = route.params;
  const ids: string[] = productIds || [];
  const names: string[] = productNames || ids.map((_, i) => `Product ${i + 1}`);

  const [productRatings, setProductRatings] = useState<Record<string, number>>(
    () => Object.fromEntries(ids.map((id) => [id, 5]))
  );
  const [sellerRating, setSellerRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const setProductRating = (id: string, rating: number) => {
    setProductRatings((prev) => ({ ...prev, [id]: rating }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      for (const id of ids) {
        await ratingApi.product({ product_id: id, rating: productRatings[id] || 5, comment });
      }
      await ratingApi.seller({ company_id: companyId, rating: sellerRating, comment });
      Alert.alert("Thank you!", "Your ratings have been submitted.", [
        { text: "OK", onPress: () => navigation.navigate("Main") },
      ]);
    } catch (err) {
      Alert.alert("Error", apiErrorMessage(err, "Could not submit ratings. You may have already rated this order."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>How was your experience?</Text>

      {ids.map((id, index) => (
        <View key={id} style={styles.section}>
          <Text style={styles.label}>{names[index] || "Product"}</Text>
          <StarRow value={productRatings[id] || 5} onChange={(n) => setProductRating(id, n)} />
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.label}>Seller Rating</Text>
        <StarRow value={sellerRating} onChange={setSellerRating} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Leave a comment (optional)"
        value={comment}
        onChangeText={setComment}
        multiline
        placeholderTextColor={colors.mutedBlue}
      />

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: branding.primary_color }]}
        onPress={submit}
        disabled={loading}
      >
        <Text style={styles.submitText}>{loading ? "Submitting..." : "Submit Ratings"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmBeige, padding: 24 },
  title: { fontSize: 22, fontWeight: "700", color: colors.deepNavy, marginBottom: 24 },
  section: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontWeight: "600", color: colors.deepNavy, marginBottom: 8 },
  stars: { flexDirection: "row", gap: 8 },
  star: { fontSize: 36, color: colors.warmBeige },
  starActive: { color: "#f59e0b" },
  input: { backgroundColor: colors.white, borderRadius: 12, padding: 16, minHeight: 100, textAlignVertical: "top", borderWidth: 1, borderColor: colors.mutedBlue, marginBottom: 24 },
  submitBtn: { borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 32 },
  submitText: { color: colors.white, fontWeight: "600", fontSize: 16 },
});
