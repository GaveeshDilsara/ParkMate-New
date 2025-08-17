// app/AfterSubmitting.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const BLUE = '#0099ff';

const AfterSubmitting = () => {
  const navigation = useNavigation();
  const allowLeaveRef = useRef(false);

  // Responsive drawer width
  const { width, height } = useWindowDimensions();
  const isTablet = Math.max(width, height) >= 900;
  const DRAWER_W = Math.min(width * 0.82, isTablet ? 420 : 330);

  // Drawer animation
  const drawerX = useRef(new Animated.Value(-DRAWER_W)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keep drawer position consistent when layout changes
  useEffect(() => {
    if (!drawerOpen) drawerX.setValue(-DRAWER_W);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DRAWER_W]);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerX, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  const closeDrawer = () => {
    Animated.timing(drawerX, {
      toValue: -DRAWER_W,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  // Disable iOS swipe-back & header back for THIS screen (no cleanup to avoid warnings)
  useEffect(() => {
    navigation.setOptions?.({
      gestureEnabled: false,
      headerBackVisible: false,
      headerShown: false,
    });
  }, [navigation]);

  // Block back while focused (Android back, header back, swipe)
  useFocusEffect(
    React.useCallback(() => {
      const beforeRemove = navigation.addListener('beforeRemove', (e: any) => {
        if (allowLeaveRef.current) return;
        e.preventDefault();
      });

      const onBackPress = () => {
        if (drawerOpen) {
          closeDrawer();
          return true;
        }
        return true; // block
      };
      const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        beforeRemove();
        backSub.remove();
      };
    }, [navigation, drawerOpen])
  );

  const goHome = () => {
    allowLeaveRef.current = true;
    requestAnimationFrame(() => {
      router.replace('/AfterAccepting'); // or your intended home
    });
  };

  const goRoute = (path: string) => {
    // close without scheduling more updates after nav
    drawerX.stopAnimation();
    setDrawerOpen(false);
    allowLeaveRef.current = true;
    requestAnimationFrame(() => {
      router.replace(path as any);
    });
  };

  const logout = async () => {
    // Avoid any setState during the navigation commit:
    drawerX.stopAnimation();     // stop pending animations
    setDrawerOpen(false);        // close immediately, no animated callback
    await AsyncStorage.multiRemove(['pm_owner_id', 'pm_owner_name', 'pm_last_space_id']);
    allowLeaveRef.current = true;
    requestAnimationFrame(() => {
      router.replace('/ChooseRole');
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Submission Status</Text>
          <Text style={styles.headerTitle}>Thanks for your upload 🙌</Text>
        </View>

        <Image source={require('../assets/images/profile.jpg')} style={styles.avatar} />
      </View>

      {/* Banner Card */}
      <View style={styles.bannerCard}>
        <ImageBackground
          source={require('../assets/images/banner1.png')}
          style={styles.bannerBg}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="cover"
        >
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>We’re reviewing your documents</Text>
            <Text style={styles.bannerSubtitle}>You’ll get notified once approved</Text>
          </View>
        </ImageBackground>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.badgeWrap}>
          <Ionicons name="cloud-upload-outline" size={16} color="#10B981" />
          <Text style={styles.badgeText}>Submitted</Text>
        </View>
        <Text style={styles.statusText}>
          {`Your documents were uploaded successfully.\nPlease wait while we verify your submission.`}
        </Text>
      </View>

      {/* Go Home */}
      <TouchableOpacity style={styles.homeBtn} onPress={goHome} activeOpacity={0.9}>
        <Ionicons name="home-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.homeBtnText}>Go to Home</Text>
      </TouchableOpacity>

      {/* Drawer */}
      {drawerOpen && <Pressable style={styles.backdrop} onPress={closeDrawer} />}
      <Animated.View style={[styles.drawer, { width: DRAWER_W, transform: [{ translateX: drawerX }] }]}>
        {/* Drawer Header Card */}
        <View style={styles.drawerTopCard}>
          <Image source={require('../assets/images/profile.jpg')} style={styles.drawerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.drawerName}>Owner</Text>
            <Text style={styles.drawerMuted}>Account</Text>
          </View>
          <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats (decorative) */}
        <View style={styles.cardRow}>
          <StatCard icon="shield-checkmark-outline" label="Status" value="Pending" />
          <StatCard icon="document-text-outline" label="Docs" value="2/2" />
        </View>

        {/* Menu Card */}
        <View style={styles.menuCard}>
          <MenuItem icon="home-outline" label="Home" onPress={() => goRoute('/AfterAccepting')} />
          <Divider />
          <MenuItem icon="information-circle-outline" label="About" onPress={() => goRoute('/About')} />
          <Divider />
          <MenuItem icon="call-outline" label="Contact Us" onPress={() => goRoute('/ContactUs')} />
          <Divider />
          <MenuItem icon="card-outline" label="Payment Info" onPress={() => goRoute('/PaymentInfo')} />
        </View>

        {/* Logout Card */}
        <TouchableOpacity style={styles.logoutCard} onPress={logout} activeOpacity={0.9}>
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          </View>
          <Text style={styles.logoutText}>Log out</Text>
          <Ionicons name="chevron-forward" size={18} color="#ef4444" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default AfterSubmitting;

/* ---------- Small components ---------- */
function StatCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={BLUE} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={20} color={BLUE} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </TouchableOpacity>
  );
}
function Divider() { return <View style={styles.divider} />; }

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: BLUE,
  },
  headerBtn: {
    height: 40, width: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  kicker: { color: '#e0f2ff', fontSize: 12, marginBottom: 2 },
  headerTitle: { fontSize: 18, color: '#ffffff', fontWeight: '800' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff' },

  bannerCard: { paddingHorizontal: 16, marginTop: 14 },
  bannerBg: { height: 150, borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  bannerTextBox: { padding: 14 },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  bannerSubtitle: { color: '#f1f5f9', fontSize: 12, marginTop: 4 },
  dots: {
    position: 'absolute', bottom: -8, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.2)', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#000' },

  statusCard: {
    marginTop: 26, marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  badgeWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1, borderColor: '#bbf7d0',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, marginBottom: 10,
  },
  badgeText: { marginLeft: 6, color: '#065f46', fontWeight: '800', fontSize: 12 },
  statusText: { color: '#475569', fontSize: 14, textAlign: 'center' },

  homeBtn: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: BLUE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  homeBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: '#f8fafc',
    paddingTop: 16, paddingHorizontal: 14,
    elevation: 20, shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 12,
  },

  drawerTopCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12, borderRadius: 16,
    borderWidth: 1, borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  drawerAvatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12, backgroundColor: '#f1f5f9' },
  drawerName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  drawerMuted: { fontSize: 12, color: '#64748b', marginTop: 2 },
  closeBtn: {
    height: 32, width: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9',
  },

  cardRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#ffffff',
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center',
  },
  statIcon: {
    height: 34, width: 34, borderRadius: 10,
    backgroundColor: '#e6f5ff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1, borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12,
  },
  menuIconWrap: {
    height: 36, width: 36, borderRadius: 12,
    backgroundColor: '#e6f5ff',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 60 },

  logoutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1, borderColor: '#fee2e2',
    paddingVertical: 12, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  logoutIconWrap: {
    height: 36, width: 36, borderRadius: 12,
    backgroundColor: '#fff1f2',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  logoutText: { flex: 1, fontSize: 15, color: '#ef4444', fontWeight: '800' },
});
