import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const AdminDashboard = ({ navigation }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const Card = ({ title, icon, screen }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate(screen)}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Ionicons name={icon} size={34} color="#fff" />
        <Text style={styles.cardText}>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#0f2027", "#203a43", "#2c5364"]} style={{ flex: 1 }}>
      <View style={styles.container}>

        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.sub}>TailorX Management</Text>

        <Card title="Tailors" icon="cut-outline" screen="ManageTailors" />
        <Card title="Customers" icon="people-outline" screen="ManageCustomers" />
        <Card title="Orders" icon="reader-outline" screen="ManageOrders" />
        <Card title="Complain-Box" icon="alert-circle-outline" screen="ManageComplain" />

        <TouchableOpacity
          onPress={async () => {
            try {
              await AsyncStorage.removeItem('userToken');
            } catch (e) {
              console.error('Logout error:', e);
            }
            navigation.navigate("Login");
          }}
          style={styles.logout}
        >
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },

  sub: {
    color: "#aaa",
    marginBottom: 40,
  },

  card: {
    width: width * 0.78,
    height: 85,
    borderRadius: 22,
    marginVertical: 12,
    paddingHorizontal: 25,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  cardText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 20,
  },

  logout: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    backgroundColor: "#ff5252",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 40,
  },

  logoutText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
  },
});

export default AdminDashboard;
