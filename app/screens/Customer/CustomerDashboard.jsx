import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const CustomerDashboard = ({ route, navigation }) => {
  const { email } = route.params;

  const [profile, setProfile] = useState({});
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);

  // Controls profile card visibility state
  const [showProfile, setShowProfile] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false); // For animation mount control

  /* ---------------- ANIMATIONS ---------------- */
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(40));

  // Animate card fade and slide on showProfile toggle
  useEffect(() => {
    if (showProfile) {
      setProfileVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 40, duration: 300, useNativeDriver: true }),
      ]).start(() => setProfileVisible(false));
    }
  }, [showProfile]);

  /* ---------------- FETCH USER ---------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          "http://UF-MacBook-Pro.local:3000/get-profile",
          { params: { email } }
        );

        if (data.user) {
          setProfile(data.user);
          setForm({ ...data.user, password: "" });
        }
      } catch (err) {
        console.log("Fetch Error:", err);
      }
    };
    fetchProfile();
  }, []);

  /* ---------------- SAVE PROFILE ---------------- */
  const saveProfile = async () => {
    const { cnic, phone_number, password } = form;

    if (cnic?.length !== 13) return alert("CNIC must be 13 digits.");
    if (phone_number?.length !== 11) return alert("Phone must be 11 digits.");
    if (password && password.length < 7) return alert("Password must be at least 7 characters.");

    try {
      const { data } = await axios.put(
        "http://UF-MacBook-Pro.local:3000/update-profile",
        { email, ...form }
      );

      if (data.error) return alert(data.error);

      setProfile(form);
      setEditMode(false);
    } catch (err) {
      console.log("Update Error:", err);
    }
  };

  const change = (key, val) => setForm({ ...form, [key]: val });

  return (
    <View style={{ flex: 1 }}>
       <LinearGradient colors={['#64769eff', '#3b5998', '#192f6a']} style={styles.container} pointerEvents={showProfile ? 'none' : 'auto'}>

        <View style={styles.greetingBox}>
          <Text style={styles.greetingSmall}>Welcome back 👋</Text>
          <Text style={styles.greetingName}>
            {profile.full_name || "Customer"}
          </Text>
        </View>

        {/* ----------- TOP RIGHT BUTTONS ----------- */}
        <View style={styles.topRightContainer}>

          {/* Notification Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => alert("Notifications")}
            disabled={showProfile}
          >
            <Ionicons name="notifications-outline" size={24} color="rgba(0, 0, 0, 1)" />
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowProfile(true)}
            disabled={showProfile}
          >
            <Image
              source={require('../../../assets/images/Men.png')}
              style={{ height: 35, width: 35 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

        </View>

        <View style={styles.verticalContainer}>
          <TouchableOpacity style={styles.locationBox} onPress={() => alert("Location pressed")} disabled={showProfile}>
            <Ionicons name="location-outline" size={26} color="rgba(234, 238, 2, 1)" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.locationTitle}>My Location</Text>
              <Text style={styles.locationText}>
                {profile.location || "Fetching location..."}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tailorBox}   onPress={() => navigation.navigate("BrowseTailors", { CustomerEmail: email })}
  disabled={showProfile}>
            <Image
              source={require('../../../assets/images/3Peice.png')}
              style={styles.tailorImage}
              resizeMode="contain"
            />
            <Text style={styles.tailorText}>Look for a Tailor</Text>
          </TouchableOpacity>

          <View style={styles.horizontalButtons} pointerEvents={showProfile ? 'none' : 'auto'}>

            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => alert("My Orders")}
              disabled={showProfile}
            >
              <Ionicons name="receipt-outline" size={20} color="#fff" />
              <Text style={styles.smallButtonText}>My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: "#42c3ffff" }]}
              onPress={() => alert("My Appointments")}
              disabled={showProfile}
            >
              <Ionicons name="calendar-outline" size={20} color="#fff" />
              <Text style={styles.smallButtonText}>My Appointments</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.navigate("Login")}
          disabled={showProfile}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}> Logout</Text>
        </TouchableOpacity>

      </LinearGradient>

      {/* Profile overlay + card */}
      {profileVisible && (
        <TouchableWithoutFeedback onPress={() => setShowProfile(false)}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.card,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }
                ]}
              >

                {!editMode ? (
                  <>
                    <Text style={styles.title}>My Profile</Text>

                    {/* Profile Items */}
                    <View style={styles.itemBox}>
                      <Text style={styles.label}>Full Name</Text>
                      <Text style={styles.value}>{profile.full_name}</Text>
                    </View>
                    <View style={styles.itemBox}>
                      <Text style={styles.label}>CNIC</Text>
                      <Text style={styles.value}>{profile.cnic}</Text>
                    </View>
                    <View style={styles.itemBox}>
                      <Text style={styles.label}>Phone Number</Text>
                      <Text style={styles.value}>{profile.phone_number}</Text>
                    </View>
                    <View style={styles.itemBox}>
                      <Text style={styles.label}>Location</Text>
                      <Text style={styles.value}>{profile.location}</Text>
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity style={[styles.btn, { backgroundColor: "#4a90e2" }]} onPress={() => setEditMode(true)}>
                      <Text style={styles.btnText}>Edit Details</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.title}>Edit Profile</Text>

                    {/* Inputs */}
                    <TextInput
                      placeholder="Full Name"
                      value={form.full_name}
                      onChangeText={t => change("full_name", t)}
                      style={styles.input}
                    />
                    <TextInput
                      placeholder="CNIC"
                      keyboardType="numeric"
                      maxLength={13}
                      value={form.cnic}
                      onChangeText={t => change("cnic", t)}
                      style={styles.input}
                    />
                    <TextInput
                      placeholder="Phone Number"
                      keyboardType="numeric"
                      maxLength={11}
                      value={form.phone_number}
                      onChangeText={t => change("phone_number", t)}
                      style={styles.input}
                    />
                    <TextInput
                      placeholder="Street, apartment, suite"
                      value={form.location}
                      onChangeText={t => change("location", t)}
                      style={styles.input}
                    />
                    <TextInput
                      placeholder="New Password (optional)"
                      secureTextEntry
                      value={form.password}
                      onChangeText={t => change("password", t)}
                      style={styles.input}
                    />

                    {/* Save & Cancel */}
                    <TouchableOpacity style={[styles.btn, { backgroundColor: "#4CAF50" }]} onPress={saveProfile}>
                      <Text style={styles.btnText}>Save Changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: "#f05454" }]} onPress={() => setEditMode(false)}>
                      <Text style={styles.btnText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  greetingBox: {
    width: "90%",
    marginTop: 90,
    marginBottom: 20,
    marginLeft:46
  },

  greetingSmall: {
    fontSize: 15,
    color: "#ffffffff",
    fontWeight: "bold",
  },

  greetingName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f8f4f4ff",
    marginTop: 4,
  },

  greetingSub: {
    fontSize: 14,
   color: "#ffffffff",
    marginTop: 6,
  },

  topRightContainer: {
    position: "absolute",
    marginLeft: 280,
    flexDirection: "row",
    padding: 20,
  },

  iconButton: {
    padding: 8,
    backgroundColor: "rgba(244, 244, 244, 1)",
    borderRadius: 30,
    marginLeft: 12,
  },

  verticalContainer: {
    width: "80%",
    alignSelf: "center",
    marginTop: 35,
  },

  locationBox: {
    flexDirection: "row",
    alignItems: "center",
  backgroundColor: "#201f52ff",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  locationTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  locationText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  tailorBox: {
    backgroundColor: "#201f52ff",
    height: 150,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },

  tailorImage: {
    width: 60,
    height: 80,
    marginBottom: 10,
  },

  tailorText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  horizontalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  smallButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#42c3ffff",
    paddingVertical: 24,
    borderRadius: 16,
    marginRight: 10,
    shadowColor: "#1b3344ff",
    shadowOpacity: 2,
    shadowRadius: 5,
  },

  smallButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },

  card: {
    position: "absolute",
    top: '20%',
    alignSelf: "center",
    width: "88%",
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    shadowColor: '#6C63FF',
    shadowOpacity: 3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 999,
  },

  title: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 20,
  },

  itemBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },

  label: { fontSize: 13, color: "#777" },
  value: { fontSize: 17, fontWeight: "700", color: "#333" },

  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
    fontSize: 16,
  },

  btn: {
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  logoutBtn: {
    marginTop: 160,
    bottom: 40,
    backgroundColor: "#d85b5b",
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
  },

  logoutText: { color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 6 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 998,
  }
});

export default CustomerDashboard;