import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import styles from "./Home.module.css";
import Chats from "./Chats";

function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const [searchQuery, setSearchQuery] = useState("");

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Run once on mount to apply default logic
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <div className={styles.container}>
      {/* Sidebar Drawer Container */}
      <div className={`${styles.sidebarDrawer} ${isSidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className={styles.brand}>Menu</h2>
            <button onClick={toggleTheme} className={styles.themeToggle}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className={styles.closeBtn}>✕</button>
        </div>
        <ul className={styles.menu}>
          <li className={styles.menuItem}>
            <NavLink
              to="/home"
              end
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              💬 Chats
            </NavLink>
          </li>
          <li className={styles.menuItem}>
            <NavLink
              to="/home/profile"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              👤 Profile
            </NavLink>
          </li>
          <li className={styles.menuItem}>
            <NavLink
              to="/home/invites"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              📩 Invites
            </NavLink>
          </li>
          <li className={styles.menuItem} style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <button
              className={`${styles.link} ${styles.logoutBtn}`}
              onClick={() => {
                // Dispatch logout or clear local storage here
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
            >
              🚪 Log Out
            </button>
          </li>
        </ul>
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
              placeholder="Search"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.panelContent}>
            <Chats searchQuery={searchQuery} />
          </div>
        </div>

        <div className={styles.rightPanel}>
          {location.pathname === '/home' || location.pathname === '/home/' ? (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <div className={styles.placeholderChat}>
                Select a chat to start messaging
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
