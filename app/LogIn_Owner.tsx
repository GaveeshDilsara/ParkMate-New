// app/login-owner.tsx
import AsyncStorage from "@react-native-async-storage/async-storage"; // ⬅️ ADD

import { Ionicons } from "@expo/vector-icons";
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
  // ⬅️ SAVE OWNER ID for later (parking agreement upload, etc.)
  await AsyncStorage.setItem(
    "pm_owner_id",
    String(data.id ?? data.owner_id) // your PHP should return one of these
  );

  // go to owner home (or wherever you want)
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header Image */}
          <ImageBackground
            source={require("../assets/images/parking-car.jpg")}
            style={styles.hero}
          >
            <View style={styles.overlay} />
            <View style={styles.heroTextWrap}>
              <Text style={styles.title}>Let’s get started</Text>
              <Text style={styles.subtitle}>
                Sign up or log in to find out the best{"\n"}Place for you
              </Text>
            </View>
          </ImageBackground>

          <View style={styles.content}>
            {/* Identifier */}
            <View style={styles.inputWrap}>
              <TextInput
                placeholder="User Name / Phone no / Email"
                placeholderTextColor="#9aa0a6"
                value={usernameOrPhone}
                onChangeText={setUsernameOrPhone}
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9aa0a6"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry={secure}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setSecure((s) => !s)}
              >
                <Ionicons
                  name={secure ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            {/* Log in button */}
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>Log in</Text>
              )}
            </TouchableOpacity>

            {/* Or divider */}
            <View style={styles.orRow}>
              <View style={styles.line} />
              <Text style={styles.orText}>Or</Text>
              <View style={styles.line} />
            </View>

            {/* Google button (placeholder) */}
            <TouchableOpacity style={styles.googleBtn}>
              <Image
                style={styles.googleIcon}
                source={require("../assets/images/google-logo.png")}
              />
              <Text style={styles.googleText}>Log In with Google</Text>
            </TouchableOpacity>

            {/* Footer link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't Have an Account ? </Text>
              <TouchableOpacity onPress={() => router.push("/Register_Owner")}>
                <Text style={styles.signup}>sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },
  hero: { height: 260, width: "100%", justifyContent: "flex-end" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.28)" },
  heroTextWrap: { paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 6, fontSize: 12, lineHeight: 16, color: "#374151" },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 },
  inputWrap: {
    position: "relative",
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#eef1f5",
  },
  input: { height: 44, fontSize: 15, color: "#111827" },
  eyeBtn: {
    position: "absolute", right: 12, top: 10, height: 24, width: 24,
    alignItems: "center", justifyContent: "center",
  },
  loginBtn: {
    height: 48, backgroundColor: "#2f80ed", borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginTop: 6,
  },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  orRow: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  orText: { marginHorizontal: 10, color: "#6b7280", fontSize: 13 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#f3f4f6",
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
  },
  googleIcon: { width: 22, height: 22, marginRight: 10 },
  googleText: { fontSize: 14, color: "#111827", fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { fontSize: 13, color: "#6b7280" },
  signup: { fontSize: 13, fontWeight: "700", color: "#2f80ed" },
});
