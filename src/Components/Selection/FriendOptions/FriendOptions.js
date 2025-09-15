import React from "react";
import styles from "./FriendOptions.module.css";
import { withCookies } from "react-cookie";
import { motion } from "framer-motion";

class FriendOptions extends React.Component {
  API_URL = process.env.REACT_APP_API_URL;
  state = { name: "" };

  generateFriendCode = () => {
    fetch(this.API_URL + "createGame", {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: this.state.name }),
    })
      .then((res) =>
        res
          .json()
          .then((res) => {
            if (
              res &&
              res.success &&
              res.data &&
              res.data.gameId &&
              res.data.secret
            ) {
              this.props.history.push("/friend/code", {
                gameId: res.data.gameId,
                secret: res.data.secret,
                loading: false,
                myName: this.state.name,
              });
            } else {
              this.setState({
                loading: false,
                generateError:
                  (res.data && res.data.message) || "Something went wrong",
              });
            }
          })
          .catch((e) => {
            this.setState({
              loading: false,
              generateError: "Something went wrong",
            });
          })
      )
      .catch((e) => {
        this.setState({
          loading: false,
          generateError: "Something went wrong",
        });
      });
  };

  componentDidMount() {
    const { cookies } = this.props;
    const name = cookies.get("userId");
    if (name && name.length > 0) {
      this.setState({ name: name, fromCookie: true });
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
        <div style={{ marginBottom: "2em" }}>
          <input
            disabled={this.state.fromCookie ? true : false}
            className={
              styles.NameInput +
              (this.state.nameError ? " " + styles.NameInputError : "")
            }
            value={this.state.name}
            placeholder="Enter Your Name"
            onChange={(e) => {
              if (this.state.fromCookie) {
                return;
              }
              this.setState({
                name: e.target.value.replace(/[^a-zA-Z0-9]/, ""),
                nameError: null,
                generateError: null,
              });
            }}
          ></input>
          {this.state.nameError ? (
            <div className={styles.ErrorText}>{this.state.nameError}</div>
          ) : null}
        </div>
        <button
          className={
            styles.Button + " " + (this.state.loading ? styles.Disabled : "")
          }
          onClick={() => {
            if (this.state.name && this.state.name.length > 0) {
              if (this.state.loading) {
                return;
              }
              this.generateFriendCode();
              this.setState({ loading: true, generateError: null });
            } else {
              this.setState({ nameError: "Please enter your name" });
            }
          }}
        >
          Generate Code
        </button>
        <button
          className={
            styles.Button + " " + (this.state.loading ? styles.Disabled : "")
          }
          onClick={() => {
            if (this.state.name && this.state.name.length > 0) {
              if (this.state.loading) {
                return;
              }
              this.props.history.push("/friend/enter", {
                name: this.state.name,
              });
              return;
            } else {
              this.setState({ nameError: "Please enter your name" });
            }
          }}
        >
          Enter Code
        </button>
        {this.state.generateError ? (
          <div className={styles.ErrorText}>{this.state.generateError}</div>
        ) : null}
      </motion.div>
    );
  }
}

export default withCookies(FriendOptions);
