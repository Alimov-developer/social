import { useNavigate } from "react-router-dom";
import styles from "./ChatList.module.css";

function ChatList({ chats }) {
  const navigate = useNavigate();

  return (
    <div className={styles.chatList}>
      {chats.map((c) => (
        <div
          key={c._id}
          className={styles.chatCard}
          onClick={() => navigate(`/home/chats/${c._id}`)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className={styles.iconWrapper}>
              <div className={styles.chatIcon}>
                {c.title.charAt(0).toUpperCase()}
              </div>
              <div className={styles.onlineBadge}></div>
            </div>

            <div className={styles.infoWrapper}>
              <div className={styles.chatTitle}>{c.title}</div>
              <div className={styles.chatId}>ID: {c._id}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatList;
