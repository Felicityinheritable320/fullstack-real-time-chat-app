import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// ✅ GET USERS FOR SIDEBAR
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getUsers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ GET MESSAGES BETWEEN 2 USERS
export const getMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const userToChatId = req.params.id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ SEND MESSAGE
import cloudinary from "../lib/cloudinary.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.id;
    const { text } = req.body;

    let imageUrl = "";
    let fileUrl = "";
    let fileName = "";

    // IMAGE
    if (req.body.image) {
      const upload = await cloudinary.uploader.upload(req.body.image);
      imageUrl = upload.secure_url;
    }

    // FILE
    if (req.body.file) {
      const upload = await cloudinary.uploader.upload(req.body.file, {
        resource_type: "raw",
      });
      fileUrl = upload.secure_url;
      fileName = req.body.fileName;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      file: fileUrl,
      fileName,
    });

    await newMessage.save();

    // 🔥 REALTIME EMIT
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(200).json(newMessage);

  } catch (error) {
    console.log("SEND ERROR:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};