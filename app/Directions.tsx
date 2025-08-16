// app/driver/Directions.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

type LatLng = { latitude: number; longitude: number };

export default function Directions() {
  const { lat, lng, name, distance } = useLocalSearchParams<{
    lat: string;
    lng: string;
    name?: string;
    distance?: string;
  }>();

  const dest: LatLng = {
    latitude: Number(lat),
    longitude: Number(lng),
  };

  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Location permission is required for directions.");
          setLoading(false);
          return;
        }
        const first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const here = { latitude: first.coords.latitude, longitude: first.coords.longitude };
        setUserLoc(here);

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 15 },
          (pos) => setUserLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        );
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Could not get location.");
      } finally {
        setLoading(false);
      }
    })();
    return () => sub?.remove();
  }, []);

  // Fit both markers when we have current location
  useEffect(() => {
    if (!userLoc || !mapRef.current) return;
    mapRef.current.fitToCoordinates([userLoc, dest], {
      edgePadding: { top: 80, right: 80, bottom: 220, left: 80 },
      animated: true,
    });
  }, [userLoc?.latitude, userLoc?.longitude]);

  const startNavigation = async () => {
    const dlat = dest.latitude;
    const dlng = dest.longitude;

    const web = `https://www.google.com/maps/dir/?api=1&destination=${dlat},${dlng}&travelmode=driving`;
    try {
      if (Platform.OS === "android") {
        const gnav = `google.navigation:q=${dlat},${dlng}&mode=d`;
        const supported = await Linking.canOpenURL("google.navigation:q=0,0");
        if (supported) return Linking.openURL(gnav);
        return Linking.openURL(web);
      } else {
        // iOS Apple Maps
        const apple = `maps://?daddr=${dlat},${dlng}&dirflg=d`;
        const supported = await Linking.canOpenURL("maps://");
        if (supported) return Linking.openURL(apple);
        return Linking.openURL(web);
      }
    } catch {
      Alert.alert("Unable to open maps", "Please open your maps app and search the destination.");
    }
  };

  // Big markers (same style as your map screen)
  const BigMarker = ({
    color,
    ringColor,
    size = 28,
    ring = 54,
  }: {
    color: string;
    ringColor: string;
    size?: number;
    ring?: number;
  }) => (
    <View style={styles.markerWrap}>
      <View
        style={[
          styles.markerRing,
          { borderColor: ringColor, width: ring, height: ring, borderRadius: ring / 2 },
        ]}
      />
      <View
        style={[
          styles.markerDot,
          { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    </View>
  );
  const RedBigMarker = () => (
    <BigMarker color="#EF4444" ringColor="rgba(239,68,68,0.35)" size={30} ring={58} />
  );
  const GreenBigMarker = () => (
    <BigMarker color="#16A34A" ringColor="rgba(22,163,74,0.35)" size={26} ring={50} />
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {name || "Destination"}
          </Text>
          {!!distance && (
            <Text style={styles.sub}>{(Number(distance) / 1000).toFixed(2)} km away</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.replace("/DriverHome")} style={styles.exitBtn}>
          <Ionicons name="exit-outline" size={20} color="#fff" />
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 8, color: "#6B7280" }}>Getting your location…</Text>
          </View>
        ) : (
          <MapView ref={mapRef} style={{ flex: 1 }} showsMyLocationButton={false}>
            {userLoc && (
              <Marker coordinate={userLoc} tappable={false} zIndex={999}>
                <RedBigMarker />
              </Marker>
            )}
            <Marker coordinate={dest} tappable={false} zIndex={998} title={name as string}>
              <GreenBigMarker />
            </Marker>

            {/* Simple preview line (straight) */}
            {userLoc && (
              <Polyline
                coordinates={[userLoc, dest]}
                strokeColor="#2563EB"
                strokeWidth={4}
                lineDashPattern={[8, 6]}
              />
            )}
          </MapView>
        )}
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={startNavigation} activeOpacity={0.9}>
          <Ionicons name="navigate-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Start Navigation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.exitSolid]}
          onPress={() => router.replace("/DriverHome")}
          activeOpacity={0.9}
        >
          <Ionicons name="exit-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Exit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: { color: "#111827", fontSize: 16, fontWeight: "800" },
  sub: { color: "#6B7280", fontSize: 12 },

  exitBtn: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
  },
  exitText: { color: "#fff", fontWeight: "700" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  bottomBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#2563EB",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  exitSolid: { backgroundColor: "#111827" },

  // 👇 added to fix your error
  actionText: { color: "#fff", fontWeight: "700" },

  // marker visuals
  markerWrap: { alignItems: "center", justifyContent: "center" },
  markerDot: {
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  markerRing: { position: "absolute", borderWidth: 2 },
});
