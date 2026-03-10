import styles from "./InviteNotifications.module.css";

function InviteNotifications({ invites, isLoading, isAccepting, onAccept }) {
  const list = Array.isArray(invites) ? invites : [];

  function getChatTitle(invite) {
    return invite?.chatId?.title || "Chat invite";
  }

  function getInviteKey(invite, index) {
    return invite?._id || `invite-${index}`;
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>Invites</h2>

      {isLoading && <div className={styles.loading}>Loading invites...</div>}

      {!isLoading && list.length === 0 && (
        <div className={styles.muted}>No invites yet</div>
      )}

      {!isLoading && list.length > 0 && (
        <div className={styles.inviteList}>
          {list.map((invite, index) => {
            const id = invite?._id;
            const chatTitle = getChatTitle(invite);
            const inviter = invite?.from?.username;
            const status = invite?.status;
            const isPending = status === "pending";

            return (
              <div
                key={getInviteKey(invite, index)}
                className={styles.inviteItem}
              >
                <div className={styles.inviteInfo}>
                  <div className={styles.inviteTitle}>{chatTitle}</div>

                  {inviter && (
                    <div className={styles.inviteMeta}>From: {inviter}</div>
                  )}

                  <div className={styles.inviteMeta}>Status: {status}</div>
                </div>

                <button
                  className={styles.button}
                  disabled={isAccepting || !isPending}
                  onClick={() => onAccept?.(id)}
                >
                  {isAccepting
                    ? "Accepting..."
                    : isPending
                    ? "Accept"
                    : "Accepted"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default InviteNotifications;
