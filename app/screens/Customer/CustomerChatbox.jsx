import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "http://UF-MacBook-Pro.local:3000";
const CHAT_GRADIENT_COLORS = ["#1b254f", "#0c1435", "#080927"];
const CUSTOMER_ROLE = "customer";
const DEFAULT_CUSTOMER_NAME = "Customer";
const DEFAULT_TAILOR_NAME = "Tailor";

const formatTime = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getConversationPreview = (item) => item.last_message || (item.last_image_url ? "Image" : "No messages yet");

const CustomerChatbox = ({ route }) => {
  const params = route?.params || {};
  const customerEmail = params.CustomerEmail || params.customerEmail || params.email || "";
  const routeTailorEmail = params.tailorEmail || "";
  const routeTailorName = params.tailorName || "";

  const [customerName, setCustomerName] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState("");
  const [sending, setSending] = useState(false);

  const fetchCustomerName = useCallback(async () => {
    if (!customerEmail) {
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/get-profile`, {
        params: { email: customerEmail },
      });
      setCustomerName(response.data?.user?.full_name || DEFAULT_CUSTOMER_NAME);
    } catch {
      setCustomerName(DEFAULT_CUSTOMER_NAME);
    }
  }, [customerEmail]);

  const fetchConversations = useCallback(
    async (showLoader = true) => {
      if (!customerEmail) {
        setConversations([]);
        setLoadingConversations(false);
        return;
      }

      if (showLoader) {
        setLoadingConversations(true);
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/chat-conversations`, {
          params: {
            email: customerEmail,
            role: CUSTOMER_ROLE,
          },
        });

        setConversations(response.data?.conversations || []);
      } catch {
        if (showLoader) {
          setConversations([]);
        }
      } finally {
        if (showLoader) {
          setLoadingConversations(false);
        }
      }
    },
    [customerEmail]
  );

  const fetchMessages = useCallback(
    async (conversation, showLoader = true) => {
      if (!conversation?.tailor_email || !customerEmail) {
        return;
      }

      if (showLoader) {
        setLoadingMessages(true);
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/chat-messages`, {
          params: {
            tailor_email: conversation.tailor_email,
            customer_email: customerEmail,
            viewer_role: CUSTOMER_ROLE,
          },
        });

        setMessages(response.data?.messages || []);
      } finally {
        if (showLoader) {
          setLoadingMessages(false);
        }
      }
    },
    [customerEmail]
  );

  useEffect(() => {
    fetchCustomerName();
    fetchConversations();
  }, [fetchCustomerName, fetchConversations]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(false);
      if (activeConversation) {
        fetchMessages(activeConversation, false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeConversation, fetchConversations, fetchMessages]);

  const routeConversation =
    routeTailorEmail && customerEmail
      ? {
          conversation_id: `${routeTailorEmail}::${customerEmail}`,
          tailor_email: routeTailorEmail,
          customer_email: customerEmail,
          tailor_name: routeTailorName || DEFAULT_TAILOR_NAME,
          customer_name: customerName || DEFAULT_CUSTOMER_NAME,
          last_message: "",
          unread_count: 0,
        }
      : null;

  const hasRouteConversationInList =
    !routeConversation ||
    conversations.some(
      (item) => item.tailor_email === routeConversation.tailor_email && item.customer_email === routeConversation.customer_email
    );

  const resetComposer = () => { setMessageText(""); setSelectedImageUri(""); };
  const closeConversation = () => { setActiveConversation(null); setMessages([]); resetComposer(); };

  const openConversation = async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    await fetchMessages(conversation, true);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setSelectedImageUri(result.assets[0].uri);
  };

  const uploadImage = async () => {
    if (!selectedImageUri) {
      return null;
    }

    const fileName = selectedImageUri.split("/").pop() || `chat_${Date.now()}.jpg`;
    const extension = fileName.split(".").pop() || "jpg";
    const mimeType = extension === "jpg" ? "image/jpeg" : `image/${extension}`;

    const formData = new FormData();
    formData.append("image", {
      uri: selectedImageUri,
      type: mimeType,
      name: fileName,
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/chat-upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data?.image_url || null;
    } catch (error) {
      const message = error?.response?.data?.error || "Failed to upload image";
      throw new Error(message);
    }
  };

  const sendMessage = async () => {
    if (!activeConversation || sending) {
      return;
    }

    const cleanMessage = messageText.trim();
    if (!cleanMessage && !selectedImageUri) {
      return;
    }

    setSending(true);

    try {
      const imageUrl = await uploadImage();

      await axios.post(`${API_BASE_URL}/chat-send-message`, {
        tailor_email: activeConversation.tailor_email,
        customer_email: customerEmail,
        tailor_name: activeConversation.tailor_name || DEFAULT_TAILOR_NAME,
        customer_name: customerName || activeConversation.customer_name || DEFAULT_CUSTOMER_NAME,
        sender_role: CUSTOMER_ROLE,
        message: cleanMessage,
        image_url: imageUrl,
      });

      resetComposer();

      await fetchMessages(activeConversation, false);
      await fetchConversations(false);
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Failed to send message";
      Alert.alert("Message not sent", message);
    } finally {
      setSending(false);
    }
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity style={styles.conversationItem} activeOpacity={0.86} onPress={() => openConversation(item)}>
      <View style={styles.conversationAvatar}>
        <Ionicons name="cut-outline" size={18} color="#99aaff" />
      </View>

      <View style={styles.conversationBody}>
        <Text style={styles.conversationName} numberOfLines={1}>
          {item.tailor_name || "Tailor"}
        </Text>
        <Text style={styles.conversationPreview} numberOfLines={1}>
          {getConversationPreview(item)}
        </Text>
      </View>

      <View style={styles.conversationMeta}>
        <Text style={styles.conversationTime}>{formatTime(item.last_datetime)}</Text>
        {item.unread_count > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }) => {
    const isMine = item.sender_role === "customer";
    const isSystemUnknown = !item.sender_role;

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowOther,
          isSystemUnknown && styles.messageRowUnknown,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
            isSystemUnknown && styles.messageBubbleUnknown,
          ]}>
          {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.messageImage} /> : null}

          {item.message ? <Text style={styles.messageText}>{item.message}</Text> : null}

          <Text style={styles.messageTime}>{formatTime(item.datetime)}</Text>
        </View>
      </View>
    );
  };

  if (!customerEmail) {
    return (
      <LinearGradient colors={CHAT_GRADIENT_COLORS} style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>Unable to open chat</Text>
          <Text style={styles.emptyText}>Missing customer email in navigation params.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={CHAT_GRADIENT_COLORS} style={styles.container}>
      {!activeConversation ? (
        <View style={styles.screenContent}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Customer Chat</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={() => fetchConversations(true)} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={18} color="#99aaff" />
            </TouchableOpacity>
          </View>

          {routeConversation && !hasRouteConversationInList ? (
            <TouchableOpacity style={styles.quickStartCard} activeOpacity={0.86} onPress={() => openConversation(routeConversation)}>
              <View style={styles.quickStartIconWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#d1d9ff" />
              </View>
              <View style={styles.quickStartTextWrap}>
                <Text style={styles.quickStartTitle}>Start chat with {routeConversation.tailor_name}</Text>
                <Text style={styles.quickStartSubtitle}>Tap to open this conversation</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {loadingConversations ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#99aaff" />
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.centerContent}>
              <Ionicons name="chatbubble-outline" size={42} color="#506ba9" />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>Open any tailor profile and tap the message icon to start chatting.</Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.conversation_id}
              renderItem={renderConversationItem}
              contentContainerStyle={styles.conversationList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.screenContent}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}>
          <View style={styles.threadHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={closeConversation}
              activeOpacity={0.85}>
              <Ionicons name="chevron-back" size={20} color="#d1d9ff" />
            </TouchableOpacity>

            <View style={styles.threadHeaderTextWrap}>
              <Text style={styles.threadTitle}>{activeConversation.tailor_name || "Tailor"}</Text>
              <Text style={styles.threadSubtitle}>{activeConversation.tailor_email}</Text>
            </View>
          </View>

          {loadingMessages ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#99aaff" />
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {selectedImageUri ? (
            <View style={styles.selectedImageRow}>
              <Image source={{ uri: selectedImageUri }} style={styles.selectedImagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImageUri("")} activeOpacity={0.85}>
                <Ionicons name="close-circle" size={22} color="#aabbff" />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.iconActionButton} onPress={pickImage} activeOpacity={0.85}>
              <Ionicons name="image-outline" size={19} color="#d1d9ff" />
            </TouchableOpacity>

            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type your message"
              placeholderTextColor="#8e9ccf"
              style={styles.input}
              multiline
            />

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={sendMessage}
              activeOpacity={0.85}
              disabled={sending}>
              {sending ? (
                <ActivityIndicator size="small" color="#d1d9ff" />
              ) : (
                <Ionicons name="send" size={18} color="#d1d9ff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 62 : 42,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: {
    color: "#d1d9ff",
    fontSize: 24,
    fontWeight: "800",
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.18)",
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickStartCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.2)",
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  quickStartIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(42,60,114,0.5)",
  },
  quickStartTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  quickStartTitle: {
    color: "#d1d9ff",
    fontSize: 14,
    fontWeight: "700",
  },
  quickStartSubtitle: {
    color: "#8e9ccf",
    fontSize: 12,
    marginTop: 2,
  },
  conversationList: {
    paddingBottom: 12,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  conversationAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(52,74,138,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  conversationBody: {
    flex: 1,
    marginLeft: 10,
  },
  conversationName: {
    color: "#d1d9ff",
    fontSize: 15,
    fontWeight: "700",
  },
  conversationPreview: {
    color: "#99aaff",
    fontSize: 13,
    marginTop: 2,
  },
  conversationMeta: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  conversationTime: {
    color: "#8e9ccf",
    fontSize: 11,
    fontWeight: "600",
  },
  unreadBadge: {
    marginTop: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#506ba9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#e6ebff",
    fontSize: 11,
    fontWeight: "800",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: "#d1d9ff",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyText: {
    color: "#8e9ccf",
    fontSize: 13,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 19,
  },
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(155,179,255,0.12)",
    marginBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  threadHeaderTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  threadTitle: {
    color: "#d1d9ff",
    fontSize: 16,
    fontWeight: "800",
  },
  threadSubtitle: {
    color: "#8e9ccf",
    fontSize: 12,
    marginTop: 2,
  },
  messageList: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 8,
    flexDirection: "row",
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  messageRowUnknown: {
    justifyContent: "center",
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  messageBubbleMine: {
    backgroundColor: "rgba(102,126,234,0.2)",
    borderColor: "rgba(155,179,255,0.2)",
  },
  messageBubbleOther: {
    backgroundColor: "rgba(16, 24, 52, 0.97)",
    borderColor: "rgba(155,179,255,0.12)",
  },
  messageBubbleUnknown: {
    backgroundColor: "rgba(45,58,96,0.75)",
  },
  messageImage: {
    width: 190,
    height: 190,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(8,15,33,0.55)",
  },
  messageText: {
    color: "#d1d9ff",
    fontSize: 14,
    lineHeight: 19,
  },
  messageTime: {
    color: "#99aaff",
    fontSize: 10,
    marginTop: 5,
    alignSelf: "flex-end",
  },
  selectedImageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  selectedImagePreview: {
    width: 62,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.2)",
  },
  removeImageButton: {
    marginLeft: 10,
  },
  inputRow: {
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(20, 28, 54, 0.6)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(155,179,255,0.16)",
    padding: 8,
  },
  iconActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(42,60,114,0.5)",
  },
  input: {
    flex: 1,
    color: "#d1d9ff",
    fontSize: 14,
    maxHeight: 90,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(80,109,189,0.8)",
  },
  sendButtonDisabled: {
    opacity: 0.65,
  },
});

export default CustomerChatbox;
