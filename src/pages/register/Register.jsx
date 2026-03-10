import React, { useState } from "react";
import styles from "./Register.module.css";
import { useRegisterMutation } from "../../app/services/authApi";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getCredentials } from "../../app/features/authSlice";

function Register() {
  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState(null);
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((state) => ({
      ...state,
      [name]: value,
    }));
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.username || !formData.password) return;

    try {
      const res = await register(formData).unwrap();

      dispatch(
        getCredentials({
          user: res.user,
          token: res.token || res.accessToken,
        })
      );

      setFormData({ username: "", password: "" });
      navigate("/");

    } catch (err) {
      console.log(err);
      setError(err?.data?.message || "Registration failed. Please try again.");
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>Create Account 🚀</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              type="text"
              placeholder="Username"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              name="password"
              value={formData.password}
              onChange={handleChange}
              type="password"
              placeholder="Password"
              required
            />
          </div>

          <button className={styles.button} disabled={isLoading}>
            {isLoading ? "Loading..." : "Register"}
          </button>
          {error && <div className={styles.error}>{error}</div>}
        </form>

        <p className={styles.footerText}>
          Already have an account? <Link to="/login" className={styles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
