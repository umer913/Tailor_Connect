import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../../api.js";

const SERVER = `${API_BASE_URL}`;
const SPECIAL_ISSUES = ["Payment Issue", "Late Delivery", "Wrong Measurement", "Bad Stitching", "Misbehaviour"];
const ISSUE_OPTIONS = [
  { label: "General", value: "General", icon: "help-circle-outline" },
  { label: "Payment Issue", value: "Payment Issue", icon: "card-outline" },
  { label: "Late Delivery", value: "Late Delivery", icon: "time-outline" },
  { label: "Wrong Measurement", value: "Wrong Measurement", icon: "resize-outline" },
  { label: "Bad Stitching", value: "Bad Stitching", icon: "cut-outline" },
  { label: "Misbehaviour", value: "Misbehaviour", icon: "people-outline" },
  { label: "Other", value: "Other", icon: "ellipsis-horizontal-outline" },
];

const getIssueIcon = (type) => {
  const option = ISSUE_OPTIONS.find((opt) => opt.value === type);
  return option ? option.icon : "alert-circle-outline";
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatChatTime = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }) + " • " + d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
};

const parseDescriptionToMessages = (descriptionText, adminResponse, resolvedAt, createdAt) => {
  const messages = [];
  if (!descriptionText) return messages;

  const followUpRegex = /\[Follow-up ([^\]]+)\]/g;
  let match;
  const positions = [];

  while ((match = followUpRegex.exec(descriptionText)) !== null) {
    positions.push({
      index: match.index,
      timestamp: match[1],
      length: match[0].length
    });
  }

  if (positions.length === 0) {
    messages.push({
      sender: "user",
      text: descriptionText.trim(),
      time: createdAt || null,
      isInitial: true
    });
  } else {
    const initialText = descriptionText.substring(0, positions[0].index).trim();
    if (initialText) {
      messages.push({
        sender: "user",
        text: initialText,
        time: createdAt || null,
        isInitial: true
      });
    }

    for (let i = 0; i < positions.length; i++) {
      const current = positions[i];
      const startOfText = current.index + current.length;
      const endOfText = (i + 1 < positions.length) ? positions[i + 1].index : descriptionText.length;
      const msgText = descriptionText.substring(startOfText, endOfText).trim();

      messages.push({
        sender: "user",
        text: msgText,
        time: current.timestamp,
        isInitial: false
      });
    }
  }

  if (adminResponse) {
    messages.push({
      sender: "admin",
      text: adminResponse,
      time: resolvedAt || null,
      isInitial: false
    });
  }

  return messages;
};

const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

const StyledInput = ({ placeholder, value, onChangeText, multiline, icon }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.inputWrap}>
      {icon && <Ionicons name={icon} size={16} color={focused ? "#D6406A" : "#E6B0B0"} style={styles.inputIcon} />}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        style={[
          styles.input,
          multiline && { height: 90, textAlignVertical: "top" },
          icon && { paddingLeft: 36 },
          focused && styles.inputFocused,
        ]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
};

export default function CustomerComplainBox({ route }) {
  const email = route.params?.email;
  const [againstEmail, setAgainstEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [followUps, setFollowUps] = useState({});
  const [activeTab, setActiveTab] = useState("new");
  const [expandedId, setExpandedId] = useState(null);
  const [showPickerModal, setShowPickerModal] = useState(false);

  const shouldShowFields = SPECIAL_ISSUES.includes(selectedIssue);

  const resetForm = () => { setAgainstEmail(""); setOrderId(""); setSelectedIssue(""); setSubject(""); setDescription(""); setImage(null); };
  const setFollowUpText = (id, text) => setFollowUps((prev) => ({ ...prev, [id]: text }));
  const clearFollowUpText = (id) => setFollowUps((prev) => ({ ...prev, [id]: "" }));
  const toggleExpand = (id) => { setExpandedId((prev) => (prev === id ? null : id)); };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${SERVER}/complaints/my-complaints/${email}`);
      setComplaints(res.data);
    } catch { Alert.alert("Error fetching complaints"); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const deleteComplaint = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this complaint?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${SERVER}/complaints/delete-complaint/${id}/${email}`);
            Alert.alert("Complaint deleted");
            fetchComplaints();
          } catch { Alert.alert("Error deleting complaint"); }
        },
      },
    ]);
  };

  const submitComplaint = async () => {
    if (!subject || !description) { Alert.alert("Please fill required fields"); return; }
    if (shouldShowFields && (!againstEmail || !orderId)) { Alert.alert("Tailor Email and Order ID are required for this issue"); return; }
    const payload = { filed_by_email: email, filed_by_role: "customer", against_email: againstEmail || null, complaint_type: selectedIssue, subject, description, order_id: orderId || null, attachment_url: image || null };
    try {
      await axios.post(`${SERVER}/complaints/file-complaint`, payload);
      Alert.alert("Complaint submitted successfully");
      resetForm(); fetchComplaints(); setActiveTab("history");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || err.response?.data?.message || "Error submitting complaint");
    }
  };

  const sendFollowUp = async (complaintId) => {
    const message = String(followUps[complaintId] || "").trim();
    if (!message) { Alert.alert("Write a message first"); return; }
    try {
      await axios.post(`${SERVER}/complaints/follow-up`, { complaint_id: complaintId, filed_by_email: email, message });
      clearFollowUpText(complaintId); fetchComplaints(); Alert.alert("Follow-up sent");
    } catch (err) { Alert.alert("Error", err.response?.data?.error || "Could not send follow-up"); }
  };



  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />

      {/* Header */}
      <LinearGradient
        colors={["rgba(157,42,75,0.3)", "rgba(0,0,0,0)"]}
        style={styles.header}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="shield-half-outline" size={24} color="#E6B0B0" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Complaint Center</Text>
            <Text style={styles.headerSubtitle}>Raise concerns professionally</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Segmented Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "new" && styles.tabButtonActive]}
          onPress={() => setActiveTab("new")}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={16} color={activeTab === "new" ? "#fff" : "#E6B0B0"} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === "new" && styles.tabButtonTextActive]}>
            File Complaint
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "history" && styles.tabButtonActive]}
          onPress={() => setActiveTab("history")}
          activeOpacity={0.8}
        >
          <Ionicons name="folder-open-outline" size={16} color={activeTab === "history" ? "#fff" : "#E6B0B0"} style={{ marginRight: 6 }} />
          <Text style={[styles.tabButtonText, activeTab === "history" && styles.tabButtonTextActive]}>
            My History
          </Text>
          {complaints.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{complaints.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* FORM TAB */}
        {activeTab === "new" && (
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>File a Complaint</Text>
            </View>

            {/* Custom Picker Dropdown Button */}
            <TouchableOpacity
              style={styles.customPicker}
              onPress={() => setShowPickerModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={selectedIssue ? getIssueIcon(selectedIssue) : "options-outline"}
                size={18}
                color="#E6B0B0"
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.pickerText, !selectedIssue && { color: "#6b7280" }]}>
                {selectedIssue ? ISSUE_OPTIONS.find(o => o.value === selectedIssue)?.label : "Select Issue Type *"}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color="#E6B0B0" style={{ marginLeft: "auto" }} />
            </TouchableOpacity>

            {shouldShowFields && (
              <>
                <StyledInput placeholder="Tailor Email *" value={againstEmail} onChangeText={setAgainstEmail} icon="mail-outline" />
                <StyledInput placeholder="Order ID *" value={orderId} onChangeText={setOrderId} icon="receipt-outline" />
              </>
            )}

            <StyledInput placeholder="Subject *" value={subject} onChangeText={setSubject} icon="document-text-outline" />
            <StyledInput placeholder="Description *" value={description} onChangeText={setDescription} multiline icon="create-outline" />

            <TouchableOpacity style={styles.imageButton} onPress={pickImage} activeOpacity={0.8}>
              <Ionicons name="image-outline" size={18} color="#E6B0B0" style={{ marginRight: 8 }} />
              <Text style={styles.imageButtonText}>{image ? "Change Proof Image" : "Upload Proof Image"}</Text>
            </TouchableOpacity>

            {image && (
              <View style={styles.previewWrap}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImgBtn} onPress={() => setImage(null)}>
                  <Ionicons name="close-circle" size={24} color="#f87171" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={submitComplaint} activeOpacity={0.85} style={{ marginTop: 16 }}>
              <LinearGradient colors={["#9D2A4B", "#D6406A"]} style={styles.submitButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>Submit Complaint</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* LIST TAB */}
        {activeTab === "history" && (
          <View style={styles.listSection}>
            {complaints.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#E6B0B0" />
                <Text style={styles.emptyText}>No complaints filed yet.</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setActiveTab("new")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyButtonText}>File Your First Complaint</Text>
                </TouchableOpacity>
              </View>
            ) : (
              complaints.map((item) => {
                const isExpanded = expandedId === item.id;
                const parsedMessages = parseDescriptionToMessages(
                  item.description,
                  item.admin_response,
                  item.resolved_at,
                  item.created_at || item.createdAt
                );
                return (
                  <View key={item.id} style={styles.card}>
                    <TouchableOpacity
                      style={styles.accordionHeader}
                      onPress={() => toggleExpand(item.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <View style={styles.cardIconWrap}>
                          <Ionicons
                            name={getIssueIcon(item.complaint_type)}
                            size={18}
                            color="#E6B0B0"
                          />
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{item.subject}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                            <Text style={styles.cardCategoryText}>{item.complaint_type || "General"}</Text>
                            {(item.created_at || item.createdAt) && (
                              <>
                                <View style={styles.dotSeparator} />
                                <Text style={styles.cardTimeText}>{formatDate(item.created_at || item.createdAt)}</Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={[styles.statusBadge, {
                          backgroundColor: item.resolved_at ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                          borderColor: item.resolved_at ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"
                        }]}>
                          <View style={[styles.statusDot, { backgroundColor: item.resolved_at ? "#10b981" : "#f59e0b" }]} />
                          <Text style={[styles.statusText, { color: item.resolved_at ? "#10b981" : "#f59e0b" }]}>
                            {item.resolved_at ? "Resolved" : "Pending"}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={18}
                          color="#E6B0B0"
                          style={{ marginLeft: 8 }}
                        />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.cardDetails}>
                        <View style={styles.cardDivider} />

                        {/* Meta Fields Badge Row */}
                        {(item.against_email || item.order_id) && (
                          <View style={styles.metaRow}>
                            {item.against_email && (
                              <View style={styles.metaBadge}>
                                <Ionicons name="mail-outline" size={12} color="#E6B0B0" style={{ marginRight: 4 }} />
                                <Text style={styles.metaBadgeText} numberOfLines={1}>{item.against_email}</Text>
                              </View>
                            )}
                            {item.order_id && (
                              <View style={styles.metaBadge}>
                                <Ionicons name="receipt-outline" size={12} color="#E6B0B0" style={{ marginRight: 4 }} />
                                <Text style={styles.metaBadgeText} numberOfLines={1}>Order: {item.order_id}</Text>
                              </View>
                            )}
                          </View>
                        )}

                        {item.attachment_url && (
                          <View style={{ marginBottom: 12 }}>
                            <Text style={styles.detailsLabel}>Attached Proof</Text>
                            <Image source={{ uri: item.attachment_url }} style={styles.cardImage} />
                          </View>
                        )}

                        {/* Private Chatbox Section */}
                        <View style={styles.chatSection}>
                          <Text style={styles.detailsLabel}>Conversation History</Text>
                          <View style={styles.chatContainer}>
                            {parsedMessages.map((msg, index) => {
                              const isUser = msg.sender === "user";
                              return (
                                <View
                                  key={index}
                                  style={[
                                    styles.chatMessageRow,
                                    isUser ? styles.chatMessageRowUser : styles.chatMessageRowAdmin
                                  ]}
                                >
                                  {!isUser && (
                                    <View style={styles.chatAvatarAdmin}>
                                      <Ionicons name="shield-checkmark" size={12} color="#fff" />
                                    </View>
                                  )}
                                  <View
                                    style={[
                                      styles.chatBubble,
                                      isUser ? styles.chatBubbleUser : styles.chatBubbleAdmin
                                    ]}
                                  >
                                    {msg.isInitial && (
                                      <Text style={styles.chatInitialLabel}>Initial Complaint Details</Text>
                                    )}
                                    <Text style={styles.chatMessageText}>{msg.text}</Text>
                                    {msg.time && (
                                      <Text style={styles.chatBubbleTime}>
                                        {formatChatTime(msg.time)}
                                      </Text>
                                    )}
                                  </View>
                                  {isUser && (
                                    <View style={styles.chatAvatarUser}>
                                      <Ionicons name="person" size={12} color="#fff" />
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>

                        {!item.resolved_at && (
                          <View style={styles.chatInputWrapper}>
                            <TextInput
                              placeholder="Type a follow-up message..."
                              placeholderTextColor="#6b7280"
                              value={followUps[item.id] || ""}
                              onChangeText={(text) => setFollowUpText(item.id, text)}
                              style={styles.chatTextInput}
                              multiline
                            />
                            <TouchableOpacity
                              style={styles.chatSendButton}
                              onPress={() => sendFollowUp(item.id)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="send" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        )}

                        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteComplaint(item.id)}>
                          <Ionicons name="trash-outline" size={14} color="#f87171" style={{ marginRight: 6 }} />
                          <Text style={styles.deleteText}>Remove Complaint</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Selector Modal */}
      <Modal
        visible={showPickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPickerModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Issue Type</Text>
              <TouchableOpacity onPress={() => setShowPickerModal(false)}>
                <Ionicons name="close" size={22} color="#E6B0B0" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {ISSUE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.modalOption,
                    selectedIssue === opt.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedIssue(opt.value);
                    setShowPickerModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={[
                      styles.modalOptionIconWrap,
                      selectedIssue === opt.value && styles.modalOptionIconWrapActive
                    ]}>
                      <Ionicons
                        name={opt.icon}
                        size={18}
                        color={selectedIssue === opt.value ? "#fff" : "#E6B0B0"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedIssue === opt.value && styles.modalOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  {selectedIssue === opt.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#D6406A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIconWrap: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: "rgba(157,42,75,0.15)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSubtitle: { color: "#E6B0B0", marginTop: 2, fontSize: 13, fontWeight: "600" },
  scrollContent: { paddingHorizontal: PAGE_GUTTER, paddingBottom: 50, paddingTop: 12, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },

  // Segmented Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(26, 6, 16, 0.55)",
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(157,42,75,0.18)",
    marginHorizontal: PAGE_GUTTER,
    marginTop: 10,
    marginBottom: 8,
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
    width: SCREEN_W - (PAGE_GUTTER * 2),
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "rgba(157, 42, 75, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.4)",
  },
  tabButtonText: {
    color: "#E6B0B0",
    fontSize: 14,
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  badge: {
    backgroundColor: "#9D2A4B",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  formCard: {
    backgroundColor: "rgba(26, 6, 16, 0.45)",
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(157,42,75,0.2)",
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
    marginBottom: 20,
  },
  listSection: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  sectionDot: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  inputWrap: { position: "relative", marginVertical: 6 },
  inputIcon: { position: "absolute", left: 12, top: 14, zIndex: 1 },
  pickerIcon: { position: "absolute", left: 12, top: 14, zIndex: 1 },

  // Custom Picker (Dropdown Button)
  customPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 6, 16, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginVertical: 6,
  },
  pickerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  // Modal selector styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 8, 13, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxWidth: 360,
    backgroundColor: "rgba(26, 6, 16, 0.98)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(157, 42, 75, 0.15)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  modalOptionSelected: {
    backgroundColor: "rgba(157, 42, 75, 0.2)",
  },
  modalOptionText: {
    color: "#E6B0B0",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOptionTextSelected: {
    color: "#fff",
    fontWeight: "800",
  },
  modalOptionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(157, 42, 75, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalOptionIconWrapActive: {
    backgroundColor: "rgba(157, 42, 75, 0.3)",
  },

  // Input styles
  input: {
    backgroundColor: "rgba(26, 6, 16, 0.5)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
    color: "#fff", padding: 12,
    borderRadius: 14, fontSize: 14,
  },
  inputFocused: {
    borderColor: "rgba(214, 64, 106, 0.6)",
    shadowColor: "#D6406A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  pickerWrapper: {
    backgroundColor: "rgba(26, 6, 16, 0.5)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
    borderRadius: 14, marginVertical: 6, paddingLeft: 2,
  },
  picker: { color: "#fff" },
  imageButton: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(157,42,75,0.15)",
    padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.3)",
    justifyContent: "center", marginTop: 8,
  },
  imageButtonText: { color: "#E6B0B0", fontWeight: "700", fontSize: 14 },
  previewWrap: { position: "relative", marginTop: 10 },
  previewImage: { width: "100%", height: 180, borderRadius: 14 },
  removeImgBtn: { position: "absolute", top: -10, right: -10 },
  submitButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 16, borderRadius: 16,
    shadowColor: "#9D2A4B", shadowOpacity: 0.4, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Accordion Card styles
  card: {
    backgroundColor: "rgba(26, 6, 16, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.18)",
    borderRadius: 20,
    marginVertical: 6,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(157, 42, 75, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardCategoryText: {
    color: "#E6B0B0",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  cardDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(157, 42, 75, 0.15)",
    marginBottom: 12,
  },
  detailsLabel: {
    color: "#E6B0B0",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },

  cardTitle: { fontWeight: "800", fontSize: 15, color: "#fff", flex: 1, marginRight: 10 },
  statusBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "700" },
  cardDescription: { color: "#E6B0B0", fontSize: 14, lineHeight: 20, marginBottom: 12 },
  cardImage: { width: "100%", height: 150, borderRadius: 12, marginTop: 4, marginBottom: 12 },
  adminBox: {
    backgroundColor: "rgba(157,42,75,0.1)", padding: 12,
    borderRadius: 12, marginTop: 12,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.25)",
  },
  adminLabel: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  adminLabelText: { fontWeight: "700", color: "#E6B0B0", fontSize: 13 },
  adminResponse: { color: "#fff", fontSize: 14 },
  followUpBox: {
    marginTop: 12, padding: 14, borderRadius: 14,
    backgroundColor: "rgba(26, 6, 16, 0.3)",
    borderWidth: 1, borderColor: "rgba(157,42,75,0.22)",
  },
  followUpTitle: { color: "#fff", fontWeight: "800", fontSize: 14 },
  followUpHint: { marginTop: 4, marginBottom: 10, color: "#E6B0B0", fontSize: 12 },
  followUpButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 10, backgroundColor: "rgba(157,42,75,0.15)",
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(157,42,75,0.35)",
  },
  followUpButtonText: { color: "#E6B0B0", fontWeight: "700", fontSize: 14 },
  deleteButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 12, backgroundColor: "rgba(239,68,68,0.1)",
    padding: 10, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.25)",
  },
  deleteText: { color: "#f87171", fontWeight: "700", fontSize: 14 },
  emptyWrap: { alignItems: "center", padding: 30 },
  emptyText: { color: "#E6B0B0", marginTop: 10, fontSize: 15, fontWeight: "600" },
  emptyButton: {
    marginTop: 16,
    backgroundColor: "rgba(157, 42, 75, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.35)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: "#E6B0B0",
    fontWeight: "700",
    fontSize: 14,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(230, 176, 176, 0.4)",
    marginHorizontal: 8,
  },
  cardTimeText: {
    color: "rgba(230, 176, 176, 0.55)",
    fontSize: 11,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(157, 42, 75, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.25)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  metaBadgeText: {
    color: "#E6B0B0",
    fontSize: 11,
    fontWeight: "600",
  },
  chatSection: {
    marginVertical: 12,
  },
  chatContainer: {
    paddingVertical: 10,
    gap: 10,
  },
  chatMessageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
    width: "100%",
  },
  chatMessageRowUser: {
    justifyContent: "flex-end",
  },
  chatMessageRowAdmin: {
    justifyContent: "flex-start",
  },
  chatAvatarUser: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#9D2A4B",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  chatAvatarAdmin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  chatBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  chatBubbleUser: {
    backgroundColor: "#9D2A4B",
    borderBottomRightRadius: 2,
  },
  chatBubbleAdmin: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chatInitialLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  chatMessageText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  chatBubbleTime: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 4,
    textAlign: "right",
  },
  chatInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 6, 16, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.25)",
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 4,
    marginTop: 12,
    marginBottom: 8,
  },
  chatTextInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    maxHeight: 80,
    paddingVertical: 8,
  },
  chatSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#9D2A4B",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
