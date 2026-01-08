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
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [cnic, setCnic] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  const tailorImages = [
    require('../../../assets/images/3Peice.png'),
    require('../../../assets/images/blazer.png'),
    require('../../../assets/images/Fsherwani.png'),
  ];
  const [currentTailorImageIndex, setCurrentTailorImageIndex] = useState(0);

  /* ---------- ANIMATIONS ---------- */
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(40));

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

  /* ---------- FETCH PROFILE ---------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          "http://UF-MacBook-Pro.local:3000/get-profile",
          { params: { email } }
        );

        if (data.user) {
          setProfile(data.user);
          setFullName(data.user.full_name || "");
          setCnic(data.user.cnic || "");
          setPhoneNumber(data.user.phone_number || "");
          setLocation(data.user.location || "");
          setPassword("");
        }
      } catch (err) {
        console.log("Fetch Error:", err);
      }
    };
    fetchProfile();
  }, []);
  /* ---------- Update PROFILE ---------- */
  const updateProfile = async () => {
    if (cnic.length !== 13) return alert("CNIC must be 13 digits.");
    if (phoneNumber.length !== 11) return alert("Phone must be 11 digits.");
    if (password && password.length < 7) return alert("Password must be at least 7 characters.");

    try {
      const { data } = await axios.put(
        "http://UF-MacBook-Pro.local:3000/update-profile",
        {
          email,
          full_name: fullName,
          cnic,
          phone_number: phoneNumber,
          location,
          password
        }
      );

      if (data.error) return alert(data.error);

      setProfile({
        ...profile,
        full_name: fullName,
        cnic,
        phone_number: phoneNumber,
        location
      });

      setEditMode(false);
      setPassword("");
    } catch (err) {
      console.log("Update Error:", err);
    }
  };

  /* ---------- IMAGE ROTATION ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTailorImageIndex(prev => (prev + 1) % tailorImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#64769eff', '#3b5998', '#192f6a']}
        style={styles.container}
        pointerEvents={showProfile ? 'none' : 'auto'}
      >

        <View style={styles.greetingBox}>
          <Text style={styles.greetingSmall}>Welcome back 👋</Text>
          <Text style={styles.greetingName}>
            {profile.full_name || "Customer"}
          </Text>
        </View>

        <View style={styles.topRightContainer}>
          <TouchableOpacity style={styles.iconButton} disabled={showProfile}>
            <Ionicons name="chatbubbles-outline" size={28} color="blue" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowProfile(true)}
            disabled={showProfile}
          >
            <Image
              source={require('../../../assets/images/Men.png')}
              style={{ height: 40, width: 40 }}
               resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.verticalContainer}>
          <TouchableOpacity style={styles.locationBox} disabled={showProfile}>
            <Ionicons name="location-outline" size={26} color="lightblue" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.locationTitle}>My Location</Text>
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tailorBox}
            onPress={() => navigation.navigate("BrowseTailors", { CustomerEmail: email })}
            disabled={showProfile}
          >
            <Image source={tailorImages[currentTailorImageIndex]} style={styles.tailorImage} />
            <Text style={styles.tailorText}>Look for a Tailor</Text>
          </TouchableOpacity>

          <View style={styles.horizontalButtons}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => navigation.navigate("CustomerOrders", { CustomerEmail: email })}
            >
              <Ionicons name="receipt-outline" size={23} color="#ffffffff" />
              <Text style={styles.smallButtonText}>My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => navigation.navigate("MyAppointments", { CustomerEmail: email })}
            >
              <Ionicons name="calendar-outline" size={23} color="#fff" />
              <Text style={styles.smallButtonText}>My Appointments</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.navigate("Login")}
        >
          <Ionicons name="log-out-outline" size={23} color="#fff" />
          <Text style={styles.logoutText}> Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ---------- PROFILE CARD ---------- */}
      {profileVisible && (
        <TouchableWithoutFeedback onPress={() => setShowProfile(false)}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>

              {!editMode ? (
                <>
                  <Text style={styles.title}>My Profile</Text>

                  <View style={styles.itemBox}><Text style={styles.label}>Full Name</Text><Text style={styles.value}>{profile.full_name}</Text></View>
                  <View style={styles.itemBox}><Text style={styles.label}>CNIC</Text><Text style={styles.value}>{profile.cnic}</Text></View>
                  <View style={styles.itemBox}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{profile.phone_number}</Text></View>
                  <View style={styles.itemBox}><Text style={styles.label}>Location</Text><Text style={styles.value}>{profile.location}</Text></View>

                  <TouchableOpacity style={[styles.btn, { backgroundColor: "#4a90e2" }]} onPress={() => setEditMode(true)}>
                    <Text style={styles.btnText}>Edit Details</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Edit Profile</Text>

                  <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full Name" />
                  <TextInput style={styles.input} value={cnic} onChangeText={setCnic} placeholder="CNIC" keyboardType="numeric" maxLength={13} />
                  <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Phone" keyboardType="numeric" maxLength={11} />
                  <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Location" />
                  <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="New Password" secureTextEntry />

                  <TouchableOpacity style={[styles.btn, { backgroundColor: "#4CAF50" }]} onPress={updateProfile}>
                    <Text style={styles.btnText}>Save Changes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.btn, { backgroundColor: "#f05454" }]} onPress={() => setEditMode(false)}>
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}

            </Animated.View>
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
    fontSize: 25,
    color: "#ffffffff",
    fontWeight: "bold",
  },

  greetingName: {
    fontSize: 22,
    color: "#d8eceeff",
    marginTop: 4,
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
    width: 80,
    height: 90,
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
    fontSize: 14,
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
  }
});

export default CustomerDashboard;
