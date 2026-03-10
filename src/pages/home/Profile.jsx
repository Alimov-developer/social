import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useUpdateProfileMutation } from '../../app/services/authApi';
import styles from './Profile.module.css';

function Profile() {
  const user = useSelector(state => state.auth?.user);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');
    try {
      // Send only fields that have values (don't send empty password)
      const payload = {};
      if (formData.username.trim() !== user?.username) payload.username = formData.username;
      if (formData.password.trim()) payload.password = formData.password;

      if (Object.keys(payload).length === 0) {
        setMessage("No changes to save.");
        return;
      }

      await updateProfile(payload).unwrap();
      setMessage("Profile updated successfully!");
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.data?.message || "Failed to update profile");
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => window.history.back()} className={styles.backBtn}>⬅</button>
        <h2 className={styles.headerTitle}>Profile</h2>
      </header>
      <div className={styles.card}>
        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>
            {(user?.username || "U").charAt(0).toUpperCase()}
          </div>
        </div>

        <h2 className={styles.title}>Edit Profile</h2>
        <p className={styles.subtitle}>Update your account details below</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className={styles.input}
              placeholder="Enter new username"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>New Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className={styles.input}
              placeholder="Leave blank to keep current"
            />
          </div>

          <button type="submit" disabled={isLoading} className={styles.saveBtn}>
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {message && <div className={styles.successMessage}>{message}</div>}
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}
      </div>
    </div>
  );
}

export default Profile;