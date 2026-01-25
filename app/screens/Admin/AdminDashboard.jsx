import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";

const { width } = Dimensions.get("window");

const AdminDashboard = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = () => {
    navigation.navigate("Login");
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.title}>Welcome Admin</Text>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("ManageTailors")}
      >
        <Text style={styles.buttonText}>Manage Tailors</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("ManageCustomers")}
      >
        <Text style={styles.buttonText}>Manage Customers</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("ManageOrders")}
      >
        <Text style={styles.buttonText}>Manage Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        activeOpacity={0.8}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e2f",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#f5f6fa",
    marginBottom: 50,
    letterSpacing: 1.2,
  },
  button: {
    backgroundColor: "#5c6bc0",
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 12,
    marginVertical: 12,
    width: width * 0.75,
    alignItems: "center",
    shadowColor: "#4f5bd5",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 15,
    elevation: 10,
  },
  buttonText: {
    color: "#f1f1f1",
    fontSize: 20,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  logoutButton: {
    backgroundColor: "#ef5350",
    shadowColor: "#d84315",
    marginTop: 40,
  },
});

export default AdminDashboard;
