// app/LoginDriver.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const BASE_URL = "http://192.168.8.131/Parkmate"; // ← keep your backend

const BLUE = "#0099ff";
const BG = "#f6f7fb";
const SURFACE = "#ffffff";
const TEXT = "#0f172a";
const MUTED = "#6b7280";
const BORDER = "#e6e9f2";

export default function LoginDriver() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // username / phone / email
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Missing info", "Enter your username/phone/email and password.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/login_driver.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const json = await res.json();

      if (!json?.success) {
        setLoading(false);
        Alert.alert("Login failed", json?.message || "Please try again.");
        return;
      }

      await AsyncStorage.setItem("pm_driver", JSON.stringify(json.driver));
      setLoading(false);
      router.replace("/DriverHome");
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Network error", e?.message ?? "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 28 }}
          bounces={false}
        >
          {/* HERO */}
          <View style={styles.heroWrap}>
            <ImageBackground
              source={{
                uri:
                  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop",
              }}
              style={styles.hero}
              imageStyle={styles.heroImg}
            >
              <View style={styles.heroOverlay} />
              <View style={styles.heroTextWrap}>
                <Text style={styles.kicker}>Driver Portal</Text>
                <Text style={styles.title}>Let’s get you parked</Text>
                <Text style={styles.subtitle}>
                  Sign in to find nearby spaces fast
                </Text>
              </View>
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.35)"]}
                style={styles.heroGradient}
              />
            </ImageBackground>
          </View>

          {/* CONTENT */}
          <View style={styles.content}>
            {/* Card */}
            <View style={styles.card}>
              {/* Identifier */}
              <View style={styles.inputWrap}>
                <View style={styles.leadingIcon}>
                  <Ionicons name="person-outline" size={18} color={BLUE} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Username / Phone / Email"
                  placeholderTextColor="#9aa0a6"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View style={styles.inputWrap}>
                <View style={styles.leadingIcon}>
                  <Ionicons name="lock-closed-outline" size={18} color={BLUE} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#9aa0a6"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secure}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setSecure((s) => !s)}
                  hitSlop={12}
                  style={styles.trailingIcon}
                >
                  <Ionicons
                    name={secure ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Login */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={submit}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Log in</Text>
                )}
              </TouchableOpacity>

              {/* OR */}
              <View style={styles.orRow}>
                <View style={styles.line} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.line} />
              </View>

              {/* Secondary CTA (optional) */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.push("/RegisterDriver")}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="person-add-outline"
                  size={18}
                  color={BLUE}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.secondaryBtnText}>Create a driver account</Text>
              </TouchableOpacity>

              {/* Footer link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already on ParkMate? </Text>
                <TouchableOpacity onPress={submit}>
                  <Text style={styles.linkSmall}>Quick Login</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tiny tips */}
            <View style={styles.tips}>
              <Ionicons name="information-circle-outline" size={16} color={MUTED} />
              <Text style={styles.tipsText}>
                Use your registered phone, email, or username.
              </Text>
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
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  heroGradient: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    height: "62%",
  },
  heroTextWrap: { paddingHorizontal: 20, paddingBottom: 18 },
  kicker: { color: "#e0f2ff", fontSize: 12, marginBottom: 4 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#dbeafe", fontSize: 12, marginTop: 4 },

  /* CONTENT */
  content: { paddingHorizontal: 16, marginTop: -10 },
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
    position: "relative",
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
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 10,
    color: TEXT,
    fontSize: 15,
  },
  trailingIcon: { paddingLeft: 8 },

  primaryBtn: {
    height: 48,
    backgroundColor: BLUE,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    paddingHorizontal: 6,
  },
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
  secondaryBtnText: { color: BLUE, fontWeight: "800" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerText: { fontSize: 13, color: MUTED },
  linkSmall: { fontSize: 13, fontWeight: "800", color: BLUE },

  tips: { flexDirection: "row", alignItems: "center", marginTop: 12, alignSelf: "center" },
  tipsText: { marginLeft: 6, color: MUTED, fontSize: 12 },
});
