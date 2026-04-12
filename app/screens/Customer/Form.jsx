import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from 'expo-location';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function Form({ route, navigation }) {
  const { CustomerEmail, tailorEmail, orderId } = route.params;

  const [stage, setStage] = useState("idle");

  // Animated values in useState
  const [truckX] = useState(new Animated.Value(-80));
  const [successScale] = useState(new Animated.Value(0.6));
  const [successOpacity] = useState(new Animated.Value(0));

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset animation values when stage resets to idle
  useEffect(() => {
    if (stage === "idle") {
      truckX.setValue(-80);
      successScale.setValue(0.6);
      successOpacity.setValue(0);
    }
  }, [stage]);

  // Trigger animations based on stage changes
  useEffect(() => {
    if (stage === "loading") {
      Animated.timing(truckX, {
        toValue: 260,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setStage("done");
      });
    }

    if (stage === "done") {
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => navigation.goBack(), 900);
      });
    }
  }, [stage]);

  // Autofill user profile from server
  const autofillProfile = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "http://UF-MacBook-Pro.local:3000/get-profile2",
        { params: { email: CustomerEmail } }
      );
      const p = data.user;
      setFullName(p.full_name || "");
      setAddress(p.location || "");
      setPhone(p.phone_number ? p.phone_number.toString() : "");
      setLoading(false);
    } catch {
      setLoading(false);
      Alert.alert("Error", "Failed to fetch profile");
    }
  };

  // Submit order details to server
  const submitPersonalDetails = async () => {
    if (!fullName || !address || !phone) {
      Alert.alert("Validation Error", "Fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("http://UF-MacBook-Pro.local:3000/place-order2", {
        full_name: fullName,
        address,
        phone,
        CustomerEmail,
        tailorEmail,
        orderId,
      });

      console.log("✅ Order updated:", response.data);

      setLoading(false);
      setStage("loading"); // start animation
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to place order");
      console.error("❌ Order placement error:", error);
    }
  };

  const fetchLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to fetch your address.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const { city, country, street, name } = geocode[0];
        setAddress(`${name || ''} ${street || ''}, ${city || ''}, ${country || ''}`.trim());
      } else {
        Alert.alert('Error', 'Unable to fetch address.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while fetching location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1b254f', '#0c1435', '#080927']}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.autofillBtn}
            onPress={autofillProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.autofillBtnText}>Auto-fill</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Delivery Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              color="white"
              placeholder="Full Name"
              placeholderTextColor="gray"
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.addressContainer}>
              <TextInput
                color="white"
                placeholder="Full Address"
                placeholderTextColor="gray"
                style={[styles.input, { flex: 1 }]}
                value={address}
                onChangeText={setAddress}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={fetchLocation}
                disabled={loading}
              >
                <Ionicons name="location" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              color="white"
              placeholder="Phone Number"
              placeholderTextColor="gray"
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={11}
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ""))}
              editable={!loading}
            />
          </View>

          <View style={{ height: 64, marginTop: 30 }}>
            {stage === "idle" && (
              <TouchableOpacity
                style={styles.btn}
                onPress={submitPersonalDetails}
              >
                <Text style={styles.btnText}>Place Order</Text>
              </TouchableOpacity>
            )}

            {stage === "loading" && (
              <View style={styles.loadingBtn}>
                <Animated.View
                  style={[
                    styles.truck,
                    { transform: [{ translateX: truckX }] },
                  ]}
                >
                  <Text style={{ fontSize: 38 }}>🚌</Text>
                </Animated.View>
              </View>
            )}

            {stage === "done" && (
              <Animated.View
                style={[
                  styles.successBtn,
                  {
                    transform: [{ scale: successScale }],
                    opacity: successOpacity,
                  },
                ]}
              >
                <Text style={styles.successText}>✔ Order Placed</Text>
              </Animated.View>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.15)",
  },
  autofillBtn: {
    backgroundColor: "#2a3c72",
    paddingVertical: 12,
    borderRadius: 28,
    alignItems: "center",
  },
  autofillBtnText: {
    color: "#d1d9ff",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 18,
    color: "#d1d9ff",
  },
  input: {
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    marginTop: 12,
    color: "#c3d1ff",
    borderWidth: 1,
    borderColor: "#506ba9",
  },
  btn: {
    height: 56,
    backgroundColor: "#3957a6",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#d1d9ff",
    fontSize: 17,
    fontWeight: "800",
  },
  loadingBtn: {
    height: 56,
    borderRadius: 30,
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    justifyContent: "center",
    overflow: "hidden",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 100,
    padding: 8,
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.12)",
  },
  truck: {
    position: "absolute",
    left: -60,
  },
  successBtn: {
    height: 56,
    borderRadius: 30,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationButton: {
    backgroundColor: '#2a3c72',
    marginTop: 11,
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 7,
  },
  label: {
    color: '#d1d9ff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
});
