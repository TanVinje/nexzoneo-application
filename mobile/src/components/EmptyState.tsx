import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = "📭", title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 40, marginTop: 20 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "600", color: colors.deepNavy, marginBottom: 8 },
  message: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  button: { backgroundColor: colors.deepNavy, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: colors.white, fontWeight: "600" },
});
