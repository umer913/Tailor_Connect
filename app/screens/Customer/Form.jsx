import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
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
  const { CustomerEmail,tailorEmail } = route.params;
console.log(tailorEmail)
console.log(CustomerEmail)
  const [stage, setStage] = useState("idle");
  const truckX = useRef(new Animated.Value(-80)).current;
  const successScale = useRef(new Animated.Value(0.6)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

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

  const submitPersonalDetails = async () => {
    if (!fullName || !address || !phone) {
      Alert.alert("Validation Error", "Fill all fields");
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://UF-MacBook-Pro.local:3000/place-order2", {
        CustomerEmail,
        tailorEmail,
        full_name: fullName,
        address,
        phone,
      });
      setLoading(false);

      setStage("loading");

      Animated.timing(truckX, {
        toValue: 260,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setStage("done");

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
      });
    } catch {
      setLoading(false);
      Alert.alert("Error", "Order failed");
    }
  };

  return (
    <LinearGradient
      colors={['#64769eff', '#3b5998', '#192f6a']}
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

          <TextInput
          color='white'
            placeholder="Full Name"
            placeholderTextColor={'gray'}
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            editable={!loading}
          />

          <TextInput
          color='white'
            placeholder="Full Address"
            placeholderTextColor={'gray'}
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            editable={!loading}
          />

          <TextInput
          color='white'
            placeholder="Phone Number"
            placeholderTextColor={'gray'}
            style={styles.input}
            keyboardType="phone-pad"
            maxLength={11}
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ""))}
            editable={!loading}
          />

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
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  autofillBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 28,
    alignItems: "center",
  },
  autofillBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 18,
    color: "#111",
  },
  input: {
    backgroundColor: "#444",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    marginTop: 12,
  },
  btn: {
    height: 56,
    backgroundColor: "#2563eb",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  loadingBtn: {
    height: 56,
    borderRadius: 30,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    overflow: "hidden",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 100,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  truck: {
    position: "absolute",
    left: -60,
  },
  successBtn: {
    height: 56,
    borderRadius: 30,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
});
