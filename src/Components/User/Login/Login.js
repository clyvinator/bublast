import React from "react";
import styles from "./Login.module.css";
import { withCookies } from "react-cookie";
import { motion } from "framer-motion";

class Login extends React.Component {
  state = { gamerTag: "", password: "" };
  API_URL = process.env.REACT_APP_API_URL;

  handleLogin = () => {
    const { cookies } = this.props;
    if (!this.state.gamerTag || this.state.gamerTag.length < 1) {
      this.setState({ tagError: "Please enter a Gamer Tag" });
    } else if (
      !(this.state.gamerTag.length >= 3 && this.state.gamerTag.length <= 10)
    ) {
      this.setState({
        tagError: "Invalid Gamer Tag",
      });
    } else if (!this.state.password || this.state.password.length < 1) {
      this.setState({ passwordError: "Please enter your Password" });
    } else if (
      !(this.state.password.length >= 8 && this.state.password.length <= 16)
    ) {
      this.setState({
        passwordError: "Invalid Password",
      });
    } else {
      this.setState({ loading: true, error: null });
      fetch(this.API_URL + "login", {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: this.state.gamerTag,
          password: this.state.password,
        }),
      })
        .then((res) => {
          if (res.ok) {
            res.json().then((apiRes) => {
              if (
                apiRes.data &&
                apiRes.data.user_id &&
                apiRes.data.session_id &&
                apiRes.data.session_id.length === 16
              ) {
                cookies.set("userId", apiRes.data.user_id, {
                  path: "/",
                  maxAge: 99999999,
                  secure: true,
                });
                cookies.set("sessionId", apiRes.data.session_id, {
                  path: "/",
                  maxAge: 99999999,
                  secure: true,
                });
                this.props.history.push("/");
              } else {
                this.setState({ loading: false });
                this.setState({ error: "Something went wrong" });
              }
              if (apiRes.success) {
              } else if (apiRes.message) {
                this.setState({ loading: false });
                this.setState({ error: apiRes.message });
              } else {
                this.setState({ loading: false });
                this.setState({ error: "Something went wrong" });
              }
            });
          } else {
            this.setState({ loading: false });
            this.setState({ error: "Something went wrong" });
          }
        })
        .catch((e) => {
          this.setState({ loading: false });
          console.log(e);
          this.setState({ error: "Something went wrong" });
        });
    }
  };

  componentDidMount() {
    if (
      this.props.location &&
      this.props.location.state &&
      this.props.location.state.userId &&
      this.props.location.state.userId.length > 0
    ) {
      this.setState({ gamerTag: this.props.location.state.userId });
    }
  }

  render() {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.LoginTextDiv}>Login</div>
        <div style={{ marginBottom: "2em" }}>
          <input
            className={
              styles.Input +
              (this.state.tagError ? " " + styles.TagInputError : "")
            }
            value={this.state.gamerTag}
            placeholder="Gamer Tag"
            onChange={(e) => {
              this.setState({
                gamerTag: e.target.value.replace(/[^a-zA-Z0-9]/, ""),
                tagError: null,
                error: null,
              });
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                this.handleLogin();
              }
            }}
          ></input>
          {this.state.tagError ? (
            <div className={styles.ErrorText}>{this.state.tagError}</div>
          ) : null}
        </div>

        <div style={{ marginBottom: "2em" }}>
          <input
            type="password"
            className={
              styles.Input +
              (this.state.passwordError ? " " + styles.PasswordInputError : "")
            }
            value={this.state.password}
            placeholder="Password"
            onChange={(e) => {
              this.setState({
                password: e.target.value,
                passwordError: null,
                error: null,
              });
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                this.handleLogin();
              }
            }}
          ></input>
          {this.state.passwordError ? (
            <div className={styles.ErrorText}>{this.state.passwordError}</div>
          ) : null}
        </div>
        <button
          className={
            styles.Button + " " + (this.state.loading ? styles.Disabled : "")
          }
          onClick={() => {
            if (this.state.loading) {
              return;
            }
            this.handleLogin();
          }}
        >
          Continue
        </button>
        <div className={styles.LoginRegisterDiv}>
          Don't have an account? <a href="/register">Register</a>
        </div>
        {this.state.error ? (
          <div className={styles.ErrorText}>{this.state.error}</div>
        ) : null}
        {this.state.info ? (
          <div className={styles.InfoText}>{this.state.info}</div>
        ) : null}
      </motion.div>
    );
  }
}

export default withCookies(Login);
