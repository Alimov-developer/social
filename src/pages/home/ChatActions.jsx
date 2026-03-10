import React, { useState } from "react";
import styles from "./ChatActions.module.css";

function ChatActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      
      <div className={styles.header}>
        <span>Chat</span>

        <button
          className={styles.plusBtn}
          onClick={() => setOpen(!open)}
        >
          +
        </button>
      </div>

      {open && (
        <div className={styles.forms}>

          <div className={styles.row}>
            <input placeholder="Chat name" />
            <button>Create</button>
          </div>

          <div className={styles.row}>
            <input placeholder="Chat ID" />
            <button>Join</button>
          </div>

          <div className={styles.row}>
            <input placeholder="Username" />
            <button>Invite</button>
          </div>

        </div>
      )}
      
    </div>
  );
}

export default ChatActions;