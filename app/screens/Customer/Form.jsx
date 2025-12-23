import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Form() {
  return (
    <LinearGradient
      colors={["#64769e", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* CONTACT */}
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Contact</Text>
            
          </View>

          <TextInput
            placeholder="Enter Email"
            placeholderTextColor="#999"
            style={styles.input}
          />

     

          {/* DELIVERY */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Delivery
          </Text>

        

         
            <TextInput
              placeholder="Full name"
              placeholderTextColor="#999"
              style={styles.input}
            />
         

          <TextInput
            placeholder="Address"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <TextInput
            placeholder="Full Address: Apartment, suite, etc"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <View style={styles.row}>
        
          
          </View>

          <TextInput
            placeholder="Phone"
            placeholderTextColor="#999"
            style={styles.input}
            keyboardType="phone-pad"
          />

          {/* BUTTON */}
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },
  link: {
    color: "#3b5998",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#000",
    marginTop: 12,
    backgroundColor: "#fafafa",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  half: {
    width: "48%",
  },
  dropdownText: {
    color: "#000",
    fontSize: 15,
  },

  btn: {
    marginTop: 28,
    backgroundColor: "#192f6a",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
