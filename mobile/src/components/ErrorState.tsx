import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Couldn't load</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 40, marginTop: 20 },
  icon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "600", color: colors.deepNavy, marginBottom: 8 },
  message: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  button: { backgroundColor: colors.deepNavy, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: colors.white, fontWeight: "600" },
});
