import { Picker } from "@react-native-picker/picker";
import axios from "axios";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Signup = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [full_name, setFullName] = useState("");
  const [cnic, setCnic] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState("");

   const handleSignup = async () => {
    setError("");
    if (!full_name || !email || !password || (role === "tailor" && !cnic)) {
      setError("All fields are required");
      return;
    }

    try {
      await axios.post(
        "http://localhost:3000/signup",
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
    if (!otp) return setError("Enter OTP");

    try {
      await axios.post(
        "http://localhost:3000/verify-otp",
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Image
              source={require("../../assets/images/tailor.jpeg")}
              style={styles.logo}
            />
            <Text style={styles.title}>
              {showOtp ? "Enter Verification Code" : "Create Your Account"}
            </Text>

            {!showOtp ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={full_name}
                  onChangeText={setFullName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={role}
                    onValueChange={(itemValue) => setRole(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Customer" value="customer" />
                    <Picker.Item label="Tailor" value="tailor" />
                  </Picker>
                </View>
                {role === "tailor" && (
                  <TextInput
                    style={styles.input}
                    placeholder="CNIC"
                    value={cnic}
                    onChangeText={setCnic}
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
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#cbe1f6ff" },
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    alignItems: "center",
  },
  logo: { width: 160, height: 100, marginBottom: 25, borderRadius: 10 },
  title: { fontSize: 24, fontWeight: "700", color: "#222", marginBottom: 20 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  picker: { width: "100%" },
  button: {
    backgroundColor: "#6C63FF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  errorText: { color: "red", marginBottom: 10, textAlign: "center", fontSize: 14 },
  linkText: { marginTop: 20, fontSize: 15, color: "#555", fontWeight: "bold" },
});

export default Signup;
