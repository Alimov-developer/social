import React, { useState } from "react";
import {
  useGetChatsQuery,
  useCreateChatMutation,
  useJoinChatMutation,
  useInviteToChatMutation,
} from "../../app/services/chatApi";
import styles from "./Chats.module.css";
import { useNavigate } from "react-router-dom";
import ChatList from "./ChatList";

function Chats({ searchQuery }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeForm, setActiveForm] = useState(null); // 'create', 'join', 'invite'

  const [formData, setFormData] = useState({ title: "" });
  const [joinId, setJoinId] = useState("");
  const [inviteData, setInviteData] = useState({ chatId: "", username: "" });

  const { data: chats, isLoading } = useGetChatsQuery();
  const [createChat, { isLoading: isCreating }] = useCreateChatMutation();
  const [joinChat, { isLoading: isJoining }] = useJoinChatMutation();
  const [inviteToChat, { isLoading: isInviting }] = useInviteToChatMutation();

  const filteredChats = chats?.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
    chat._id.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

  async function handleCreate(e) {
    e.preventDefault();
    if (!formData.title.trim()) return;
    try {
      await createChat(formData).unwrap();
      setFormData({ title: "" });
      setActiveForm(null);
      setMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) return;
    try {
      await joinChat(id).unwrap();
      navigate(`/home/chats/${id}`);
      setJoinId("");
      setActiveForm(null);
      setMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    const chatId = inviteData.chatId.trim();
    const username = inviteData.username.trim();
    if (!chatId || !username) return;
    try {
      await inviteToChat({ chatId, payload: { username } }).unwrap();
      setInviteData({ chatId: "", username: "" });
      setActiveForm(null);
      setMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className={styles.container}>
      {(isLoading) && (
        <div className={styles.loading}>Loading chats...</div>
      )}

      {filteredChats && (
        <div className={styles.chatListScroll}>
          <ChatList chats={filteredChats} />
        </div>
      )}

      {/* Floating Action Button */}
      <div className={styles.fabContainer}>
        {menuOpen && (
          <div className={styles.fabMenu}>
            {activeForm === 'create' && (
              <form onSubmit={handleCreate} className={styles.miniForm}>
                <input autoFocus placeholder="Chat Title" value={formData.title} onChange={e => setFormData({ title: e.target.value })} className={styles.input} />
                <button type="submit" disabled={isCreating} className={styles.button}>Create</button>
              </form>
            )}
            {activeForm === 'join' && (
              <form onSubmit={handleJoin} className={styles.miniForm}>
                <input autoFocus placeholder="Chat ID" value={joinId} onChange={e => setJoinId(e.target.value)} className={styles.input} />
                <button type="submit" disabled={isJoining} className={styles.button}>Join</button>
              </form>
            )}
            {!activeForm && (
              <div className={styles.menuOptions}>
                <button onClick={() => setActiveForm('create')} className={styles.menuOptionBtn}>✏️ Create Chat</button>
                <button onClick={() => setActiveForm('join')} className={styles.menuOptionBtn}>🔗 Join Chat</button>
              </div>
            )}
          </div>
        )}

        <button
          className={`${styles.fab} ${menuOpen ? styles.fabOpen : ''}`}
          onClick={() => {
            setMenuOpen(!menuOpen);
            setActiveForm(null);
          }}
        >
          {menuOpen ? '✕' : '+'}
        </button>
      </div>

      {menuOpen && <div className={styles.backdrop} onClick={() => { setMenuOpen(false); setActiveForm(null); }}></div>}
    </div>
  );
}

export default Chats;

