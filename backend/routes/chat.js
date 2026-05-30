import express from "express";
import { createChatController } from "../controllers/chatController.js";
import { authenticateToken } from "../middleware/auth.js";

export const createChatRouter = ({
  ChatMessage,
  transporter,
  upload,
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
  const router = express.Router();
  const controller = createChatController({
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
  });

  // Apply authentication middleware to all chat routes
  router.use(authenticateToken);

  router.get("/chat-conversations", controller.getConversations);
  router.get("/chat-messages", controller.getMessages);
  router.post("/chat-send-message", controller.sendMessage);
  router.post("/chat-upload-image", upload.single("image"), controller.uploadImage);

  return router;
};
