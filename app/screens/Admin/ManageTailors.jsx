import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { API_BASE_URL } from "../../api.js";

export default function ManageTailors() {
  const [tailors, setTailors] = useState([]);
  const [openEmail, setOpenEmail] = useState(null);

  useEffect(() => {
    fetchTailors();
  }, []);

  const fetchTailors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/get-tailors`);
      setTailors(res.data.tailors || []);
    } catch (err) {
      console.log(err);
    }
  };

  const removeTailor = (email) => {
    Alert.alert("Remove Tailor", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/admin/remove-tailor`, {
              data: { email },
            });
            setTailors((prev) => prev.filter((t) => t.email !== email));
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const isOpen = openEmail === item.email;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpenEmail(isOpen ? null : item.email)}
        style={styles.card}
      >
        <View style={styles.header}>

          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color="#fff" />
          </View>

          <Text style={styles.name}>{item.full_name}</Text>

          <TouchableOpacity
            onPress={() => removeTailor(item.email)}
            style={styles.delete}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {isOpen && (
          <View style={styles.details}>
            <Info icon="mail-outline" text={item.email} />
            <Info icon="call-outline" text={item.phone_number || "N/A"} />
            <Info icon="location-outline" text={item.location || "N/A"} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={["#0f2027", "#203a43", "#2c5364"]} style={{ flex: 1 }}>
      <View style={styles.container}>

        <Text style={styles.heading}>Manage Tailors</Text>
        <Text style={styles.sub}>TailorX Admin</Text>

        <FlatList
          data={tailors}
          keyExtractor={(item) => item.email}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}
        />

        {tailors.length === 0 && (
          <View style={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
            <Text style={styles.empty}>No Tailors Found</Text>
          </View>
        )}

      </View>
    </LinearGradient>
  );
}

const Info = ({ icon, text }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={18} color="#bbb" />
    <Text style={styles.info}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  heading: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },

  sub: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 30,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 22,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#5c6bc0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  name: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  delete: {
    backgroundColor: "#ff5252",
    padding: 8,
    borderRadius: 30,
  },

  details: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 12,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  info: {
    color: "#ddd",
    marginLeft: 10,
    fontSize: 15,
  },

  empty: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 120,
    fontSize: 18,
  },
});
