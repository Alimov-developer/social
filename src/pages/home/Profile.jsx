import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import { useUpdateProfileMutation } from '../../app/services/authApi';
import { getCredentials } from '../../app/features/authSlice';
import styles from './Profile.module.css';

function Profile() {
  const { t } = useOutletContext();
  const user = useSelector(state => state.auth?.user);
  const token = useSelector(state => state.auth?.token);
  const dispatch = useDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    profilePic: user?.profilePic || ''
  });
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 250;
          const MAX_HEIGHT = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setFormData(prev => ({ ...prev, profilePic: compressedDataUrl }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');
    try {
      const payload = {};
      if (formData.username.trim() !== user?.username) payload.username = formData.username;
      if (formData.password.trim()) payload.password = formData.password;
      if (formData.profilePic !== user?.profilePic && formData.profilePic) payload.profilePic = formData.profilePic;

      if (Object.keys(payload).length === 0) {
        setMessage(t.noChanges);
        return;
      }

      const res = await updateProfile(payload).unwrap();

      // Update Redux state with merged user payload in case of missing response user
      const updatedUser = { ...user, ...res.user, ...payload };
      dispatch(getCredentials({ user: updatedUser, token }));

      setMessage(t.profileUpdated);
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.data?.message || t.failUpdate);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => window.history.back()} className={styles.backBtn}>⬅</button>
        <h2 className={styles.headerTitle}>{t.profile}</h2>
      </header>
      <div className={styles.card}>
        <div className={styles.avatarContainer}>
          <div className={styles.avatarWrapper} onClick={() => fileInputRef.current?.click()}>
            <div className={styles.avatar}>
              {formData.profilePic ? (
                <img src={formData.profilePic} alt="avatar" className={styles.avatarImg} />
              ) : (
                (user?.username || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div className={styles.avatarOverlay}>
              <span>📷</span>
            </div>
          </div>
          <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} />
        </div>

        <h2 className={styles.title}>{t.editProfile}</h2>
        <p className={styles.subtitle}>{t.updateDetails}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>{t.username}</label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className={styles.input}
              placeholder={t.enterUsername}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>{t.password}</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className={styles.input}
              placeholder={t.leaveBlank}
            />
          </div>

          <button type="submit" disabled={isLoading} className={styles.saveBtn}>
            {isLoading ? t.saving : t.saveChanges}
          </button>
        </form>

        {message && <div className={styles.successMessage}>{message}</div>}
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}
      </div>
    </div>
  );
}

export default Profile;
