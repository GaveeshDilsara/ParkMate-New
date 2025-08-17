// app/login-owner.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/** 👉 CHANGE THIS when your PC’s IP changes (or replace with ngrok/cloudflared URL) */
const LOGIN_URL = "http://192.168.8.131/ParkMate/login_owner.php";

export default function LoginOwner() {
  const [usernameOrPhone, setUsernameOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  // ⚠️ Backend flow kept identical
  const handleLogin = async () => {
    if (!usernameOrPhone.trim() || !password.trim()) {
      Alert.alert("Missing info", "Please enter username/phone/email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: usernameOrPhone.trim(), // can be username OR phone OR email
          password,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { /* keep as raw text */ }

      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      if (data?.success) {
        await AsyncStorage.setItem("pm_owner_id", String(data.id ?? data.owner_id));
        router.replace("/OwnerHome");
        return;
      }

      throw new Error(data?.message || "Unexpected response");
    } catch (e: any) {
      Alert.alert("Login failed", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Hero */}
          <View style={styles.heroWrap}>
            <ImageBackground
              source={require("../assets/images/parking-car.jpg")}
              style={styles.hero}
              imageStyle={{ resizeMode: "cover" }}
            >
              <View style={styles.overlay} />
              <View style={styles.heroTextWrap}>
                <Text style={styles.kicker}>Welcome back 👋</Text>
                <Text style={styles.title}>Let’s get you parked</Text>
                <Text style={styles.subtitle}>
                  Log in to manage your spaces and see live activity.
                </Text>
              </View>
            </ImageBackground>
          </View>

          {/* Card */}
          <View style={styles.cardWrap}>
            <View style={styles.card}>
              {/* Identifier */}
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color="#64748b" style={styles.leftIcon} />
                <TextInput
                  placeholder="User Name / Phone no / Email"
                  placeholderTextColor="#9aa0a6"
                  value={usernameOrPhone}
                  onChangeText={setUsernameOrPhone}
                  style={[styles.input, { paddingLeft: 42 }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>

              {/* Password */}
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.leftIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#9aa0a6"
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, { paddingLeft: 42, paddingRight: 42 }]}
                  secureTextEntry={secure}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setSecure((s) => !s)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={secure ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#475569"
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot + Spacer */}
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#64748b" />
                  <Text style={styles.mutedSmall}>  Secured by ParkMate</Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert("Forgot password", "Please contact admin.")}>
                  <Text style={styles.linkSmall}>Forgot?</Text>
                </TouchableOpacity>
              </View>

              {/* Log in */}
              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.loginText}>Log in</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.orRow}>
                <View style={styles.line} />
                <Text style={styles.orText}>Or continue with</Text>
                <View style={styles.line} />
              </View>

              {/* Google */}
              <TouchableOpacity style={styles.googleBtn} activeOpacity={0.9}>
                <Image
                  style={styles.googleIcon}
                  source={require("../assets/images/google-logo.png")}
                />
                <Text style={styles.googleText}>Google</Text>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don’t have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/Register_Owner")}>
                  <Text style={styles.signup}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom pad */}
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CARD_BG = "#ffffff";
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" },

  heroWrap: { backgroundColor: "#0f172a" },
  hero: { height: 260, width: "100%", justifyContent: "flex-end" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  heroTextWrap: { paddingHorizontal: 24, paddingBottom: 22 , alignItems:'center' },
  kicker: { color: "#e2e8f0", fontSize: 13, letterSpacing: 0.4 , fontWeight:'bold'},
  title: { marginTop: 6, fontSize: 28, fontWeight: "800", color: "#ffffff" },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#cfe2f9ff",
    fontWeight:'bold'
  },

  cardWrap: {
    marginTop: -10,
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  
linkSmall: {
  color: "#2563eb",
  fontSize: 12,
  fontWeight: "700",
},

  inputWrap: {
    position: "relative",
    marginBottom: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  leftIcon: { position: "absolute", left: 14, top: 13 },
  input: {
    height: 48,
    fontSize: 15,
    color: "#0f172a",
    paddingHorizontal: 14,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  rowBetween: {
    marginTop: 2,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mutedSmall: { color: "#64748b", fontSize: 12 },

  loginBtn: {
    height: 50,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 12,
  },
  line: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  orText: { marginHorizontal: 10, color: "#6b7280", fontSize: 12 },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  googleIcon: { width: 22, height: 22, marginRight: 10 },
  googleText: { fontSize: 14, color: "#0f172a", fontWeight: "700" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerText: { fontSize: 13, color: "#64748b" },
  signup: { fontSize: 13, fontWeight: "800", color: "#2563eb" },
});
