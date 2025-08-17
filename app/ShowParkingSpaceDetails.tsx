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
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

/** ===== THEME ===== */
const BLUE = "#0099ff";
const SURFACE = "#ffffff";
const BG = "#f6f7fb";
const BORDER = "#e6e9f2";
const TEXT = "#0f172a";
const MUTED = "#64748b";

/** ===== API CONFIG (change IP only) ===== */
const API_BASE = "http://192.168.8.131/Parkmate";
const VEHICLES_API = `${API_BASE}/vehicles_api.php`;

const ORDER: VehicleKind[] = ["Cars", "Vans", "Bikes", "Buses"];

// Icons + chip colors per category
const ICON_META: Record<
  VehicleKind,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; chipBg: string; chipBorder: string }
> = {
  Cars:  { icon: "car-outline",       color: "#0ea5e9", label: "Cars",  chipBg: "#eaf7ff", chipBorder: "#cfe9ff" },
  Vans:  { icon: "car-sport",         color: "#3b82f6", label: "Vans",  chipBg: "#eaf2ff", chipBorder: "#d3e0ff" },
  Bikes: { icon: "bicycle-outline",   color: "#10b981", label: "Bikes", chipBg: "#eafaf3", chipBorder: "#c9f2dc" },
  Buses: { icon: "bus-outline",       color: "#f59e0b", label: "Buses", chipBg: "#fff4e5", chipBorder: "#ffe5bf" },
};

// time helpers
const to12hCompact = (hhmm?: string) => {
  if (!hhmm) return "--";
  const [H, M] = hhmm.split(":").map((n) => parseInt(n, 10));
  const am = H < 12;
  const h12 = ((H + 11) % 12) + 1;
  return `${h12}:${String(M).padStart(2, "0")} ${am ? "AM" : "PM"}`;
};
const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
function computeDailyWindow(availability: AvailabilitySlot[]) {
  const starts: string[] = [], ends: string[] = [];
  for (const s of availability || []) {
    if (s.start) starts.push(s.start);
    if (s.end) ends.push(s.end);
  }
  if (!starts.length || !ends.length) {
    return { label: "Open Hours", range: "Hours vary" };
  }
  starts.sort(); ends.sort();
  const start = starts[0], end = ends[ends.length - 1];
  return { label: "Open Daily", range: `${to12hCompact(start)} - ${to12hCompact(end)}` };
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
      <SafeAreaView style={[styles.safe, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={BLUE} />
        <Text style={{ color: "#b91c1c", fontWeight: "600" }}>Space not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.btn, { marginTop: 14 }]}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const title = space.name || space.location_label || space.address || "Parking Space";
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
        if (j?.success && j.occupied_counts) {
          setOccupied((prev) => ({ ...prev, ...j.occupied_counts }));
        }
      } catch {/* ignore */ }
    })();
  }, [space.id]);

  useEffect(() => {
    if (showIn) {
      setStartTime(to12hCompact(nowHHMM()));
      if (!category && AVAILABLE_KINDS.length) setCategory(AVAILABLE_KINDS[0]);
    }
  }, [showIn, AVAILABLE_KINDS, category]);

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
        start_time: outVerified.start_time,
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

  /* ===== Derived / layout helpers ===== */
  const titleLine = (space.location_label || space.address || "").trim();

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      {/* App Bar */}
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.appbarBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.appbarTitle}>{title}</Text>
        <View style={styles.appbarBtn} />
      </View>

      {/* Footer actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: BLUE }]}
          onPress={() => setShowIn(true)}
          activeOpacity={0.9}
        >
          <Ionicons name="log-in-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Vehicle In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: TEXT }]}
          onPress={() => setShowOut(true)}
          activeOpacity={0.9}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Vehicle Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          {titleLine ? (
            <View style={styles.row}>
              <Ionicons name="location-outline" size={16} color={BLUE} />
              <Text style={styles.mutedText} numberOfLines={2}>{titleLine}</Text>
            </View>
          ) : null}

          <View style={[styles.rowBetween, { marginTop: 10 }]}>
            <View style={[styles.badgeSoft]}>
              <Ionicons name="time-outline" size={14} color={TEXT} />
              <Text style={styles.badgeText}>{label}</Text>
            </View>
            <Text style={styles.rangeText}>{range}</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={[styles.pricePill, space.is_free ? styles.priceFree : styles.pricePaid]}>
              <Ionicons name={space.is_free ? "gift-outline" : "cash-outline"} size={14} color="#fff" />
              <Text style={styles.pricePillText}>
                {space.is_free
                  ? "Free"
                  : space.pricing_text ||
                    (space.price_amount != null && space.price_unit
                      ? `Rs ${space.price_amount} / ${space.price_unit}`
                      : "Paid")}
              </Text>
            </View>
          </View>
        </View>

        {/* Category Overview (pills) */}
        <View style={styles.pillsRow}>
          {ORDER.filter((k) => Number(space.vehicle_counts[k] ?? 0) > 0).map((k) => {
            const meta = ICON_META[k];
            const cap = Number(space.vehicle_counts[k] ?? 0);
            const occ = occupied[k] || 0;
            return (
              <View key={k} style={[styles.catPill, { backgroundColor: meta.chipBg, borderColor: meta.chipBorder }]}>
                <Ionicons name={meta.icon} size={15} color={meta.color} />
                <Text style={styles.catPillText}>
                  {meta.label} <Text style={styles.boldCount}>{occ}/{cap}</Text>
                </Text>
              </View>
            );
          })}
        </View>

        {/* Category Sections with Grids */}
        {ORDER.filter((k) => Number(space.vehicle_counts[k] ?? 0) > 0).map((k) => {
          const cap = Number(space.vehicle_counts[k] ?? 0);
          const occ = occupied[k] || 0;
          const meta = ICON_META[k];

          return (
            <View key={k} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.row}>
                  <View style={[styles.sectionIconWrap, { borderColor: meta.chipBorder, backgroundColor: meta.chipBg }]}>
                    <Ionicons name={meta.icon} size={18} color={meta.color} />
                  </View>
                  <Text style={styles.sectionTitle}>{meta.label}</Text>
                </View>
                <View style={[styles.countPill, occ < cap ? styles.countOk : styles.countFull]}>
                  <Ionicons name="albums-outline" size={12} color="#fff" />
                  <Text style={styles.countPillText}>
                    {occ}/{cap} occupied
                  </Text>
                </View>
              </View>

              {/* Grid */}
              <View style={styles.grid}>
                {Array.from({ length: cap }).map((_, i) => {
                  const taken = i < occ;
                  return (
                    <View
                      key={`${k}-${i}`}
                      style={[
                        styles.cell,
                        { borderColor: meta.chipBorder },
                        taken ? styles.cellTaken : styles.cellFree,
                      ]}
                    >
                      <Ionicons name={meta.icon} size={22} color={taken ? "#fff" : TEXT} />
                      {taken && (
                        <View style={styles.tickOverlay}>
                          <Ionicons name="checkmark" size={26} color="#fff" />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* IN MODAL (NOW SCROLLABLE) */}
      <Modal visible={showIn} transparent animationType="fade" onRequestClose={() => setShowIn(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.backdrop} onPress={() => { Keyboard.dismiss(); setShowIn(false); }} />
          <View style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 14 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Vehicle In</Text>

              {/* Vehicle no */}
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Vehicle No</Text>
                <TextInput
                  value={vehNo}
                  onChangeText={setVehNo}
                  placeholder="e.g., ABC-1234"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, vehNo ? null : styles.inputError]}
                  autoCapitalize="characters"
                  returnKeyType="next"
                />
              </View>

              {/* Category quick select */}
              <Text style={[styles.groupLabel, { marginTop: 12 }]}>Select Category</Text>
              <View style={styles.catRowGrid}>
                {ORDER.filter((k) => Number(space.vehicle_counts[k] ?? 0) > 0).map((k) => {
                  const meta = ICON_META[k];
                  const active = category === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setCategory(k)}
                      style={[styles.catCard, active ? styles.catCardActive : null, { borderColor: meta.chipBorder }]}
                    >
                      <View style={[styles.catIconWrap, { backgroundColor: meta.chipBg }]}>
                        <Ionicons name={meta.icon} size={22} color={meta.color} />
                      </View>
                      <Text style={[styles.catLabel, active ? styles.catLabelActive : null]}>{meta.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Phone */}
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Phone No</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="07x xxxxxx"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  style={[
                    styles.input,
                    phone.replace(/\D/g, "").length >= 9 ? null : styles.inputError,
                  ]}
                  returnKeyType="done"
                />
              </View>

              {/* Start time (display) */}
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Start Time</Text>
                <View style={[styles.input, { justifyContent: "center" }]}>
                  <Text style={styles.timeStrong}>{startTime}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 14 }, !canSubmitIn && { opacity: 0.7 }]}
                onPress={onEnterIn}
                disabled={!canSubmitIn}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryBtnText}>{saving ? "Saving..." : "Enter"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* OUT MODAL (also scrollable for consistency) */}
      <Modal visible={showOut} transparent animationType="fade" onRequestClose={() => setShowOut(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.backdrop} onPress={() => { Keyboard.dismiss(); setShowOut(false); }} />
          <View style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 14 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Vehicle Out</Text>

              {/* Vehicle No + Verify */}
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Vehicle No</Text>
                <View style={[styles.row, { alignItems: "center" }]}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 10 }, outVerified ? { opacity: 0.6 } : null]}
                    placeholder="e.g., ABC-1234"
                    placeholderTextColor="#9CA3AF"
                    value={outVehNo}
                    onChangeText={(t) => { setOutVehNo(t); setOutVerified(null); }}
                    autoCapitalize="characters"
                    editable={!outVerified}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={onVerifyOut}
                    disabled={verifyDisabled}
                    style={[styles.secondaryBtn, verifyDisabled && { opacity: 0.6 }]}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {outVerified ? "OK" : (outVerifying ? "..." : "Verify")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Times */}
              <View style={styles.inputWrap}>
                <Text style={styles.labelMuted}>Start Time</Text>
                <View style={[styles.input, { justifyContent: "center" }]}>
                  <Text style={styles.timeValue}>
                    {outVerified ? new Date(outVerified.start_time).toLocaleString() : "—"}
                  </Text>
                </View>
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.labelMuted}>End Time</Text>
                <View style={[styles.input, { justifyContent: "center" }]}>
                  <Text style={styles.timeStrong}>{outEndTime}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 14 }, !canSubmitOut && { opacity: 0.7 }]}
                onPress={onEnterOut}
                disabled={!canSubmitOut}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryBtnText}>{outSaving ? "Processing..." : "Enter"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ===== layout ===== */
const WIDTH = Dimensions.get("window").width;
const COLS = 4;
const GAP = 10;
const CELL = Math.floor((WIDTH - 32 - GAP * (COLS - 1)) / COLS);

/* ===== styles ===== */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { alignItems: "center", justifyContent: "center" },

  /* Appbar */
  appbar: {
    backgroundColor: BLUE,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  appbarBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  appbarTitle: {
    flex: 1, color: "#fff", fontSize: 18, fontWeight: "800", paddingHorizontal: 8,
  },

  /* Cards & text */
  summaryCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mutedText: { color: MUTED, fontSize: 13, flex: 1 },
  badgeSoft: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: TEXT, fontWeight: "700", fontSize: 12 },
  rangeText: { color: TEXT, fontWeight: "800" },

  priceRow: { marginTop: 12, flexDirection: "row" },
  pricePill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },
  priceFree: { backgroundColor: "#10b981" },
  pricePaid: { backgroundColor: "#111827" },
  pricePillText: { color: "#fff", fontWeight: "900" },

  /* Overview pills */
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, marginBottom: 6 },
  catPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
  },
  catPillText: { color: TEXT, fontWeight: "700", fontSize: 12 },
  boldCount: { fontWeight: "900" },

  /* Category sections */
  sectionCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 12,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionIconWrap: {
    height: 38, width: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  sectionTitle: { color: TEXT, fontWeight: "800", fontSize: 16, marginLeft: 10 },

  countPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  countOk: { backgroundColor: "#10b981" },
  countFull: { backgroundColor: "#ef4444" },
  countPillText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  /* Grid */
  grid: {
    flexDirection: "row", flexWrap: "wrap",
    marginRight: -GAP, marginBottom: -GAP,
  },
  cell: {
    width: CELL, height: CELL,
    borderWidth: 1, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff",
    marginRight: GAP, marginBottom: GAP,
    overflow: "hidden",
  },
  cellFree: { backgroundColor: "#ffffff" },
  cellTaken: { backgroundColor: BLUE, borderColor: BLUE },
  tickOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center", justifyContent: "center",
  },

  /* Footer actions */
  footer: { marginTop: 20, flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionText: { color: "#fff", fontWeight: "900" },

  /* Generic button */
  btn: { backgroundColor: BLUE, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "700" },

  /* Modal base */
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  modalCard: {
    position: "absolute", left: 16, right: 16, top: 80,
    backgroundColor: SURFACE, borderRadius: 18, padding: 16, maxHeight: "85%",
    borderWidth: 1, borderColor: BORDER,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: TEXT, marginBottom: 8 },

  inputWrap: { marginTop: 10 },
  label: { color: TEXT, fontWeight: "800", marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: BORDER, color: TEXT,
  },
  inputError: { borderColor: "#ef4444" },

  groupLabel: { color: TEXT, fontWeight: "800", fontSize: 16 },
  catRowGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  catCard: {
    width: "48%", backgroundColor: "#fff", borderRadius: 14, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: BORDER, marginTop: 10,
  },
  catCardActive: { backgroundColor: "#eef7ff", borderColor: BLUE },
  catIconWrap: {
    width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  catLabel: { fontSize: 14, color: TEXT, fontWeight: "700", textAlign: "center" },
  catLabelActive: { color: BLUE },

  labelMuted: { color: MUTED, fontSize: 12, marginBottom: 6 },
  timeValue: { color: TEXT, fontWeight: "700" },
  timeStrong: { color: TEXT, fontWeight: "900", textAlign: "center" },

  primaryBtn: {
    backgroundColor: BLUE, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  secondaryBtn: {
    backgroundColor: TEXT, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryBtnText: { color: "#fff", fontWeight: "900" },
});
