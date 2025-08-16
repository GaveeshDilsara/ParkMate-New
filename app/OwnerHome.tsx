import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function OwnerHome() {
  const banners = [
    require("../assets/images/banner1.png"),
    require("../assets/images/banner1.png"),
    require("../assets/images/banner1.png"),
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="menu" size={30} color="#000" />
        <Text style={styles.headerTitle}>
          Welcome Back, <Text style={styles.bold}>User 👋</Text>
        </Text>
        <Image
          source={require("../assets/images/avatar.png")}
          style={styles.avatar}
        />
      </View>

      {/* Banner */}
      <Image
        source={require("../assets/images/banner1.png")}
        style={styles.image}
      />

      {/* Dots + Empty Card */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.activeDot]}
            />
          ))}
        </View>

        {/* Empty State Box */}
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            You don't have{"\n"}any registered place yet
          </Text>
        </View>
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.innerAddBtn}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
  style={styles.innerAddBtn}
  onPress={() => router.push("/RegisterSpace")}
>
  <Ionicons name="add" size={32} color="#fff" />
</TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
    backgroundColor:"red"
  },
  headerTitle: {
    fontSize: 20,
    color: "#000",
  },
  bold: {
    fontWeight: "bold",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 20,
  },
  image: {
    height: 150,
    width: width,
    marginBottom: 10,
  },
  bottomSection: {
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#000",
  },
  emptyBox: {
    backgroundColor: "#777474ff",
    borderRadius: 20,
    padding: 30,
    paddingBottom: 60,
    alignItems: "center",
    justifyContent: "center",
    width: width - 40,
    marginTop: 140,
  },
  emptyText: {
    paddingTop: 20,
    textAlign: "center",
    color: "#fff",
    alignSelf: "center",
    fontSize: 16,
    marginBottom: 16,
    paddingBottom: 5,
  },
  innerAddBtn: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#0099ff",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
});
