import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Signup = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [full_name, setFullName] = useState("");
  const [cnic, setCnic] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");
    if (!full_name || !email || !password || (role === "tailor" && !cnic)) {
      setError("All fields are required");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < 7) {
      setError("Password must be at least 7 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and Confirm Password must match");
      return;
    }



    try {
      await axios.post(
        "http://localhost:3001/auth/signup",
        { full_name, email, password, cnic, role },
        { headers: { "Content-Type": "application/json" } }
      );
      alert("OTP sent to your email!");
      setShowOtp(true);
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  const handleVerifyOtp = async () => {
    if (otp == '')
      return setError("Enter OTP");

    try {
      await axios.post(
        "http://localhost:3001/auth/verify-otp",
        { email, otp },
        { headers: { "Content-Type": "application/json" } }
      );
      alert("Email verified successfully!");
      navigation.navigate("Login");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP");
    }
  };


  return (
    <LinearGradient colors={['#0f0f13', '#1a0610', '#2a0a18']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
              <Image
                source={require("../../assets/images/MyLogo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>
                {showOtp ? "Enter Verification Code" : "Create Your Account"}
              </Text>

              {showOtp == '' ? (
                <>
                  <TextInput
                    placeholderTextColor={'rgba(255, 255, 255, 0.4)'}
                    style={styles.input}
                    placeholder="Full Name"
                    value={full_name}
                    onChangeText={setFullName}
                  />
                  <TextInput
                    placeholderTextColor={'rgba(255, 255, 255, 0.4)'}
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      style={styles.passwordInput}
                      placeholder="Password"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />

                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye" : "eye-off"}
                        size={22}
                        color="rgba(255, 255, 255, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      style={styles.passwordInput}
                      placeholder="Confirm Password"
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye" : "eye-off"}
                        size={22}
                        color="rgba(255, 255, 255, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={role}
                      onValueChange={(itemValue) => setRole(itemValue)}
                      style={styles.picker}
                      itemStyle={{ color: '#fff' }}
                    >
                      <Picker.Item label="Customer" value="customer" color='#fff' />
                      <Picker.Item label="Tailor" value="tailor" color='#fff' />
                    </Picker>
                  </View>
                  {role === "tailor" && (
                    <TextInput
                      placeholderTextColor={'rgba(255, 255, 255, 0.4)'}
                      style={styles.input}
                      placeholder="CNIC"
                      keyboardType="numeric"
                      maxLength={13}
                      value={cnic}
                      onChangeText={(text) => {
                        const numericText = text.replace(/[^0-9]/g, '');
                        setCnic(numericText);
                      }}
                    />
                  )}
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  <TouchableOpacity style={styles.button} onPress={handleSignup}>
                    <Text style={styles.buttonText}>Sign Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                    <Text style={styles.linkText}>
                      Already have an account? Login
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="numeric"
                    value={otp}
                    onChangeText={setOtp}
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
                    <Text style={styles.buttonText}>Verify OTP</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 3,
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(230, 176, 176, 0.15)',
  },
  logo: { width: 160, height: 100, marginBottom: 65, borderRadius: 10 },
  title: { fontSize: 24, fontWeight: "700", color: "#E6B0B0", marginBottom: 20, letterSpacing: 1 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: 'rgba(230, 176, 176, 0.2)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#fff',
  },
  passwordWrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(230, 176, 176, 0.2)',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 15,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  eyeIcon: {
    paddingHorizontal: 8,
  },

  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: 'rgba(230, 176, 176, 0.2)',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    height: 140,
    justifyContent: "center",
    overflow: "hidden",
  },

  picker: {
    width: "100%",
    color: '#fff',
  },
  button: {
    backgroundColor: '#9D2A4B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
    shadowColor: '#9D2A4B',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  errorText: { color: "red", marginBottom: 10, textAlign: "center", fontSize: 14 },
  linkText: { marginTop: 20, fontSize: 15, color: "#E6B0B0", fontWeight: "bold" },
});

export default Signup;
