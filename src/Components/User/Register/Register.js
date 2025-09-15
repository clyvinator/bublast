import React from "react";
import styles from "./Register.module.css";
import { motion } from "framer-motion";

class Register extends React.Component {
  state = { gamerTag: "", password: "" };
  API_URL = process.env.REACT_APP_API_URL;

  handleRegister = () => {
    if (!this.state.gamerTag || this.state.gamerTag.length < 1) {
      this.setState({ tagError: "Please enter a Gamer Tag" });
    } else if (
      !(this.state.gamerTag.length >= 3 && this.state.gamerTag.length <= 10)
    ) {
      this.setState({
        tagError: "Gamer Tag must be between 3 and 10 characters in length",
      });
    } else if (!this.state.password || this.state.password.length < 1) {
      this.setState({ passwordError: "Please enter a Password" });
    } else if (
      !(this.state.password.length >= 8 && this.state.password.length <= 16)
    ) {
      this.setState({
        passwordError: "Password must be between 8 and 16 characters in length",
      });
    } else {
      this.setState({ loading: true, error: null });
      fetch(this.API_URL + "register", {
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
              console.log(apiRes);
              if (apiRes.success) {
                this.setState({ info: "Successfully created account" });
                setTimeout(() => {
                  this.props.history.push("/login", {
                    userId: this.state.gamerTag,
                  });
                }, 1500);
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

  render() {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.RegisterTextDiv}>Register</div>
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
                this.handleRegister();
              }
            }}
          ></input>
          {this.state.tagError ? (
            <div className={styles.ErrorText}>{this.state.tagError}</div>
          ) : null}
          <div style={{ color: "gray" }}>You cannot change this later</div>
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
                this.handleRegister();
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
            this.handleRegister();
          }}
        >
          Create Account
        </button>
        <div className={styles.RegisterLoginDiv}>
          Already have an account? <a href="/login">Login</a>
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

export default Register;
