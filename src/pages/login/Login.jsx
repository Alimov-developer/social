import { useState } from "react";
import styles from "./Login.module.css";
import { useLoginMutation } from "../../app/services/authApi";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getCredentials } from "../../app/features/authSlice";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(formData).unwrap();

      dispatch(
        getCredentials({
          user: res.user,
          token: res.token || res.accessToken,
        })
      );

      if (res?.user?.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/home");
      }
    } catch (err) {
      console.log("Login error:", err);
      setError(err?.data?.message || "Invalid username or password");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome Back 👋</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              name="username"
              type="text"
              placeholder="Username"
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
          </div>

          <button className={styles.button} disabled={isLoading}>
            {isLoading ? "Loading..." : "Login"}
          </button>
          {error && <div className={styles.error}>{error}</div>}
        </form>

        <p className={styles.footerText}>
          Don't have an account? <Link to="/register" className={styles.link}>Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
