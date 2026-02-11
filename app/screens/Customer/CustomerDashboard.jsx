import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
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
  const fadeTailorImage = useRef(new Animated.Value(1)).current;

  /* ---------- ANIMATIONS ---------- */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleBtnAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showProfile) {
      setProfileVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 15,
          bounciness: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.in(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setProfileVisible(false));
    }
  }, [showProfile]);

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

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeTailorImage, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentTailorImageIndex(prev => (prev + 1) % tailorImages.length);
        Animated.timing(fadeTailorImage, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Button press animation without haptic feedback
  const onPressWithScale = (callback) => {
    Animated.sequence([
      Animated.timing(scaleBtnAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleBtnAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0c1435' }}>
      <LinearGradient
        colors={['#1b254f', '#0c1435', '#080927']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
        pointerEvents={showProfile ? 'none' : 'auto'}
      >
        <View style={styles.greetingBox}>
          <Text style={styles.greetingSmall}>Welcome back </Text>
          <Text style={styles.greetingName}>
            {profile.full_name || "Customer"}
          </Text>
        </View>

        <View style={styles.topRightContainer}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
            disabled={showProfile}
            onPress={() => onPressWithScale(() => alert("Chat coming soon!"))}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={36} color="#99aaff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
            onPress={() => onPressWithScale(() => setShowProfile(true))}
            disabled={showProfile}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../../assets/images/Men.png')}
              style={styles.profileIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.verticalContainer}>
          <TouchableOpacity style={styles.locationBox} disabled={showProfile}>
            <Ionicons name="location-outline" size={28} color="#8fa1cc" />
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.locationTitle}>My Location</Text>
              <Text style={styles.locationText}>{profile.location || "Unknown"}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tailorBox}
            onPress={() => onPressWithScale(() => navigation.navigate("BrowseTailors", { CustomerEmail: email }))}
            disabled={showProfile}
            activeOpacity={0.9}
          >
            <Animated.Image
              source={tailorImages[currentTailorImageIndex]}
              style={[styles.tailorImage, { opacity: fadeTailorImage }]}
              resizeMode="contain"
            />
            <Text style={styles.tailorText}>Look for a Tailor</Text>
          </TouchableOpacity>

          <View style={styles.horizontalButtons}>
            <AnimatedTouchable
              style={[styles.smallButton, { backgroundColor: '#2a3c72', transform: [{ scale: scaleBtnAnim }] }]}
              onPress={() => onPressWithScale(() => navigation.navigate("CustomerOrders", { CustomerEmail: email }))}
              activeOpacity={0.85}
            >
              <Ionicons name="receipt-outline" size={24} color="#ccd9ff" />
              <Text style={styles.smallButtonText}>My Orders</Text>
            </AnimatedTouchable>

            <AnimatedTouchable
              style={[styles.smallButton, { backgroundColor: '#2a3c72', transform: [{ scale: scaleBtnAnim }] }]}
              onPress={() => onPressWithScale(() => navigation.navigate("MyAppointments", { CustomerEmail: email }))}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={24} color="#ccd9ff" />
              <Text style={styles.smallButtonText}>My Appointments</Text>
            </AnimatedTouchable>
          </View>
        </View>

        <AnimatedTouchable
          style={[styles.logoutBtn, { backgroundColor: '#111a3a', transform: [{ scale: scaleBtnAnim }] }]}
          onPress={() => onPressWithScale(() => navigation.navigate("Login"))}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={24} color="#8899cc" />
          <Text style={styles.logoutText}> Logout</Text>
        </AnimatedTouchable>
      </LinearGradient>

      {profileVisible && (
        <TouchableWithoutFeedback onPress={() => setShowProfile(false)}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>

              {!editMode ? (
                <>
                  <Text style={styles.title}>My Profile</Text>

                  <View style={styles.itemBox}>
                    <Text style={styles.label}>Full Name</Text>
                    <Text style={styles.value}>{profile.full_name}</Text>
                  </View>
                  <View style={styles.itemBox}>
                    <Text style={styles.label}>CNIC</Text>
                    <Text style={styles.value}>{profile.cnic}</Text>
                  </View>
                  <View style={styles.itemBox}>
                    <Text style={styles.label}>Phone</Text>
                    <Text style={styles.value}>{profile.phone_number}</Text>
                  </View>
                  <View style={styles.itemBox}>
                    <Text style={styles.label}>Location</Text>
                    <Text style={styles.value}>{profile.location}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#2a3c72" }]}
                    onPress={() => onPressWithScale(() => setEditMode(true))}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnText}>Edit Details</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Edit Profile</Text>

                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Full Name"
                    placeholderTextColor="#667799"
                    selectionColor="#aabbff"
                  />
                  <TextInput
                    style={styles.input}
                    value={cnic}
                    onChangeText={setCnic}
                    placeholder="CNIC"
                    keyboardType="numeric"
                    maxLength={13}
                    placeholderTextColor="#667799"
                    selectionColor="#aabbff"
                  />
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Phone"
                    keyboardType="numeric"
                    maxLength={11}
                    placeholderTextColor="#667799"
                    selectionColor="#aabbff"
                  />
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Location"
                    placeholderTextColor="#667799"
                    selectionColor="#aabbff"
                  />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="New Password"
                    secureTextEntry
                    placeholderTextColor="#667799"
                    selectionColor="#aabbff"
                  />

                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#1f2a59" }]}
                    onPress={() => onPressWithScale(updateProfile)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnText}>Save Changes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#6a2e2e" }]}
                    onPress={() => onPressWithScale(() => setEditMode(false))}
                    activeOpacity={0.85}
                  >
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

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  greetingBox: {
    width: "100%",
    marginBottom: 20,
  },
  greetingSmall: {
    fontSize: 28,
    color: "#8e9ccf",
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  greetingName: {
    fontSize: 26,
    color: "#d1d9ff",
    marginTop: 6,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  topRightContainer: {
    position: "absolute",
    top: 45,
    right: 20,
    flexDirection: "row",
    padding: 6,
    zIndex: 10,
  },
  iconButton: {
    padding: 10,
    borderRadius: 30,
    marginLeft: 14,
    shadowColor: "#18294a",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  profileIcon: {
    height: 42,
    width: 42,
  },
  verticalContainer: {
    width: "100%",
    marginTop: 40,
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(38, 52, 90, 0.4)",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 22,
    marginBottom: 30,
    shadowColor: "#1a2a5a",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  locationTitle: {
    color: "#aab6ff",
    fontSize: 14,
    fontWeight: "600",
  },
  locationText: {
    color: "#d1d9ff",
    fontSize: 14,
    fontWeight: "700",
  },
  tailorBox: {
    backgroundColor: "rgba(38, 52, 90, 0.45)",
    height: 160,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#18294a",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 7,
    marginBottom: 30,
  },
  tailorImage: {
    width: 90,
    height: 110,
    marginBottom: 12,
    borderRadius: 12,
  },
  tailorText: {
    color: "#d1d9ff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
  },
  horizontalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
    borderRadius: 18,
    marginRight: 14,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
  },
  smallButtonText: {
    color: "#ccd9ff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
    letterSpacing: 0.7,
  },
  card: {
    position: "absolute",
    top: '22%',
    alignSelf: "center",
    width: "88%",
    padding: 24,
    backgroundColor: "rgba(23, 34, 67, 0.95)",
    borderRadius: 24,
    shadowColor: '#18294a',
    shadowOpacity: 0.85,
    shadowRadius: 24,
    elevation: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#b0c2ff",
    marginBottom: 24,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  itemBox: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(38, 52, 90, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.5)",
    shadowColor: "#3b4f90",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  label: {
    fontSize: 14,
    color: "#889acc",
    fontWeight: "600",
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#c3d1ff",
  },
  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#506ba9",
    borderRadius: 14,
    backgroundColor: "rgba(20, 28, 54, 0.7)",
    marginBottom: 14,
    fontSize: 16,
    color: "#c3d1ff",
    shadowColor: "#506ba9",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  btn: {
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 14,
    shadowColor: "#3957a6",
    shadowOpacity: 0.75,
    shadowRadius: 14,
    elevation: 12,
  },
  btnText: {
    color: "#e6ebff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  logoutBtn: {
    marginTop: 160,
    bottom: 40,
    backgroundColor: "#101d43",
    paddingVertical: 16,
    paddingHorizontal: 44,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    shadowColor: "#1e2d67",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 16,
  },
  logoutText: {
    color: "#9bb3ff",
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 10,
    letterSpacing: 0.8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 10, 35, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

export default CustomerDashboard;
