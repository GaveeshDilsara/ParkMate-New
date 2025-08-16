// app/driver/DriverHome.tsx
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

// 👇 change to your LAN IP + folder
const BASE_URL = "http://192.168.8.131/Parkmate";
const SPACES_ENDPOINT = `${BASE_URL}/list_spaces_near.php`;

// Wider default so the 5 km circle fits nicely
const DEFAULT_REGION: Region = {
  latitude: 6.9022,
  longitude: 79.8607,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

// 🔵 Circle shown on map = 5 km
const CIRCLE_RADIUS_M = 5000;
// (Optional) Radius used after pressing Show = 10 km (keep if you still use /LocationDetails)
const SHOW_RADIUS_M = 10000;

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

  // Live location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLoading(false);
          Alert.alert("Location permission denied.");
          return;
        }
        const first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const lat = first.coords.latitude;
        const lng = first.coords.longitude;

        // Zoom to fit the 5 km circle
        const delta = (CIRCLE_RADIUS_M / 111_000) * 2.4; // rough degrees
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

  // Fetch spaces whenever the live location changes – within **5 km**
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
    // Optional: keep this if you want a separate screen with a larger radius
    router.push({
      pathname: "/LocationDetails",
      params: {
        lat: String(userLoc.latitude),
        lng: String(userLoc.longitude),
        radius: String(SHOW_RADIUS_M), // 10 km
      },
    });
  };

  // ========= Big Markers (always red/green, no color change on press) =========
  const BigMarker = ({
    color,
    ringColor,
    size = 28, // inner dot diameter
    ring = 54, // outer ring diameter
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding" })}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Parking Location</Text>
        </View>

        

        {/* Map */}
        <View style={styles.mapWrap}>
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
                showsUserLocation={false} // we render our own red marker
                showsMyLocationButton={false}
              >
                {/* 🔴 live user + 5 km circle */}
                {userLoc && (
                  <>
                    <Marker
                      coordinate={userLoc}
                      title="You are here"
                      zIndex={999}
                      tappable={false}         // 👈 no press color/ripple/changes
                      tracksViewChanges={false}
                    >
                      <RedBigMarker />
                    </Marker>
                    <Circle
                      center={userLoc}
                      radius={CIRCLE_RADIUS_M}
                      strokeColor="rgba(34,197,94,0.9)"
                      fillColor="rgba(34,197,94,0.22)"
                      strokeWidth={2}
                    />
                  </>
                )}

                {/* 🟢 spaces within 5 km */}
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
                    tappable={false}           // 👈 keep the color stable even if tapped
                    tracksViewChanges={false}
                  >
                    <GreenBigMarker />
                  </Marker>
                ))}
              </MapView>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.legendText}>Your live location</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: "#16A34A" }]} />
                  <Text style={styles.legendText}>Parking spaces</Text>
                </View>
                <View style={[styles.legendRow, { marginTop: 4 }]}>
                  <View
                    style={[
                      styles.swatch,
                      { borderColor: "rgba(34,197,94,0.9)", backgroundColor: "rgba(34,197,94,0.22)" },
                    ]}
                  />
                  <Text style={styles.legendText}>Radius (5 km)</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryBtn, (loadingSpaces || !userLoc) && { opacity: 0.7 }]}
            onPress={onShow}
            disabled={loadingSpaces || !userLoc}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>{loadingSpaces ? "Loading spaces…" : "Show"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    backgroundColor: "#44A6FF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },

  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 12, gap: 10 },
  searchInputWrap: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    height: 44,
    justifyContent: "center",
  },
  searchInput: { color: "#111827" },
  searchBtn: {
    backgroundColor: "#44A6FF",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: { color: "#fff", fontWeight: "700" },

  mapWrap: { flex: 1, marginTop: 12, marginHorizontal: 12, borderRadius: 12, overflow: "hidden" },
  mapLoader: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Custom markers
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerDot: {
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  markerRing: {
    position: "absolute",
    borderWidth: 2,
  },

  // Legend
  legend: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 2 },
  legendText: { color: "#111827", fontSize: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },

  bottomBar: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff" },
  primaryBtn: {
    backgroundColor: "#2F80ED",
    height: 50,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2F80ED",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  swatch: { width: 16, height: 10, borderRadius: 4, borderWidth: 1 },
});
