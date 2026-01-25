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
    View,
} from "react-native";

export default function ManageTailors() {
  const [tailors, setTailors] = useState([]);
  const [openEmail, setOpenEmail] = useState(null);

  useEffect(() => {
    fetchTailors();
  }, []);

  const fetchTailors = async () => {
    try {
      const res = await axios.get("http://UF-MacBook-Pro.local:3000/get-tailors");
      setTailors(res.data.tailors || []);
    } catch (err) {
      console.log("Fetch error:", err);
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
            await axios.delete("http://UF-MacBook-Pro.local:3000/remove-tailor", {
              data: { email },
            });
            setTailors((prev) => prev.filter((t) => t.email !== email));
          } catch (err) {
            console.log("Delete error:", err);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const isOpen = openEmail === item.email;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setOpenEmail(isOpen ? null : item.email)}
        activeOpacity={0.85}
      >
        {/* HEADER */}
        <View style={styles.row}>
          <Text style={styles.name}>{item.full_name}</Text>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeTailor(item.email)}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* DETAILS */}
        {isOpen && (
          <View style={styles.details}>
            <Text style={styles.detailText}>Email: {item.email}</Text>
            <Text style={styles.detailText}>
              Phone: {item.phone_number || "N/A"}
            </Text>
            <Text style={styles.detailText}>
              Location: {item.location || "N/A"}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={["#1e1e2f", "#3b3f56"]} style={styles.container}>
      <Text style={styles.heading}>Manage Tailors</Text>

      {tailors.length === 0 ? (
        <Text style={styles.emptyText}>No tailors found</Text>
      ) : (
        <FlatList
          data={tailors}
          keyExtractor={(item) => item.email}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: "#f1f1f1",
    marginBottom: 25,
    textAlign: "center",
    letterSpacing: 1.2,
  },

  card: {
    backgroundColor: "#2b2f44",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e1e4f2",
  },

  removeBtn: {
    backgroundColor: "#ef5350",
    padding: 10,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
    shadowColor: "#d84315",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },

  details: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#444a6a",
    paddingTop: 14,
  },

  detailText: {
    fontSize: 16,
    color: "#c1c5d7",
    marginBottom: 10,
    letterSpacing: 0.4,
  },

  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 20,
    textAlign: "center",
    marginTop: 140,
    fontWeight: "700",
  },
});
