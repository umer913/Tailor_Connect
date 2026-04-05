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

export default function CustomerComplainBox({ route }) {
  const email = route.params?.email;

  const [againstEmail, setAgainstEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState("");
  const [complaints, setComplaints] = useState([]);

  const specialIssues = [
    "Payment Issue",
    "Late Delivery",
    "Wrong Measurement",
    "Bad Stitching",
    "Misbehaviour"
  ];

  const shouldShowFields = specialIssues.includes(selectedIssue);

  /* ================= IMAGE ================= */
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
    } catch (err) {
      Alert.alert("Error fetching complaints");
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /* ================= DELETE ================= */
  const deleteComplaint = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this complaint?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(
                `${SERVER}/delete-complaint/${id}/${email}`
              );
              Alert.alert("Complaint deleted");
              fetchComplaints();
            } catch (err) {
              Alert.alert("Error deleting complaint");
            }
          }
        }
      ]
    );
  };

  /* ================= SUBMIT ================= */
  const submitComplaint = async () => {
    if (!subject || !description) {
      Alert.alert("Please fill required fields");
      return;
    }

    if (shouldShowFields && (!againstEmail || !orderId)) {
      Alert.alert("Tailor Email and Order ID are required for this issue");
      return;
    }

    const payload = {
      filed_by_email: email,
      filed_by_role: "customer",
      against_email: againstEmail || null,
      complaint_type: selectedIssue,
      subject,
      description,
      order_id: orderId || null,
      attachment_url: image || null
    };

    try {
      await axios.post(`${SERVER}/file-complaint`, payload);
      Alert.alert("Complaint submitted successfully");

      setAgainstEmail("");
      setOrderId("");
      setSelectedIssue("");
      setSubject("");
      setDescription("");
      setImage(null);

      fetchComplaints();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error submitting complaint";

      Alert.alert("Error", message);
    }
  };

  /* ================= UI ================= */
  return (
    <View style={{ flex: 1, backgroundColor: "#0c1435" }}>
      <LinearGradient
        colors={["#1b254f", "#0c1435", "#080927"]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Complaint Center</Text>
        <Text style={styles.headerSubtitle}>
          Raise concerns professionally
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* FORM */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>File a Complaint</Text>

          {shouldShowFields && (
            <>
              <TextInput
                placeholder="Enter Tailor Email *"
                placeholderTextColor="#667799"
                style={styles.input}
                value={againstEmail}
                onChangeText={setAgainstEmail}
              />
              <TextInput
                placeholder="Enter Order ID *"
                placeholderTextColor="#667799"
                style={styles.input}
                value={orderId}
                onChangeText={setOrderId}
              />
            </>
          )}

          <TextInput
            placeholder="Subject *"
            placeholderTextColor="#667799"
            value={subject}
            onChangeText={setSubject}
            style={styles.input}
          />

          <TextInput
            placeholder="Description *"
            placeholderTextColor="#667799"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { height: 90 }]}
            multiline
          />

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedIssue}
              onValueChange={setSelectedIssue}
              dropdownIconColor="#c3d1ff"
              style={{ color: "#c3d1ff" }}
            >
              <Picker.Item color="white" label="General" value="General" />
              <Picker.Item color="white" label="Payment Issue" value="Payment Issue" />
              <Picker.Item color="white" label="Late Delivery" value="Late Delivery" />
              <Picker.Item color="white" label="Wrong Measurement" value="Wrong Measurement" />
              <Picker.Item color="white" label="Bad Stitching" value="Bad Stitching" />
              <Picker.Item color="white" label="Misbehaviour" value="Misbehaviour" />
              <Picker.Item color="white" label="Other" value="Other" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>Upload Proof Image</Text>
          </TouchableOpacity>

          {image && (
            <Image source={{ uri: image }} style={styles.previewImage} />
          )}

          <TouchableOpacity style={styles.submitButton} onPress={submitComplaint}>
            <Text style={styles.submitText}>Submit Complaint</Text>
          </TouchableOpacity>
        </View>

        {/* LIST */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.sectionTitle}>My Complaints</Text>

          {complaints.length === 0 ? (
            <Text style={styles.emptyText}>No complaints filed yet.</Text>
          ) : (
            complaints.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.subject}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: item.resolved_at
                          ? "#2e7d32"
                          : "#ff9800"
                      }
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {item.resolved_at ? "Resolved" : "Pending"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDescription}>
                  {item.description}
                </Text>

                {item.attachment_url && (
                  <Image
                    source={{ uri: item.attachment_url }}
                    style={styles.cardImage}
                  />
                )}

                {item.admin_response && (
                  <View style={styles.adminBox}>
                    <Text style={styles.adminLabel}>Admin Response</Text>
                    <Text style={{ color: "#c3d1ff" }}>
                      {item.admin_response}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteComplaint(item.id)}
                >
                  <Text style={styles.deleteText}>
                    Remove Complaint
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  header: {
    padding: 30,
    paddingTop: 60,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25
  },
  headerTitle: { color: "#d1d9ff", fontSize: 24, fontWeight: "bold" },
  headerSubtitle: { color: "#8e9ccf", marginTop: 4 },
  formCard: {
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.15)"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#d1d9ff"
  },
  input: {
    backgroundColor: "rgba(20, 28, 54, 0.7)",
    borderWidth: 1,
    borderColor: "#506ba9",
    color: "#c3d1ff",
    padding: 12,
    borderRadius: 12,
    marginVertical: 6
  },
  pickerWrapper: {
    backgroundColor: "rgba(20, 28, 54, 0.7)",
    borderWidth: 1,
    borderColor: "#506ba9",
    borderRadius: 12,
    marginVertical: 6
  },
  imageButton: {
    backgroundColor: "#2a3c72",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8
  },
  imageButtonText: { color: "#ccd9ff", fontWeight: "600" },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 10
  },
  submitButton: {
    backgroundColor: "#2a3c72",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 15
  },
  submitText: {
    color: "#e6ebff",
    fontWeight: "bold",
    fontSize: 16
  },
  card: {
    backgroundColor: "rgba(38, 52, 90, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.15)",
    padding: 15,
    borderRadius: 20,
    marginVertical: 8
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#d1d9ff"
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600"
  },
  cardDescription: { marginTop: 6, color: "#8e9ccf" },
  cardImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginTop: 10
  },
  adminBox: {
    backgroundColor: "rgba(20, 28, 54, 0.7)",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#506ba9"
  },
  adminLabel: { fontWeight: "bold", color: "#9bb3ff" },
  deleteButton: {
    marginTop: 12,
    backgroundColor: "#7a1f2b",
    padding: 10,
    borderRadius: 10,
    alignItems: "center"
  },
  deleteText: { color: "white", fontWeight: "600" },
  emptyText: { color: "#889acc", marginTop: 10 }
});
