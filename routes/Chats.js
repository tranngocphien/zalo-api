const chatController = require("../controllers/Chats");
const { asyncWrapper } = require("../utils/asyncWrapper");
const express = require("express");
const chatsRoutes = express.Router();
const auth = require("../middlewares/auth");

chatsRoutes.post("/send", auth, asyncWrapper(chatController.send));

chatsRoutes.get(
  "/getMessages/:chatId",
  auth,
  asyncWrapper(chatController.getMessages)
);

chatsRoutes.get("/getMessaged", auth, asyncWrapper(chatController.getMessaged));

// Lấy danh sách các cuộc hội thoại.
chatsRoutes.get(
    "/getChats/:userId",
    auth,
    asyncWrapper(chatController.getChats),
);


module.exports = chatsRoutes;
