import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // ✅ CHECK AUTH
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      console.log("AUTH USER:", res.data); // 🔥 DEBUG

      set({ authUser: res.data });

      get().connectSocket();
    } catch (error) {
      console.log("AUTH ERROR:", error.response?.data || error.message); // 🔥 ADD THIS
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);

      console.log("LOGIN USER:", res.data); // 🔥 DEBUG

      set({ authUser: res.data });

      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);

      set({ authUser: res.data });

      toast.success("Account created");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");

      set({ authUser: null });

      toast.success("Logged out");

      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  },

  // ✅ SOCKET CONNECTION FIX
 connectSocket: () => {
  const { authUser, socket } = get();

  if (!authUser) return;

  // ✅ DISCONNECT OLD SOCKET FIRST
  if (socket) {
    socket.disconnect();
  }

  const newSocket = io(BASE_URL, {
    query: {
      userId: authUser._id,
    },
  });

  newSocket.connect();

  set({ socket: newSocket });

  newSocket.on("getOnlineUsers", (userIds) => {
    set({ onlineUsers: userIds });
  });
},

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) socket.disconnect();
  },
}));