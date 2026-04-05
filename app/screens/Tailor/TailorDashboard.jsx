import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
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

const TailorDashboard = ({ route, navigation }) => {
  const { email } = route.params;
  console.log("Tailor Dashboard Email:", email);

  const [profile, setProfile] = useState({});
  const [editMode, setEditMode] = useState(false);

  /* --------- PROFILE STATES (REPLACED form) --------- */
  const [fullName, setFullName] = useState("");
  const [cnic, setCnic] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");

  /* --------- PROFILE CARD STATES --------- */
  const [showProfile, setShowProfile] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  /* ---------------- ANIMATIONS ---------------- */
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

  /* ---------------- FETCH PROFILE ---------------- */
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

  /* ---------------- SAVE PROFILE ---------------- */
  const saveProfile = async () => {
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
        ...profile,//Spread operator overwrites data and copy previous data
        full_name: fullName,
        cnic,
        phone_number: phoneNumber,
        location
      });

      setEditMode(false);
      setShowProfile(false);
      setPassword("");
    } catch (err) {
      console.log("Update Error:", err);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#2B0F14', '#3A1419', '#4A1C22']}
        style={styles.container}
        pointerEvents={showProfile ? 'none' : 'auto'}//make screen unclickable when profile is open
      >

        <View style={styles.greetingBox}>
          <Text style={styles.greetingSmall}>Welcome back</Text>
          <Text style={styles.greetingName}>
            {profile.full_name || "Tailor"}
          </Text>
        </View>

        {/* ----------- TOP RIGHT BUTTONS ----------- */}
        <View style={styles.topRightContainer}>
         

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowProfile(true)}
            disabled={showProfile}
          >
            <Image
              source={require('../../../assets/images/imTailor.png')}
              style={{ height: 40, width: 46, borderRadius: 25   }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.verticalContainer}>
          <TouchableOpacity style={styles.locationBox} disabled={showProfile}>
            <Ionicons name="location-outline" size={26} color="#4A1C22" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.locationTitle}>My Location</Text>
              <Text style={[styles.locationText, { flexWrap: 'wrap' }]}>{profile.location}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.TruckBox} disabled={showProfile}  onPress={() => navigation.navigate("MyOrders", { email })}>
            <Image
              source={require('../../../assets/images/Truck.png')}
              style={styles.TruckImage}
              resizeMode="contain"
            />
            <Text style={styles.TruckText}>My Orders</Text>
          </TouchableOpacity>

          <View style={styles.horizontalButtons}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => navigation.navigate("Appointment", { email })}
            >
              <Ionicons name="calendar-outline" size={20} color="#4A1C22" />
              <Text style={styles.smallButtonText}>Appointments</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.smallButton}>
              <Ionicons name="cash-outline" size={20} color="#4A1C22" />
              <Text style={styles.smallButtonText}>Earnings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.navigate("Login")}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}> Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ----------- PROFILE CARD ----------- */}
      {profileVisible && (
        <TouchableWithoutFeedback onPress={() => setShowProfile(false)}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Animated.View
              style={[
                styles.card,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              {!editMode ? (
                <>
                  <Text style={styles.title}>My Profile</Text>

                  <View style={styles.itemBox}><Text style={styles.label}>Full Name</Text><Text style={styles.value}>{profile.full_name}</Text></View>
                  <View style={styles.itemBox}><Text style={styles.label}>CNIC</Text><Text style={styles.value}>{profile.cnic}</Text></View>
                  <View style={styles.itemBox}><Text style={styles.label}>Phone Number</Text><Text style={styles.value}>{profile.phone_number}</Text></View>
                  <View style={styles.itemBox}><Text style={styles.label}>Location</Text><Text style={styles.value}>{profile.location}</Text></View>

                  <TouchableOpacity style={[styles.btn, { backgroundColor: "#4a90e2" }]} onPress={() => setEditMode(true)}>
                    <Text style={styles.btnText}>Edit Details</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Edit Profile</Text>

                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your full name" placeholderTextColor="#ccc" />
                  
                  <Text style={styles.fieldLabel}>CNIC (13 digits)</Text>
                  <TextInput style={styles.input} value={cnic} onChangeText={setCnic} keyboardType="numeric" maxLength={13} placeholder="12345678901234" placeholderTextColor="#ccc" />
                  
                  <Text style={styles.fieldLabel}>Phone Number (11 digits)</Text>
                  <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="numeric" maxLength={11} placeholder="03001234567" placeholderTextColor="#ccc" />
                  
                  <Text style={styles.fieldLabel}>Location</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="Enter your location"
                      placeholderTextColor="#ccc"
                    />
                    <TouchableOpacity
                      style={{ marginLeft: 10, padding: 10, backgroundColor: '#4CAF50', borderRadius: 8 }}
                      onPress={async () => {
                        try {
                          const { status } = await Location.requestForegroundPermissionsAsync();
                          if (status !== 'granted') {
                            alert('Permission to access location was denied');
                            return;
                          }

                          const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                          const geocode = await Location.reverseGeocodeAsync({
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                          });

                          const address = geocode[0];
                          setLocation(`${address.city}, ${address.street}, ${address.country}`);
                        } catch (error) {
                          console.error('Error fetching location:', error);
                          alert('Unable to fetch location');
                        }
                      }}
                    >
                      <Ionicons name="location-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.fieldLabel}>New Password (optional)</Text>
                  <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Leave blank to keep current password" placeholderTextColor="#ccc" />

                  <TouchableOpacity style={[styles.btn, { backgroundColor: "#4CAF50" }]} onPress={saveProfile}>
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
    marginLeft:40
  },

  greetingSmall: {
    fontSize: 25,
    color:"#F2E6E6",
    fontWeight: "bold",
  },

  greetingName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E6B0B0",
    marginTop: 4,
  },

  greetingSub: {
    fontSize: 14,
    color: "#ffffffff",
    marginTop: 6,
  },

  topRightContainer: {
    position: "absolute",
    right: 20,
    top: 50,
    flexDirection: "row",
    padding: 10,
  },

  iconButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 30,
    marginLeft: 10,
  },

  verticalContainer: {
    width: "80%",
    alignSelf: "center",
    marginTop: 35,
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
  backgroundColor: "#E6B0B0",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  locationTitle: {
    color: "#000000ff",
    fontSize: 14,
    fontWeight: "600",
  },

  locationText: {
    color: "#000000ff",
    fontSize: 16,
    fontWeight: "bold",
  },
   TruckBox: {
    backgroundColor: "#ffffffff",
    height: 150,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },

  TruckImage: {
    width: 500,
    height: 80,
    marginBottom: 10,
  },

  TruckText: {
    color: "#4A1C22",
    fontSize: 20,
    fontWeight: "700",
  },

  horizontalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  smallButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6B0B0",
    paddingVertical: 14,
    borderRadius: 16,
    marginRight: 10,
    shadowColor: "#1b3344ff",
    shadowOpacity: 2,
    shadowRadius: 5,
  },

  smallButtonText: {
    color: "#000000ff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 6,
  },

  card: {
    position: "absolute",
    top: '10%',
    alignSelf: "center",
    width: "88%",
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    shadowColor: '#E6B0B0',
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
    marginBottom: 15,
    fontSize: 16,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginTop: 10,
    marginBottom: 8,
    letterSpacing: 0.3,
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
    alignSelf: "center",
  },

  logoutText: { color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 6 },

  overlay: {
    ...StyleSheet.absoluteFillObject,//A Transparent layer on the screen 
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default TailorDashboard;
