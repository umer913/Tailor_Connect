import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
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

const SERVER = `${API_BASE_URL}`;

const SPECIAL_ISSUES = ["Customer Misbehaviour", "Payment Not Received", "Order Cancellation"];

const ISSUE_OPTIONS = [
  { label: "General Platform Issue", value: "General", icon: "help-circle-outline" },
  { label: "Customer Misbehaviour", value: "Customer Misbehaviour", icon: "people-outline" },
  { label: "Payment Not Received", value: "Payment Not Received", icon: "card-outline" },
  { label: "Order Cancellation", value: "Order Cancellation", icon: "close-circle-outline" },
  { label: "Other", value: "Other", icon: "ellipsis-horizontal-outline" },
];

const getIssueIcon = (type) => {
  const opt = ISSUE_OPTIONS.find((o) => o.value === type);
  return opt ? opt.icon : "alert-circle-outline";
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatChatTime = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return (
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) +
    " • " +
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );
};

const parseDescriptionToMessages = (descriptionText, adminResponse, resolvedAt, createdAt) => {
  const messages = [];
  if (!descriptionText) return messages;

  const followUpRegex = /\[Follow-up ([^\]]+)\]/g;
  let match;
  const positions = [];
  while ((match = followUpRegex.exec(descriptionText)) !== null) {
    positions.push({ index: match.index, timestamp: match[1], length: match[0].length });
  }

  if (positions.length === 0) {
    messages.push({ sender: "user", text: descriptionText.trim(), time: createdAt || null, isInitial: true });
  } else {
    const initialText = descriptionText.substring(0, positions[0].index).trim();
    if (initialText) {
      messages.push({ sender: "user", text: initialText, time: createdAt || null, isInitial: true });
    }
    for (let i = 0; i < positions.length; i++) {
      const cur = positions[i];
      const startOfText = cur.index + cur.length;
      const endOfText = i + 1 < positions.length ? positions[i + 1].index : descriptionText.length;
      const msgText = descriptionText.substring(startOfText, endOfText).trim();
      messages.push({ sender: "user", text: msgText, time: cur.timestamp, isInitial: false });
    }
  }

  if (adminResponse) {
    messages.push({ sender: "admin", text: adminResponse, time: resolvedAt || null, isInitial: false });
  }
  return messages;
};

const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_W = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

// ── Styled input sub-component ─────────────────────────────────────────────
const StyledInput = ({ placeholder, value, onChangeText, multiline, icon }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.inputWrap}>
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={focused ? "#F59E0B" : "#64748b"}
          style={styles.inputIcon}
        />
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#334155"
        style={[
          styles.input,
          multiline && { minHeight: 90, textAlignVertical: "top" },
          icon && { paddingLeft: 38 },
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

// ── Main component ─────────────────────────────────────────────────────────
export default function TailorComplainBox({ route, navigation }) {
  const email = route.params?.email;

  const [selectedIssue, setSelectedIssue] = useState("");
  const [againstEmail, setAgainstEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [followUps, setFollowUps] = useState({});
  const [activeTab, setActiveTab] = useState("new");
  const [expandedId, setExpandedId] = useState(null);
  const [showPickerModal, setShowPickerModal] = useState(false);

  const shouldShowFields = SPECIAL_ISSUES.includes(selectedIssue);

  const resetForm = () => {
    setAgainstEmail(""); setOrderId(""); setSelectedIssue("");
    setSubject(""); setDescription(""); setImage(null);
  };

  const setFollowUpText = (id, text) => setFollowUps((p) => ({ ...p, [id]: text }));
  const clearFollowUpText = (id) => setFollowUps((p) => ({ ...p, [id]: "" }));
  const toggleExpand = (id) => setExpandedId((p) => (p === id ? null : id));

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${SERVER}/complaints/my-complaints/${email}`);
      setComplaints(res.data);
    } catch { Alert.alert("Error fetching complaints"); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const deleteComplaint = async (id) => {
    Alert.alert("Confirm Delete", "Remove this complaint permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${SERVER}/complaints/delete-complaint/${id}/${email}`);
            fetchComplaints();
          } catch { Alert.alert("Error deleting complaint"); }
        },
      },
    ]);
  };

  const submitComplaint = async () => {
    if (!subject || !description) { Alert.alert("Please fill required fields"); return; }
    if (shouldShowFields && (!againstEmail || !orderId)) {
      Alert.alert("Customer Email and Order ID are required for this issue type");
      return;
    }
    try {
      await axios.post(`${SERVER}/complaints/file-complaint`, {
        filed_by_email: email,
        filed_by_role: "tailor",
        against_email: againstEmail || null,
        order_id: orderId || null,
        complaint_type: selectedIssue,
        subject,
        description,
        attachment_url: image || null,
      });
      Alert.alert("Complaint submitted successfully");
      resetForm();
      fetchComplaints();
      setActiveTab("history");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Error submitting complaint");
    }
  };

  const sendFollowUp = async (complaintId) => {
    const message = String(followUps[complaintId] || "").trim();
    if (!message) { Alert.alert("Write a message first"); return; }
    try {
      await axios.post(`${SERVER}/complaints/follow-up`, {
        complaint_id: complaintId, filed_by_email: email, message,
      });
      clearFollowUpText(complaintId);
      fetchComplaints();
      Alert.alert("Follow-up sent");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Could not send follow-up");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={["#050811", "#0b1220", "#141c30"]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#050811" />

      {/* HEADER */}
      <LinearGradient
        colors={["rgba(59,130,246,0.18)", "rgba(0,0,0,0)"]}
        style={styles.header}
      >
        <View style={styles.headerInner}>

          <View style={styles.headerIconWrap}>
            <Ionicons name="megaphone-outline" size={22} color="#F59E0B" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Complaint Center</Text>
            <Text style={styles.headerSubtitle}>Raise concerns professionally</Text>
          </View>
        </View>
      </LinearGradient>

      {/* TABS */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "new" && styles.tabButtonActive]}
          onPress={() => setActiveTab("new")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle-outline" size={16}
            color={activeTab === "new" ? "#fff" : "#64748b"}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabButtonText, activeTab === "new" && styles.tabButtonTextActive]}>
            File Complaint
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "history" && styles.tabButtonActive]}
          onPress={() => setActiveTab("history")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="folder-open-outline" size={16}
            color={activeTab === "history" ? "#fff" : "#64748b"}
            style={{ marginRight: 6 }}
          />
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

        {/* ════ FILE COMPLAINT TAB ════ */}
        {activeTab === "new" && (
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>File a Complaint</Text>
            </View>

            {/* Issue type picker */}
            <TouchableOpacity
              style={styles.customPicker}
              onPress={() => setShowPickerModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={selectedIssue ? getIssueIcon(selectedIssue) : "options-outline"}
                size={18}
                color="#F59E0B"
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.pickerText, !selectedIssue && { color: "#334155" }]}>
                {selectedIssue
                  ? ISSUE_OPTIONS.find((o) => o.value === selectedIssue)?.label
                  : "Select Issue Type *"}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color="#64748b" style={{ marginLeft: "auto" }} />
            </TouchableOpacity>

            {shouldShowFields && (
              <>
                <StyledInput placeholder="Customer Email *" value={againstEmail} onChangeText={setAgainstEmail} icon="mail-outline" />
                <StyledInput placeholder="Order ID *" value={orderId} onChangeText={setOrderId} icon="receipt-outline" />
              </>
            )}

            <StyledInput placeholder="Subject *" value={subject} onChangeText={setSubject} icon="document-text-outline" />
            <StyledInput placeholder="Description *" value={description} onChangeText={setDescription} multiline icon="create-outline" />

            {/* Image upload — no expo-image-picker used, just placeholder button */}
            <TouchableOpacity style={styles.imageButton} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={styles.imageButtonText}>{image ? "Change Proof Image" : "Upload Proof Image"}</Text>
            </TouchableOpacity>

            {image && (
              <View style={styles.previewWrap}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImgBtn} onPress={() => setImage(null)}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={submitComplaint} activeOpacity={0.85} style={{ marginTop: 16 }}>
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                style={styles.submitButton}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>Submit Complaint</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ════ HISTORY TAB ════ */}
        {activeTab === "history" && (
          <View style={styles.listSection}>
            {complaints.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="checkmark-circle-outline" size={40} color="rgba(245,158,11,0.4)" />
                </View>
                <Text style={styles.emptyText}>No complaints filed yet.</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setActiveTab("new")}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.emptyButtonGrad}>
                    <Text style={styles.emptyButtonText}>File Your First Complaint</Text>
                  </LinearGradient>
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
                    {/* Accordion header */}
                    <TouchableOpacity
                      style={styles.accordionHeader}
                      onPress={() => toggleExpand(item.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <View style={styles.cardIconWrap}>
                          <Ionicons name={getIssueIcon(item.complaint_type)} size={18} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{item.subject}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                            <Text style={styles.cardCategoryText}>{item.complaint_type || "General"}</Text>
                            {(item.created_at || item.createdAt) && (
                              <>
                                <View style={styles.dotSeparator} />
                                <Text style={styles.cardTimeText}>
                                  {formatDate(item.created_at || item.createdAt)}
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={[styles.statusBadge, {
                          backgroundColor: item.resolved_at ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                          borderColor: item.resolved_at ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)",
                        }]}>
                          <View style={[styles.statusDot, { backgroundColor: item.resolved_at ? "#10b981" : "#F59E0B" }]} />
                          <Text style={[styles.statusText, { color: item.resolved_at ? "#10b981" : "#F59E0B" }]}>
                            {item.resolved_at ? "Resolved" : "Pending"}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={18} color="#64748b"
                          style={{ marginLeft: 8 }}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expanded body */}
                    {isExpanded && (
                      <View style={styles.cardDetails}>
                        <View style={styles.cardDivider} />

                        {(item.against_email || item.order_id) && (
                          <View style={styles.metaRow}>
                            {item.against_email && (
                              <View style={styles.metaBadge}>
                                <Ionicons name="mail-outline" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                                <Text style={styles.metaBadgeText} numberOfLines={1}>{item.against_email}</Text>
                              </View>
                            )}
                            {item.order_id && (
                              <View style={styles.metaBadge}>
                                <Ionicons name="receipt-outline" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
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

                        {/* Chat-style conversation */}
                        <View style={styles.chatSection}>
                          <Text style={styles.detailsLabel}>Conversation History</Text>
                          <View style={styles.chatContainer}>
                            {parsedMessages.map((msg, idx) => {
                              const isUser = msg.sender === "user";
                              return (
                                <View
                                  key={idx}
                                  style={[
                                    styles.chatMessageRow,
                                    isUser ? styles.chatMessageRowUser : styles.chatMessageRowAdmin,
                                  ]}
                                >
                                  {!isUser && (
                                    <View style={styles.chatAvatarAdmin}>
                                      <Ionicons name="shield-checkmark" size={12} color="#fff" />
                                    </View>
                                  )}
                                  <View style={[
                                    styles.chatBubble,
                                    isUser ? styles.chatBubbleUser : styles.chatBubbleAdmin,
                                  ]}>
                                    {msg.isInitial && (
                                      <Text style={styles.chatInitialLabel}>Initial Complaint Details</Text>
                                    )}
                                    <Text style={styles.chatMessageText}>{msg.text}</Text>
                                    {msg.time && (
                                      <Text style={styles.chatBubbleTime}>{formatChatTime(msg.time)}</Text>
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

                        {/* Follow-up input */}
                        {!item.resolved_at && (
                          <View style={styles.chatInputWrapper}>
                            <TextInput
                              placeholder="Type a follow-up message..."
                              placeholderTextColor="#334155"
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
                          <Ionicons name="trash-outline" size={14} color="#EF4444" style={{ marginRight: 6 }} />
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

      {/* ISSUE TYPE MODAL */}
      <Modal
        visible={showPickerModal}
        transparent
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
                <Ionicons name="close" size={22} color="#94a3b8" />
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
                  onPress={() => { setSelectedIssue(opt.value); setShowPickerModal(false); }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={[
                      styles.modalOptionIconWrap,
                      selectedIssue === opt.value && styles.modalOptionIconWrapActive,
                    ]}>
                      <Ionicons
                        name={opt.icon} size={18}
                        color={selectedIssue === opt.value ? "#fff" : "#F59E0B"}
                      />
                    </View>
                    <Text style={[
                      styles.modalOptionText,
                      selectedIssue === opt.value && styles.modalOptionTextSelected,
                    ]}>
                      {opt.label}
                    </Text>
                  </View>
                  {selectedIssue === opt.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 24,
    paddingHorizontal: PAGE_GUTTER,
  },
  headerInner: { flexDirection: "row", alignItems: "center", gap: 0 },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  headerIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1, borderColor: "rgba(245,158,11,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 21, fontWeight: "800" },
  headerSubtitle: { color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 2 },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(15,23,42,0.6)",
    padding: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.15)",
    marginHorizontal: PAGE_GUTTER,
    marginTop: 4,
    marginBottom: 10,
    maxWidth: CONTENT_MAX_W,
    alignSelf: "center",
    width: SCREEN_W - PAGE_GUTTER * 2,
  },
  tabButton: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 12, borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1, borderColor: "rgba(245,158,11,0.35)",
  },
  tabButtonText: { color: "#64748b", fontSize: 14, fontWeight: "600" },
  tabButtonTextActive: { color: "#fff", fontSize: 14, fontWeight: "800" },
  badge: {
    backgroundColor: "#F59E0B", borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6,
  },
  badgeText: { color: "#000", fontSize: 10, fontWeight: "800" },

  // Scroll
  scrollContent: {
    paddingHorizontal: PAGE_GUTTER, paddingBottom: 50, paddingTop: 8,
    width: "100%", maxWidth: CONTENT_MAX_W, alignSelf: "center",
  },

  // Form card
  formCard: {
    backgroundColor: "rgba(15,23,42,0.6)",
    padding: 20, borderRadius: 22,
    borderWidth: 1, borderColor: "rgba(59,130,246,0.18)",
    marginBottom: 20,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  sectionDot: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  // Custom picker button
  customPicker: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.5)",
    borderWidth: 1, borderColor: "rgba(245,158,11,0.2)",
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12,
  },
  pickerText: { color: "#fff", fontSize: 14, fontWeight: "500" },

  // Inputs
  inputWrap: { position: "relative", marginBottom: 12 },
  inputIcon: { position: "absolute", left: 12, top: 14, zIndex: 1 },
  input: {
    backgroundColor: "rgba(15,23,42,0.5)",
    borderWidth: 1, borderColor: "rgba(59,130,246,0.18)",
    color: "#fff", padding: 13, borderRadius: 14, fontSize: 14,
  },
  inputFocused: {
    borderColor: "rgba(245,158,11,0.5)",
    shadowColor: "#F59E0B", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 6,
  },

  // Image
  imageButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.08)",
    padding: 13, borderRadius: 14, marginTop: 4,
    borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderStyle: "dashed",
  },
  imageButtonText: { color: "#F59E0B", fontWeight: "700", fontSize: 14 },
  previewWrap: { position: "relative", marginVertical: 12 },
  previewImage: { width: "100%", height: 180, borderRadius: 14 },
  removeImgBtn: { position: "absolute", top: 8, right: 8, backgroundColor: "#fff", borderRadius: 12 },

  // Submit
  submitButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: 16, paddingVertical: 15,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  // History list
  listSection: { width: "100%", maxWidth: CONTENT_MAX_W, alignSelf: "center" },

  // Empty state
  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(245,158,11,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyText: { color: "#94a3b8", fontSize: 15, fontWeight: "700", marginBottom: 20 },
  emptyButton: { borderRadius: 14, overflow: "hidden" },
  emptyButtonGrad: { paddingVertical: 13, paddingHorizontal: 28 },
  emptyButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // Complaint card
  card: {
    backgroundColor: "rgba(15,23,42,0.65)",
    borderRadius: 20, borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
    marginBottom: 14, overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row", alignItems: "center",
    padding: 16, justifyContent: "space-between",
  },
  cardIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1, borderColor: "rgba(245,158,11,0.2)",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  cardCategoryText: { color: "#F59E0B", fontSize: 11, fontWeight: "700" },
  cardTimeText: { color: "#475569", fontSize: 11, fontWeight: "600" },
  dotSeparator: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#475569", marginHorizontal: 6 },

  statusBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "800" },

  // Expanded body
  cardDetails: { paddingHorizontal: 16, paddingBottom: 16 },
  cardDivider: { height: 1, backgroundColor: "rgba(59,130,246,0.12)", marginBottom: 14 },
  detailsLabel: { color: "#64748b", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  metaBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1, borderColor: "rgba(245,158,11,0.2)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  metaBadgeText: { color: "#F59E0B", fontSize: 11, fontWeight: "700" },

  cardImage: { width: "100%", height: 150, borderRadius: 14, marginBottom: 12 },

  // Chat
  chatSection: { marginBottom: 14 },
  chatContainer: { gap: 10 },
  chatMessageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  chatMessageRowUser: { justifyContent: "flex-end" },
  chatMessageRowAdmin: { justifyContent: "flex-start" },

  chatAvatarUser: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#F59E0B",
    alignItems: "center", justifyContent: "center",
  },
  chatAvatarAdmin: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#3B82F6",
    alignItems: "center", justifyContent: "center",
  },
  chatBubble: {
    maxWidth: "75%", borderRadius: 16, padding: 12,
  },
  chatBubbleUser: {
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1, borderColor: "rgba(245,158,11,0.25)",
    borderBottomRightRadius: 4,
  },
  chatBubbleAdmin: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth: 1, borderColor: "rgba(59,130,246,0.25)",
    borderBottomLeftRadius: 4,
  },
  chatInitialLabel: {
    color: "#F59E0B", fontSize: 9, fontWeight: "800",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4,
  },
  chatMessageText: { color: "#e2e8f0", fontSize: 13, lineHeight: 18 },
  chatBubbleTime: { color: "#475569", fontSize: 10, fontWeight: "600", marginTop: 4 },

  // Follow-up input
  chatInputWrapper: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: "rgba(15,23,42,0.7)",
    borderWidth: 1, borderColor: "rgba(59,130,246,0.18)",
    borderRadius: 16, padding: 6, marginBottom: 12, gap: 6,
  },
  chatTextInput: {
    flex: 1, color: "#fff", fontSize: 13, padding: 8,
    maxHeight: 100, minHeight: 40,
  },
  chatSendButton: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#F59E0B",
    alignItems: "center", justifyContent: "center",
  },

  deleteButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 10, borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
  },
  deleteText: { color: "#EF4444", fontWeight: "700", fontSize: 13 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(5,8,17,0.88)",
    justifyContent: "center", alignItems: "center",
  },
  modalContent: {
    width: "88%", maxWidth: 360,
    backgroundColor: "#0b1220",
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: "rgba(59,130,246,0.25)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 15, elevation: 10,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(59,130,246,0.12)",
  },
  modalTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  modalOption: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 12, marginVertical: 3,
  },
  modalOptionSelected: { backgroundColor: "rgba(245,158,11,0.12)" },
  modalOptionText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
  modalOptionTextSelected: { color: "#fff", fontWeight: "800" },
  modalOptionIconWrap: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: "rgba(245,158,11,0.08)",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  modalOptionIconWrapActive: { backgroundColor: "rgba(245,158,11,0.25)" },
});
