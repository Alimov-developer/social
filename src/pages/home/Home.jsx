import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from "./Home.module.css";
import Chats from "./Chats";
import { createSocket, SOCKET_EVENTS } from "../../app/services/socket";

const translations = {
  en: {
    chats: "Chats",
    profile: "My Profile",
    invites: "Invites",
    language: "Language",
    setStatus: "Set Status",
    logout: "Log Out",
    version: "Version",
    about: "About",
    nightMode: "Night Mode",
    search: "Search",
    placeholder: "Select a chat to start messaging",
    createChat: "Create Chat",
    joinChat: "Join Chat",
    chatTitle: "Chat Title",
    chatId: "Chat ID",
    create: "Create",
    join: "Join",
    editProfile: "Edit Profile",
    updateDetails: "Update your account details below",
    username: "Username",
    password: "New Password",
    saveChanges: "Save Changes",
    saving: "Saving...",
    noChanges: "No changes to save.",
    profileUpdated: "Profile updated successfully!",
    failUpdate: "Failed to update profile",
    back: "Back",
    enterUsername: "Enter new username",
    leaveBlank: "Leave blank to keep current",
    writeMessage: "Write a message...",
    send: "Send",
    addMember: "Add Member",
    deleteForMe: "Delete for me",
    deleteForEveryone: "Delete for everyone",
    cancel: "Cancel",
    deleteConfirm: "Delete message?",
    deleteSub: "Select how you want to delete this message.",
    online: "online",
    offline: "offline",
    yesterday: "Yesterday",
    success: "Success",
    failedToInvite: "Failed to invite",
    appName: "Telegram Desktop",
    goBack: "Go Back"
  },
  uz: {
    chats: "Chatlar",
    profile: "Mening profilim",
    invites: "Taklifnomalar",
    language: "Til",
    setStatus: "Status o'rnatish",
    logout: "Chiqish",
    version: "Versiya",
    about: "Dastur haqida",
    nightMode: "Tungi rejim",
    search: "Qidiruv",
    placeholder: "Xabarlashishni boshlash uchun chatni tanlang",
    createChat: "Chat yaratish",
    joinChat: "Chatga qo'shilish",
    chatTitle: "Chat nomi",
    chatId: "Chat IDsi",
    create: "Yaratish",
    join: "Qo'shilish",
    editProfile: "Profilni tahrirlash",
    updateDetails: "Hisobingiz ma'lumotlarini pastda yangilang",
    username: "Foydalanuvchi nomi",
    password: "Yangi parol",
    saveChanges: "O'zgarishlarni saqlash",
    saving: "Saqlanmoqda...",
    noChanges: "Saqlash uchun o'zgarishlar yo'q.",
    profileUpdated: "Profil muvaffaqiyatli yangilandi!",
    failUpdate: "Profilni yangilab bo'lmadi",
    back: "Orqaga",
    enterUsername: "Yangi foydalanuvchi nomini kiriting",
    leaveBlank: "Joriy parolni saqlab qolish uchun bo'sh qoldiring",
    writeMessage: "Xabar yozing...",
    send: "Yuborish",
    addMember: "A'zo qo'shish",
    deleteForMe: "Men uchun o'chirish",
    deleteForEveryone: "Hamma uchun o'chirish",
    cancel: "Bekor qilish",
    deleteConfirm: "Xabarni o'chirmoqchimisiz?",
    deleteSub: "Xabarni qanday o'chirishni tanlang.",
    online: "onlayn",
    offline: "oflayn",
    yesterday: "Kecha",
    success: "Muvaffaqiyatli",
    failedToInvite: "Taklif qilishda xatolik",
    appName: "Telegram Desktop",
    goBack: "Orqaga"
  },
  ru: {
    chats: "Чаты",
    profile: "Мой профиль",
    invites: "Приглашения",
    language: "Язык",
    setStatus: "Установить статус",
    logout: "Выйти",
    version: "Версия",
    about: "О программе",
    nightMode: "Ночной режим",
    search: "Поиск",
    placeholder: "Выберите чат, чтобы начать общение",
    createChat: "Создать чат",
    joinChat: "Присоединиться к чату",
    chatTitle: "Название чата",
    chatId: "ID чата",
    create: "Создать",
    join: "Присоединиться",
    editProfile: "Редактировать профиль",
    updateDetails: "Обновите данные вашего аккаунта ниже",
    username: "Имя пользователя",
    password: "Новый пароль",
    saveChanges: "Сохранить изменения",
    saving: "Сохранение...",
    noChanges: "Нет изменений для сохранения.",
    profileUpdated: "Профиль успешно обновлен!",
    failUpdate: "Не удалось обновить профиль",
    back: "Назад",
    enterUsername: "Введите новое имя пользователя",
    leaveBlank: "Оставьте пустым, чтобы сохранить текущий",
    writeMessage: "Напишите сообщение...",
    send: "Отправить",
    addMember: "Добавить участника",
    deleteForMe: "Удалить у меня",
    deleteForEveryone: "Удалить у всех",
    cancel: "Отмена",
    deleteConfirm: "Удалить сообщение?",
    deleteSub: "Выберите, как вы хотите удалить это сообщение.",
    online: "в сети",
    offline: "не в сети",
    yesterday: "Вчера",
    success: "Успешно",
    failedToInvite: "Ошибка при приглашении",
    appName: "Telegram Desktop",
    goBack: "Назад"
  }
};

function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const token = useSelector((state) => state.auth?.token);
  const user = useSelector((state) => state.auth.user);

  const t = translations[language];

  const toggleLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    setIsLanguageMenuOpen(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    if (!token) return;
    const socket = createSocket(token);

    const handleMessage = (payload) => {
      if (!payload) return;
      const sId = payload.sender?._id || payload.sender?.id || payload.sender;
      if (String(sId) === String(user?._id)) return;

      const chatId = payload.chatId || payload.chat?._id || payload.chat;
      const currentChatId = location.pathname.split("/home/chats/")[1];

      if (chatId && chatId !== currentChatId) {
        setUnreadCounts(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1
        }));
      }
    };

    socket.on(SOCKET_EVENTS.receive, handleMessage);
    socket.on('message', handleMessage);

    return () => socket.disconnect();
  }, [token, location.pathname, user?._id]);

  useEffect(() => {
    const currentChatId = location.pathname.split("/home/chats/")[1];
    if (currentChatId && unreadCounts[currentChatId]) {
      setUnreadCounts(prev => ({
        ...prev,
        [currentChatId]: 0
      }));
    }
  }, [location.pathname]);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className={styles.container}>
      {/* Sidebar Drawer Container */}
      <div className={`${styles.sidebarDrawer} ${isSidebarOpen ? styles.open : ''}`}>

        {/* Profile Header section (Telegram Style) */}
        <div
          className={styles.profileHeader}
          onClick={() => { setIsSidebarOpen(false); navigate('/home/profile'); }}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar} style={{ overflow: 'hidden' }}>
              {user?.profilePic ? (
                <img src={user.profilePic} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                user?.username?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className={styles.headerTopActions}>
              <button
                onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                className={styles.headerThemeToggle}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }}
                className={styles.closeBtn}
              >✕</button>
            </div>
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileMain}>
              <span className={styles.userName}>{user?.username || 'User'}</span>
              <span className={styles.arrowIcon}>⌵</span>
            </div>
            <button className={styles.statusLink}>{t.setStatus}</button>
          </div>
        </div>

        <ul className={styles.menu}>
          {!isLanguageMenuOpen ? (
            <>
              <li className={styles.menuItem}>
                <NavLink to="/home" end className={styles.link} onClick={() => setIsSidebarOpen(false)}>
                  <span className={styles.icon}>💬</span>
                  <span className={styles.linkLabel}>{t.chats}</span>
                </NavLink>
              </li>
              <li className={styles.menuItem}>
                <NavLink to="/home/profile" className={styles.link} onClick={() => setIsSidebarOpen(false)}>
                  <span className={styles.icon}>👤</span>
                  <span className={styles.linkLabel}>{t.profile}</span>
                </NavLink>
              </li>

              <div className={styles.divider}></div>

              <li className={styles.menuItem}>
                <NavLink to="/home/invites" className={styles.link} onClick={() => setIsSidebarOpen(false)}>
                  <span className={styles.icon}>📬</span>
                  <span className={styles.linkLabel}>{t.invites}</span>
                </NavLink>
              </li>

              <li className={styles.menuItem}>
                <div className={styles.link} onClick={() => setIsLanguageMenuOpen(true)}>
                  <span className={styles.icon}>🌐</span>
                  <span className={styles.linkLabel}>{t.language}</span>
                </div>
              </li>

              <li className={styles.menuItem} style={{ marginTop: 'auto' }}>
                <button
                  className={`${styles.link} ${styles.logoutBtn}`}
                  onClick={() => {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                  }}
                >
                  🚪 {t.logout}
                </button>
              </li>
            </>
          ) : (
            <>
              <li className={styles.menuItem}>
                <div className={styles.link} onClick={() => setIsLanguageMenuOpen(false)} style={{ color: '#64b5f6' }}>
                  <span className={styles.icon}>⬅</span>
                  <span className={styles.linkLabel}>{t.goBack}</span>
                </div>
              </li>
              <li className={styles.menuItem}>
                <div className={`${styles.link} ${language === 'en' ? styles.activeLang : ''}`} onClick={() => toggleLanguage('en')}>
                  <span className={styles.icon}>🇺🇸</span>
                  <span className={styles.linkLabel}>English</span>
                </div>
              </li>
              <li className={styles.menuItem}>
                <div className={`${styles.link} ${language === 'uz' ? styles.activeLang : ''}`} onClick={() => toggleLanguage('uz')}>
                  <span className={styles.icon}>🇺🇿</span>
                  <span className={styles.linkLabel}>O'zbekcha</span>
                </div>
              </li>
              <li className={styles.menuItem}>
                <div className={`${styles.link} ${language === 'ru' ? styles.activeLang : ''}`} onClick={() => toggleLanguage('ru')}>
                  <span className={styles.icon}>🇷🇺</span>
                  <span className={styles.linkLabel}>Русский</span>
                </div>
              </li>
            </>
          )}
        </ul>

        <div className={styles.sidebarFooter}>
          <span>{t.appName}</span>
          <span>{t.version} 5.11.1 x64 – {t.about}</span>
        </div>
      </div>

      {isSidebarOpen && (
        <div className={styles.backdrop} onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Main Telegram Layout */}
      <div className={`${styles.mainLayout} ${location.pathname === '/home' || location.pathname === '/home/' ? styles.noChat : ''}`}>
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={styles.hamburgerBtn}
            >
              ☰
            </button>
            <input
              type="text"
              placeholder={t.search}
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.panelContent}>
            <Chats searchQuery={searchQuery} t={t} unreadCounts={unreadCounts} />
          </div>
        </div>

        <div className={styles.rightPanel}>
          {location.pathname === '/home' || location.pathname === '/home/' ? (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <div className={styles.placeholderChat}>
                {t.placeholder}
              </div>
            </div>
          ) : (
            <Outlet context={{ t, language }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
