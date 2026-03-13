import { useNavigate } from "react-router-dom";
import styles from "./ChatList.module.css";

function ChatList({ chats, t, unreadCounts }) {
  const navigate = useNavigate();

  return (
    <div className={styles.chatList}>
      {chats.map((c, index) => (
        <div
          key={c._id}
          className={styles.chatCard}
          onClick={() => navigate(`/home/chats/${c._id}`)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: '100%' }}>
            <div className={styles.iconWrapper}>
              <div className={styles.chatIcon}>
                {c.title.charAt(0).toUpperCase()}
              </div>
              <div className={styles.onlineBadge}></div>
            </div>

            <div className={styles.infoWrapper}>
              <div className={styles.chatTitle}>{c.title}</div>
              <div className={styles.chatId}>{t.chatId}: {c._id}</div>
            </div>

            {/* Real Unread Badge */}
            {unreadCounts?.[c._id] > 0 && (
              <div className={styles.unreadBadge}>{unreadCounts[c._id]}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatList;
