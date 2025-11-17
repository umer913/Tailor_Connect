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
  View
} from 'react-native';

const CustomerDashboard = ({ route, navigation }) => {
  const { email } = route.params;

  const [profile, setProfile] = useState({});
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);


  /* ---------------- ANIMATIONS ---------------- */
  const [fadeAnim] = useState(new Animated.Value(0));     // screen fade
  const [slideAnim] = useState(new Animated.Value(40));   // card slide
  const [scaleAnim] = useState(new Animated.Value(0.3));  // image scale


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, []);

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
  const { cnic, phone_number } = form;

  if (cnic?.length !== 13) return alert("CNIC must be 13 digits.");
  if (phone_number?.length !== 11) return alert("Phone must be 11 digits.");
  const { password } = form;

  // Only validate password if user entered something
  if (password && password.length < 7) {
    return alert("Password must be at least 7 characters.");
  }
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
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LinearGradient colors={['#a8edea', '#fed6e3']} style={styles.container}>

        {/* IMAGE WITH SCALE ANIMATION */}
        <Animated.View style={[styles.imageCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Image
            source={require('../../../assets/images/Men.png')}
            style={{ height: 110, width: 110 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* CARD WITH SLIDE-UP ANIMATION */}
        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>

          {!editMode ? (
            <>
              <Text style={styles.title}>My Profile</Text>

              <Item label="Full Name" value={profile.full_name} />
              <Item label="CNIC" value={profile.cnic} />
              <Item label="Phone Number" value={profile.phone_number} />
              <Item label="Location" value={profile.location} />

              <Button text="Edit Details" color="#4a90e2" onPress={() => setEditMode(true)} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Edit Profile</Text>

              <Input placeholder="Full Name" value={form.full_name} onChangeText={t => change("full_name", t)} />

              <Input
                placeholder="CNIC"
                keyboardType="numeric"
                maxLength={13}
                value={form.cnic}
                onChangeText={t => change("cnic", t.replace(/[^0-9]/g, ""))}
              />

              <Input
                placeholder="Phone Number"
                keyboardType="numeric"
                maxLength={11}
                value={form.phone_number}
                onChangeText={t => change("phone_number", t.replace(/[^0-9]/g, ""))}
              />

              <Input placeholder="Location" value={form.location} onChangeText={t => change("location", t)} />

              <Input
                placeholder="New Password (optional)"
                secureTextEntry
                value={form.password}
                onChangeText={t => change("password", t)}
              />

              <Button text="Save Changes" color="#4CAF50" onPress={saveProfile} />
              <Button text="Cancel" color="#f05454" onPress={() => setEditMode(false)} />
            </>
          )}
        </Animated.View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.navigate("Login")}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}> Logout</Text>
        </TouchableOpacity>

      </LinearGradient>
    </Animated.View>
  );
};

/* ------------ Reusable Components -------------- */

const Item = ({ label, value }) => (
  <View style={styles.itemBox}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const Input = props => <TextInput {...props} style={styles.input} />;

const Button = ({ text, color, onPress }) => (
  <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.btnText}>{text}</Text>
  </TouchableOpacity>
);

/* ------------ Styles -------------- */

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 35 },

  imageCircle: {
    padding: 15,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.23)",
    marginTop: 5
  },

  card: {
    width: "88%",
    padding: 20,
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
     shadowColor: '#6C63FF',
    shadowOpacity: 0.7,
    shadowRadius: 100,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#444",
    alignSelf: "center",
    marginBottom: 15
  },

  itemBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee"
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
    fontSize: 16
  },

  btn: {
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10
  },

  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  logoutBtn: {
    marginTop:90,
    bottom: 40,
    backgroundColor: "#d85b5b",
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center"
  },

  logoutText: { color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 6 }
});

export default CustomerDashboard;
