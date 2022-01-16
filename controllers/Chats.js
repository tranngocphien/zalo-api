const { PRIVATE_CHAT, GROUP_CHAT } = require("../constants/constants");
const ChatModel = require("../models/Chats");
const DocumentModel = require("../models/Documents");
const MessagesModel = require("../models/Messages");
const httpStatus = require("../utils/httpStatus");
const chatController = {};
chatController.send = async (req, res, next) => {
  try {
    let userId = req.userId;
    const {
      name, // Tên cuộc hội thoại, vì có thể chỉnh sửa ?
      chatId,
      member,
      type,
      content,
    } = req.body;
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
          name: name,
          type: PRIVATE_CHAT,
          member: member,
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
          name: name,
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
          .populate({
            path: "user",
            select:
              "id phonenumber username gender birthday avatar blocked_inbox blocked_diary",
            models: "Users",
            populate: {
              path: "avatar",
              select: "_id fileName",
              model: "Documents",
            },
          });
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
        "id phonenumber username gender birthday avatar blocked_inbox blocked_diary",
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

chatController.getChats = async (req, res, next) => {
  try {
    let chats = await ChatModel.find({
      member: req.userId,
    })
      .select("_id name member type")
      .populate({
        path: "member",
        select: "_id username avatar",
      });

    // Lấy hết danh sách chat.
    for (var i = 0; i < chats.length; i++) {
      chats[i]["member"] = await Promise.all(
        chats[i]["member"].map(async (user) => {
          user["avatar"] = await DocumentModel.findById(user["avatar"]);
          return user;
        })
      );
      chats[i] = chats[i].toJSON();
      chats[i]["message"] = await MessagesModel.find({ chat: chats[i]["_id"] })
        .select("user content createdAt updatedAt")
        .populate({
          path: "user",
          select: "_id username avatar phonenumber",
        });
    }

    return res.status(200).json({
      chat: chats,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

chatController.getGroupChats = async (req, res, next) => {
  try {
    let groupChats = await ChatModel.find({
      member: req.userId,
      type: "GROUP_CHAT",
    })
      .select("_id name member type")
      .populate({
        path: "member",
        select: "_id username avatar",
      });

    groupChats = await Promise.all(
      groupChats.map(async (chat) => {
        chat["member"] = await Promise.all(
          chat["member"].map(async (user) => {
            user["avatar"] = await DocumentModel.findById(user["avatar"]);
            return user;
          })
        );

        return chat;
      })
    );

    return res.status(200).json({
      chat: groupChats,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

chatController.createGroupChat = async (req, res, next) => {
  try {
    const {
      name, // Tên cuộc hội thoại, vì có thể chỉnh sửa ?
      member,
    } = req.body;

    chat = new ChatModel({
      name: name,
      type: GROUP_CHAT,
      member: member,
    });
    await chat.save();
    var chatId = await chat._id;
    return res.status(httpStatus.OK).json({
      data: chat,
      message: "Create group chat success",
      response: "CREATE_GROUP_CHAT_SUCCESS",
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

chatController.createChat = async (req, res, next) => {
  try {
    const { member } = req.body;
    chat = new ChatModel({
      type: PRIVATE_CHAT,
      member: member,
    });
    await chat.save();
    return res.status(httpStatus.OK).json({
      data: chat,
      message: "Create group chat success",
      response: "CREATE_GROUP_CHAT_SUCCESS",
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

module.exports = chatController;
