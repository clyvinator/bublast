import React from "react";
import styles from "./EnterCode.module.css";
import { motion } from "framer-motion";

class EnterCode extends React.Component {
  API_URL = process.env.REACT_APP_API_URL;
  state = { id: "" };

  componentDidMount() {
    if (
      !this.props.location ||
      !this.props.location.state ||
      !this.props.location.state.name ||
      !this.props.location.state.name.length > 0
    ) {
      this.props.history.push("/friend");
    }
  }

  handleJoin = () => {
    let myName = this.props.location.state.name;
    if (!this.state.id || this.state.id.length !== 6) {
      this.setState({ codeError: "Please enter a valid code" });
    } else if (!myName || myName < 1) {
      this.setState({ error: "Something went wrong" });
    } else {
      this.setState({ loading: true, error: null });
      fetch(this.API_URL + "joinGame", {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: this.state.id,
          name: myName,
        }),
      })
        .then((res) => {
          this.setState({ loading: false });
          if (res.ok) {
            res.json().then((apiRes) => {
              console.log(apiRes);
              if (apiRes.success) {
                this.props.history.replace("/playFriend", {
                  secret: apiRes.data.secret,
                  opponentName: apiRes.data.opponent_name,
                  myUserNum: 2,
                  myName: myName,
                  turn: 2,
                  id: this.state.id,
                });
              } else if (apiRes.message) {
                this.setState({ error: apiRes.message });
              } else {
                this.setState({ error: "Something went wrong" });
              }
            });
          } else {
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
        <div style={{ marginBottom: "2em" }}>
          <input
            className={
              styles.NameInput +
              (this.state.codeError ? " " + styles.CodeInputError : "")
            }
            value={this.state.name}
            placeholder="Enter The Code"
            onKeyPress={(e) => {
              if (this.state.loading) {
                return;
              }
              if (e.key === "Enter") {
                this.handleJoin();
              }
            }}
            onChange={(e) => {
              this.setState({
                id: e.target.value,
                codeError: null,
                error: null,
              });
            }}
          ></input>
          {this.state.codeError ? (
            <div className={styles.ErrorText}>{this.state.codeError}</div>
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
            this.handleJoin();
          }}
        >
          Join
        </button>
        {this.state.error ? (
          <div className={styles.ErrorText}>{this.state.error}</div>
        ) : null}
      </motion.div>
    );
  }
}

export default EnterCode;
