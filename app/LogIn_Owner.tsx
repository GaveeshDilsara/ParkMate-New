// app/login-owner.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
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

const BLUE = "#0099ff";
const BG = "#f6f7fb";
const SURFACE = "#ffffff";
const TEXT = "#0f172a";
const MUTED = "#6b7280";
const BORDER = "#e6e9f2";

export default function LoginOwner() {
  const [usernameOrPhone, setUsernameOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  // ⚠️ Backend flow kept IDENTICAL
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
        // save owner id and go home
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
        <ScrollView contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          {/* HERO (same composition as Driver) */}
          <View style={styles.heroWrap}>
            <ImageBackground
              source={require("../assets/images/parking-car.jpg")}
              style={styles.hero}
              imageStyle={styles.heroImg}
            >
              <View style={styles.heroOverlay} />
              <View style={styles.heroTextWrap}>
                <Text style={styles.kicker}>Owner Portal</Text>
                <Text style={styles.title}>Let’s get you parked</Text>
                <Text style={styles.subtitle}>Sign in to manage your spaces</Text>
              </View>
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.36)"]}
                style={styles.heroGradient}
              />
            </ImageBackground>
          </View>

          {/* CARD */}
          <View style={styles.content}>
            <View style={styles.card}>
              {/* Identifier */}
              <View style={styles.inputWrap}>
                <View style={styles.leadingIcon}>
                  <Ionicons name="person-outline" size={18} color={BLUE} />
                </View>
                <TextInput
                  placeholder="Username / Phone / Email"
                  placeholderTextColor="#9aa0a6"
                  value={usernameOrPhone}
                  onChangeText={setUsernameOrPhone}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              {/* Password */}
              <View style={styles.inputWrap}>
                <View style={styles.leadingIcon}>
                  <Ionicons name="lock-closed-outline" size={18} color={BLUE} />
                </View>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#9aa0a6"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry={secure}
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setSecure((s) => !s)} hitSlop={12} style={styles.trailingIcon}>
                  <Ionicons name={secure ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Meta row */}
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={MUTED} />
                  <Text style={styles.mutedSmall}>  Secured by ParkMate</Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert("Forgot password", "Please contact admin.")}>
                  <Text style={styles.linkSmall}>Forgot?</Text>
                </TouchableOpacity>
              </View>

              {/* Login */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Log in</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.orRow}>
                <View style={styles.line} />
                <Text style={styles.orText}>or continue with</Text>
                <View style={styles.line} />
              </View>

              {/* Google (placeholder) */}
              <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.9}>
                <Image
                  style={styles.googleIcon}
                  source={require("../assets/images/google-logo.png")}
                />
                <Text style={styles.secondaryBtnText}>Google</Text>
              </TouchableOpacity>

              {/* Footer link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don’t have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/Register_Owner")}>
                  <Text style={styles.linkSmall}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tiny tip */}
            <View style={styles.tips}>
              <Ionicons name="information-circle-outline" size={16} color={MUTED} />
              <Text style={styles.tipsText}>Use your registered phone, email, or username.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* HERO */
  heroWrap: { height: 230, backgroundColor: "#000" },
  hero: { flex: 1, justifyContent: "flex-end" },
  heroImg: { opacity: 0.95 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.12)" },
  heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "62%" },
  heroTextWrap: { paddingHorizontal: 20, paddingBottom: 18, alignItems: "flex-start" },
  kicker: { color: "#e0f2ff", fontSize: 12, marginBottom: 4 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#dbeafe", fontSize: 12, marginTop: 4 },

  /* CONTENT */
  content: { paddingHorizontal: 16, marginTop: -28 },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingLeft: 12,
    paddingRight: 12,
    height: 48,
    marginBottom: 12,
  },
  leadingIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#e6f5ff",
    alignItems: "center", justifyContent: "center",
  },
  trailingIcon: { paddingLeft: 8 },
  input: { flex: 1, height: "100%", paddingHorizontal: 10, color: TEXT, fontSize: 15 },

  rowBetween: {
    marginTop: 2,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mutedSmall: { color: MUTED, fontSize: 12 },

  primaryBtn: {
    height: 48,
    backgroundColor: BLUE,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  orRow: { flexDirection: "row", alignItems: "center", marginVertical: 14, paddingHorizontal: 6 },
  line: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  orText: { marginHorizontal: 8, color: MUTED, fontSize: 12, textTransform: "uppercase" },

  secondaryBtn: {
    height: 46,
    backgroundColor: "#f3f9ff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d9ecff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  googleIcon: { width: 20, height: 20, marginRight: 8 },
  secondaryBtnText: { color: BLUE, fontWeight: "800" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerText: { fontSize: 13, color: MUTED },
  linkSmall: { fontSize: 13, fontWeight: "800", color: BLUE },

  tips: { flexDirection: "row", alignItems: "center", marginTop: 12, alignSelf: "center" },
  tipsText: { marginLeft: 6, color: MUTED, fontSize: 12 },
});
