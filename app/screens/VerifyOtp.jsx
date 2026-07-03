import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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

const VerifyOtp = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (otp === "0000") {
      navigation.navigate("Login");
    }
  }, [otp]);

  const handleVerifyOtp = () => {
    setError("");
    if (otp.length < 4) {
      setError("Please enter the 4-digit OTP");
      return;
    }
    if (otp !== "0000") {
      setError("Invalid OTP");
      return;
    }
    navigation.navigate("Login");
  };

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={{ flex: 1 }}>
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
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                Enter 0000 to verifyOTP {email}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="• • • •"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="numeric"
                maxLength={4}
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, ""))}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
                <Text style={styles.buttonText}>Verify OTP</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 3,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(230, 176, 176, 0.15)",
  },
  logo: { width: 160, height: 100, marginBottom: 30, borderRadius: 10 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E6B0B0",
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(230, 176, 176, 0.2)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 6,
  },
  button: {
    backgroundColor: "#9D2A4B",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
    shadowColor: "#9D2A4B",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  errorText: { color: "red", marginBottom: 10, textAlign: "center", fontSize: 14 },
  linkText: { marginTop: 20, fontSize: 15, color: "#E6B0B0", fontWeight: "bold" },
});

export default VerifyOtp;
