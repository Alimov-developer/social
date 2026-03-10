import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Public.module.css';

function Public() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to the Chat App</h1>
      <div className={styles.actions}>
        <Link className={styles.button} to="/login">Login</Link>
        <Link className={styles.button} to="/register">Register</Link>
      </div>
    </div>
  );
}

export default Public;