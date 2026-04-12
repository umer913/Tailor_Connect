import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

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

  // Removed scaling effect for button presses
  const onPressWithScale = (callback) => {
    if (callback) callback();
  };

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied.');
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });

      if (geocode.length > 0) {
        const { city, country, street, name } = geocode[0];
        setLocation(`${name || ''} ${street || ''}, ${city || ''}, ${country || ''}`.trim());
      } else {
        alert('Unable to fetch location details.');
      }
    } catch (error) {
      alert('An error occurred while fetching location.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080927' }}>
      <StatusBar barStyle="light-content" backgroundColor="#080927" />
      <LinearGradient
        colors={['#1b254f', '#0c1435', '#080927']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
        pointerEvents={showProfile ? 'none' : 'auto'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ---- Header ---- */}
          <View style={styles.headerRow}>
            <View style={styles.greetingBox}>
              <Text style={styles.greetingSmall}>Welcome back</Text>
              <Text style={styles.greetingName}>
                {profile.full_name || "Customer"}
              </Text>
            </View>

            <View style={styles.topRightContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                disabled={showProfile}
                onPress={() => onPressWithScale(() => navigation.navigate('NotificationScreen', { email }))}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubbles-outline" size={38} color="#99aaff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => onPressWithScale(() => setShowProfile(true))}
                disabled={showProfile}
                activeOpacity={0.8}
              >
                <View style={styles.profileInitialCircle}>
                  <Text style={styles.profileInitialText}>
                    {((profile.full_name || "Customer").trim().charAt(0) || "C").toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ---- Location ---- */}
          <TouchableOpacity
            style={styles.locationBox}
            onPress={fetchLocation}
            disabled={showProfile}
            activeOpacity={0.85}
          >
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={20} color="#7b9bff" />
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.locationTitle}>My Location</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {profile.location || "Tap to detect"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(155,179,255,0.4)" />
          </TouchableOpacity>

          {/* ---- Tailor Spotlight ---- */}
          <TouchableOpacity
            style={styles.tailorBox}
            onPress={() => onPressWithScale(() => navigation.navigate("BrowseTailors", { CustomerEmail: email }))}
            disabled={showProfile}
            activeOpacity={0.9}
          >
            <View style={styles.tailorAccent} />
            <View style={styles.tailorContent}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.tailorLabel}>EXPLORE</Text>
                <Text style={styles.tailorText}>Find Your{'\n'}Perfect Tailor</Text>
                <View style={styles.tailorArrowRow}>
                  <Text style={styles.tailorCta}>Browse now</Text>
                  <Ionicons name="arrow-forward" size={14} color="#7b9bff" style={{ marginLeft: 6 }} />
                </View>
              </View>
              <Animated.Image
                source={tailorImages[currentTailorImageIndex]}
                style={[styles.tailorImage, { opacity: fadeTailorImage }]}
                resizeMode="contain"
              />
            </View>
            {/* Dot indicators */}
            <View style={styles.dotsRow}>
              {tailorImages.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentTailorImageIndex && styles.dotActive]} />
              ))}
            </View>
          </TouchableOpacity>

         

          {/* ---- Action Cards ---- */}
          <View style={styles.allButtonsContainer}>
            <View style={styles.horizontalButtons}>
              <LinearGradient
                colors={['#3957a6', '#506ba9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCard}
              >
                <TouchableOpacity
                  onPress={() => onPressWithScale(() => navigation.navigate("CustomerOrders", { CustomerEmail: email }))}
                  activeOpacity={0.85}
                  style={{ alignItems: 'center', width: '100%' }}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons name="receipt-outline" size={24} color="#99aaff" />
                  </View>
                  <Text style={styles.actionCardTitle}>My Orders</Text>
                  <Text style={styles.actionCardSub}>Track & manage</Text>
                </TouchableOpacity>
              </LinearGradient>

              <LinearGradient
                colors={['#506ba9', '#3957a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCard}
              >
                <TouchableOpacity
                  onPress={() => onPressWithScale(() => navigation.navigate("MyAppointments", { CustomerEmail: email }))}
                  activeOpacity={0.85}
                  style={{ alignItems: 'center', width: '100%' }}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons name="calendar-outline" size={24} color="#99aaff" />
                  </View>
                  <Text style={styles.actionCardTitle}>Appointments</Text>
                  <Text style={styles.actionCardSub}>View schedule</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* ---- Logout ---- */}
            <LinearGradient
              colors={['#506ba9', '#3957a6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoutCard}
            >
              <TouchableOpacity
                onPress={() => onPressWithScale(() => navigation.navigate("Login"))}
                activeOpacity={0.85}
                style={{ alignItems: 'center', width: '100%' }}
              >
                <Ionicons name="log-out-outline" size={24} color="#8899cc" />
                <Text style={styles.actionCardTitle}>Logout</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* ========== PROFILE OVERLAY ========== */}
      {profileVisible && (
        <TouchableWithoutFeedback onPress={() => setShowProfile(false)}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>

                {/* Close button */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => { setShowProfile(false); setEditMode(false); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#8899cc" />
                </TouchableOpacity>

                {!editMode ? (
                  <>
                    {/* Avatar */}
                    <View style={styles.avatarWrap}>
                      <LinearGradient colors={['#3957a6', '#2a3c72']} style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                          {(profile.full_name || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </Text>
                      </LinearGradient>
                      <Text style={styles.avatarName}>{profile.full_name || 'Customer'}</Text>
                      <Text style={styles.avatarEmail}>{email}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.itemBox}>
                      <Ionicons name="person-outline" size={16} color="#7b9bff" style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Full Name</Text>
                        <Text style={styles.value}>{profile.full_name}</Text>
                      </View>
                    </View>
                    <View style={styles.itemBox}>
                      <Ionicons name="card-outline" size={16} color="#7b9bff" style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>CNIC</Text>
                        <Text style={styles.value}>{profile.cnic}</Text>
                      </View>
                    </View>
                    <View style={styles.itemBox}>
                      <Ionicons name="call-outline" size={16} color="#7b9bff" style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Phone</Text>
                        <Text style={styles.value}>{profile.phone_number}</Text>
                      </View>
                    </View>
                    <View style={styles.itemBox}>
                      <Ionicons name="location-outline" size={16} color="#7b9bff" style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Location</Text>
                        <Text style={styles.value}>{profile.location}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#2a3c72" }]}
                      onPress={() => onPressWithScale(() => setEditMode(true))}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="create-outline" size={18} color="#e6ebff" style={{ marginRight: 8 }} />
                      <Text style={styles.btnText}>Edit Details</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.title}>Edit Profile</Text>

                    <View style={styles.inputRow}>
                      <Ionicons name="person-outline" size={16} color="#667799" style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Full Name"
                        placeholderTextColor="#667799"
                        selectionColor="#aabbff"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Ionicons name="card-outline" size={16} color="#667799" style={{ marginRight: 10 }} />
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
                    </View>
                    <View style={styles.inputRow}>
                      <Ionicons name="call-outline" size={16} color="#667799" style={{ marginRight: 10 }} />
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
                    </View>
                    <View style={styles.locationRow}>
                      <View style={[styles.inputRow, { flex: 1 }]}>
                        <Ionicons name="location-outline" size={16} color="#667799" style={{ marginRight: 10 }} />
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          value={location}
                          onChangeText={setLocation}
                          placeholder="Location"
                          placeholderTextColor="#667799"
                          selectionColor="#aabbff"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.locationButton}
                        onPress={fetchLocation}
                      >
                        <Ionicons name="location" size={22} color="white" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.inputRow}>
                      <Ionicons name="lock-closed-outline" size={16} color="#667799" style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="New Password"
                        secureTextEntry
                        placeholderTextColor="#667799"
                        selectionColor="#aabbff"
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#1f2a59" }]}
                      onPress={() => onPressWithScale(updateProfile)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#e6ebff" style={{ marginRight: 8 }} />
                      <Text style={styles.btnText}>Save Changes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, styles.cancelBtn]}
                      onPress={() => onPressWithScale(() => setEditMode(false))}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.btnText, { color: '#cc8888' }]}>Cancel</Text>
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

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 10 : 35,
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },

  /* ---- header ---- */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greetingBox: {
    flex: 1,
  },
  greetingSmall: {
    fontSize: 15,
    color: "#8e9ccf",
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 28,
    color: "#d1d9ff",
    fontWeight: "800",
  },
  topRightContainer: {
    flexDirection: "row",
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: 'rgba(42,60,114,0.5)',
    padding: 11,
    borderRadius: 16,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(155,179,255,0.12)',
  },
  profileInitialCircle: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitialText: {
    color: '#d1d9ff',
    fontSize: 30,
    fontWeight: 'bold',
  },

  /* ---- location ---- */
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(38, 52, 90, 0.45)",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.15)',
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(42,60,114,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: {
    color: "#8e9ccf",
    fontSize: 12,
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  locationText: {
    color: "#d1d9ff",
    fontSize: 15,
    fontWeight: "700",
  },

  /* ---- tailor card ---- */
  tailorBox: {
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.15)',
    shadowColor: "#18294a",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    overflow: 'hidden',
  },
  tailorAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#506ba9',
  },
  tailorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tailorLabel: {
    fontSize: 11,
    color: '#7b9bff',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  tailorImage: {
    width: 95,
    height: 115,
    borderRadius: 14,
  },
  tailorText: {
    color: "#d1d9ff",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
  },
  tailorCta: {
    color: '#7b9bff',
    fontSize: 13,
    fontWeight: '600',
  },
  tailorArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(155,179,255,0.2)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#7b9bff',
    width: 20,
    borderRadius: 4,
  },

  /* ---- section label ---- */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(155,179,255,0.1)',
  },
  sectionTitle: {
    color: '#8e9ccf',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginHorizontal: 14,
  },

  /* ---- action cards ---- */
  allButtonsContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 14,
  },
  horizontalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.15)',
    shadowColor: "#18294a",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  logoutCard: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.15)',
    shadowColor: "#18294a",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(42,60,114,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  actionCardTitle: {
    color: "#d1d9ff",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3,
  },
  actionCardSub: {
    color: 'rgb(136, 150, 186)',
    fontSize: 14,
    fontWeight: 'bold',
  },


  /* ---- overlay ---- */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 8, 25, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  /* ---- profile card ---- */
  card: {
    position: "absolute",
    top: '12%',
    alignSelf: "center",
    width: "90%",
    maxWidth: 400,
    padding: 24,
    backgroundColor: "rgba(16, 24, 52, 0.97)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.18)',
    shadowColor: '#0a0f2e',
    shadowOpacity: 0.9,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(42,60,114,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e6ebff',
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#d1d9ff',
    marginBottom: 2,
  },
  avatarEmail: {
    fontSize: 12,
    color: '#7b8dbb',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(102,126,234,0.12)',
    marginVertical: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#aabbff",
    marginBottom: 20,
    textAlign: 'center',
  },
  itemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(38, 52, 90, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.12)",
  },
  label: {
    fontSize: 11,
    color: "#7b8dbb",
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: "#c3d1ff",
  },

  /* ---- inputs ---- */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(80,107,169,0.35)",
    borderRadius: 14,
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: "#c3d1ff",
  },
  btn: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: "#3957a6",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  cancelBtn: {
    backgroundColor: 'rgba(106,46,46,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(204,136,136,0.2)',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: "#e6ebff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: '#3957a6',
    padding: 11,
    borderRadius: 14,
    marginLeft: 10,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.25)',
  },
});

export default CustomerDashboard;
