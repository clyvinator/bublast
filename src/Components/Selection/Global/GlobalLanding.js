import React from "react";
import { withCookies } from "react-cookie";
import styles from "./GlobalLanding.module.css";
import { motion } from "framer-motion";

class GlobalLanding extends React.Component {
  API_URL = process.env.REACT_APP_API_URL;
  state = {
    situation: "matching",
  };
  retry = 0;

  componentDidMount() {
    const { cookies } = this.props;
    const userId = cookies.get("userId");
    const sessionId = cookies.get("sessionId");
    if (!userId || userId.length < 1 || !sessionId || sessionId.length !== 16) {
      this.props.history.replace("/login");
    } else {
      this.setState({ userId: userId, sessionId: sessionId }, () => {
        this.onlineGameReadyPoll();
      });
      this.poller = setInterval(this.onlineGameAddedPoll, 2000);
    }
  }

  onlineGameAddedPoll = () => {
    if (this.state.situation !== "added") {
      return;
    }
    let abortController = new AbortController();
    let signal = abortController.signal;
    setTimeout(() => {
      abortController.abort();
    }, 2000);
    this.retry++;
    if (this.retry >= 30) {
      this.setState({ situation: "failed" });
    }
    fetch(this.API_URL + "getGameInfo?id=" + this.state.gameId, {
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
              let myUserNum = this.state.user1Secret ? 1 : 2;
              if (
                apiRes.data &&
                apiRes.data.user1Name &&
                apiRes.data.user2Name &&
                apiRes.data.p1 &&
                apiRes.data.p1 !== "" &&
                apiRes.data.p2 &&
                apiRes.data.p2 !== "" &&
                apiRes.data.sequenceId &&
                apiRes.data.sequenceId !== null
              ) {
                this.props.history.replace("/play", {
                  secret: this.state.user1Secret || this.state.user2Secret,
                  opponentName:
                    myUserNum === 1
                      ? apiRes.data.user2Name
                      : apiRes.data.user1Name,
                  myUserNum: myUserNum,
                  myName: this.state.userId,
                  turn: 1,
                  id: this.state.gameId,
                });
              }
            } else {
            }
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((e) => {});
  };

  onlineGameReadyPoll = () => {
    if (this.state.situation !== "matching") {
      return;
    }
    let abortController = new AbortController();
    let signal = abortController.signal;
    setTimeout(() => {
      abortController.abort();
    }, 10000);
    this.retry++;
    if (this.retry >= 30) {
      this.setState({ situation: "failed" });
    }
    fetch(this.API_URL + "match", {
      signal,
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: this.state.userId,
        sessionId: this.state.sessionId,
      }),
    })
      .then((res) => {
        res
          .json()
          .then((apiRes) => {
            console.log(apiRes);
            if (apiRes.success) {
              if (
                apiRes.data &&
                apiRes.data.user1Secret &&
                apiRes.data.user1Secret !== "" &&
                apiRes.data.gameId &&
                apiRes.data.gameId !== "" &&
                apiRes.message === "added" &&
                this.state.situation === "matching"
              ) {
                console.log("Added: change situation");
                this.setState({
                  networkUnavailable: false,
                  situation: "added",
                  user1Secret: apiRes.data.user1Secret,
                  gameId: apiRes.data.gameId,
                });
              } else if (
                apiRes.data &&
                apiRes.data.secret &&
                apiRes.data.secret !== "" &&
                apiRes.data.opponent_name &&
                apiRes.data.opponent_name !== "" &&
                apiRes.data.target_game_id &&
                apiRes.data.target_game_id !== "" &&
                this.state.situation === "matching"
              ) {
                console.log("User1 already waiting: join in");
                this.setState({
                  networkUnavailable: false,
                  situation: "added",
                  user2Secret: apiRes.data.secret,
                  gameId: apiRes.data.target_game_id,
                });
              } else {
                this.setState({ networkUnavailable: false });
                setTimeout(() => {
                  this.onlineGameReadyPoll();
                }, 3000);
              }
            } else {
              this.setState({ networkUnavailable: false });
              if (apiRes.code === 401) {
                console.log("Auth Fail");

                this.props.cookies.remove("userId", { path: "/" });
                this.props.cookies.remove("sessionId", { path: "/" });
                document.location.reload();
              } else {
                setTimeout(() => {
                  this.onlineGameReadyPoll();
                }, 3000);
              }
            }
          })
          .catch((e) => {
            this.setState({ networkUnavailable: false });
            setTimeout(() => {
              this.onlineGameReadyPoll();
            }, 3000);
          });
      })
      .catch((e) => {
        if (!window.navigator.onLine) {
          this.setState({ networkUnavailable: true });
        }
        setTimeout(() => {
          this.onlineGameReadyPoll();
        }, 3000);
      });
  };

  componentWillUnmount() {
    if (this.poller) {
      clearInterval(this.poller);
      this.poller = null;
    }
  }

  render() {
    let display;
    if (this.state.situation === "failed") {
      display = (
        <div className={styles.GlobalLandingPulseLabel}>
          Could not find any players to match with
          <div>
            <button
              className={styles.Button}
              onClick={() => {
                this.retry = 0;
                this.setState({ situation: "matching" }, () => {
                  this.onlineGameReadyPoll();
                });
              }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    } else {
      display = (
        <>
          <div
            className={
              styles.GlobalLandingPulse + " " + styles.GlobalLandingPulse1
            }
          ></div>
          <div
            className={
              styles.GlobalLandingPulse + " " + styles.GlobalLandingPulse2
            }
          ></div>
          <div
            className={
              styles.GlobalLandingPulse + " " + styles.GlobalLandingPulse3
            }
          ></div>
          <div className={styles.GlobalLandingPulseLabel}>Matching</div>
        </>
      );
    }
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.vGlobalLandingMainDiv}
      >
        <div className={styles.GlobalLandingPulserContainer}>{display}</div>
        {this.state.networkUnavailable ? (
          <div className={styles.ConnectionStatsContainer}>
            Poor Connection. Connecting...
          </div>
        ) : null}
      </motion.div>
    );
  }
}

export default withCookies(GlobalLanding);
