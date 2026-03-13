import { useNavigate, useOutletContext } from "react-router-dom";
import {
  useGetInvitesQuery,
  useAcceptInviteMutation,
} from "../../app/services/chatApi";
import InviteNotifications from "../../ui/InviteNotifications";
import styles from "./Invites.module.css";

function Invites() {
  const { t } = useOutletContext();
  const navigate = useNavigate();
  const { data: invitesData, isLoading } = useGetInvitesQuery();
  const [acceptInvite, { isLoading: isAcceptingInvite }] =
    useAcceptInviteMutation();

  const invites =
    invitesData?.invites || invitesData?.data?.invites || invitesData || [];

  async function handleAcceptInvite(inviteId) {
    if (!inviteId) return;

    try {
      const res = await acceptInvite(inviteId).unwrap();
      const chat = res?.chat || res?.data?.chat || res;
      const chatId =
        chat?._id || chat?.id || res?.chatId || res?.data?.chatId || null;

      if (chatId) {
        navigate(`/home/chats/${chatId}`);
      }
    } catch (err) {
      console.error("Accept invite error:", err);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => window.history.back()} className={styles.backBtn}>⬅</button>
        <h2 className={styles.headerTitle}>{t.invites}</h2>
      </header>
      <InviteNotifications
        invites={invites}
        isLoading={isLoading}
        isAccepting={isAcceptingInvite}
        onAccept={handleAcceptInvite}
      />
    </div>
  );
}

export default Invites;
