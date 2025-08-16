// app/Register-Space2.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { Stack, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type DaySlot = { day: string; enabled: boolean; startTime: string; endTime: string };
type PricingUnit = "hour" | "day";
type VehicleType = "Cars" | "Vans" | "Bikes" | "Buses";

const STORAGE_KEY = "pm_timeSlots";       // temp availability handoff from SetTimeSlots
const DRAFT_KEY = "pm_space_draft";       // draft autosave key

const to12h = (t: string) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const am = h < 12;
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")} ${am ? "AM" : "PM"}`;
};

export default function RegisterSpace2() {
  // form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  // refs to force focus when tapping container
  const nameRef = useRef<TextInput>(null);

  // location
  const [locationLabel, setLocationLabel] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);

  // UI focus
  const [focusName, setFocusName] = useState(false);
  const [focusAddress, setFocusAddress] = useState(false);

  // save debounce timer
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // pricing
  const [pricing, setPricing] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [pricingAmount, setPricingAmount] = useState<string>("");
  const [pricingUnit, setPricingUnit] = useState<PricingUnit>("hour");

  // vehicles
  const [showCategory, setShowCategory] = useState(false);
  const [vehicleCounts, setVehicleCounts] = useState<Record<VehicleType, number>>({
    Cars: 0,
    Vans: 0,
    Bikes: 0,
    Buses: 0,
  });
  const prevCountsRef = useRef(vehicleCounts);

  // misc
  const [description, setDescription] = useState("");
  const [agree, setAgree] = useState(false);

  // verify / locate
  const [verifying, setVerifying] = useState(false);
  const [verifiedOnce, setVerifiedOnce] = useState(false);
  const [locating, setLocating] = useState(false);

  // availability chips
  const [enabledSlots, setEnabledSlots] = useState<DaySlot[]>([]);

  // API
  const API_BASE = "http://192.168.8.131/Parkmate"; // ← your LAN/XAMPP path
  const SAVE_ENDPOINT = `${API_BASE}/save_space_details.php`;
  const LINK_ENDPOINT = `${API_BASE}/link_agreement_to_owner_space.php`;

  const [submitting, setSubmitting] = useState(false);

  // Read temp availability from SetTimeSlots, then CLEAR it so it doesn't stick forever
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          if (!mounted) return;
          if (raw) {
            const slots = JSON.parse(raw) as DaySlot[];
            const enabled = (slots || []).filter(d => d.enabled && d.startTime && d.endTime);
            setEnabledSlots(enabled);
            // important: clear temp so it only shows once after you set it
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          // ignore, leave whatever was already in state
        }
      })();
      return () => { mounted = false; };
    }, [])
  );

  // Load draft once on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        setName(d.name ?? "");
        setAddress(d.address ?? "");
        setLocationLabel(d.location_label ?? "");
        setLat(typeof d.lat === "number" ? d.lat : null);
        setLon(typeof d.lon === "number" ? d.lon : null);
        setIsFree(!!d.is_free);
        setPricingAmount(d.pricingAmount ?? "");
        setPricingUnit(d.pricingUnit === "day" ? "day" : "hour");
        setVehicleCounts(d.vehicle_counts ?? { Cars: 0, Vans: 0, Bikes: 0, Buses: 0 });
        setEnabledSlots(Array.isArray(d.enabledSlots) ? d.enabledSlots : []);
        setVerifiedOnce(!!(d.location_label || (typeof d.lat === "number" && typeof d.lon === "number")));
      } catch {
        // ignore
      }
    })();
  }, []);

  // Autosave draft with a tiny debounce
  useEffect(() => {
    const draft = {
      name,
      address,
      location_label: locationLabel,
      lat,
      lon,
      is_free: isFree ? 1 : 0,
      pricingAmount,
      pricingUnit,
      vehicle_counts: vehicleCounts,
      enabledSlots,
    };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    name, address, locationLabel, lat, lon,
    isFree, pricingAmount, pricingUnit,
    vehicleCounts, enabledSlots
  ]);

  // derive pricing preview
  useEffect(() => {
    if (isFree) setPricing("Free");
    else if (pricingAmount) setPricing(`Rs ${pricingAmount} / ${pricingUnit}`);
    else setPricing("");
  }, [isFree, pricingAmount, pricingUnit]);

  const onSubmit = async () => {
    if (!agree) {
      Alert.alert("Please agree", "You must accept the terms before submitting.");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Missing", "Enter the parking space name.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Missing", "Enter the exact address.");
      return;
    }

    // Build availability payload (enabled slots only)
    const availability = enabledSlots.map((d) => ({
      day: d.day,
      start: d.startTime,
      end: d.endTime,
    }));

    const price_amount = isFree ? null : (pricingAmount ? parseInt(pricingAmount, 10) : null);
    const price_unit: PricingUnit | null = isFree ? null : pricingUnit;
    const pricing_text = isFree
      ? "Free"
      : price_amount != null
        ? `Rs ${price_amount} / ${price_unit}`
        : null;

    const payload = {
      name: name.trim(),
      address: address.trim(),
      location_label: locationLabel || null,
      // send as strings so PHP can NULLIF('', '') → NULL for empty coords
      latitude: lat != null ? String(lat) : "",
      longitude: lon != null ? String(lon) : "",

      availability,                  // array → PHP json_encode
      vehicle_counts: vehicleCounts, // object → PHP json_encode

      is_free: isFree ? 1 : 0,
      price_amount,
      price_unit,
      pricing_text,
    };

    try {
      setSubmitting(true);
      const res = await fetch(SAVE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json(); // ← you were missing this line
      if (json?.success) {
        const spaceId = String(json.id);

        // remember space id if you like (used by ParkingAgreementScreen)
        await AsyncStorage.setItem("pm_last_space_id", spaceId);

        // link any pending agreement (created earlier before owner/space)
        const pending = await AsyncStorage.getItem("pm_pending_agreement_id");
        if (pending) {
          try {
            await fetch(LINK_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                agreement_id: Number(pending),
                space_id: Number(spaceId),
              }),
            });
          } catch {
            // ignore link errors; not fatal for space creation
          }
          // clear regardless
          await AsyncStorage.removeItem("pm_pending_agreement_id");
        }

        // clear draft + temp time-slots so the next open is fresh
        await AsyncStorage.multiRemove([DRAFT_KEY, STORAGE_KEY]);

        // go to next page
        router.replace({ pathname: "/AfterSubmitting", params: { space_id: spaceId } });
        return;
      }

      Alert.alert("Save failed", json?.message || "Unknown error from server.");
    } catch (e) {
      Alert.alert(
        "Network error",
        "Could not reach the server. Check your IP (API_BASE) and XAMPP."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const verifyAddress = async () => {
    const q = address.trim();
    if (!q) return;
    try {
      setVerifying(true);
      setVerifiedOnce(false);

      const url =
        "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=" +
        encodeURIComponent(q);

      const res = await fetch(url, {
        headers: { "User-Agent": "ParkMate-Demo/1.0 (contact@example.com)" },
      });
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const best = data[0];
        const display = String(best.display_name || "");
        const latNum = parseFloat(best.lat);
        const lonNum = parseFloat(best.lon);

        setLocationLabel(display);
        setLat(isFinite(latNum) ? latNum : null);
        setLon(isFinite(lonNum) ? lonNum : null);
        setVerifiedOnce(true);
      } else {
        Alert.alert("Not found", "Couldn’t verify that address. Try refining it.");
      }
    } catch {
      Alert.alert("Network error", "Address verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const setFromCoords = async (latNum: number, lonNum: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latNum}&lon=${lonNum}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "ParkMate-Demo/1.0 (contact@example.com)" },
      });
      const data = await res.json();
      const display = String(data.display_name || `${latNum.toFixed(5)}, ${lonNum.toFixed(5)}`);
      setLocationLabel(display);
      setLat(latNum);
      setLon(lonNum);
      setVerifiedOnce(true);
    } catch {
      // fallback to coords only
      setLocationLabel(`${latNum.toFixed(5)}, ${lonNum.toFixed(5)}`);
      setLat(latNum);
      setLon(lonNum);
      setVerifiedOnce(true);
    }
  };

  const useMyLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "We need location permission to use your current position."
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
      });
      await setFromCoords(pos.coords.latitude, pos.coords.longitude);
    } catch {
      Alert.alert("Location error", "Could not get your current location.");
    } finally {
      setLocating(false);
    }
  };

  const openInMaps = () => {
    if (lat == null || lon == null) {
      Alert.alert("No location", "Verify the address or use your location first.");
      return;
    }
    const label = encodeURIComponent(locationLabel || "Selected location");
    if (Platform.OS === "ios") {
      const url = `http://maps.apple.com/?ll=${lat},${lon}&q=${label}`;
      Linking.openURL(url);
    } else {
      const url = `geo:${lat},${lon}?q=${lat},${lon}(${label})`;
      Linking.openURL(url);
    }
  };

  // pricing helpers
  const addStep = (step: number) => {
    const n = Number(pricingAmount || 0) + step;
    setPricingAmount(String(Math.max(0, Math.floor(n))));
  };
  const onChangeAmount = (txt: string) => setPricingAmount(txt.replace(/[^\d]/g, ""));

  // vehicle helpers
  const selectedVehicles = () =>
    (["Cars", "Vans", "Bikes", "Buses"] as const)
      .map((k) => ({ k, v: vehicleCounts[k] || 0 }))
      .filter((x) => x.v > 0);

  const openCategory = () => {
    prevCountsRef.current = vehicleCounts; // snapshot
    setShowCategory(true);
  };
  const cancelCategory = () => {
    setVehicleCounts(prevCountsRef.current); // revert
    setShowCategory(false);
  };
  const saveCategory = () => setShowCategory(false);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Space Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Space Name */}
        <View style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Ionicons name="home-outline" size={16} color={palette.primary} />
            <Text style={styles.labelText}>Parking Space Name</Text>
          </View>
          <Pressable
            onPress={() => nameRef.current?.focus()}
            style={[styles.inputBox, focusName && styles.inputBoxFocused]}
          >
            <TextInput
              ref={nameRef}
              placeholder="e.g., City Center Basement"
              placeholderTextColor="#9aa0a6"
              value={name}
              onChangeText={setName}
              style={styles.inputPlain}
              onFocus={() => setFocusName(true)}
              onBlur={() => setFocusName(false)}
              returnKeyType="next"
              autoCapitalize="words"
              autoCorrect
            />
          </Pressable>
        </View>

        {/* Address + Verify */}
        <View style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Ionicons name="location-outline" size={16} color={palette.primary} />
            <Text style={styles.labelText}>Exact Address</Text>
          </View>

          <View style={[styles.inlineRow, focusAddress && styles.inlineRowFocused]}>
            <TextInput
              placeholder="Street, city, region (type full address)"
              placeholderTextColor="#9aa0a6"
              value={address}
              onChangeText={(t) => {
                setAddress(t);
                setVerifiedOnce(false);
                setLocationLabel("");
                setLat(null);
                setLon(null);
              }}
              style={[styles.inputPlain, { flex: 1, paddingRight: 10 }]}
              onFocus={() => setFocusAddress(true)}
              onBlur={() => setFocusAddress(false)}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={verifyAddress}
              disabled={!address.trim() || verifying}
              style={[
                styles.verifyBtn,
                (!address.trim() || verifying) && styles.verifyBtnDisabled,
                verifiedOnce && styles.verifiedBtn,
              ]}
              activeOpacity={0.9}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : verifiedOnce ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={styles.verifyText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.helpText}>
            Tip: enter full address (number, street, city) then tap Verify.
          </Text>
        </View>

        {/* Location */}
        <View style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Ionicons name="map-outline" size={16} color={palette.primary} />
            <Text style={styles.labelText}>Location</Text>
            {verifiedOnce ? (
              <View style={styles.badgeVerified}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            activeOpacity={locationLabel ? 0.9 : 1}
            onPress={openInMaps}
            disabled={!locationLabel}
            style={[styles.mapBox, !locationLabel && styles.mapBoxDisabled]}
          >
            <Ionicons
              name="pin-outline"
              size={18}
              color={locationLabel ? palette.primary : "#9aa0a6"}
              style={{ marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={locationLabel ? styles.mapText : styles.mapPlaceholderText}
              >
                {locationLabel || "Will appear after verifying the address"}
              </Text>
            </View>
            <Ionicons
              name="open-outline"
              size={18}
              color={locationLabel ? palette.primary : "#c5c7cb"}
            />
          </TouchableOpacity>

          {/* Use my location */}
          <View style={styles.locateRow}>
            <TouchableOpacity
              style={styles.locateBtn}
              onPress={useMyLocation}
              activeOpacity={0.9}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator size="small" />
              ) : (
                <>
                  <Ionicons
                    name="navigate-outline"
                    size={16}
                    color="#0F172A"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.locateText}>Use my location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.helpTextSmall}>
            {locationLabel ? "Tap the box to open in your Maps app." : "Verify or use your GPS to set location."}
          </Text>
        </View>

        {/* Availability */}
        <TouchableOpacity
          style={styles.availabilityCard}
          activeOpacity={0.9}
          onPress={() => router.push("/SetTimeSlots")}
        >
          <View style={styles.availHeader}>
            <View style={styles.rowCenter}>
              <Ionicons name="time" size={18} color={palette.primary} />
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Availability</Text>
            </View>
            <Ionicons name="create-outline" size={18} color={palette.primary} />
          </View>

          {enabledSlots.length ? (
            <View style={styles.chipsWrap}>
              {enabledSlots.map((d) => (
                <View key={d.day} style={styles.chip}>
                  <Ionicons name="calendar-outline" size={12} color={palette.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.chipText}>
                    {d.day.slice(0, 3)} {to12h(d.startTime)}–{to12h(d.endTime)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyAvailBox}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAvailText}>No time slots set. Tap to add</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Pricing */}
        <View style={styles.pricingCard}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <TouchableOpacity
            style={[styles.freeToggle, isFree && styles.freeToggleActive]}
            onPress={() => setIsFree((s) => !s)}
            activeOpacity={0.9}
          >
            <Ionicons
              name={isFree ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={isFree ? "#fff" : palette.primary}
            />
            <Text style={[styles.freeToggleText, isFree && styles.freeToggleTextActive]}>Free</Text>
          </TouchableOpacity>

          {!isFree && (
            <>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitBtn, pricingUnit === "hour" && styles.unitBtnActive]}
                  onPress={() => setPricingUnit("hour")}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.unitText, pricingUnit === "hour" && styles.unitTextActive]}>
                    Per hour
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitBtn, pricingUnit === "day" && styles.unitBtnActive]}
                  onPress={() => setPricingUnit("day")}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.unitText, pricingUnit === "day" && styles.unitTextActive]}>
                    Per day
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.amountRow}>
                <View style={styles.currencyPill}>
                  <Text style={styles.currencyText}>Rs</Text>
                </View>

                <TextInput
                  value={pricingAmount}
                  onChangeText={onChangeAmount}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9aa0a6"
                  style={styles.amountInput}
                  maxLength={6}
                />

                <TouchableOpacity onPress={() => addStep(-10)} style={styles.stepBtn} activeOpacity={0.85}>
                  <Text style={styles.stepBtnText}>−10</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => addStep(10)} style={styles.stepBtn} activeOpacity={0.85}>
                  <Text style={styles.stepBtnText}>+10</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.previewText}>
            {isFree ? "Will save as: Free" : pricingAmount ? `Will save as: Rs ${pricingAmount} / ${pricingUnit}` : "Enter a price"}
          </Text>
        </View>

        {/* Vehicle Categories */}
        <View style={styles.catCard}>
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() => (showCategory ? setShowCategory(false) : openCategory())}
            activeOpacity={0.9}
          >
            <View style={styles.rowCenter}>
              <Ionicons name="grid" size={18} color={palette.primary} />
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Vehicle Categories</Text>
            </View>
            <Ionicons
              name={showCategory ? "chevron-up" : "chevron-down"}
              size={18}
              color={palette.primary}
            />
          </TouchableOpacity>

          <View style={styles.summaryBox}>
            {selectedVehicles().length ? (
              selectedVehicles().map(({ k, v }) => (
                <Text key={k} style={styles.summaryLine}>
                  {k}: <Text style={styles.summaryCount}>{v}</Text>
                </Text>
              ))
            ) : (
              <Text style={styles.summaryEmpty}>None selected</Text>
            )}
          </View>

          {showCategory && (
            <>
              <View style={styles.grid}>
                {(["Cars", "Vans", "Bikes", "Buses"] as const).map((type) => {
                  const count = vehicleCounts[type] || 0;
                  return (
                    <View key={type} style={styles.vehicleCard}>
                      <View style={styles.vehicleTopRow}>
                        <View style={styles.iconWrap}>
                          <Ionicons
                            name={
                              type === "Cars" ? "car" :
                              type === "Vans" ? "car-sport" :
                              type === "Bikes" ? "bicycle" : "bus"
                            }
                            size={20}
                            color={palette.text}
                          />
                        </View>
                        <Text style={styles.vehicleName}>{type}</Text>
                      </View>

                      <View style={styles.counterRow}>
                        <TouchableOpacity
                          onPress={() =>
                            setVehicleCounts((p) => ({ ...p, [type]: Math.max(0, (p[type] || 0) - 1) }))
                          }
                          style={[styles.counterBtn, { opacity: count > 0 ? 1 : 0.4 }]}
                          disabled={count <= 0}
                        >
                          <Ionicons name="remove" size={18} color={palette.text} />
                        </TouchableOpacity>

                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>{count}</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() =>
                            setVehicleCounts((p) => ({ ...p, [type]: Math.min(99, (p[type] || 0) + 1) }))
                          }
                          style={styles.counterBtn}
                        >
                          <Ionicons name="add" size={18} color={palette.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.catFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelCategory} activeOpacity={0.9}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={saveCategory} activeOpacity={0.9}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Legal docs */}
        <View style={styles.legalRow}>
          <Text style={styles.legalLabel}>Legal Documentation Upload :</Text>
          <TouchableOpacity onPress={() => router.push("/ParkingAgreementScreen")}>
            <Text style={styles.link}>Click here</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View style={styles.termsRow}>
          <TouchableOpacity
            style={[styles.checkbox, { backgroundColor: agree ? "#2563EB" : "#fff" }]}
            onPress={() => setAgree((s) => !s)}
            activeOpacity={0.8}
          >
            {agree && <Ionicons name="checkmark" size={12} color="#fff" />}
          </TouchableOpacity>
          <Text style={styles.termsText}>
            I agree to the terms and conditions of the platform.{" "}
            <Text style={styles.link} onPress={() => router.push("/UserAgreementScreen")}>
              Click here
            </Text>
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { opacity: agree && !submitting ? 1 : 0.6 }]}
          activeOpacity={0.9}
          disabled={!agree || submitting}
          onPress={onSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit for Approval</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const palette = {
  bg: "#F5F6FA",
  pillBg: "#F2F4F7",
  border: "#E5E7EB",
  text: "#0F172A",
  primary: "#2F80ED",
  header: "#39A1E1",
  verify: "#0EA5E9",
  verifyDisabled: "#9ecff0",
  verified: "#10B981",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },

  header: {
    backgroundColor: palette.header,
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 10, android: 14 }),
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 18 },

  container: { padding: 16 },

  /* field cards */
  fieldCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelText: { color: "#0F172A", fontWeight: "800", fontSize: 13 },

  inputBox: {
    backgroundColor: palette.pillBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  inputBoxFocused: {
    borderColor: palette.primary,
    shadowColor: "#2F80ED",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  inputPlain: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
    paddingVertical: Platform.select({ ios: 10, android: 8 }),
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.pillBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineRowFocused: { borderColor: palette.primary, elevation: 2 },

  verifyBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: palette.verify,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnDisabled: { backgroundColor: palette.verifyDisabled },
  verifiedBtn: { backgroundColor: palette.verified },
  verifyText: { color: "#fff", fontWeight: "800" },

  helpText: { color: "#6B7280", fontSize: 12, marginTop: 8 },
  helpTextSmall: { color: "#9aa0a6", fontSize: 11, marginTop: 8 },

  mapBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6EEFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mapBoxDisabled: { opacity: 0.7 },
  mapText: { color: "#0F172A", fontSize: 13, fontWeight: "600" },
  mapPlaceholderText: { color: "#9aa0a6", fontSize: 13, fontStyle: "italic" },

  badgeVerified: {
    marginLeft: "auto",
    backgroundColor: palette.verified,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  locateRow: { marginTop: 10, flexDirection: "row" },
  locateBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EEFF",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  locateText: { color: "#0F172A", fontWeight: "700" },

  /* description pill (kept if needed) */
  pill: {
    backgroundColor: palette.pillBg,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  textArea: { color: palette.text, fontSize: 14, minHeight: 90, textAlignVertical: "top" },

  /* Availability chips card */
  availabilityCard: {
    backgroundColor: "#f7fbff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d9e8ff",
    padding: 14,
    marginBottom: 12,
  },
  availHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cfe4ff",
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { color: "#0F172A", fontWeight: "700", fontSize: 12 },
  emptyAvailBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e6eefc",
    backgroundColor: "#ffffff",
  },
  emptyAvailText: { color: "#6B7280", fontSize: 12, fontStyle: "italic" },

  /* Pricing */
  pricingCard: {
    backgroundColor: "#e9f3ff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cfe4ff",
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  freeToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.primary,
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  freeToggleActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  freeToggleText: { color: palette.primary, fontWeight: "800", marginLeft: 8 },
  freeToggleTextActive: { color: "#fff" },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: "#dff0ff",
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
  },
  unitBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 999 },
  unitBtnActive: { backgroundColor: palette.primary },
  unitText: { fontSize: 12, fontWeight: "800", color: "#0F172A" },
  unitTextActive: { color: "#fff" },
  amountRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  currencyPill: {
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f3f8ff",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cfe4ff",
    marginRight: 8,
  },
  currencyText: { fontWeight: "900", color: "#0F172A" },
  amountInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cfe4ff",
    color: palette.text,
    marginRight: 8,
  },
  stepBtn: {
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#dff0ff",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cfe4ff",
    marginRight: 8,
  },
  stepBtnText: { fontWeight: "900", color: "#0F172A" },
  previewText: { marginTop: 6, fontSize: 12, color: "#0F172A", fontWeight: "600" },

  /* Categories */
  catCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  summaryBox: {
    backgroundColor: "#f7fbff",
    borderWidth: 1,
    borderColor: "#d9e8ff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  summaryLine: { color: palette.text, fontWeight: "700", marginBottom: 4 },
  summaryCount: { color: palette.primary, fontWeight: "900" },
  summaryEmpty: { color: "#6B7280", fontStyle: "italic" },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  vehicleCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#cfe4ff",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  vehicleTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f0f7ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cfe4ff",
    marginRight: 8,
  },
  vehicleName: { fontSize: 14, fontWeight: "800", color: palette.text },
  counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#e9f3ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cfe4ff",
  },
  countBadge: {
    minWidth: 48,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cfe4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontWeight: "900", color: "#0F172A" },
  catFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d9e8ff",
    backgroundColor: "#fff",
  },
  cancelText: { color: "#0F172A", fontWeight: "700" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: palette.primary,
  },
  saveBtnText: { color: "#fff", fontWeight: "800" },

  /* Submit + misc */
  termsRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 3,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  termsText: { color: palette.text, fontSize: 12, flex: 1 },
  legalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  legalLabel: { color: palette.text, fontWeight: "800", marginRight: 6 },
  link: { color: "#2F80ED", fontWeight: "700" },
  submitBtn: {
    backgroundColor: palette.primary,
    borderRadius: 20,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  submitText: { color: "#fff", fontWeight: "800" },
});
