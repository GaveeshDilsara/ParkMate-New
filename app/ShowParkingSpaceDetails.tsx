// app/ShowParkingSpaceDetails.tsx
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type VehicleKind = "Cars" | "Vans" | "Bikes" | "Buses";
type AvailabilitySlot = { day?: string; start?: string; end?: string };
type VehicleCounts = Record<VehicleKind | string, number>;

type Space = {
  id: number;
  name: string;
  address: string;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  availability: AvailabilitySlot[];
  vehicle_counts: VehicleCounts;
  is_free: boolean;
  price_amount: number | null;
  price_unit: "hour" | "day" | null;
  pricing_text: string | null;
};

/** ===== API CONFIG (change IP) ===== */
const API_BASE = "http://192.168.8.131/Parkmate";
const VEHICLES_API = `${API_BASE}/vehicles_api.php`;

const ORDER: VehicleKind[] = ["Cars", "Vans", "Bikes", "Buses"];
const ICON_META: Record<
  VehicleKind,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; bg: string }
> = {
  Cars:  { icon: "car-sport-outline", color: "#1D4ED8", label: "Car",  bg: "#E0E7FF" },
  Vans:  { icon: "car-outline",       color: "#0284C7", label: "Van",  bg: "#DBEAFE" },
  Bikes: { icon: "bicycle-outline",   color: "#16A34A", label: "Bike", bg: "#DCFCE7" },
  Buses: { icon: "bus-outline",       color: "#D97706", label: "Bus",  bg: "#FEF3C7" },
};

// time helpers
const to12hCompact = (hhmm?: string) => {
  if (!hhmm) return "--";
  const [H, M] = hhmm.split(":").map((n) => parseInt(n, 10));
  const am = H < 12;
  const h12 = ((H + 11) % 12) + 1;
  return `${h12}.${String(M).padStart(2, "0")}${am ? "AM" : "PM"}`;
};
const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
function computeDailyWindow(availability: AvailabilitySlot[]) {
  const starts: string[] = [], ends: string[] = [];
  for (const s of availability || []) { if (s.start) starts.push(s.start); if (s.end) ends.push(s.end); }
  starts.sort(); ends.sort();
  const start = starts[0], end = ends[ends.length - 1];
  return { label: "Open Daily", range: start && end ? `${to12hCompact(start)} - ${to12hCompact(end)}` : "Hours vary" };
}

export default function ShowParkingSpaceDetails() {
  const router = useRouter();
  const { space: spaceStr } = useLocalSearchParams<{ space?: string }>();

  const space: Space | null = useMemo(() => {
    try { return spaceStr ? JSON.parse(decodeURIComponent(spaceStr)) : null; } catch { return null; }
  }, [spaceStr]);

  const [occupied, setOccupied] = useState<Record<VehicleKind, number>>({
    Cars: 0, Vans: 0, Bikes: 0, Buses: 0,
  });

  // IN modal
  const [showIn, setShowIn] = useState(false);
  const [vehNo, setVehNo] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<VehicleKind | null>(null);
  const [startTime, setStartTime] = useState(to12hCompact(nowHHMM()));
  const [saving, setSaving] = useState(false);

  // OUT modal
  const [showOut, setShowOut] = useState(false);
  const [outVehNo, setOutVehNo] = useState("");
  const [outVerifying, setOutVerifying] = useState(false);
  const [outVerified, setOutVerified] = useState<null | { id: number; category: VehicleKind; start_time: string }>(null);
  const [outEndTime, setOutEndTime] = useState(to12hCompact(nowHHMM()));
  const [outSaving, setOutSaving] = useState(false);

  if (!space) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#b91c1c", fontWeight: "600" }}>Space not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.btn, { marginTop: 14 }]}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const title = space.location_label || space.address || space.name;
  const { label, range } = computeDailyWindow(space.availability);

  const AVAILABLE_KINDS: VehicleKind[] = useMemo(
    () => ORDER.filter((k) => Number(space.vehicle_counts[k] ?? 0) > 0),
    [space.vehicle_counts]
  );

  // load occupied from server
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${VEHICLES_API}?action=status&space_id=${space.id}`);
        const j = await res.json();
        if (j?.success && j.occupied_counts) setOccupied((prev) => ({ ...prev, ...j.occupied_counts }));
      } catch {/* ignore */ }
    })();
  }, [space.id]);

  useEffect(() => {
    if (showIn) {
      setStartTime(to12hCompact(nowHHMM()));
      if (!category && AVAILABLE_KINDS.length) setCategory(AVAILABLE_KINDS[0]);
    }
  }, [showIn, AVAILABLE_KINDS, category]);

  // build grid (non-zero categories only)
  const gridItems: Array<{ kind: VehicleKind; idx: number; tick: boolean }> = [];
  AVAILABLE_KINDS.forEach((k) => {
    const total = Number(space.vehicle_counts[k] ?? 0);
    for (let i = 0; i < total; i++) gridItems.push({ kind: k, idx: i, tick: i < (occupied[k] || 0) });
  });

  // ===== IN handlers =====
  const phoneDigits = phone.replace(/\D/g, "");
  const canSubmitIn =
    Boolean(vehNo.trim()) && Boolean(category) && phoneDigits.length >= 9 && !saving;

  const onEnterIn = async () => {
    if (!canSubmitIn || !category) return;
    setSaving(true);
    try {
      const res = await fetch(VEHICLES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "in",
          space_id: space.id,
          vehicle_no: vehNo.trim(),
          category,
          phone: phone.trim(),
          start_ts: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (!json?.success) {
        Alert.alert("Failed", json?.error || "Could not save");
        return;
      }
      setOccupied((p) => ({ ...p, [category]: (p[category] || 0) + 1 }));
      setVehNo(""); setPhone(""); setCategory(null); setShowIn(false);
    } catch {
      Alert.alert("Network error", "Check your server URL");
    } finally {
      setSaving(false);
    }
  };

  // ===== OUT handlers =====
  useEffect(() => { if (showOut) setOutEndTime(to12hCompact(nowHHMM())); }, [showOut]);

  const onVerifyOut = async () => {
    if (!outVehNo.trim()) return;
    setOutVerifying(true);
    try {
      const res = await fetch(VEHICLES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", space_id: space.id, vehicle_no: outVehNo.trim() }),
      });
      const j = await res.json();
      if (!j?.success) {
        setOutVerified(null);
        Alert.alert("Not found", j?.error || "No active session");
        return;
      }
      setOutVerified({ id: j.item.id, category: j.item.category, start_time: j.item.start_time });
      setOutEndTime(to12hCompact(nowHHMM()));
    } catch {
      Alert.alert("Network error", "Check your server URL");
    } finally {
      setOutVerifying(false);
    }
  };

  const canSubmitOut = Boolean(outVerified) && !outSaving;
  const verifyDisabled = !outVehNo.trim() || outVerifying || Boolean(outVerified);

  const onEnterOut = async () => {
    if (!outVerified) return;
    setOutSaving(true);
    try {
      const res = await fetch(VEHICLES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "out", id: outVerified.id }),
      });
      const j = await res.json();
      if (!j?.success) {
        Alert.alert("Failed", j?.error || "Could not mark out");
        return;
      }

      // remove one tick
      setOccupied((p) => {
        const n = Math.max(0, (p[outVerified.category] || 1) - 1);
        return { ...p, [outVerified.category]: n };
      });

      // navigate to payment
      const payload = {
        session_id: outVerified.id,
        space_id: space.id,
        vehicle_no: outVehNo.trim(),
        category: outVerified.category,
        start_time: outVerified.start_time, // ISO from DB
        end_time: new Date().toISOString(),
      };
      setShowOut(false);
      setOutVehNo(""); setOutVerified(null);
      router.push({
        pathname: "/PaymentInfo",
        params: { details: encodeURIComponent(JSON.stringify(payload)) },
      });
    } catch {
      Alert.alert("Network error", "Check your server URL");
    } finally {
      setOutSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* App Bar */}
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.appbarBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.appbarTitle}>{title}</Text>
        <TouchableOpacity style={styles.appbarBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {/* Banner */}
        <View style={styles.bannerWrap}>
          <Text style={styles.bannerTop}>{label}</Text>
          <Text style={styles.bannerBottom}>{range}</Text>
        </View>

        {/* Category pills */}
        <View style={styles.pillRow}>
          {ORDER.filter((k) => Number(space.vehicle_counts[k] ?? 0) > 0).map((k) => {
            const meta = ICON_META[k];
            const cap = Number(space.vehicle_counts[k] ?? 0);
            const occ = occupied[k] || 0;
            return (
              <View key={k} style={styles.pill}>
                <Ionicons name={meta.icon} size={16} color={meta.color} />
                <Text style={styles.pillText}>
                  {meta.label} <Text style={styles.pillCount}>{occ}/{cap}</Text>
                </Text>
              </View>
            );
          })}
        </View>

        {/* Grid with ticks */}
        <View style={styles.grid}>
          {ORDER.filter((k) => Number(space.vehicle_counts[k] ?? 0) > 0).flatMap((k) => {
            const total = Number(space.vehicle_counts[k] ?? 0);
            const occ = occupied[k] || 0;
            const meta = ICON_META[k];
            return Array.from({ length: total }).map((_, i) => (
              <View key={`${k}-${i}`} style={styles.cell}>
                <Ionicons name={meta.icon} size={30} color="#111827" />
                {i < occ && (
                  <View style={styles.fullTick}>
                    <Ionicons name="checkmark" size={36} color="#fff" />
                  </View>
                )}
              </View>
            ));
          })}
        </View>

        {/* Footer actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.actionBtn, { marginRight: 12 }]} onPress={() => setShowIn(true)}>
            <Text style={styles.actionText}>In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowOut(true)}>
            <Text style={styles.actionText}>Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* IN MODAL */}
      <Modal visible={showIn} transparent animationType="fade" onRequestClose={() => setShowIn(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.backdrop} onPress={() => { Keyboard.dismiss(); setShowIn(false); }} />
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
              <Text style={styles.modalTitle}>Vehicle In</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  value={vehNo}
                  onChangeText={setVehNo}
                  placeholder="Vehicle No"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, vehNo ? null : styles.inputError]}
                  autoCapitalize="characters"
                />
              </View>

              <Text style={styles.groupLabel}>Select Category</Text>
              <View style={styles.catRowGrid}>
                {ORDER.filter((k) => Number(space.vehicle_counts[k] ?? 0) > 0).map((k) => {
                  const meta = ICON_META[k];
                  const active = category === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setCategory(k)}
                      style={[styles.catCard, active ? styles.catCardActive : null]}
                    >
                      <View style={[styles.catIconWrap, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon} size={22} color={meta.color} />
                      </View>
                      <Text style={[styles.catLabel, active ? styles.catLabelActive : null]}>{meta.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone No"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  style={[
                    styles.input,
                    phone.replace(/\D/g, "").length >= 9 ? null : styles.inputError,
                  ]}
                />
              </View>

              <View style={[styles.inputWrap, { opacity: 0.95 }]}>
                <View style={[styles.input, { justifyContent: "center" }]}>
                  <Text style={styles.startTimeText}>{startTime}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.enterBtn, canSubmitIn ? null : { backgroundColor: "#93C5FD" }]}
                onPress={onEnterIn}
                disabled={!canSubmitIn}
              >
                <Text style={styles.enterText}>{saving ? "Saving..." : "Enter"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* OUT MODAL */}
      <Modal visible={showOut} transparent animationType="fade" onRequestClose={() => setShowOut(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.backdrop} onPress={() => { Keyboard.dismiss(); setShowOut(false); }} />
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
              <Text style={styles.modalTitle}>Vehicle Out</Text>

              {/* Vehicle No + Verify on one line */}
              <View style={[styles.inputWrap, styles.row]}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, marginRight: 10 },
                    outVerified ? { opacity: 0.6 } : null,
                  ]}
                  placeholder="Vehicle No"
                  placeholderTextColor="#9CA3AF"
                  value={outVehNo}
                  onChangeText={(t) => { setOutVehNo(t); setOutVerified(null); }}
                  autoCapitalize="characters"
                  editable={!outVerified}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <TouchableOpacity
                  onPress={onVerifyOut}
                  disabled={verifyDisabled}
                  style={[
                    styles.verifyBtn,
                    verifyDisabled ? { backgroundColor: "#BFDBFE" } : null,
                  ]}
                >
                  <Text style={styles.verifyText}>
                    {outVerified ? "OK" : (outVerifying ? "..." : "Verify")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Start / End time */}
              <View style={styles.inputWrap}>
                <View style={[styles.input, { justifyContent: "center" }]}>
                  <Text style={styles.labelMuted}>Start Time</Text>
                  <Text style={styles.timeValue}>
                    {outVerified ? new Date(outVerified.start_time).toLocaleString() : "—"}
                  </Text>
                </View>
              </View>
              <View style={styles.inputWrap}>
                <View style={[styles.input, { justifyContent: "center" }]}>
                  <Text style={styles.labelMuted}>End Time</Text>
                  <Text style={styles.timeValue}>{outEndTime}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.enterBtn, canSubmitOut ? null : { backgroundColor: "#93C5FD" }]}
                onPress={onEnterOut}
                disabled={!canSubmitOut}
              >
                <Text style={styles.enterText}>{outSaving ? "Processing..." : "Enter"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

/* ===== layout ===== */
const WIDTH = Dimensions.get("window").width;
const COLS = 3, GRID_GAP = 10;
const CELL = Math.floor((WIDTH - 32 - GRID_GAP * (COLS - 1)) / COLS);

/* ===== styles ===== */
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  appbar: { backgroundColor: "#3B82F6", height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  appbarBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  appbarTitle: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "800", paddingHorizontal: 6 },

  bannerWrap: { backgroundColor: "#FDE6D8", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", marginTop: 12, marginBottom: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "#FCD5BF" },
  bannerTop: { color: "#9A3412", fontWeight: "800", fontSize: 13 },
  bannerBottom: { color: "#7C2D12", fontWeight: "900", fontSize: 16, marginTop: 2 },

  pillRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#F3F4F6", borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: "#E5E7EB", marginRight: 8, marginBottom: 8 },
  pillText: { fontSize: 13, color: "#111827" },
  pillCount: { fontWeight: "900" },

  grid: { flexDirection: "row", flexWrap: "wrap", marginRight: -GRID_GAP, marginBottom: -GRID_GAP },
  cell: { width: CELL, height: CELL, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", position: "relative", overflow: "hidden", marginRight: GRID_GAP, marginBottom: GRID_GAP },
  fullTick: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(34,197,94,0.9)", alignItems: "center", justifyContent: "center" },

  footer: { marginTop: 22, flexDirection: "row", justifyContent: "space-between" },
  actionBtn: { flex: 1, backgroundColor: "#3B82F6", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  btn: { backgroundColor: "#3B82F6", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "700" },

  // Modal
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  modalCard: { position: "absolute", left: 16, right: 16, top: 90, backgroundColor: "#F3F4F6", borderRadius: 18, padding: 16, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 10 },

  inputWrap: { marginTop: 10 },
  input: { backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 16, height: 50, borderWidth: StyleSheet.hairlineWidth, borderColor: "#E5E7EB", color: "#111827" },
  inputError: { borderColor: "#EF4444" },

  // Category 2×2 (IN modal)
  groupLabel: { marginTop: 12, marginBottom: 8, color: "#111827", fontWeight: "800", fontSize: 16 },
  catRowGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  catCard: { width: "48%", backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "#E5E7EB", marginBottom: 12 },
  catCardActive: { borderColor: "#3B82F6", borderWidth: 2, backgroundColor: "#EEF2FF" },
  catIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  catLabel: { fontSize: 14, color: "#111827", fontWeight: "700", textAlign: "center" },
  catLabelActive: { color: "#1D4ED8" },

  // OUT modal extras
  row: { flexDirection: "row", alignItems: "center" },
  verifyBtn: { backgroundColor: "#3B82F6", height: 50, paddingHorizontal: 16, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  verifyText: { color: "#fff", fontWeight: "900" },
  labelMuted: { color: "#6B7280", fontSize: 12, marginBottom: 2 },
  timeValue: { color: "#111827", fontWeight: "800" },

  startTimeText: {
  color: "#111827",
  fontWeight: "800",
  textAlign: "center",
},


  enterBtn: { alignSelf: "flex-end", marginTop: 14, backgroundColor: "#3B82F6", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  enterText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
