import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from "react-native";
import { colors } from "../theme";
import { useAuth } from "../AuthContext";
import { imageUrl } from "../api";

export default function SplashLoginScreen() {
  const { branding, login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("customer@demo.com");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const logoUri = imageUrl(branding.logo_url);

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
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.formCard}>
        <Text style={styles.formTitle}>{isRegister ? "Create Account" : "Sign In"}</Text>
        {isRegister && (
          <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} placeholderTextColor={colors.mutedBlue} />
        )}
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.mutedBlue} />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.mutedBlue} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.button, { backgroundColor: branding.primary_color }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{isRegister ? "Register" : "Sign In"}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
          <Text style={styles.switchText}>{isRegister ? "Already have an account? Sign In" : "New here? Create Account"}</Text>
        </TouchableOpacity>
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
  formCard: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  formTitle: { fontSize: 22, fontWeight: "600", color: colors.deepNavy, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: colors.mutedBlue, borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  button: { borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8 },
  buttonText: { color: colors.white, fontWeight: "600", fontSize: 16 },
  switchText: { textAlign: "center", color: colors.softRoyalBlue, marginTop: 16, fontSize: 14 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 8 },
});
