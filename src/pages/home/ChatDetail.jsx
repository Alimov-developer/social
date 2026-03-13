import styles from "./ChatDetail.module.css";
import { useParams, useSearchParams, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createSocket, SOCKET_EVENTS } from "../../app/services/socket";
import { useInviteToChatMutation, useEditMessageMutation, useDeleteMessageMutation, useGetChatMessagesQuery } from "../../app/services/chatApi";
import EmojiPicker from 'emoji-picker-react';

function ChatDetail() {
  const { t } = useOutletContext();
  const [searchParams] = useSearchParams();
  const { chatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboardView = location.pathname.startsWith("/dashboard");
  const token = useSelector((state) => state.auth?.token);
  const user = useSelector((state) => state.auth?.user);

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const [presence, setPresence] = useState("offline");
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Emoji state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Multimedia state
  const [isRecording, setIsRecording] = useState(false);
  const [pendingMedia, setPendingMedia] = useState(null); // Data URL
  const [pendingMediaType, setPendingMediaType] = useState(null); // 'image' or 'voice'
  const [fullscreenImage, setFullscreenImage] = useState(null); // URL for lightbox
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
    if (messageDate === yesterday) return `${t.yesterday}, ${timeString}`;
    return `${date.toLocaleDateString()}, ${timeString}`;
  };

  const parseMessage = useCallback((m) => {
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
      type: m.type || (m.text?.startsWith('data:image') ? 'image' : m.text?.startsWith('data:audio') ? 'voice' : 'text'),
      sender: sName,
      senderId: sId,
      mine: isMine,
      time: m.time || m.createdAt || m.updatedAt || new Date().toISOString()
    };
  }, [user?._id, user?.username, displayName]);

  useEffect(() => {
    if (initialMessagesData) {
      let msgs = initialMessagesData.messages || initialMessagesData.data || initialMessagesData;
      if (Array.isArray(msgs)) {
        setMessages(msgs.map(parseMessage));
      }
    }
  }, [initialMessagesData, user, parseMessage]);

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
      if (data?.users) {
        setOnlineUsers(data.users);
        setPresence(data.users.length > 1 ? "online" : "offline");
      } else if (typeof data === 'string') {
        setPresence(data);
      }
    }

    socket.on(SOCKET_EVENTS.receive, handleReceive);
    socket.on('message', handleReceive);

    socket.on('userJoined', () => {
      setPresence("online");
    });
    socket.on('userLeft', () => {
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

  function handleSend(mediaPayload = null) {
    const text = mediaPayload?.[0] || pendingMedia || draft.trim();
    if (!text || !chatId) return;

    const type = mediaPayload?.[1] || pendingMediaType || 'text';

    const payload = {
      chatId,
      text,
      type,
      sender: user?._id || displayName,
      time: new Date().toISOString(),
    };

    setMessages((prev) => [
      ...prev,
      {
        id: `optimistic-${Date.now()}`,
        text,
        type: payload.type,
        sender: displayName,
        mine: true,
        time: payload.time,
      },
    ]);

    socketRef.current?.emit(SOCKET_EVENTS.send, payload);
    setDraft("");
    setPendingMedia(null);
    setPendingMediaType(null);
    setShowEmojiPicker(false);
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPendingMedia(event.target.result);
      setPendingMediaType('image');
    };
    reader.readAsDataURL(file);
    e.target.value = null; // Reset
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (event) => {
          handleSend([event.target.result, 'voice']);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    try {
      await inviteToChat({ chatId, payload: { username: inviteUsername.trim() } }).unwrap();
      setInviteUsername("");
      setShowInvite(false);
      alert(t.success);
    } catch (err) {
      console.error(err);
      alert(err?.data?.message || err?.data?.error || t.failedToInvite);
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
            <span>{searchParams.get("title") || chatId}</span>
            <span className={`${styles.status} ${presence === 'online' ? styles.online : styles.offline}`}>
              {presence === 'online' ? t.online : t.offline}
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {showInvite ? (
            <form onSubmit={handleInvite} className={styles.inviteForm}>
              <input
                autoFocus
                type="text"
                placeholder={`${t.username}...`}
                value={inviteUsername}
                onChange={e => setInviteUsername(e.target.value)}
                className={styles.inviteInput}
              />
              <button type="submit" disabled={isInviting} className={styles.inviteBtn}>{t.addMember}</button>
              <button type="button" onClick={() => setShowInvite(false)} className={styles.cancelBtn}>✕</button>
            </form>
          ) : (
            <button onClick={() => setShowInvite(true)} className={styles.inviteBtn}>+ {t.addMember}</button>
          )}
        </div>
      </header>

      <div className={styles.messages}>
        {messages.map((message) => {
          const canEditOrDelete = (message.mine || isAdmin) && message.type === 'text';

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
                    <button onClick={() => handleEditSubmit(message.id)} className={styles.saveBtn}>{t.saveChanges}</button>
                    <button onClick={() => setEditingMessageId(null)} className={styles.cancelEditBtn}>{t.cancel}</button>
                  </div>
                ) : (
                  <div className={styles.messageContent}>
                    {message.type === 'image' || message.text.startsWith('data:image') ? (
                      <div className={styles.mediaWrapper} onClick={() => setFullscreenImage(message.text)}>
                        <img src={message.text} alt="attachment" className={styles.media} loading="lazy" />
                      </div>
                    ) : message.type === 'voice' || message.text.startsWith('data:audio') ? (
                      <div className={styles.audioWrapper}>
                        <audio src={message.text} controls className={styles.audio} />
                      </div>
                    ) : (
                      <p className={styles.messageText}>{message.text}</p>
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
                {/* Delete button even for media */}
                {!canEditOrDelete && (message.mine || isAdmin) && editingMessageId !== message.id && (
                  <div className={styles.messageActions}>
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
        {isLoadingMessages && <div className={styles.loading}>{t.chats}...</div>}
        <div ref={messagesEndRef} />
      </div>

      {pendingMedia && (
        <div className={styles.previewArea}>
          <div className={styles.previewContainer}>
            {pendingMediaType === 'image' ? (
              <img src={pendingMedia} alt="preview" className={styles.previewImage} />
            ) : (
              <div className={styles.voicePreview}>{t.voiceMessage}</div>
            )}
            <button className={styles.cancelPreview} onClick={() => { setPendingMedia(null); setPendingMediaType(null); }}>✕</button>
          </div>
        </div>
      )}

      <div className={styles.inputArea}>
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
        />
        <button className={styles.attachBtn} onClick={() => fileInputRef.current?.click()}>
          📎
        </button>

        <button
          className={styles.emojiBtn}
          onClick={() => setShowEmojiPicker(prev => !prev)}
          type="button"
        >
          🙂
        </button>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className={styles.form}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            type="text"
            placeholder={t.writeMessage}
            className={styles.input}
          />
          {draft.trim() || pendingMedia ? (
            <button className={styles.sendButton} type="button" onClick={() => handleSend()}>
              {pendingMedia ? t.send : "➔"}
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.micButton} ${isRecording ? styles.recording : ''}`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
            >
              🎤
            </button>
          )}
        </form>
      </div>

      {showEmojiPicker && (
        <div className={styles.emojiPickerContainer}>
          <EmojiPicker
            onEmojiClick={(emojiObject) => {
              setDraft(prev => prev + emojiObject.emoji);
            }}
            theme="dark"
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className={styles.modalOverlay} onClick={() => setDeleteModal({ show: false, messageId: null, isMine: false })}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>{t.deleteConfirm}</h3>
            <p>{t.deleteSub}</p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalBtn}
                onClick={() => handleDelete(deleteModal.messageId, false)}
              >
                {t.deleteForMe}
              </button>
              {deleteModal.isMine && (
                <button
                  className={`${styles.modalBtn} ${styles.dangerBtn}`}
                  onClick={() => handleDelete(deleteModal.messageId, true)}
                >
                  {t.deleteForEveryone}
                </button>
              )}
              <button
                className={styles.cancelLink}
                onClick={() => setDeleteModal({ show: false, messageId: null, isMine: false })}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatDetail;
