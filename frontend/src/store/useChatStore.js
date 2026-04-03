import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // ✅ GET USERS
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");

      set({ users: res.data });

      if (res.data.length > 0) {
        set({ selectedUser: res.data[0] });
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // ✅ GET MESSAGES
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ✅ SEND MESSAGE
  sendMessage: async (messageData) => {
    try {
      const { selectedUser } = get();

      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      set((state) => ({
        messages: [...state.messages, res.data],
      }));
    } catch (error) {
      console.log("SEND ERROR:", error);
      toast.error("Failed to send message");
    }
  },

  // ✅ FIXED SOCKET SUBSCRIBE
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket; // 🔥 FIX

    if (!socket) return;

    socket.on("newMessage", (message) => {
      set((state) => ({
        messages: [...state.messages, message],
      }));
    });
  },

  // ✅ FIXED UNSUBSCRIBE
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket; // 🔥 FIX

    if (!socket) return;

    socket.off("newMessage");
  },
}));