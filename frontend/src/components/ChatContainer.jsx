import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // ✅ DOWNLOAD FUNCTION (FIXED - no 0B issue)
  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "file";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // ✅ LOAD MESSAGES + SOCKET
 useEffect(() => {
  if (!selectedUser?._id) return;

  getMessages(selectedUser._id);

}, [selectedUser?._id]);

useEffect(() => {
  subscribeToMessages();

  return () => unsubscribeFromMessages();
}, []);

  // ✅ AUTO SCROLL
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ LOADING UI
  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {/* ✅ MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMe =
            message.senderId?.toString() === authUser?._id?.toString();

          return (
            <div
              key={message._id}
              className={`chat ${isMe ? "chat-end" : "chat-start"}`}
            >
              {/* PROFILE */}
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isMe
                        ? authUser?.profilePic || "/avatar.png"
                        : selectedUser?.profilePic || "/avatar.png"
                    }
                    alt="profile"
                  />
                </div>
              </div>

              {/* TIME */}
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              {/* MESSAGE BODY */}
              <div className="chat-bubble flex flex-col gap-2">

                {/* ✅ IMAGE */}
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md cursor-pointer"
                    onClick={() => window.open(message.image, "_blank")}
                  />
                )}

                {/* ✅ FILE */}
                {message.file && (
                  <div className="relative group">

                    {/* FILE BOX */}
                    <div className="flex items-center gap-2 bg-base-200 px-3 py-2 rounded-lg">
                      <span>
                        {message.fileName?.toLowerCase().endsWith(".pdf") && "📄"}
                        {message.fileName?.toLowerCase().endsWith(".doc") && "📁"}
                        {message.fileName?.toLowerCase().endsWith(".docx") && "📁"}
                        {message.fileName?.toLowerCase().endsWith(".xls") && "📊"}
                        {message.fileName?.toLowerCase().endsWith(".xlsx") && "📊"}
                        {message.fileName?.toLowerCase().endsWith(".txt") && "📄"}
                        {!message.fileName && "📎"}
                      </span>

                      <span className="underline cursor-pointer">
                        {message.fileName || "Download File"}
                      </span>
                    </div>

                    {/* ✅ HOVER ACTIONS */}
                    <div className="absolute -top-10 right-0 hidden group-hover:flex gap-2 bg-base-300 p-2 rounded-lg shadow-lg">

                      {/* VIEW */}
                      <a
                        href={message.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        View
                      </a>

                      {/* DOWNLOAD */}
                      <button
                        onClick={() => handleDownload(message.file, message.fileName)}
                        className="text-sm px-2 py-1 bg-green-500 text-white rounded"
                      >
                        Download
                      </button>

                    </div>
                  </div>
                )}

                {/* ✅ TEXT */}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}

        {/* SCROLL */}
        <div ref={messageEndRef} />
      </div>

      {/* INPUT */}
      <MessageInput />
    </div>
  );
};

export default ChatContainer;