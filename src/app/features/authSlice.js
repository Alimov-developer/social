import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || localStorage.getItem("accessToken") || null,
};

if (initialState.user && !initialState.user.profilePic) {
  const savedPic = localStorage.getItem('avatar_' + initialState.user.username);
  if (savedPic) {
    initialState.user.profilePic = savedPic;
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    getCredentials: (state, action) => {
      let incomingUser = action.payload.user;
      
      // Retrieve saved avatar if backend response is missing it
      if (incomingUser && incomingUser.username && !incomingUser.profilePic) {
        const savedPic = localStorage.getItem('avatar_' + incomingUser.username);
        if (savedPic) {
          incomingUser.profilePic = savedPic;
        }
      }

      state.user = incomingUser;
      state.token = action.payload.token || action.payload.accessToken || null;

      if (state.token) {
        localStorage.setItem("token", state.token);
        localStorage.setItem("accessToken", state.token);
      }
      try {
        if (incomingUser?.profilePic && incomingUser?.username) {
          localStorage.setItem('avatar_' + incomingUser.username, incomingUser.profilePic);
        }
        localStorage.setItem("user", JSON.stringify(state.user));
      } catch (err) {
        console.error("Local storage quota exceeded or failed:", err);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    },
  },
});

export const { getCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
