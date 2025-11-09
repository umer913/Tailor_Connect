import axios from "axios";
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
    if (!email.trim()) return Alert.alert("Error", "Please enter your email");
    try {
      const res = await axios.post("http://UF-MacBook-Pro.local:3000/forgot-password", { email });
      Alert.alert("Success", res.data.message || "OTP sent to your email");
      setStep(2);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to send OTP");
    }
  };

  // ---------------- RESET PASSWORD ----------------
  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim())
      return Alert.alert("Error", "Please enter all fields");

    try {
      const res = await axios.post("http://UF-MacBook-Pro.local:3000/reset-password", {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#cbe1f6ff" }}>
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
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
              />
              <TextInput
                placeholder="Enter New Password"
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
  );
};

export default Forgot;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    shadowColor: "#6C63FF",
    shadowOpacity: 0.7,
    shadowRadius: 30,
    alignItems: "center",
    marginBottom: 200,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 25,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#F7F7F7",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#c7c7c7ff",
  },
  button: {
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    shadowColor: "#6C63FF",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
