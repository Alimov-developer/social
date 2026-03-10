import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login/Login";
import Register from "./pages/register/register";
import Public from "./pages/public/Public";
import Dashboard from "./pages/dashboard/Dashboard";

import Home from "./pages/home/Home";
import Chats from "./pages/home/Chats";
import Profile from "./pages/home/Profile";
import ProtectedRoute from "./pages/ProtectedRoute/ProtectedRoute";
import ChatDetail from "./pages/home/ChatDetail";
import Invites from "./pages/home/Invites";
import ChatApp from "./pages/home/ChatApp";
import Sidebar from "./pages/home/ChatActions";
import ChatActions from "./pages/home/ChatActions";

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Public />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/chats/:chatId" element={<ChatDetail />} />
      </Route>

      <Route element={<ProtectedRoute role="user" />}>
        <Route path="/home" element={<Home />}>
          <Route index element={<Chats />} />
          <Route path="chats/:chatId" element={<ChatDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="invites" element={<Invites />} />
          <Route path="chatapp" element={<ChatApp />} />
          <Route path="" element={<ChatActions />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
