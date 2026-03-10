import styles from "./ChatDetail.module.css";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSocket, SOCKET_EVENTS } from "../../app/services/socket";
import { useInviteToChatMutation, useEditMessageMutation, useDeleteMessageMutation, useGetChatMessagesQuery } from "../../app/services/chatApi";

function ChatDetail() {
  const [searchParams] = useSearchParams();
  const { chatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboardView = location.pathname.startsWith("/dashboard");
  const token = useSelector((state) => state.auth?.token);
  const user = useSelector((state) => state.auth?.user);

  const socketRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const [presence, setPresence] = useState("offline");
  const [onlineUsers, setOnlineUsers] = useState([]);

  // API hooks
  const { data: initialMessagesData, isLoading: isLoadingMessages } = useGetChatMessagesQuery(chatId, { skip: !chatId });
  const [inviteToChat, { isLoading: isInviting }] = useInviteToChatMutation();
  const [editMessageApi] = useEditMessageMutation();
  const [deleteMessageApi] = useDeleteMessageMutation();

  const [inviteUsername, setInviteUsername] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  const [deleteModal, setDeleteModal] = useState({ show: false, messageId: null, isMine: false });

  const displayName = useMemo(() => {
    if (user?.username) return user.username;
    if (user?.name) return user.name;
    return "You";
  }, [user]);

  const formatMessageTime = (time) => {
    const date = new Date(time);
    const now = new Date();
    const messageDate = new Date(date).setHours(0, 0, 0, 0);
    const today = new Date(now).setHours(0, 0, 0, 0);
    const yesterday = new Date(now.setDate(now.getDate() - 1)).setHours(0, 0, 0, 0);

    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (messageDate === today) return timeString;
    if (messageDate === yesterday) return `Yesterday, ${timeString}`;
    return `${date.toLocaleDateString()}, ${timeString}`;
  };

  const parseMessage = (m) => {
    const sId = m.sender?._id || m.sender?.id || m.sender;
    const isMine = String(sId) === String(user?._id) || m.sender?.username === user?.username || m.sender === displayName;
    let sName = "Unknown";
    if (isMine) sName = displayName;
    else if (m.sender?.username) sName = m.sender.username;
    else if (m.sender?.name) sName = m.sender.name;
    else if (typeof m.sender === 'string') sName = m.sender;

    return {
      id: m._id || m.id,
      text: m.text || m.message || m.body,
      sender: sName,
      senderId: sId,
      mine: isMine,
      time: m.time || m.createdAt || m.updatedAt || new Date().toISOString()
    };
  };

  useEffect(() => {
    if (initialMessagesData) {
      let msgs = initialMessagesData.messages || initialMessagesData.data || initialMessagesData;
      if (Array.isArray(msgs)) {
        setMessages(msgs.map(parseMessage));
      }
    }
  }, [initialMessagesData, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!token) return;
    const socket = createSocket(token);
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;
    socket.emit(SOCKET_EVENTS.join, chatId);
    return () => {
      socket.emit(SOCKET_EVENTS.leave, chatId);
    };
  }, [chatId, token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;

    function handleReceive(payload) {
      if (!payload) return;
      const parsed = parseMessage(payload);
      if (!parsed.text) return;

      setMessages((prev) => {
        // Prevent exact duplicates if socket reflects optimistic message
        const isDuplicate = prev.some(m => m.id === parsed.id || (m.mine && m.text === parsed.text && new Date(parsed.time).getTime() - new Date(m.time).getTime() < 5000));
        if (isDuplicate) return prev;
        return [...prev, parsed];
      });
    }

    function handlePresence(data) {
      // Assuming backend sends { users: [...] } or { count: n }
      if (data?.users) {
        setOnlineUsers(data.users);
        setPresence(data.users.length > 1 ? "online" : "offline");
      } else if (typeof data === 'string') {
        setPresence(data);
      }
    }

    socket.on(SOCKET_EVENTS.receive, handleReceive);
    socket.on('message', handleReceive);

    // Custom presence events
    socket.on('userJoined', () => {
      setPresence("online");
    });
    socket.on('userLeft', () => {
      // Simple toggle or re-fetch if backend supports
      // For now, if someone joins, it's online
    });
    socket.on('presence', handlePresence);

    return () => {
      socket.off(SOCKET_EVENTS.receive, handleReceive);
      socket.off('message', handleReceive);
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('presence');
    };
  }, [chatId, token, user, parseMessage]);

  function handleSend() {
    const text = draft.trim();
    if (!text || !chatId) return;

    const payload = {
      chatId,
      text,
      sender: user?._id || displayName,
      time: new Date().toISOString(),
    };

    setMessages((prev) => [
      ...prev,
      {
        id: `optimistic-${Date.now()}`,
        text,
        sender: displayName,
        mine: true,
        time: payload.time,
      },
    ]);

    socketRef.current?.emit(SOCKET_EVENTS.send, payload);
    setDraft("");
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    try {
      await inviteToChat({ chatId, payload: { username: inviteUsername.trim() } }).unwrap();
      setInviteUsername("");
      setShowInvite(false);
      alert("Success");
    } catch (err) {
      console.error(err);
      alert(err?.data?.message || err?.data?.error || "Failed to invite");
    }
  }

  async function handleEditSubmit(id) {
    if (!editText.trim()) return setEditingMessageId(null);
    try {
      await editMessageApi({ chatId, messageId: id, text: editText.trim() }).unwrap();
      setMessages(prev => prev.map(m => m.id === id || m.id.includes(id) ? { ...m, text: editText.trim() } : m));
      setEditingMessageId(null);
    } catch (err) {
      console.error("Edit failed", err);
      // Fallback optimistic update
      setMessages(prev => prev.map(m => m.id === id ? { ...m, text: editText.trim() } : m));
      setEditingMessageId(null);
    }
  }

  async function handleDelete(messageId, isEveryone = true) {
    try {
      // If endpoint doesn't support 'for me', we'll treat both as everyone for now or just remove locally
      await deleteMessageApi({ chatId, messageId }).unwrap();
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setDeleteModal({ show: false, messageId: null, isMine: false });
    } catch (err) {
      console.error("Delete failed", err);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setDeleteModal({ show: false, messageId: null, isMine: false });
    }
  }

  const openDeleteModal = (messageId, isMine) => {
    setDeleteModal({ show: true, messageId, isMine });
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';

  return (
    <div className={styles.container} style={isDashboardView ? { position: 'fixed', top: 0, left: 0, height: '100vh', width: '100vw', zIndex: 9999 } : {}}>
      <header className={styles.header}>
        <div className={styles.headerTitle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate(isDashboardView ? '/dashboard' : '/home')}
            className={styles.backBtn}
          >
            ⬅
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Chat: {searchParams.get("title") || chatId}</span>
            <span className={`${styles.status} ${presence === 'online' ? styles.online : styles.offline}`}>
              {presence}
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {showInvite ? (
            <form onSubmit={handleInvite} className={styles.inviteForm}>
              <input
                autoFocus
                type="text"
                placeholder="Username..."
                value={inviteUsername}
                onChange={e => setInviteUsername(e.target.value)}
                className={styles.inviteInput}
              />
              <button type="submit" disabled={isInviting} className={styles.inviteBtn}>Invite</button>
              <button type="button" onClick={() => setShowInvite(false)} className={styles.cancelBtn}>✕</button>
            </form>
          ) : (
            <button onClick={() => setShowInvite(true)} className={styles.inviteBtn}>+ Add Member</button>
          )}
        </div>
      </header>

      <div className={styles.messages}>
        {messages.map((message) => {
          const canEditOrDelete = message.mine || isAdmin;

          return (
            <div key={message.id} className={`${styles.messageWrapper} ${message.mine ? styles.mineWrapper : styles.otherWrapper}`}>
              <div className={`${styles.message} ${message.mine ? styles.myMessage : styles.otherMessage}`}>
                {!message.mine && <strong className={styles.senderName}>{message.sender}</strong>}

                {editingMessageId === message.id ? (
                  <div className={styles.editForm}>
                    <input
                      autoFocus
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className={styles.editInput}
                    />
                    <button onClick={() => handleEditSubmit(message.id)} className={styles.saveBtn}>Save</button>
                    <button onClick={() => setEditingMessageId(null)} className={styles.cancelEditBtn}>Cancel</button>
                  </div>
                ) : (
                  <div className={styles.messageContent}>
                    <p className={styles.messageText}>{message.text}</p>
                    {message.text.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) && (
                      <div className={styles.mediaWrapper}>
                        <img src={message.text} alt="attachment" className={styles.media} loading="lazy" />
                      </div>
                    )}
                    {message.text.match(/\.(mp4|webm|ogg|mov)/i) && (
                      <div className={styles.mediaWrapper}>
                        <video src={message.text} controls className={styles.media} />
                      </div>
                    )}
                  </div>
                )}

                {canEditOrDelete && editingMessageId !== message.id && (
                  <div className={styles.messageActions}>
                    <button
                      onClick={() => {
                        setEditingMessageId(message.id);
                        setEditText(message.text);
                      }}
                      className={styles.actionBtn}
                      title="Edit message"
                    >✎</button>
                    <button
                      onClick={() => openDeleteModal(message.id, message.mine)}
                      className={styles.actionBtn}
                      title="Delete message"
                    >🗑</button>
                  </div>
                )}
                <span className={styles.timeLabel}>
                  {formatMessageTime(message.time)}
                </span>
              </div>
            </div>
          );
        })}
        {isLoadingMessages && <div className={styles.loading}>Loading history...</div>}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className={styles.form}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          type="text"
          placeholder="Write a message..."
          className={styles.input}
        />
        <button className={styles.button}>Send</button>
      </form>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className={styles.modalOverlay} onClick={() => setDeleteModal({ show: false, messageId: null, isMine: false })}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Delete message?</h3>
            <p>Select how you want to delete this message.</p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalBtn}
                onClick={() => handleDelete(deleteModal.messageId, false)}
              >
                Delete for me
              </button>
              {deleteModal.isMine && (
                <button
                  className={`${styles.modalBtn} ${styles.dangerBtn}`}
                  onClick={() => handleDelete(deleteModal.messageId, true)}
                >
                  Delete for everyone
                </button>
              )}
              <button
                className={styles.cancelLink}
                onClick={() => setDeleteModal({ show: false, messageId: null, isMine: false })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatDetail;
