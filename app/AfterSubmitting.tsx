import { Ionicons } from '@expo/vector-icons';
import { Button } from '@react-navigation/elements';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
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

  // Disable swipe back gesture (iOS)
  useEffect(() => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.setOptions({ gestureEnabled: false });
    }

    return () => {
      parent?.setOptions({ gestureEnabled: true });
    };
  }, [navigation]);

  // Disable Android back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true; // Block back action
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

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


      <View>
        <Button
          onPress={() => router.push('/AfterAccepting')}
          color="#2196F3"
        >
          Go to Home
        </Button>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default AfterSubmitting;

// Styles (no changes needed)
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
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
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