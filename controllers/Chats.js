const { PRIVATE_CHAT, GROUP_CHAT } = require("../constants/constants");
const ChatModel = require("../models/Chats");
const MessagesModel = require("../models/Messages");
const httpStatus = require("../utils/httpStatus");
const chatController = {};
chatController.send = async (req, res, next) => {
  try {
    let userId = req.userId;
    const { name, chatId, receivedId, member, type, content } = req.body;
    let chatIdSend = null;
    let chat;
    if (type === PRIVATE_CHAT) {
      if (chatId) {
        chat = await ChatModel.findById(chatId);
        if (chat !== null) {
          chatIdSend = chat._id;
        }
      } else {
        chat = new ChatModel({
          type: PRIVATE_CHAT,
          member: [receivedId, userId],
        });
        await chat.save();
        chatIdSend = chat._id;
      }
    } else if (type === GROUP_CHAT) {
      if (chatId) {
        chat = await ChatModel.findById(chatId);
        if (chat !== null) {
          chatIdSend = chat._id;
        }
      } else {
        chat = new ChatModel({
          type: GROUP_CHAT,
          member: member,
        });
        await chat.save();
        chatIdSend = chat._id;
      }
    }
    if (chatIdSend) {
      if (content) {
        let message = new MessagesModel({
          chat: chatIdSend,
          user: userId,
          content: content,
        });
        await message.save();
        let messageNew = await MessagesModel.findById(message._id)
          .populate("chat")
          .populate("user");
        return res.status(httpStatus.OK).json({
          data: messageNew,
        });
      } else {
        return res.status(httpStatus.OK).json({
          data: chat,
          message: "Create chat success",
          response: "CREATE_CHAT_SUCCESS",
        });
      }
    } else {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Not chat",
      });
    }
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};
chatController.getMessages = async (req, res, next) => {
  try {
    let messages = await MessagesModel.find({
      chat: req.params.chatId,
    }).populate({
      path: "user",
      select:
        "phonenumber username gender birthday avatar blocked_inbox blocked_diary",
      models: "Users",
      populate: {
        path: "avatar",
        select: "_id fileName",
        model: "Documents",
      },
    });
    return res.status(httpStatus.OK).json({
      data: messages,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

chatController.getMessaged = async (req, res, next) => {
  let userId = req.userId;
  let listChats = await ChatModel.find({ member: { $all: [userId] } });
  let listMessages = await MessagesModel.find({ chat: { $in: listChats } })
    .populate("user")
    .populate({
      path: "chat",
      select: "_id member",
      model: "Chats",
      populate: {
        path: "member",
        select: "_id username avatar ",
        match: { _id: { $ne: req.userId } },
        model: "Users",
        populate: {
          path: "avatar",
          select: "_id fileName",
          model: "Documents",
        },
      },
    });
  let map = new Map();
  for (let message of listMessages) {
    let key = message.chat.toString();

    if (map.has(key)) {
      if (map.get(key).updatedAt < message.updatedAt) {
        map.set(key, message);
      }
    } else {
      map.set(key, message);
    }
  }

  let result = [];
  for (let [key, value] of map) {
    result.push(value);
  }

  return res.status(httpStatus.OK).json({
    data: result,
    message: "Get list success",
    response: "GET LIST SUCCESS",
  });
};

// Xử lý lấy danh sách cuộc hội thoại
chatController.getChats = async (req, res, next) => {
  try {
    let chats = await ChatModel.find({
      member: req.params.userId,
    });

    // Danh sách các chatID của người dùng đang chat
    let _ids = chats.map((chat) => chat._id);

    // Chỉ lấy danh sách các message cuối cùng của các conversation.
    let last_messages = await Promise.all(
      _ids.map(async (id) => {
        let messages = await MessagesModel.find({
          chat: id,
        }).populate("user");
        return messages.slice(-1)[0];
      })
    );

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      data: last_messages,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

module.exports = chatController;
