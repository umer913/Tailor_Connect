import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const SERVER = "http://UF-MacBook-Pro.local:3000";

export default function TailorComplainBox({ route }) {
  const email = route.params?.email;

  const [complaintType, setComplaintType] = useState("General");
  const [againstEmail, setAgainstEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [complaints, setComplaints] = useState([]);

  /* ================= IMAGE PICK ================= */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  /* ================= FETCH ================= */
  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${SERVER}/my-complaints/${email}`);
      setComplaints(res.data);
    } catch {
      Alert.alert("Error fetching complaints");
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /* ================= DELETE ================= */
  const deleteComplaint = async (id) => {
    Alert.alert("Delete Complaint", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${SERVER}/delete-complaint/${id}/${email}`);
            fetchComplaints();
          } catch {
            Alert.alert("Error deleting complaint");
          }
        }
      }
    ]);
  };

  /* ================= SUBMIT ================= */
  const submitComplaint = async () => {
    if (!subject || !description) {
      Alert.alert("Please fill required fields");
      return;
    }

    // 🔥 Only require email + orderId for these 3 types
    if (
      complaintType === "Customer Misbehaviour" ||
      complaintType === "Payment Not Received" ||
      complaintType === "Order Cancellation"
    ) {
      if (!againstEmail || !orderId) {
        Alert.alert(
          "Customer Email and Order ID are required for this complaint type"
        );
        return;
      }
    }

    try {
      await axios.post(`${SERVER}/file-complaint`, {
        filed_by_email: email,
        filed_by_role: "tailor",
        against_email:
          complaintType === "Customer Misbehaviour" ||
          complaintType === "Payment Not Received" ||
          complaintType === "Order Cancellation"
            ? againstEmail
            : null,
        order_id:
          complaintType === "Customer Misbehaviour" ||
          complaintType === "Payment Not Received" ||
          complaintType === "Order Cancellation"
            ? orderId
            : null,
        complaint_type: complaintType,
        subject,
        description,
        attachment_url: image || null
      });

      Alert.alert("Complaint submitted successfully");

      setAgainstEmail("");
      setOrderId("");
      setSubject("");
      setDescription("");
      setImage(null);
      setComplaintType("General");

      fetchComplaints();
    } catch {
      Alert.alert("Error submitting complaint");
    }
  };

  /* ================= UI ================= */
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#2B0F14", "#3A1419", "#4A1C22"]}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Complaint Center</Text>
            <Text style={styles.headerSub}>File a complaint</Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.formCard}>

            {/* Complaint Type */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={complaintType}
                onValueChange={setComplaintType}
                style={{ color: "#4A1C22" }}
              >
                <Picker.Item label="General Platform Issue" value="General" />
                <Picker.Item label="Customer Misbehaviour" value="Customer Misbehaviour" />
                <Picker.Item label="Payment Not Received" value="Payment Not Received" />
                <Picker.Item label="Order Cancellation Dispute" value="Order Cancellation" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>

            {/* 🔥 CONDITIONAL FIELDS */}
            {(complaintType === "Customer Misbehaviour" ||
              complaintType === "Payment Not Received" ||
              complaintType === "Order Cancellation") && (
              <>
                <TextInput
                  placeholder="Customer Email *"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={againstEmail}
                  onChangeText={setAgainstEmail}
                />

                <TextInput
                  placeholder="Order ID *"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={orderId}
                  onChangeText={setOrderId}
                />
              </>
            )}

            <TextInput
              placeholder="Subject *"
              placeholderTextColor="#888"
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
            />

            <TextInput
              placeholder="Description *"
              placeholderTextColor="#888"
              style={[styles.input, { height: 90 }]}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
              <Text style={{ color: "#4A1C22", fontWeight: "600" }}>
                Upload Proof Image
              </Text>
            </TouchableOpacity>

            {image && (
              <Image source={{ uri: image }} style={styles.previewImage} />
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={submitComplaint}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                Submit Complaint
              </Text>
            </TouchableOpacity>
          </View>

          {/* MY COMPLAINTS */}
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={styles.sectionTitle}>My Complaints</Text>

            {complaints.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.subject}</Text>
                <Text>{item.description}</Text>

                {item.attachment_url && (
                  <Image
                    source={{ uri: item.attachment_url }}
                    style={styles.cardImage}
                  />
                )}
 {item.admin_response && (
                  <View style={styles.adminBox}>
                    <Text style={styles.adminLabel}>Admin Response</Text>
                    <Text style={{ color: "#cd0000" }}>
                      {item.admin_response}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteComplaint(item.id)}
                >
                  <Text style={{ color: "#fff" }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

        </ScrollView>
      </LinearGradient>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  header: {
    marginTop: 70,
    marginLeft: 25,
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E6B0B0"
  },
  headerSub: {
    color: "#fff",
    marginTop: 4
  },
  formCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 20
  },
  pickerWrapper: {
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    marginBottom: 10
  },
  input: {
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 12,
    marginVertical: 6
  },
  imageBtn: {
    backgroundColor: "#E6B0B0",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8
  },
  submitBtn: {
    backgroundColor: "#4A1C22",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 15
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E6B0B0",
    marginBottom: 10
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 18,
    marginVertical: 10
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#4A1C22",
    marginBottom: 5
  },
  cardImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginTop: 10
  },
  adminLabel: { fontSize: 22,fontWeight: "bold", color: "#cd0000" },
  deleteBtn: {
    marginTop: 12,
    backgroundColor: "#d85b5b",
    padding: 10,
    borderRadius: 10,
    alignItems: "center"
  }
});
