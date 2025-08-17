// app/driver/DriverHome.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Circle, MapPressEvent, Marker, Region } from "react-native-maps";

const BASE_URL = "http://192.168.8.131/Parkmate";
const SPACES_ENDPOINT = `${BASE_URL}/list_spaces_near.php`;

// default map region (zoomed to show the radius ring nicely)
const DEFAULT_REGION: Region = {
  latitude: 6.9022,
  longitude: 79.8607,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

// Radius (meters)
const CIRCLE_RADIUS_M = 5000;  // live radius
const SHOW_RADIUS_M = 10000;   // optional larger radius when pressing "Show"

type Space = {
  id: number;
  name: string;
  address: string;
  location_label: string | null;
  latitude: number;
  longitude: number;
  is_free: boolean;
  price_amount: number | null;
  price_unit: "hour" | "day" | null;
  pricing_text: string | null;
  distance_m?: number | null;
};

export default function DriverHome() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);

  // request permission + watch live location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLoading(false);
          Alert.alert("Permission required", "Location permission is needed to find nearby parking.");
          return;
        }

        const first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const lat = first.coords.latitude;
        const lng = first.coords.longitude;

        const delta = (CIRCLE_RADIUS_M / 111_000) * 2.4; // rough degrees to frame circle
        const r: Region = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: Math.max(delta, 0.06),
          longitudeDelta: Math.max(delta, 0.06),
        };
        setRegion(r);
        setUserLoc({ latitude: lat, longitude: lng });
        mapRef.current?.animateToRegion(r, 600);

        watchRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 15 },
          (pos) => setUserLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        );
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      watchRef.current?.remove();
      if (fetchTimer.current) clearTimeout(fetchTimer.current);
    };
  }, []);

  // auto-fetch spaces on live location change (debounced)
  useEffect(() => {
    if (!userLoc) return;
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(() => {
      fetchSpaces(userLoc.latitude, userLoc.longitude, CIRCLE_RADIUS_M);
    }, 400);
  }, [userLoc?.latitude, userLoc?.longitude]);

  const fetchSpaces = async (lat: number, lng: number, radius: number) => {
    try {
      setLoadingSpaces(true);
      const url = `${SPACES_ENDPOINT}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(
        lng
      )}&radius=${encodeURIComponent(radius)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json?.success) {
        Alert.alert("Load error", json?.message || "Could not load spaces.");
        setSpaces([]);
        return;
      }
      const items: Space[] = (json.items || []).map((s: any) => ({
        id: +s.id,
        name: String(s.name),
        address: s.address ?? "",
        location_label: s.location_label ?? null,
        latitude: +s.latitude,
        longitude: +s.longitude,
        is_free: !!s.is_free,
        price_amount: s.price_amount != null ? +s.price_amount : null,
        price_unit: s.price_unit ?? null,
        pricing_text: s.pricing_text ?? null,
        distance_m: s.distance_m != null ? +s.distance_m : null,
      }));
      setSpaces(items);
    } catch (e: any) {
      Alert.alert("Network error", e?.message ?? "Unable to fetch spaces.");
      setSpaces([]);
    } finally {
      setLoadingSpaces(false);
    }
  };

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const next = { ...region, latitude, longitude };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 400);
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    try {
      setSearching(true);
      const results = await Location.geocodeAsync(q);
      if (!results?.length) {
        Alert.alert("Not found", "Try a more specific location.");
        return;
      }
      const { latitude, longitude } = results[0];
      const delta = (CIRCLE_RADIUS_M / 111_000) * 2.4;
      const next = { ...region, latitude, longitude, latitudeDelta: delta, longitudeDelta: delta };
      setRegion(next);
      mapRef.current?.animateToRegion(next, 600);
    } catch (e: any) {
      Alert.alert("Search error", e?.message ?? "Unable to find that location.");
    } finally {
      setSearching(false);
    }
  };

  const onShow = () => {
    if (!userLoc) {
      Alert.alert("No location", "Waiting for GPS fix…");
      return;
    }
    router.push({
      pathname: "/LocationDetails",
      params: {
        lat: String(userLoc.latitude),
        lng: String(userLoc.longitude),
        radius: String(SHOW_RADIUS_M),
      },
    });
  };

  /* ---------- Presentational bits ---------- */

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
          {
            borderColor: ringColor,
            width: ring,
            height: ring,
            borderRadius: ring / 2,
          },
        ]}
      />
      <View
        style={[
          styles.markerDot,
          {
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
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

  const recenter = () => {
    if (!userLoc) {
      Alert.alert("No location", "Waiting for GPS fix…");
      return;
    }
    const delta = (CIRCLE_RADIUS_M / 111_000) * 2.4;
    const r: Region = {
      latitude: userLoc.latitude,
      longitude: userLoc.longitude,
      latitudeDelta: Math.max(delta, 0.06),
      longitudeDelta: Math.max(delta, 0.06),
    };
    setRegion(r);
    mapRef.current?.animateToRegion(r, 600);
  };

  const refresh = () => {
    if (!userLoc) return;
    fetchSpaces(userLoc.latitude, userLoc.longitude, CIRCLE_RADIUS_M);
  };

  const nearbyCount = spaces.length;
  const minPrice = (() => {
    const paid = spaces
      .filter((s) => !s.is_free && s.price_amount != null)
      .map((s) => s.price_amount as number);
    if (!paid.length) return "—";
    return `Rs ${Math.min(...paid)}+`;
    // (just a hint; actual price shows on details)
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding" })}>
        {/* Gradient Header */}
        <LinearGradient
          colors={["#3B82F6", "#60A5FA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTopRow}>
            <Ionicons name="navigate-outline" size={18} color="#fff" />
            <Text style={styles.headerTitle}>Find Parking Near You</Text>
            <View style={{ width: 18 }} />
          </View>

          <View style={styles.headerChips}>
            <View style={styles.chip}>
              <View style={styles.liveDot} />
              <Text style={styles.chipText}>Live</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="locate-outline" size={14} color="#fff" />
              <Text style={styles.chipText}>Radius 5 km</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="pricetag-outline" size={14} color="#fff" />
              <Text style={styles.chipText}>From {minPrice}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Map container */}
        <View style={styles.mapCard}>
          {loading ? (
            <View style={styles.mapLoader}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 8, color: "#6B7280" }}>Fetching location…</Text>
            </View>
          ) : (
            <>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={region}
                onPress={onMapPress}
                showsUserLocation={false}
                showsMyLocationButton={false}
              >
                {/* 🔴 You + ring */}
                {userLoc && (
                  <>
                    <Marker
                      coordinate={userLoc}
                      title="You are here"
                      zIndex={999}
                      tappable={false}
                      tracksViewChanges={false}
                    >
                      <RedBigMarker />
                    </Marker>
                    <Circle
                      center={userLoc}
                      radius={CIRCLE_RADIUS_M}
                      strokeColor="rgba(59,130,246,0.9)"
                      fillColor="rgba(59,130,246,0.18)"
                      strokeWidth={2}
                    />
                  </>
                )}

                {/* 🟢 Spaces */}
                {spaces.map((s) => (
                  <Marker
                    key={s.id}
                    coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                    title={s.name}
                    description={
                      s.pricing_text ??
                      (s.is_free ? "Free parking" : "Paid parking") +
                        (s.distance_m != null ? ` • ${(s.distance_m / 1000).toFixed(2)} km` : "")
                    }
                    zIndex={10}
                    tappable={false}
                    tracksViewChanges={false}
                  >
                    <GreenBigMarker />
                  </Marker>
                ))}
              </MapView>


              {/* Floating controls */}
              <View style={styles.fabsCol}>
                <TouchableOpacity style={styles.fabBtn} onPress={recenter} activeOpacity={0.9}>
                  <Ionicons name="locate" size={18} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fabBtn, { marginTop: 10 }]}
                  onPress={refresh}
                  disabled={loadingSpaces}
                  activeOpacity={0.9}
                >
                  {loadingSpaces ? (
                    <ActivityIndicator />
                  ) : (
                    <Ionicons name="refresh" size={18} color="#111827" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.legendText}>You</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: "#16A34A" }]} />
                  <Text style={styles.legendText}>Parking</Text>
                </View>
                <View style={[styles.legendRow, { marginTop: 4 }]}>
                  <View
                    style={[
                      styles.swatch,
                      { borderColor: "rgba(59,130,246,0.9)", backgroundColor: "rgba(59,130,246,0.18)" },
                    ]}
                  />
                  <Text style={styles.legendText}>5 km</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Bottom summary card */}
        <View style={styles.bottomWrap}>
          <View style={styles.bottomCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bottomTitle}>{nearbyCount} space{nearbyCount === 1 ? "" : "s"} nearby</Text>
              <Text style={styles.bottomSub}>
                {userLoc ? "Live within 5 km radius" : "Waiting for GPS…"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, (loadingSpaces || !userLoc) && { opacity: 0.7 }]}
              onPress={onShow}
              disabled={loadingSpaces || !userLoc}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>{loadingSpaces ? "Loading…" : "Show"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FB" },

  /* Header */
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 2,
  },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerChips: { flexDirection: "row", gap: 8, marginTop: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  chipText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },

  /* Map card */
  mapCard: {
    flex: 1,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
  },
  mapLoader: { flex: 1, alignItems: "center", justifyContent: "center" },


  // Floating buttons
  fabsCol: {
    position: "absolute",
    right: 12,
    bottom: 110,
  },
  fabBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  // Legend
  legend: {
    position: "absolute",
    top: 70,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 2 },
  legendText: { color: "#111827", fontSize: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  swatch: { width: 16, height: 10, borderRadius: 4, borderWidth: 1 },

  // Custom markers
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

  // Bottom summary
  bottomWrap: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "transparent" },
  bottomCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
  },
  bottomTitle: { color: "#111827", fontWeight: "800" },
  bottomSub: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  primaryBtn: {
    backgroundColor: "#2563EB",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    minWidth: 110,
    shadowColor: "#2563EB",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
