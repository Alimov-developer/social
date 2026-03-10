import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || localStorage.getItem("accessToken") || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    getCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token || action.payload.accessToken || null;

      if (state.token) {
        localStorage.setItem("token", state.token);
        localStorage.setItem("accessToken", state.token);
      }
      localStorage.setItem("user", JSON.stringify(state.user));
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
