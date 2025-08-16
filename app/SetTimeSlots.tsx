import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

type DaySlot = {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

const STORAGE_KEY = "pm_timeSlots";
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// Helpers
const toHHmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const to12h = (t: string) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const am = h < 12;
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")} ${am ? "AM" : "PM"}`;
};

export default function SetTimeSlots() {
  const [local, setLocal] = useState<DaySlot[]>(
    DAYS.map((day) => ({ day, enabled: false, startTime: "", endTime: "" }))
  );
  const [loading, setLoading] = useState(true);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<"start" | "end">("start");
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);

  // Load saved slots on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DaySlot[];
          if (Array.isArray(parsed) && parsed.length === 7) {
            setLocal(parsed);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openPicker = (idx: number, mode: "start" | "end") => {
    setActiveDayIdx(idx);
    setPickerMode(mode);
    setPickerVisible(true);
  };

  const onConfirm = (date: Date) => {
    if (activeDayIdx == null) {
      setPickerVisible(false);
      return;
    }
    const newVal = toHHmm(date);
    setLocal((prev) => {
      const copy = [...prev];
      const row = { ...copy[activeDayIdx] };
      if (pickerMode === "start") row.startTime = newVal;
      else row.endTime = newVal;
      copy[activeDayIdx] = row;
      return copy;
    });
    setPickerVisible(false);
  };

  const toggleEnabled = (idx: number, enabled: boolean) => {
    setLocal((prev) => {
      const copy = [...prev];
      const row = { ...copy[idx], enabled };
      if (enabled && !row.startTime && !row.endTime) {
        row.startTime = "09:00";
        row.endTime = "17:00";
      }
      copy[idx] = row;
      return copy;
    });
  };

  const saveAndBack = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(local));
      router.back();
    } catch {
      Alert.alert("Error", "Could not save time slots.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Availability</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Days list */}
      <ScrollView contentContainerStyle={styles.content}>
        {local.map((row, idx) => (
          <View key={row.day} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.day}>{row.day}</Text>
              <View style={styles.switchWrap}>
                <Text style={styles.enabledLabel}>{row.enabled ? "Enabled" : "Disabled"}</Text>
                <Switch value={row.enabled} onValueChange={(v) => toggleEnabled(idx, v)} />
              </View>
            </View>

            <View style={styles.timesRow}>
              <TouchableOpacity
                style={[styles.timeBtn, !row.enabled && styles.disabledBtn]}
                onPress={() => row.enabled && openPicker(idx, "start")}
                disabled={!row.enabled || loading}
              >
                <Ionicons name="time-outline" size={16} color="#004a77" />
                <Text style={styles.timeText}>
                  {row.startTime ? to12h(row.startTime) : "Start"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.toText}>to</Text>

              <TouchableOpacity
                style={[styles.timeBtn, !row.enabled && styles.disabledBtn]}
                onPress={() => row.enabled && openPicker(idx, "end")}
                disabled={!row.enabled || loading}
              >
                <Ionicons name="time-outline" size={16} color="#004a77" />
                <Text style={styles.timeText}>
                  {row.endTime ? to12h(row.endTime) : "End"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={saveAndBack} disabled={loading}>
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker */}
      <DateTimePickerModal
        isVisible={pickerVisible}
        mode="time"
        onConfirm={onConfirm}
        onCancel={() => setPickerVisible(false)}
        is24Hour={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#00aaff",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, color: "#fff", fontWeight: "bold" },

  content: { padding: 16, paddingBottom: 80 },

  card: {
    borderWidth: 1,
    borderColor: "#d9e8ff",
    backgroundColor: "#f7fbff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  day: { fontSize: 16, fontWeight: "700", color: "#0a66c2" },
  switchWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  enabledLabel: { marginRight: 6, color: "#004a77", fontWeight: "600" },

  timesRow: { marginTop: 10, flexDirection: "row", alignItems: "center" },
  timeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cfe4ff",
    backgroundColor: "#fff",
    minWidth: 120,
  },
  disabledBtn: { opacity: 0.5 },
  timeText: { color: "#004a77", fontWeight: "600" },
  toText: { marginHorizontal: 10, color: "#6b7280" },

  footer: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    padding: 12, backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#eee",
  },
  saveBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#0099ff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
});
