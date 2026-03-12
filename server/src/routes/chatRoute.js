import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getConversationsController,
  createConversationController,
  getConversationController,
  getMessagesController,
  sendMessageController,
  markReadController,
  getAvailablePeopleController,
  getVerifyWithExpertContextController,
  updateConversationController,
  removeConversationMemberController,
  getTotalUnreadCountController,
  deleteMessageController,
} from "../controllers/chatController.js";

const router = Router();

router.use(authenticate);

router.get("/unread-count", getTotalUnreadCountController);
router.get("/conversations", getConversationsController);
router.post("/conversations", createConversationController);
router.get("/conversations/:id", getConversationController);
router.patch("/conversations/:id", updateConversationController);
router.get("/conversations/:id/messages", getMessagesController);
router.post("/conversations/:id/messages", sendMessageController);
router.post("/conversations/:id/read", markReadController);
router.delete("/conversations/:id/messages/:msgId", deleteMessageController);
router.delete("/conversations/:id/members/:userId", removeConversationMemberController);

router.get("/available-people", getAvailablePeopleController);
router.get("/verify-with-expert/context", authorize("user"), getVerifyWithExpertContextController);

export default router;
