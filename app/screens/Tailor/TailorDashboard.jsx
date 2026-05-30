import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const [fullName, setFullName] = useState("");
  const [cnic, setCnic] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");

  const [showProfile, setShowProfile] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          "https://tailorx-production.up.railway.app/profiles/get-profile",
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

  const saveProfile = async () => {
    if (cnic.length !== 13) return alert("CNIC must be 13 digits.");
    if (phoneNumber.length !== 11) return alert("Phone must be 11 digits.");
    if (password && password.length < 7) return alert("Password must be at least 7 characters.");

    try {
      const { data } = await axios.put(
        "https://tailorx-production.up.railway.app/profiles/update-profile",
        { email, full_name: fullName, cnic, phone_number: phoneNumber, location, password }
      );
      if (data.error) return alert(data.error);
      setProfile({ ...profile, full_name: fullName, cnic, phone_number: phoneNumber, location });
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
        colors={['#050811', '#0b1220', '#141c30']}
        style={styles.container}
        pointerEvents={showProfile ? 'none' : 'auto'}
      >
        {/* Top decorative accent */}
        <View style={styles.topAccent} />

        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.greetingBox}>
            <Text style={styles.greetingSmall}>Welcome back 👋</Text>
            <Text style={styles.greetingName}>{profile.full_name || "Tailor"}</Text>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setShowProfile(true)}
            disabled={showProfile}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.avatarGradient}>
              <Image
                source={require('../../../assets/images/imTailor.png')}
                style={{ height: 36, width: 40, borderRadius: 20 }}
                resizeMode="contain"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Location Card */}
        <TouchableOpacity style={styles.locationBox} disabled={showProfile} activeOpacity={0.85}>
          <LinearGradient colors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']} style={styles.locationGradient}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.locationTitle}>My Location</Text>
              <Text style={styles.locationText} numberOfLines={1}>{profile.location || "Not set"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(148, 163, 184, 0.5)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* My Orders Banner */}
        <TouchableOpacity
          style={styles.ordersBanner}
          disabled={showProfile}
          onPress={() => navigation.navigate("MyOrders", { email })}
          activeOpacity={0.88}
        >
          <LinearGradient colors={['#1E3A8A', '#1E40AF', '#172554']} style={styles.ordersBannerGradient}>
            <View style={styles.ordersLeft}>
              <Text style={styles.ordersBannerLabel}>Your workspace</Text>
              <Text style={styles.ordersBannerTitle}>My Orders</Text>
              <View style={styles.ordersChip}>
                <Text style={styles.ordersChipText}>View all →</Text>
              </View>
            </View>
            <Image
              source={require('../../../assets/images/Truck.png')}
              style={styles.TruckImage}
              resizeMode="contain"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.horizontalButtons}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Appointment", { email })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']} style={styles.quickCardGradient}>
              <View style={styles.quickIconWrap}>
                <Ionicons name="calendar" size={26} color="#F59E0B" />
              </View>
              <Text style={styles.quickCardText}>Appointments</Text>
              <Text style={styles.quickCardSub}>Manage bookings</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} activeOpacity={0.85}>
            <LinearGradient colors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']} style={styles.quickCardGradient}>
              <View style={styles.quickIconWrap}>
                <Ionicons name="cash" size={26} color="#F59E0B" />
              </View>
              <Text style={styles.quickCardText}>Earnings</Text>
              <Text style={styles.quickCardSub}>Track income</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            try {
              await AsyncStorage.removeItem('userToken');
            } catch (e) {
              console.error('Logout error:', e);
            }
            navigation.navigate("Login");
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#ffffffff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Profile Card Overlay */}
      {profileVisible && (
        <TouchableWithoutFeedback onPress={() => setShowProfile(false)}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Animated.View
              style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              {!editMode ? (
                <>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.title}>My Profile</Text>
                  </View>

                  {[
                    { label: "Full Name", value: profile.full_name, icon: "person-outline" },
                    { label: "CNIC", value: profile.cnic, icon: "card-outline" },
                    { label: "Phone Number", value: profile.phone_number, icon: "call-outline" },
                    { label: "Location", value: profile.location, icon: "location-outline" },
                  ].map((item) => (
                    <View key={item.label} style={styles.itemBox}>
                      <Ionicons name={item.icon} size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>{item.label}</Text>
                        <Text style={styles.value}>{item.value || "—"}</Text>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity style={[styles.btn, styles.editBtnStyle]} onPress={() => setEditMode(true)}>
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <Text style={styles.btnText}>Edit Details</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.title}>Edit Profile</Text>
                  </View>

                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your full name" placeholderTextColor="#94a3b8" />

                  <Text style={styles.fieldLabel}>CNIC (13 digits)</Text>
                  <TextInput style={styles.input} value={cnic} onChangeText={setCnic} keyboardType="numeric" maxLength={13} placeholder="1234567890123" placeholderTextColor="#94a3b8" />

                  <Text style={styles.fieldLabel}>Phone Number (11 digits)</Text>
                  <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="numeric" maxLength={11} placeholder="03001234567" placeholderTextColor="#94a3b8" />

                  <Text style={styles.fieldLabel}>Location</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="Enter your location"
                      placeholderTextColor="#94a3b8"
                    />
                    <TouchableOpacity
                      style={styles.locBtn}
                      onPress={async () => {
                        try {
                          const { status } = await Location.requestForegroundPermissionsAsync();
                          if (status !== 'granted') { alert('Permission denied'); return; }
                          const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                          const geocode = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
                          const address = geocode[0];
                          setLocation(`${address.city}, ${address.street}, ${address.country}`);
                        } catch { alert('Unable to fetch location'); }
                      }}
                    >
                      <Ionicons name="navigate" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>New Password (optional)</Text>
                  <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Leave blank to keep current" placeholderTextColor="#94a3b8" />

                  <TouchableOpacity style={[styles.btn, styles.saveBtnStyle]} onPress={saveProfile}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.btnText}>Save Changes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.btn, styles.cancelBtnStyle]} onPress={() => setEditMode(false)}>
                    <Ionicons name="close-circle-outline" size={18} color="#fff" />
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
  container: { flex: 1, paddingHorizontal: 20 },

  topAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: '#F59E0B',
    opacity: 0.6,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 68,
    marginBottom: 22,
  },

  greetingBox: { flex: 1 },

  greetingSmall: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 0.8)',
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  greetingName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },

  avatarButton: { marginLeft: 12 },

  avatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  locationBox: {
    marginBottom: 18,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },

  locationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  locationTitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  locationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  ordersBanner: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  ordersBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 20,
    minHeight: 130,
  },

  ordersLeft: { flex: 1 },

  ordersBannerLabel: {
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.75)',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  ordersBannerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },

  ordersChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },

  ordersChipText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },

  TruckImage: { width: 120, height: 90 },

  sectionLabel: {
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.8)',
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  horizontalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },

  quickCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },

  quickCardGradient: {
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'flex-start',
  },

  quickIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  quickCardText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  quickCardSub: {
    color: 'rgba(148, 163, 184, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: 'center',
    marginRight: 10,
    gap: 8,
  },

  logoutText: { color: '#ffffffff', fontSize: 16, fontWeight: '700' },

  /* Profile Card */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: '90%',
    maxHeight: '85%',
    padding: 22,
    backgroundColor: '#0b1220',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
  },

  titleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },

  itemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },

  label: { fontSize: 11, color: 'rgba(148, 163, 184, 0.7)', fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '700', color: '#ffffff' },

  input: {
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    marginBottom: 12,
    fontSize: 15,
    color: '#ffffff',
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(148, 163, 184, 0.8)',
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  locBtn: {
    marginLeft: 10,
    padding: 13,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },

  editBtnStyle: { backgroundColor: '#3B82F6' },
  saveBtnStyle: { backgroundColor: '#10B981' },
  cancelBtnStyle: { backgroundColor: '#475569', borderWidth: 1, borderColor: 'rgba(150,150,150,0.2)' },

  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default TailorDashboard;
