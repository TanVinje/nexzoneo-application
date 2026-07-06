import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

export function SkeletonBox({ height = 20, width: w = "100%", style }: { height?: number; width?: number | string; style?: object }) {
  return <View style={[styles.skeleton, { height, width: w }, style]} />;
}

export function ProductGridSkeleton() {
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <SkeletonBox height={80} style={{ marginBottom: 8 }} />
          <SkeletonBox height={14} width="80%" style={{ marginBottom: 6 }} />
          <SkeletonBox height={14} width="50%" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: colors.warmBeige, borderRadius: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 12 },
  card: { width: "47%", backgroundColor: colors.white, borderRadius: 12, padding: 12, margin: 6 },
});
