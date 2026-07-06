import { View, Text, ActivityIndicator, Image, StyleSheet } from "react-native";
import { colors } from "../theme";
import { imageUrl } from "../api";

interface LoadingSplashProps {
  appName?: string;
  primaryColor?: string;
  logoUrl?: string | null;
}

export default function LoadingSplash({
  appName = "Nexzoneo",
  primaryColor = colors.deepNavy,
  logoUrl,
}: LoadingSplashProps) {
  const uri = imageUrl(logoUrl);
  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.logo} resizeMode="contain" />
      ) : (
        <Text style={styles.emoji}>🏪</Text>
      )}
      <Text style={styles.name}>{appName}</Text>
      <ActivityIndicator color={colors.white} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 56 },
  logo: { width: 96, height: 96, borderRadius: 16 },
  name: { color: colors.white, fontSize: 24, fontWeight: "700", marginTop: 16 },
});
