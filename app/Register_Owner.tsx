import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // ✅ import router
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "http://192.168.8.131"; // 👉 replace with your PC LAN IP
const SAVE_URL = `${BASE_URL}/ParkMate/save_owner_details.php`;

export default function RegisterOwner() {
  const router = useRouter(); // ✅ initialize router

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(SAVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email, phone }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Registration failed");
      }

      Alert.alert("Success", "Registered successfully!");

      // ✅ Navigate to Login_Owner page after success
      router.replace("/LogIn_Owner");  
      // (make sure your login file is in app/auth/login-owner.tsx)

    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Image */}
      <Image
        source={require("../assets/images/parking-car.jpg")}
        style={styles.headerImage}
      />

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.title}>Register Here</Text>

        <TextInput
          placeholder="User Name / Phone no"
          style={styles.input}
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          style={styles.input}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Phone"
          keyboardType="phone-pad"
          style={styles.input}
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
        />

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerText}>Sign up</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.or}>Or</Text>

        <TouchableOpacity style={styles.googleBtn}>
          <Ionicons name="logo-google" size={20} color="#EA4335" />
          <Text style={styles.googleText}>Log In with Google</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
    marginTop: -13,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 16,
    marginVertical: 8,
    fontSize: 16,
  },
  registerBtn: {
    backgroundColor: "#0099ff",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  registerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  or: {
    textAlign: "center",
    marginVertical: 12,
    color: "#999",
  },
  googleBtn: {
    backgroundColor: "#eee",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  googleText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
});
