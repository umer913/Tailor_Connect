import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Forgot = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ---------------- SEND OTP ----------------
  const handleSendOTP = async () => {
    if (!email) return Alert.alert("Error", "Please enter your email");
    try {
      const res = await axios.post("http://UF-MacBook-Pro.local:3001/auth/forgot-password", { email });
      Alert.alert("Success", res.data.message || "OTP sent to your email");
      setStep(3);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to send OTP");
    }
  };

  // ---------------- RESET PASSWORD ----------------
  const handleResetPassword = async () => {
    if (!otp.trim || !newPassword)
      return Alert.alert("Error", "Please enter all fields");

    try {
      const res = await axios.post("http://UF-MacBook-Pro.local:3001/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      Alert.alert("Success", res.data.message || "Password reset successfully!");
      navigation.replace("Login");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to reset password");
    }
  };

  return (
      <LinearGradient colors={['#0f0f13', '#1a0610', '#2a0a18']} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1}}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </Text>

          {step === 1 ? (
            <>
              <Text style={styles.subtitle}>
                Enter your registered email to receive an OTP
              </Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor={'rgba(255, 255, 255, 0.4)'}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleSendOTP}
              >
                <Text style={styles.buttonText}>Send OTP</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Enter the OTP and set a new password
              </Text>
              <TextInput
                placeholder="Enter OTP"
                placeholderTextColor={'rgba(255, 255, 255, 0.4)'}
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
              />
              <TextInput
                placeholder="Enter New Password"
                placeholderTextColor={'rgba(255, 255, 255, 0.4)'}
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleResetPassword}
              >
                <Text style={styles.buttonText}>Reset Password</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
};

export default Forgot;

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 28,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    alignItems: "center",
    marginBottom: 200,
    borderWidth: 1,
    borderColor: 'rgba(230, 176, 176, 0.15)',
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#E6B0B0",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 25,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(230, 176, 176, 0.2)",
    color: "#fff",
  },
  button: {
    backgroundColor: "#9D2A4B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    shadowColor: "#9D2A4B",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
