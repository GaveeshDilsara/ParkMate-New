import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  BackHandler,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const AfterSubmitting = () => {
  const navigation = useNavigation();
  const allowLeaveRef = useRef(false); // only allow programmatic forward nav

  // Disable iOS swipe-back (and header back if any) for THIS screen
  useEffect(() => {
    navigation.setOptions?.({ gestureEnabled: false, headerBackVisible: false });
    return () => {
      navigation.setOptions?.({ gestureEnabled: true, headerBackVisible: true });
    };
  }, [navigation]);

  // Block any back/leave actions while focused (Android back, header back, swipe)
  useFocusEffect(
    React.useCallback(() => {
      // 1) Intercept navigator "back"/"pop" actions
      const beforeRemove = navigation.addListener('beforeRemove', (e: any) => {
        if (allowLeaveRef.current) return; // allow when we navigate forward
        // Block leaving this screen
        e.preventDefault();
      });

      // 2) Intercept Android hardware back
      const onBackPress = () => true; // block
      const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        beforeRemove();
        backSub.remove();
      };
    }, [navigation])
  );

  const goHome = () => {
    allowLeaveRef.current = true;       // allow this navigation
    router.replace('/AfterAccepting');  // replace so this screen is removed from stack
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <View>
          <Text style={styles.welcome}>Welcome Back</Text>
        </View>
        <TouchableOpacity>
          <Image
            source={require('../assets/images/profile.jpg')}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={styles.bannerCard}>
        <Image
          source={require('../assets/images/banner1.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
        <View style={styles.dotContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* Status Message */}
      <View style={styles.statusCard}>
        <Text style={styles.statusText}>
          {`Your Documents\nsubmitted successfully.\nWait for the approval`}
        </Text>
      </View>

      {/* Go Home */}
      <TouchableOpacity style={styles.homeBtn} onPress={goHome} activeOpacity={0.9}>
        <Text style={styles.homeBtnText}>Go to Home</Text>
      </TouchableOpacity>

      {/* Floating Action Button (optional) */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default AfterSubmitting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  welcome: {
    fontSize: 16,
    color: '#444',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  bannerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: 120,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#ccc',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#000',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
    fontWeight: '500',
  },
  homeBtn: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  homeBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
