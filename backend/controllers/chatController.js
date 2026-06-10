export const createChatController = ({
  ChatMessage,
  transporter,
  uploadBufferToCloudinary,
  CHAT_IMAGE_FOLDER,
  normalizeChatRole,
  isSupportedChatRole,
  encodeChatMessage,
  decodeChatMessage,
  getConversationKey,
  toDecodedChatRow,
  getChatPreview,
  runChatboxQuery,
}) => {
  return {
    getConversations: async (req, res) => {
      const { email, role } = req.query;
      const normalizedRole = normalizeChatRole(role);

      if (!email || !isSupportedChatRole(normalizedRole)) {
        return res.status(400).json({ error: "email and role (customer|tailor) are required" });
      }

      const column = normalizedRole === "customer" ? "customer_email" : "tailor_email";

      try {
        const data = await runChatboxQuery(() =>
          ChatMessage.find({ [column]: email })
            .sort({ datetime: -1 })
            .exec()
        );

        const conversationMap = new Map();

        for (const row of data || []) {
          const key = getConversationKey(row.tailor_email, row.customer_email);
          const decoded = decodeChatMessage(row.message);
          const isUnreadIncoming = Boolean(
            decoded.sender_role &&
            decoded.sender_role !== normalizedRole &&
            !row.is_read
          );
          const existing = conversationMap.get(key);

          if (existing) {
            if (isUnreadIncoming) {
              existing.unread_count += 1;
            }
          } else {
            conversationMap.set(key, {
              conversation_id: key,
              tailor_email: row.tailor_email,
              customer_email: row.customer_email,
              tailor_name: row.tailor_name,
              customer_name: row.customer_name,
              last_message: decoded.message || (row.image_url ? "[Image]" : ""),
              last_image_url: row.image_url,
              last_datetime: row.datetime,
              unread_count: isUnreadIncoming ? 1 : 0,
            });
          }
        }

        res.json({ conversations: Array.from(conversationMap.values()) });
      } catch (err) {
        console.error("Chat conversations error:", err);
        res.status(500).json({ error: "Failed to fetch conversations" });
      }
    },

    getMessages: async (req, res) => {
      const { tailor_email, customer_email, viewer_role } = req.query;
      const normalizedViewerRole = normalizeChatRole(viewer_role);

      if (!tailor_email || !customer_email) {
        return res.status(400).json({ error: "tailor_email and customer_email are required" });
      }

      try {
        const data = await runChatboxQuery(() =>
          ChatMessage.find({ tailor_email, customer_email })
            .sort({ datetime: 1 })
            .exec()
        );

        const messages = (data || []).map(toDecodedChatRow);

        if (isSupportedChatRole(normalizedViewerRole)) {
          const incomingRole =
            normalizedViewerRole === "customer" ? "tailor" : "customer";

          const messagePattern = new RegExp(`^\\[\\[${incomingRole}\\]\\]`, "i");
          await runChatboxQuery(() =>
            ChatMessage.updateMany(
              {
                tailor_email,
                customer_email,
                is_read: false,
                message: { $regex: messagePattern },
              },
              { is_read: true }
            )
          );
        }

        res.json({ messages });
      } catch (err) {
        console.error("Chat messages error:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
      }
    },

    sendMessage: async (req, res) => {
      const {
        tailor_email,
        customer_email,
        tailor_name,
        customer_name,
        sender_role,
        message,
        image_url,
      } = req.body;

      const normalizedSenderRole = normalizeChatRole(sender_role);
      const messageText = typeof message === "string" ? message.trim() : "";

      if (!tailor_email || !customer_email || !tailor_name || !customer_name) {
        return res.status(400).json({ error: "tailor/customer names and emails are required" });
      }

      if (!isSupportedChatRole(normalizedSenderRole)) {
        return res.status(400).json({ error: "sender_role must be customer or tailor" });
      }

      if (!messageText && !image_url) {
        return res.status(400).json({ error: "message text or image is required" });
      }

      try {
        const encodedMessage = encodeChatMessage(normalizedSenderRole, messageText);

        const data = await runChatboxQuery(() =>
          ChatMessage.create({
            tailor_email,
            customer_email,
            tailor_name,
            customer_name,
            message: encodedMessage,
            image_url: image_url || null,
            is_read: false,
            datetime: new Date(),
          })
        );

        const decoded = decodeChatMessage(data.message);
        const isSenderCustomer = normalizedSenderRole === "customer";
        const recipientEmail = isSenderCustomer ? tailor_email : customer_email;
        const senderName = isSenderCustomer ? customer_name : tailor_name;
        const preview = getChatPreview(decoded.message, image_url);

        transporter
          .sendMail({
            from: `"TailorX" <${process.env.BREVO_FROM}>`,
            to: recipientEmail,
            subject: `New message from ${normalizedSenderRole}: ${senderName}`,
            text:
              `You have received a new message on TailorX.\n\n` +
              `From: ${senderName} (${normalizedSenderRole})\n` +
              `Message preview: ${preview}\n\n` +
              `Open the app to reply.`,
          })
          .catch((mailError) => {
            console.error("Chat notification email error:", mailError.message);
          });

        res.json({
          message: "Message sent",
          chat: {
            ...data,
            sender_role: decoded.sender_role,
            message: decoded.message,
          },
        });
      } catch (err) {
        console.error("Send chat message error:", err);
        res.status(500).json({ error: "Failed to send message" });
      }
    },

    uploadImage: async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      try {
        const uploadResult = await uploadBufferToCloudinary(
          req.file.buffer,
          {
            folder: CHAT_IMAGE_FOLDER,
            resource_type: "image",
          },
          req
        );

        return res.json({ image_url: uploadResult.secure_url, bucket: "cloudinary" });
      } catch (error) {
        console.error("Chat image upload error:", error.message);
        return res.status(500).json({ error: "Failed to upload image" });
      }
    },
  };
};
