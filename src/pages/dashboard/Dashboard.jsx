import React, { useState } from "react";
import {
  useDeleteChatMutation,
  useGetChatsQuery,
} from "../../app/services/chatApi";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const { data: chats, isLoading } = useGetChatsQuery();
  const [deleteChat, { isLoading: deleteLoading }] = useDeleteChatMutation();
  const navigate = useNavigate();

  async function handleDelete(id, e) {
    e.stopPropagation();
    let confirm = window.confirm("Are you sure you want to delete this chat?");
    if (confirm) {
      try {
        await deleteChat(id).unwrap();
      } catch (err) {
        console.error("Delete error", err);
      }
    }
  }

  if (isLoading) return <div className={styles.loading}>Loading Dashboard...</div>;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/home')} className={styles.backBtn}>⬅</button>
            <div>
              <h1>Admin Dashboard</h1>
              <p>Manage all platform chats</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className={styles.chatGrid}>
        {chats && chats.map((chat) => (
          <div key={chat._id} className={styles.chatCard} onClick={() => navigate(`/dashboard/chats/${chat._id}`, { replace: true })}>
            <div className={styles.chatInfo}>
              <div className={styles.avatar}>
                {chat.title.charAt(0).toUpperCase()}
              </div>
              <div className={styles.details}>
                <h3>{chat.title}</h3>
                <span className={styles.chatId}>ID: {chat._id}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(chat._id, e)}
                disabled={deleteLoading}
              >
                Delete Chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
