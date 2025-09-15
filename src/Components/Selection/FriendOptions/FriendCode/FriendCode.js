import React from "react";
import GameScreen from "../../../GameScreen/GameScreen";
import styles from "./FriendCode.module.css";
import loadingGif from "../../../../assets/loading.gif";
import { motion } from "framer-motion";

class FriendCode extends React.Component {
  API_URL = process.env.REACT_APP_API_URL;
  componentDidMount() {
    this.poller = setInterval(this.onlineFriendGameReadyPoll, 2000);
  }

  componentWillUnmount() {
    if (this.poller) {
      clearInterval(this.poller);
      this.poller = null;
    }
  }

  onlineFriendGameReadyPoll = () => {
    let abortController = new AbortController();
    let signal = abortController.signal;
    setTimeout(() => {
      abortController.abort();
    }, 2000);
    fetch(this.API_URL + "getGameInfo?id=" + this.props.location.state.gameId, {
      signal,
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        res
          .json()
          .then((apiRes) => {
            console.log(apiRes);
            if (apiRes.success) {
              if (
                apiRes.data &&
                apiRes.data.user2Name &&
                apiRes.data.p1 &&
                apiRes.data.p1 !== "" &&
                apiRes.data.p2 &&
                apiRes.data.p2 !== "" &&
                apiRes.data.sequenceId &&
                apiRes.data.sequenceId !== null
              ) {
                this.props.history.replace("/playFriend", {
                  secret: this.props.location.state.secret,
                  opponentName: apiRes.data.user2Name,
                  myUserNum: 1,
                  myName: this.props.location.state.myName,
                  turn: 1,
                  id: this.props.location.state.gameId,
                });
              }
            }
          })
          .catch((e) => {});
      })
      .catch((e) => {});
  };

  render() {
    if (
      this.props.location &&
      this.props.location.state &&
      this.props.location.state.gameId &&
      this.props.location.state.secret
    ) {
    } else {
      this.props.history.push("/friend");
      return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className={styles.GeneratedCode}>
          {this.props.location.state.gameId}
        </span>
        <p style={{ color: "white", fontSize: "1.5em" }}>
          Provide your friend with this Game Code
        </p>
        <p style={{ marginTop: "2em", display: "block" }}>
          <img src={loadingGif} alt="loading..." />
        </p>
        <p style={{ color: "white", fontSize: "1em" }}>
          Waiting for your friend to join
        </p>
      </motion.div>
    );
  }
}

export default FriendCode;
