import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from 'expo-location';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const StyledField = ({ label, icon, children }) => (
  <View style={styles.fieldWrap}>
    <View style={styles.fieldLabel}>
      <Ionicons name={icon} size={14} color="#E6B0B0" style={{ marginRight: 6 }} />
      <Text style={styles.label}>{label}</Text>
    </View>
    {children}
  </View>
);

const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

export default function Form({ route, navigation }) {
  const { CustomerEmail, tailorEmail, orderId } = route.params;

  const [stage, setStage] = useState("idle");
  const [truckX] = useState(new Animated.Value(10));
  const [truckY] = useState(new Animated.Value(0));
  const [truckTilt] = useState(new Animated.Value(0));
  const [modalOpacity] = useState(new Animated.Value(0));
  const [modalScale] = useState(new Animated.Value(0.8));
  const [successScale] = useState(new Animated.Value(0.6));
  const [successOpacity] = useState(new Animated.Value(0));
  const [percent, setPercent] = useState(0);
  const [statusText, setStatusText] = useState("Preparing order...");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (stage === "idle") {
      truckX.setValue(10);
      truckY.setValue(0);
      truckTilt.setValue(0);
      modalOpacity.setValue(0);
      modalScale.setValue(0.8);
      successScale.setValue(0.6);
      successOpacity.setValue(0);
      setPercent(0);
      setStatusText("Preparing order...");
    }
  }, [stage]);

  useEffect(() => {
    if (stage === "loading") {
      Animated.parallel([
        Animated.timing(modalOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(modalScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();

      let p = 0;
      const interval = setInterval(() => {
        p += 2;
        if (p > 100) {
          p = 100;
          clearInterval(interval);
        }
        setPercent(p);
      }, 50);

      const t1 = setTimeout(() => setStatusText("Securing order details..."), 800);
      const t2 = setTimeout(() => setStatusText("Dispatched to courier..."), 1600);

      Animated.timing(truckX, {
        toValue: 190,
        duration: 2500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start(() => {
        setStage("done");
      });

      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(truckY, { toValue: -3, duration: 100, useNativeDriver: true }),
          Animated.timing(truckY, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(truckY, { toValue: -1.5, duration: 75, useNativeDriver: true }),
          Animated.timing(truckY, { toValue: 0, duration: 75, useNativeDriver: true }),
        ])
      );
      bounce.start();

      Animated.sequence([
        Animated.timing(truckTilt, { toValue: 5, duration: 250, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(truckTilt, { toValue: -3, duration: 150, useNativeDriver: true }),
            Animated.timing(truckTilt, { toValue: 3, duration: 150, useNativeDriver: true }),
          ]),
          { iterations: 6 }
        ),
        Animated.timing(truckTilt, { toValue: -6, duration: 250, useNativeDriver: true }),
        Animated.timing(truckTilt, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();

      return () => {
        clearInterval(interval);
        clearTimeout(t1);
        clearTimeout(t2);
        bounce.stop();
      };
    }

    if (stage === "done") {
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, bounciness: 12, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(modalOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(modalScale, { toValue: 0.8, duration: 250, useNativeDriver: true }),
          ]).start(() => {
            navigation.goBack();
          });
        }, 1500);
      });
    }
  }, [stage]);

  const autofillProfile = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("https://tailorx-production.up.railway.app/profiles/get-profile2", { params: { email: CustomerEmail } });
      const p = data.user;
      setFullName(p.full_name || "");
      setAddress(p.location || "");
      setPhone(p.phone_number ? p.phone_number.toString() : "");
    } catch { Alert.alert("Error", "Failed to fetch profile"); }
    finally { setLoading(false); }
  };

  const submitPersonalDetails = async () => {
    if (!fullName || !address || !phone) { Alert.alert("Validation Error", "Fill all fields"); return; }
    try {
      setLoading(true);
      await axios.post("https://tailorx-production.up.railway.app/orders/place-order2", { full_name: fullName, address, phone, CustomerEmail, tailorEmail, orderId });
      setLoading(false);
      setStage("loading");
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to place order");
    }
  };

  const fetchLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Denied', 'Location permission is required.'); setLoading(false); return; }
      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      if (geocode.length > 0) {
        const { city, country, street, name } = geocode[0];
        setAddress(`${name || ''} ${street || ''}, ${city || ''}, ${country || ''}`.trim());
      } else { Alert.alert('Error', 'Unable to fetch address.'); }
    } catch { Alert.alert('Error', 'An error occurred while fetching location.'); }
    finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#E6B0B0" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Delivery Details</Text>
          <Text style={styles.headerSub}>Complete your order info</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Autofill */}
        <TouchableOpacity style={styles.autofillBtn} onPress={autofillProfile} disabled={loading} activeOpacity={0.8}>
          <LinearGradient colors={["rgba(157,42,75,0.15)", "rgba(214,64,106,0.1)"]} style={styles.autofillGrad}>
            {loading ? (
              <ActivityIndicator color="#E6B0B0" size="small" />
            ) : (
              <>
                <Ionicons name="person-circle-outline" size={18} color="#E6B0B0" style={{ marginRight: 8 }} />
                <Text style={styles.autofillBtnText}>Auto-fill from my profile</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Form Card */}
        <View style={styles.card}>
          <StyledField label="Full Name" icon="person-outline">
            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor="#4b5563"
              style={[styles.input, focusedField === "name" && styles.inputFocused]}
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              color="#fff"
              editable={!loading}
            />
          </StyledField>

          <StyledField label="Delivery Address" icon="location-outline">
            <View style={styles.addressContainer}>
              <TextInput
                placeholder="Enter your full address"
                placeholderTextColor="#4b5563"
                style={[styles.input, { flex: 1 }, focusedField === "address" && styles.inputFocused]}
                value={address}
                onChangeText={setAddress}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setFocusedField(null)}
                color="#fff"
                editable={!loading}
              />
              <TouchableOpacity style={styles.locationButton} onPress={fetchLocation} disabled={loading}>
                <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.locationGrad}>
                  <Ionicons name="locate" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </StyledField>

          <StyledField label="Phone Number" icon="call-outline">
            <TextInput
              placeholder="03XXXXXXXXX"
              placeholderTextColor="#4b5563"
              style={[styles.input, focusedField === "phone" && styles.inputFocused]}
              keyboardType="phone-pad"
              maxLength={11}
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ""))}
              onFocus={() => setFocusedField("phone")}
              onBlur={() => setFocusedField(null)}
              color="#fff"
              editable={!loading}
            />
          </StyledField>

          {/* Submit button area */}
          <View style={{ height: 64, marginTop: 24 }}>
            <TouchableOpacity onPress={submitPersonalDetails} disabled={stage !== "idle"} activeOpacity={0.85}>
              <LinearGradient colors={stage === "idle" ? ["#9D2A4B", "#D6406A"] : ["#374151", "#4b5563"]} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {stage === "idle" ? (
                  <>
                    <Ionicons name="bag-check-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnText}>Place Order</Text>
                  </>
                ) : (
                  <ActivityIndicator color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color="#818cf8" style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.noteText}>Your delivery details will be shared with the tailor to process your order.</Text>
        </View>
      </ScrollView>

      {/* Advanced Animated Delivery Modal */}
      <Modal transparent visible={stage !== "idle"} animationType="fade">
        <View style={styles.modalBg}>
          <Animated.View style={[styles.modalCard, { opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
            {stage === "loading" ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingTitle}>Processing Order</Text>

                {/* Percentage circle */}
                <View style={styles.progressCircle}>
                  <Text style={styles.progressPercent}>{percent}%</Text>
                  <Text style={styles.progressLabel}>{statusText}</Text>
                </View>

                {/* Road Map/Track */}
                <View style={styles.mapContainer}>
                  {/* Start Store Node */}
                  <View style={[styles.node, percent >= 10 && styles.nodeActive]}>
                    <Ionicons name="shirt" size={18} color={percent >= 10 ? "#fff" : "#6b7280"} />
                  </View>

                  {/* Connecting Road Line */}
                  <View style={styles.roadTrackLine}>
                    <Animated.View
                      style={[
                        styles.roadFill,
                        {
                          transform: [
                            {
                              translateX: truckX.interpolate({
                                inputRange: [10, 190],
                                outputRange: [-180, 0],
                                extrapolate: "clamp",
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>

                  {/* Destination Home Node */}
                  <View style={[styles.node, percent === 100 && styles.nodeActive]}>
                    <Ionicons name="home" size={18} color={percent === 100 ? "#fff" : "#6b7280"} />
                  </View>

                  {/* Moving Truck */}
                  <Animated.View
                    style={[
                      styles.animatedTruckWrapper,
                      {
                        transform: [
                          { translateX: truckX },
                          { translateY: truckY },
                          {
                            rotate: truckTilt.interpolate({
                              inputRange: [-10, 10],
                              outputRange: ["-10deg", "10deg"],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Image
                      source={require("../../../assets/images/Truck.png")}
                      style={styles.realisticTruckImage}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>

                {/* Steps checklist */}
                <View style={styles.stepsWrap}>
                  <View style={styles.stepItem}>
                    <Ionicons
                      name={percent >= 30 ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={percent >= 30 ? "#059669" : "#4b5563"}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.stepText, percent >= 30 && styles.stepTextActive]}>
                      Validating order & payment
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Ionicons
                      name={percent >= 70 ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={percent >= 70 ? "#059669" : "#4b5563"}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.stepText, percent >= 70 && styles.stepTextActive]}>
                      Assigning tailor partner
                    </Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Ionicons
                      name={percent === 100 ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={percent === 100 ? "#059669" : "#4b5563"}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.stepText, percent === 100 && styles.stepTextActive]}>
                      Scheduling courier dispatch
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              // stage === "done"
              <View style={styles.successContainer}>
                <Animated.View style={{ transform: [{ scale: successScale }], opacity: successOpacity }}>
                  <LinearGradient colors={["#059669", "#10b981"]} style={styles.successHalo}>
                    <Ionicons name="checkmark" size={54} color="#fff" />
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.successHeader}>Order Confirmed!</Text>
                <Text style={styles.successSub}>Your order has been placed successfully.</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 16, paddingHorizontal: PAGE_GUTTER,
    borderBottomWidth: 1, borderBottomColor: "rgba(230,176,176,0.08)",
  },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(157,42,75,0.15)", borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "#E6B0B0", fontSize: 13, fontWeight: "600", marginTop: 2 },
  container: { flexGrow: 1, paddingHorizontal: PAGE_GUTTER, paddingBottom: 40, paddingTop: 18, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  autofillBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  autofillGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
  },
  autofillBtnText: { color: "#E6B0B0", fontSize: 15, fontWeight: "700" },
  card: {
    backgroundColor: "rgba(26, 6, 16, 0.45)", borderRadius: 22, padding: 22,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.2)", width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center",
  },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  label: { color: "#E6B0B0", fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  input: {
    backgroundColor: "rgba(26, 6, 16, 0.5)", borderRadius: 14, padding: 14,
    fontSize: 15, color: "#fff", borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
  },
  inputFocused: { borderColor: "#D6406A", shadowColor: "#D6406A", shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  addressContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  locationButton: { borderRadius: 14, overflow: "hidden" },
  locationGrad: { width: 50, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  btn: {
    height: 58, borderRadius: 18, flexDirection: "row",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#9D2A4B", shadowOpacity: 0.5, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15, 15, 19, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "rgba(26, 6, 16, 0.9)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.35)",
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#9D2A4B",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  loadingContainer: {
    width: "100%",
    alignItems: "center",
  },
  loadingTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  progressCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "rgba(157, 42, 75, 0.2)",
    borderTopColor: "#D6406A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    padding: 12,
  },
  progressPercent: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  progressLabel: {
    color: "#E6B0B0",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 14,
  },
  mapContainer: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  node: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e1e24",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#374151",
    zIndex: 2,
  },
  nodeActive: {
    backgroundColor: "#9D2A4B",
    borderColor: "#D6406A",
    shadowColor: "#D6406A",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  roadTrackLine: {
    position: "absolute",
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: "#1e1e24",
    borderRadius: 1.5,
    zIndex: 1,
    overflow: "hidden",
  },
  roadFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#D6406A",
    borderRadius: 1.5,
  },
  animatedTruckWrapper: {
    position: "absolute",
    bottom: 26,
    left: 0,
    width: 48,
    height: 30,
    zIndex: 3,
  },
  realisticTruckImage: {
    width: 48,
    height: 30,
  },
  stepsWrap: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(157, 42, 75, 0.15)",
    paddingTop: 18,
    gap: 12,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  stepTextActive: {
    color: "#E6B0B0",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 14,
  },
  successHalo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#10b981",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successHeader: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  successSub: {
    color: "#E6B0B0",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  noteCard: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "rgba(157,42,75,0.08)", borderRadius: 14,
    padding: 14, marginTop: 20,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.18)",
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  noteText: { color: "#E6B0B0", fontSize: 13, flex: 1, lineHeight: 19 },
});
