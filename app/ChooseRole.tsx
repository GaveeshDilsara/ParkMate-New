import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";

export default function ChooseRole() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>
        Welcome To <Text style={styles.park}>Park</Text>
        <Text style={styles.mate}>Mate</Text>
      </Text>

      <Text style={styles.subtitle}>Choose how you’d like to use the app</Text>

      {/* Driver Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/LogIn_Driver")}
      >
        <Image
          source={require("../assets/images/driver.png")}
          style={styles.cardIcon}
        />
        <Text style={styles.cardTitle}>I’m a Driver</Text>
        <Text style={styles.cardDesc}>Find parking near you</Text>
      </TouchableOpacity>

      {/* Owner Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/LogIn_Owner")}
      >
        <Image
          source={require("../assets/images/owner.png")}
          style={styles.cardIcon}
        />
        <Text style={styles.cardTitle}>I’m a parking owner</Text>
        <Text style={styles.cardDesc}>List your parkings and earn</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  title: {
    marginTop: 100,
    fontSize: 35,
    fontWeight: "bold",
    color: "#000",
    fontFamily: "sans-serif",
  },
  park: {
    fontSize: 35,
    color: "#0099ff",
    fontWeight: "bold",
  },
  mate: {
    color: "black",
    fontWeight: "bold",
    fontSize: 25,
    fontFamily: "tan-nimbus",
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    width: 300,
    height: 200,
    paddingTop: 50,
    backgroundColor: "#e6e1e1ff",
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardIcon: {
    width: 48,
    height: 48,
    resizeMode: "contain",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
