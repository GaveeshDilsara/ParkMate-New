import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const UserAgreementScreen = () => {
  const handleAccept = () => {
    Alert.alert('Agreement Accepted', 'Thank you for accepting the user agreement.');
    // You can navigate to the next screen here
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>
        User <Text style={styles.highlight}>Agreement</Text>
      </Text>

      <View style={styles.card}>
        <Text style={styles.paragraph}>Welcome to ParkMate! Before using the app, please review the terms:</Text>

        <View style={styles.list}>
          <Text style={styles.bullet}>• You agree to use parking spaces responsibly.</Text>
          <Text style={styles.bullet}>• You understand space availability may change in real-time.</Text>
          <Text style={styles.bullet}>• You will not misuse the app or provide false listings.</Text>
          <Text style={styles.bullet}>• You accept that ParkMate is not responsible for third-party listings.</Text>
          <Text style={styles.bullet}>• You will comply with all local parking regulations and laws.</Text>
          <Text style={styles.bullet}>• You acknowledge that parking fees and penalties are your responsibility.</Text>
        </View>

        <Text style={styles.footer}>
          For full details, visit our official Terms of Service and Privacy Policy.
        </Text>
      </View>

      <TouchableOpacity style={styles.okButton} onPress={() => router.back()}>
        <Text style={styles.okButtonText}>OK</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UserAgreementScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  highlight: {
    color: '#1e88e5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  paragraph: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  list: {
    marginBottom: 12,
  },
  bullet: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  footer: {
    fontSize: 13,
    color: '#444',
    marginTop: 8,
  },
  okButton: {
    backgroundColor: '#4caf50',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  okButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
