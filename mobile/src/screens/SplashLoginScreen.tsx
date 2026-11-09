import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Linking,
} from "react-native";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { imageUrl } from "../api";

const SELLER_DEMO_URL =
  process.env.EXPO_PUBLIC_SELLER_URL || "https://nexzoneo-seller.netlify.app";

export default function SplashLoginScreen() {
  const { branding, login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("customer@demo.com");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const logoUri = imageUrl(branding.logo_url);

  // One-click demo: /?demo=1 auto-logs in as customer
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "1") return;
    let cancelled = false;
    (async () => {
      setDemoLoading(true);
      setError("");
      try {
        await login("customer@demo.com", "demo123");
        window.history.replaceState({}, "", window.location.pathname);
      } catch {
        if (!cancelled) setError("Demo login failed. Is the API online?");
      } finally {
        if (!cancelled) setDemoLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // intentionally once on mount for ?demo=1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
    } catch {
      setError("Authentication failed. Try customer@demo.com / demo123");
    } finally {
      setLoading(false);
    }
  };

  const tryDemo = async () => {
    setDemoLoading(true);
    setError("");
    try {
      await login("customer@demo.com", "demo123");
    } catch {
      setError("Demo login failed. Check that the API is running.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: branding.primary_color }]}>
      <View style={styles.splashContent}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="contain" />
        ) : (
          <Text style={styles.logo}>🏪</Text>
        )}
        <Text style={styles.appName}>{branding.app_name}</Text>
        <Text style={styles.welcome}>{branding.welcome_text}</Text>
        <Text style={styles.demoHint}>Interactive demo — no install needed</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.formCard}>
        <TouchableOpacity
          style={[styles.demoButton, { backgroundColor: branding.secondary_color }]}
          onPress={tryDemo}
          disabled={demoLoading || loading}
        >
          {demoLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Try demo instantly</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.demoNote}>Uses demo account · customer@demo.com</Text>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or sign in</Text>
          <View style={styles.divider} />
        </View>

        <Text style={styles.formTitle}>{isRegister ? "Create Account" : "Sign In"}</Text>
        {isRegister && (
          <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} placeholderTextColor={colors.mutedBlue} />
        )}
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.mutedBlue} />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.mutedBlue} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.button, { backgroundColor: branding.primary_color }]} onPress={handleSubmit} disabled={loading || demoLoading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{isRegister ? "Register" : "Sign In"}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
          <Text style={styles.switchText}>{isRegister ? "Already have an account? Sign In" : "New here? Create Account"}</Text>
        </TouchableOpacity>

        {Platform.OS === "web" && (
          <TouchableOpacity style={styles.sellerLink} onPress={() => Linking.openURL(SELLER_DEMO_URL)}>
            <Text style={styles.sellerLinkText}>Try seller dashboard →</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end" },
  splashContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  logo: { fontSize: 64, marginBottom: 16 },
  logoImage: { width: 96, height: 96, borderRadius: 16, marginBottom: 16 },
  appName: { fontSize: 32, fontWeight: "700", color: colors.white },
  welcome: { fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 8, textAlign: "center" },
  demoHint: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 12 },
  formCard: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  demoButton: { borderRadius: 12, padding: 16, alignItems: "center" },
  demoNote: { textAlign: "center", color: colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 4 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  divider: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 10, color: colors.textMuted, fontSize: 12 },
  formTitle: { fontSize: 18, fontWeight: "600", color: colors.deepNavy, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: colors.mutedBlue, borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  button: { borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  buttonText: { color: colors.white, fontWeight: "600", fontSize: 16 },
  switchText: { textAlign: "center", color: colors.softRoyalBlue, marginTop: 16, fontSize: 14 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 8 },
  sellerLink: { marginTop: 20, alignItems: "center" },
  sellerLinkText: { color: colors.deepNavy, fontWeight: "600", fontSize: 14 },
});
