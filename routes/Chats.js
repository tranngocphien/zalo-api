const chatController = require("../controllers/Chats");
const {asyncWrapper} = require("../utils/asyncWrapper");
const express = require("express");
const chatsRoutes = express.Router();
const auth = require("../middlewares/auth");

chatsRoutes.post(
    "/send",
    auth,
    asyncWrapper(chatController.send),
);

chatsRoutes.get(
    "/getMessages/:chatId",
    auth,
    asyncWrapper(chatController.getMessages),
);

chatsRoutes.get(
    "/getChats",
    auth,
    asyncWrapper(chatController.getChats),
);

chatsRoutes.post(
    "/getGroupChats",
    auth,
    asyncWrapper(chatController.getGroupChats),
);

chatsRoutes.post(
    "/createGroupChat",
    auth,
    asyncWrapper(chatController.createGroupChat),
);

chatsRoutes.post(
    "/createChat",
    auth,
    asyncWrapper(chatController.createChat),
);

module.exports = chatsRoutes;