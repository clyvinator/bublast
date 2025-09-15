import React from "react";
import styles from "./CoreOnlineFriend.module.css";
import FriendStats from "./Utils/FriendStats";
import popAudio from "../../assets/pop.wav";
import popAudioMp3 from "../../assets/pop.mp3";
import popAudioWebm from "../../assets/pop.webm";
import moment from "moment";
import ConnectionStats from "../Core/Utils/ConnectionStats";
import MatchResults from "./Utils/MatchResults";
import { withRouter } from "react-router-dom";
import { Howl } from "howler";
import Message from "../Core/Utils/Message";
import n1 from "../../assets/negative_emojis/1.png";
import n2 from "../../assets/negative_emojis/2.png";
import n3 from "../../assets/negative_emojis/3.png";
import n4 from "../../assets/negative_emojis/4.png";
import p1 from "../../assets/positive_emojis/1.png";
import p2 from "../../assets/positive_emojis/2.png";
import p3 from "../../assets/positive_emojis/3.png";
import p4 from "../../assets/positive_emojis/4.png";

class CoreOnlineFriend extends React.Component {
  state = { connectionRetryNum: 0 };
  API_URL = process.env.REACT_APP_API_URL;
  GRID_SIZE = 6;
  REACT_MOVEMENT_STEPS_INCREMENT = 6;
  PLAYER1_COLOR = "#F00";
  PLAYER2_COLOR = "#FF0";
  CANVAS_BG_COLOR = "#161C22";
  CANVAS_HIGHLIGHT_COLOR = "#2c3339";
  OPPONENT_HIGHLIGHT_COLOR = "#4c5359";
  MARK2_ROTATE_INCREMENT = 0.008;
  MARK3_ROTATE_INCREMENT = 0.01;
  // pop = new Audio(popAudio);
  pop = new Howl({
    src: [popAudioWebm, popAudio, popAudioMp3],
    onloaderror: (a, b) => {
      console.log(a, b);
    },
    onplayerror: (a, b) => {
      console.log(a, b);
    },
    html5: true,
    preload: true,
  });

  turn;
  p1 = Array(this.GRID_SIZE)
    .fill(0)
    .map(() => Array(this.GRID_SIZE).fill(0));
  p2 = Array(this.GRID_SIZE)
    .fill(0)
    .map(() => Array(this.GRID_SIZE).fill(0));

  CANVAS_DIMENSION = 1000;

  //Animations
  animationRequestID;
  rotateCounter2 = 0;
  rotateCounter3 = 0;
  busy = false;
  highlight = {};
  beforeFPSTime = 0;

  //React
  reactPlayer;
  reactMovement;
  reactCords;
  reactSteps = 0;
  reactMatrixP1 = [];
  reactMatrixP2 = [];
  reactState; // init, move, settle, final
  reactMovementSteps = 0;

  //Online
  sequenceId = 0;
  myUserNum;
  secret;
  myName;
  opponentName;
  poller;
  pollFrequency = 2000;
  apiBusy = false;

  componentDidMount() {
    this.turn = this.props.turn;
    this.myUserNum = this.props.myUserNum;
    this.secret = this.props.secret;
    this.myName = this.props.myName;
    this.opponentName = this.props.opponentName;
    this.id = this.props.id;
    this.setState({
      turn: this.props.turn,
      myName: this.props.myName,
      opponentName: this.props.opponentName,
      id: this.props.id,
      myUserNum: this.props.myUserNum,
    });

    let canvas = this.refs.canvas;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;
    canvasWidth < canvasHeight
      ? (canvasHeight = canvasWidth)
      : (canvasWidth = canvasHeight);
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";

    canvas.width = this.CANVAS_DIMENSION;
    canvas.height = this.CANVAS_DIMENSION;

    let ctx = canvas.getContext("2d");
    this.drawCanvas(ctx);
    window.addEventListener("resize", this.handleWindowResize);
    this.onlineFriendGameController();
    this.poller = setInterval(
      this.onlineFriendGameController,
      this.pollFrequency
    );
    let AppElement = document.getElementById("App");
    let BodyInnerDiv = document.getElementById("BodyInnerDiv");
    if (AppElement && AppElement.style) {
      AppElement.style.backgroundImage = "unset";
    }
    if (BodyInnerDiv && BodyInnerDiv.style) {
      BodyInnerDiv.style.backdropFilter = "unset";
    }
  }

  componentWillUnmount() {
    if (this.poller) {
      clearInterval(this.poller);
      this.poller = null;
    }
    if (this.animationRequestID) {
      cancelAnimationFrame(this.animationRequestID);
    }
    window.removeEventListener("resize", this.handleWindowResize);
    let AppElement = document.getElementById("App");
    let BodyInnerDiv = document.getElementById("BodyInnerDiv");
    if (AppElement && AppElement.style) {
      AppElement.style.backgroundImage = "";
    }
    if (BodyInnerDiv && BodyInnerDiv.style) {
      BodyInnerDiv.style.backdropFilter = "";
    }
  }

  /** CONTROLLER */
  onlineFriendGameController = () => {
    if (this.apiBusy) {
      return;
    }
    let abort = new AbortController();
    setTimeout(() => {
      abort.abort();
    }, 2000);
    let signal = abort.signal;
    fetch(this.API_URL + "getGameInfo?id=" + this.id, {
      signal,
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (this.state.connectionRetryNum > 0) {
          this.setState({
            connectionRetryNum: 0,
          });
        }
        res
          .json()
          .then((apiRes) => {
            if (apiRes.success) {
              if (apiRes.data && apiRes.data.sequenceId) {
                if (this.apiBusy) {
                  return;
                }
                if (
                  this.myUserNum === 1 &&
                  apiRes.data.user2_message &&
                  apiRes.data.user2_message.length > 0 &&
                  apiRes.data.user2_message !== this.state.check_user2_message
                ) {
                  if (
                    apiRes.data.user2_message_time &&
                    apiRes.data.user2_message_time >
                      moment().subtract("7", "s").utc().unix().toString()
                  ) {
                    let msgToSet;
                    let msgIsAnEmojiMatch = apiRes.data.user2_message.match(
                      /^:..:$/
                    );
                    if (
                      msgIsAnEmojiMatch &&
                      msgIsAnEmojiMatch[0] === apiRes.data.user2_message
                    ) {
                      console.log("Matched", apiRes.data.user2_message);
                      switch (apiRes.data.user2_message) {
                        case ":n1:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={n1} />
                            </div>
                          );
                          break;
                        case ":n2:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={n2} />
                            </div>
                          );
                          break;
                        case ":n3:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={n3} />
                            </div>
                          );
                          break;
                        case ":n4:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={n4} />
                            </div>
                          );
                          break;
                        case ":p1:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={p1} />
                            </div>
                          );
                          break;
                        case ":p2:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={p2} />
                            </div>
                          );
                          break;
                        case ":p3:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={p3} />
                            </div>
                          );
                          break;
                        case ":p4:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={p4} />
                            </div>
                          );
                          break;
                        default:
                          console.log("DEFAULT");
                      }
                    } else {
                      msgToSet = (
                        <div className={styles.DisplayMessageDiv}>
                          {apiRes.data.user2_message}
                        </div>
                      );
                    }
                    console.log(msgToSet);
                    this.setState({
                      user2_message: msgToSet,
                      check_user2_message: apiRes.data.user2_message,
                    });
                    setTimeout(() => {
                      this.setState({ user2_message: null });
                    }, 4000);
                  }
                } else if (
                  this.myUserNum === 2 &&
                  apiRes.data.user1_message &&
                  apiRes.data.user1_message.length > 0 &&
                  apiRes.data.user1_message !== this.state.check_user1_message
                ) {
                  if (
                    apiRes.data.user1_message_time &&
                    apiRes.data.user1_message_time >
                      moment().subtract("7", "s").utc().unix().toString()
                  ) {
                    let msgToSet;
                    let msgIsAnEmojiMatch = apiRes.data.user1_message.match(
                      /^:..:$/
                    );
                    if (
                      msgIsAnEmojiMatch &&
                      msgIsAnEmojiMatch[0] === apiRes.data.user1_message
                    ) {
                      console.log("Matched", apiRes.data.user1_message);
                      switch (apiRes.data.user1_message) {
                        case ":n1:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={n1} />
                            </div>
                          );
                          break;
                        case ":n2:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={n2} />
                            </div>
                          );
                          break;
                        case ":n3:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={n3} />
                            </div>
                          );
                          break;
                        case ":n4:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={n4} />
                            </div>
                          );
                          break;
                        case ":p1:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={p1} />
                            </div>
                          );
                          break;
                        case ":p2:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={p2} />
                            </div>
                          );
                          break;
                        case ":p3:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={p3} />
                            </div>
                          );
                          break;
                        case ":p4:":
                          msgToSet = (
                            <div className={styles.DisplayMessageEmojiDiv}>
                              <img src={p4} />
                            </div>
                          );
                          break;
                        default:
                          console.log("DEFAULT");
                      }
                    } else {
                      msgToSet = (
                        <div className={styles.DisplayMessageDiv}>
                          {apiRes.data.user1_message}
                        </div>
                      );
                    }
                    console.log(msgToSet);
                    this.setState({
                      user1_message: msgToSet,
                      check_user1_message: apiRes.data.user1_message,
                    });
                    setTimeout(() => {
                      this.setState({ user1_message: null });
                    }, 4000);
                  }
                }
                let tempSequenceId = Number.parseInt(apiRes.data.sequenceId);
                if (tempSequenceId > -1) {
                  if (tempSequenceId >= this.sequenceId + 2) {
                    console.log("Sequence gap (lagging) - bridging instantly");
                    this.sequenceId = tempSequenceId;
                    if (apiRes.data.p1 && apiRes.data.p2) {
                      let tempP1 = JSON.parse(apiRes.data.p1);
                      let tempP2 = JSON.parse(apiRes.data.p2);
                      this.p1 = tempP1;
                      this.p2 = tempP2;
                    }
                    if (apiRes.data.turn) {
                      let tempTurn = Number.parseInt(apiRes.data.turn);
                      if (tempTurn > 0) {
                        this.changeTurn(tempTurn);
                      }
                    }
                  } else if (tempSequenceId === this.sequenceId) {
                    if (this.reactSteps === 0) {
                      if (
                        JSON.stringify(this.p1) !== apiRes.data.p1 ||
                        JSON.stringify(this.p2) !== apiRes.data.p2
                      ) {
                        let tempP1 = JSON.parse(apiRes.data.p1);
                        let tempP2 = JSON.parse(apiRes.data.p2);
                        this.p1 = tempP1;
                        this.p2 = tempP2;
                      }
                      if (apiRes.data.turn) {
                        let tempTurn = Number.parseInt(apiRes.data.turn);
                        if (tempTurn > 0 && tempTurn !== this.turn) {
                          this.changeTurn(tempTurn);
                        }
                      }
                    }
                    console.log(this.myUserNum);
                    if (
                      apiRes.data.winner &&
                      (apiRes.data.winner === 1 || apiRes.data.winner === 2) &&
                      !this.busy
                    ) {
                      this.busy = true;
                      this.apiBusy = true;
                      this.gameWon(apiRes.data.winner, apiRes.data.winReason);
                    }
                  } else if (tempSequenceId === this.sequenceId + 1) {
                    if (apiRes.data.turn) {
                      let tempTurn = Number.parseInt(apiRes.data.turn);
                      if (tempTurn > 0) {
                        if (tempTurn === this.myUserNum) {
                          console.log("Update detected - bridging gracefully");
                          //opponent handleClick
                          if (apiRes.data.cords && apiRes.data.cords !== "") {
                            let tempCords = apiRes.data.cords;
                            this.handleVirtualClick(tempCords);
                          }
                        } else {
                          console.log(
                            "Update detected (client behind anomaly)- bridging"
                          );
                          this.sequenceId = tempSequenceId;
                          if (apiRes.data.p1 && apiRes.data.p2) {
                            let tempP1 = JSON.parse(apiRes.data.p1);
                            let tempP2 = JSON.parse(apiRes.data.p2);
                            this.p1 = tempP1;
                            this.p2 = tempP2;
                            this.changeTurn(tempTurn);
                          }
                        }
                      }
                    }
                  } else if (this.sequenceId > tempSequenceId) {
                    console.log(
                      "Sequence gap (limbo anomaly) - bridging instantly"
                    );
                    this.sequenceId = tempSequenceId;
                    if (apiRes.data.p1 && apiRes.data.p2) {
                      let tempP1 = JSON.parse(apiRes.data.p1);
                      let tempP2 = JSON.parse(apiRes.data.p2);
                      this.p1 = tempP1;
                      this.p2 = tempP2;
                    }
                    if (apiRes.data.turn) {
                      let tempTurn = Number.parseInt(apiRes.data.turn);
                      if (tempTurn > 0) {
                        this.changeTurn(tempTurn);
                      }
                    }
                  }
                  let turnTime = apiRes.data.turnTime;
                  if (this.state.turnTime !== turnTime) {
                    this.setState({ turnTime: turnTime });
                  }
                }
              }
            } else {
              console.log("success false");
            }
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((e) => {
        console.log(e);
        console.log(window.navigator.onLine);
        if (e.name === "AbortError" || !window.navigator.onLine) {
          this.setState((s) => {
            return { connectionRetryNum: s.connectionRetryNum + 1 };
          });
        }
      });
  };

  changeTurn = (newTurn) => {
    this.turn = newTurn;
    this.setState({ turn: newTurn });
  };

  drawGrid = (ctx) => {
    let highlightX, highlightY;
    let opponentHighlightX, opponentHighlightY;
    if (this.highlight && this.highlight.x && this.highlight.y) {
      highlightX = this.highlight.x;
      highlightY = this.highlight.y;
    }
    if (this.highlight && this.highlight.ox && this.highlight.oy) {
      opponentHighlightX = this.highlight.ox;
      opponentHighlightY = this.highlight.oy;
    }
    for (let x = 0; x < this.GRID_SIZE + 1; x++) {
      for (let y = 0; y < this.GRID_SIZE + 1; y++) {
        /**hover & opponent highlight*/
        if (highlightX === x + 1 && highlightY === y + 1) {
          ctx.fillStyle = this.CANVAS_HIGHLIGHT_COLOR;
          ctx.fillRect(
            (x * this.CANVAS_DIMENSION) / this.GRID_SIZE,
            (y * this.CANVAS_DIMENSION) / this.GRID_SIZE,
            this.CANVAS_DIMENSION / this.GRID_SIZE,
            this.CANVAS_DIMENSION / this.GRID_SIZE
          );
        }
        if (opponentHighlightX === x + 1 && opponentHighlightY === y + 1) {
          ctx.fillStyle = this.OPPONENT_HIGHLIGHT_COLOR;
          ctx.fillRect(
            (x * this.CANVAS_DIMENSION) / this.GRID_SIZE,
            (y * this.CANVAS_DIMENSION) / this.GRID_SIZE,
            this.CANVAS_DIMENSION / this.GRID_SIZE,
            this.CANVAS_DIMENSION / this.GRID_SIZE
          );
        }
        /**hover & opponent highlight end */

        ctx.lineWidth = 3;
        ctx.strokeStyle =
          this.turn === 1 ? this.PLAYER1_COLOR : this.PLAYER2_COLOR;
        ctx.beginPath();
        ctx.moveTo((x * this.CANVAS_DIMENSION) / this.GRID_SIZE, 0);
        ctx.lineTo(
          (x * this.CANVAS_DIMENSION) / this.GRID_SIZE,
          this.CANVAS_DIMENSION
        );
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(0, (y * this.CANVAS_DIMENSION) / this.GRID_SIZE);
        ctx.lineTo(
          this.CANVAS_DIMENSION,
          (y * this.CANVAS_DIMENSION) / this.GRID_SIZE
        );
        ctx.stroke();
        ctx.closePath();
      }
    }
  };

  drawMarks = (ctx) => {
    /**dots */
    if (this.p1) {
      for (let x = 0; x < this.GRID_SIZE; x++) {
        for (let y = 0; y < this.GRID_SIZE; y++) {
          if (this.p1[x] && this.p1[x][y] > 0)
            this.marksRender(ctx, x, y, this.p1[x][y], this.PLAYER1_COLOR);
        }
      }
    }
    if (this.p2) {
      for (let x = 0; x < this.GRID_SIZE; x++) {
        for (let y = 0; y < this.GRID_SIZE; y++) {
          if (this.p2[x] && this.p2[x][y] > 0)
            this.marksRender(ctx, x, y, this.p2[x][y], this.PLAYER2_COLOR);
        }
      }
    }
    /** */
  };

  marksRender = (ctx, x, y, count, color) => {
    ctx.fillStyle = color;
    switch (count) {
      case 1:
        ctx.beginPath();
        ctx.arc(
          (x * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2,
          (y * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2,
          this.CANVAS_DIMENSION / this.GRID_SIZE / 4.2,
          0,
          2 * Math.PI,
          false
        );
        ctx.fill();
        ctx.closePath();
        break;
      case 2:
        if (
          (x === 0 && y === 0) ||
          (x === this.GRID_SIZE - 1 && y === 0) ||
          (x === 0 && y === this.GRID_SIZE - 1) ||
          (x === this.GRID_SIZE - 1 && y === this.GRID_SIZE - 1)
        ) {
          break;
        }
        ctx.setTransform(
          1,
          0,
          0,
          1,
          (x * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2,
          (y * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2
        );
        ctx.rotate(this.rotateCounter2 * Math.PI);
        ctx.beginPath();
        ctx.arc(
          -15,
          -15,
          this.CANVAS_DIMENSION / this.GRID_SIZE / 4.2,
          0,
          2 * Math.PI,
          false
        );
        ctx.arc(
          15,
          15,
          this.CANVAS_DIMENSION / this.GRID_SIZE / 4.2,
          0,
          2 * Math.PI,
          false
        );

        ctx.fill();
        ctx.closePath();
        ctx.beginPath();

        ctx.fill();
        ctx.closePath();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        break;
      case 3:
        if (
          x === 0 ||
          y === 0 ||
          x === this.GRID_SIZE - 1 ||
          y === this.GRID_SIZE - 1
        ) {
          break;
        }
        if (
          (x === 0 && y === 0) ||
          (x === this.GRID_SIZE - 1 && y === 0) ||
          (x === 0 && y === this.GRID_SIZE - 1) ||
          (x === this.GRID_SIZE - 1 && y === this.GRID_SIZE - 1)
        ) {
          break;
        }
        ctx.setTransform(
          1,
          0,
          0,
          1,
          (x * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2,
          (y * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2
        );
        ctx.rotate(this.rotateCounter3 * Math.PI);
        ctx.beginPath();
        ctx.arc(
          -20,
          -20,
          this.CANVAS_DIMENSION / this.GRID_SIZE / 4.2,
          0,
          2 * Math.PI,
          false
        );

        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(
          20,
          -20,
          this.CANVAS_DIMENSION / this.GRID_SIZE / 4.2,
          0,
          2 * Math.PI,
          false
        );
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(
          0,
          20,
          this.CANVAS_DIMENSION / this.GRID_SIZE / 4.2,
          0,
          2 * Math.PI,
          false
        );

        ctx.fill();
        ctx.closePath();
        break;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  playAudio = async () => {
    this.pop.play();
  };

  drawReactionMotion(ctx) {
    if (this.busy && this.reactSteps > 0) {
      if (this.reactSteps === 1 && this.reactState === "settle") {
        this.reactState = "final";
      }
      if (
        this.reactState === "init" &&
        this.reactPlayer > 0 &&
        this.reactCords &&
        this.reactCords.length > 0
      ) {
        this[this.reactPlayer === 1 ? "p1" : "p2"][this.reactCords[0]][
          this.reactCords[1]
        ] = 0;
        this.reactState = "move";
        this.reactMovementSteps = 0;
        this.playAudio("pop");
        if (window.navigator.vibrate) {
          window.navigator.vibrate(150);
        }
      } else if (this.reactState === "move") {
        ctx.fillStyle =
          this.reactPlayer === 1 ? this.PLAYER1_COLOR : this.PLAYER2_COLOR;
        let xNudge, yNudge;
        let tempMovement = this.reactMovement[this.reactSteps - 1];
        for (let i = 0; i < tempMovement.length; i++) {
          xNudge = 0;
          yNudge = 0;
          switch (tempMovement[i][2]) {
            case "L":
              xNudge = -this.reactMovementSteps;
              break;
            case "R":
              xNudge = +this.reactMovementSteps;
              break;
            case "U":
              yNudge = -this.reactMovementSteps;
              break;
            case "D":
              yNudge = +this.reactMovementSteps;
              break;
          }
          ctx.beginPath();
          ctx.arc(
            (tempMovement[i][0] * this.CANVAS_DIMENSION) / this.GRID_SIZE +
              this.CANVAS_DIMENSION / this.GRID_SIZE / 2 +
              xNudge,
            (tempMovement[i][1] * this.CANVAS_DIMENSION) / this.GRID_SIZE +
              this.CANVAS_DIMENSION / this.GRID_SIZE / 2 +
              yNudge,
            this.CANVAS_DIMENSION / this.GRID_SIZE / 4,
            0,
            2 * Math.PI,
            false
          );
          ctx.fill();
          ctx.closePath();
        }
        this.reactMovementSteps += this.REACT_MOVEMENT_STEPS_INCREMENT;
        if (
          this.reactMovementSteps >=
          this.CANVAS_DIMENSION / this.GRID_SIZE / 1
        ) {
          this.reactState = "settle";
        }
      } else if (this.reactState === "settle") {
        this.reactSteps--;
        this.p1 = this.reactMatrixP1.pop();
        this.p2 = this.reactMatrixP2.pop();
        this.reactMovementSteps = 0;
        this.reactState = "move";
        this.playAudio("pop");
        if (window.navigator.vibrate) {
          window.navigator.vibrate(150);
        }
      } else if (this.reactState === "final") {
        this.reactSteps--;
        this.p1 = this.reactMatrixP1.pop();
        this.p2 = this.reactMatrixP2.pop();
        let p1Exists = false,
          p2Exists = false;

        for (let x = 0; x < this.GRID_SIZE; x++) {
          for (let y = 0; y < this.GRID_SIZE; y++) {
            if (this.p1[x][y] >= 1) {
              p1Exists = true;
            }
            if (this.p2[x][y] >= 1) {
              p2Exists = true;
            }
          }
        }

        if (!p1Exists || !p2Exists) {
          this.busy = true;
          this.apiBusy = true;
          console.log("Player " + (!p1Exists ? "2" : "1") + " Wins!");
          this.reactMovementSteps = 0;

          this.gameWon(!p1Exists ? 2 : 1);
        } else {
          this.reactMovementSteps = 0;

          this.reactPlayer = 0;
          this.reactMovement = [];
          this.reactCords = [];
          this.reactSteps = 0;
          this.reactMatrixP1 = [];
          this.reactMatrixP2 = [];
          this.reactState = "";
          this.reactMovementSteps = 0;
          this.busy = false;
          this.changeTurn(this.turn === 1 ? 2 : 1);
          return;
        }
      }
    }
  }

  gameWon = (winner, reason) => {
    console.log("winner", winner);
    this.reactPlayer = 0;
    this.reactMovement = [];
    this.reactCords = [];
    this.reactSteps = 0;
    this.reactMatrixP1 = [];
    this.reactMatrixP2 = [];
    this.reactState = "";
    this.reactMovementSteps = 0;
    // this.turn = 1;

    if (winner === 2) {
      if (this.myUserNum === 1) {
        setTimeout(() => {
          // window.alert("You Lose!")
          this.setState({
            matchResult: "You Lose!",
            matchResultReason: reason ? "You were " + reason : "",
            turnTime: -1,
          });
          // this.props.history.replace("/");
        }, 1000);
      } else {
        setTimeout(() => {
          this.setState({
            matchResult: "You Win!",
            matchResultReason: reason
              ? this.opponentName + " was " + reason
              : "",
            turnTime: -1,
          });
          // this.props.history.replace("/");
        }, 1000);
      }
    } else {
      if (this.myUserNum === 2) {
        setTimeout(() => {
          this.setState({
            matchResult: "You Lose!",
            matchResultReason: reason ? "You were " + reason : "",
            turnTime: -1,
          });
          // this.props.history.replace("/");
        }, 1000);
      } else {
        setTimeout(() => {
          this.setState({
            matchResult: "You Win!",
            matchResultReason: reason
              ? this.opponentName + " was " + reason
              : "",
            turnTime: -1,
          });
          // this.props.history.replace("/");
        }, 1000);
      }
    }
  };

  drawCanvas = (ctx) => {
    ctx.clearRect(0, 0, 1000, 1000);
    ctx.fillStyle = this.CANVAS_BG_COLOR;
    ctx.fillRect(0, 0, 1000, 1000);
    this.gameLoop(ctx);
  };

  gameLoop = (ctx) => {
    if (moment().utc().valueOf() > this.beforeFPSTime + 1000 / 80) {
      this.beforeFPSTime = moment().utc().valueOf();
      ctx.clearRect(0, 0, 1000, 1000);
      this.drawGrid(ctx);
      this.drawMarks(ctx);
      this.drawReactionMotion(ctx);

      this.rotateCounter2 += this.MARK2_ROTATE_INCREMENT;
      this.rotateCounter3 += this.MARK3_ROTATE_INCREMENT;
    }
    this.animationRequestID = requestAnimationFrame(() => {
      this.gameLoop(ctx);
    });
  };

  /**handles*/

  handleClick = (e) => {
    if (this.busy) {
      return;
    }
    if (this.turn !== this.myUserNum) {
      return;
    }
    let canvas = this.refs.canvas;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const canvasX = canvas.clientWidth;
    const canvasY = canvas.clientHeight;

    const clickedNumX = Math.floor(clickX / (canvasX / this.GRID_SIZE) + 1) - 1;

    const clickedNumY = Math.floor(clickY / (canvasY / this.GRID_SIZE) + 1) - 1;

    let tempP;
    let turnString = this.turn === 1 ? "p1" : "p2";
    let otherTurnString = this.turn === 2 ? "p1" : "p2";

    if (this[otherTurnString][clickedNumX][clickedNumY] > 0) {
      return;
    }
    if (window.navigator.vibrate) {
      window.navigator.vibrate(150);
    }
    /**Edge and Corner Cases */
    this.apiBusy = true;
    let abort = new AbortController();
    setTimeout(() => {
      abort.abort();
    }, 2000);
    let signal = abort.signal;
    fetch(this.API_URL + "click", {
      signal,
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: this.id,
        secret: this.secret,
        cords: [clickedNumX, clickedNumY],
      }),
    })
      .then((res) => {
        this.apiBusy = false;
        res
          .json()
          .then((apiRes) => {
            if (
              apiRes &&
              apiRes.data &&
              apiRes.data.winner &&
              (apiRes.data.winner === 1 || apiRes.data.winner === 2)
            ) {
              this.busy = true;
              this.apiBusy = true;
              this.gameWon(apiRes.data.winner, apiRes.data.winReason || null);
            }
          })
          .catch((e) => console.log(e));
      })
      .catch((e) => {
        if (e.name === "AbortError") {
          this.setState((s) => {
            return { connectionRetryNum: s.connectionRetryNum + 1 };
          });
        }
        console.log(e);
        this.apiBusy = false;
      });
    this.sequenceId++;
    if (
      (clickedNumX === 0 && clickedNumY === 0) ||
      (clickedNumX === this.GRID_SIZE - 1 && clickedNumY === 0) ||
      (clickedNumX === 0 && clickedNumY === this.GRID_SIZE - 1) ||
      (clickedNumX === this.GRID_SIZE - 1 && clickedNumY === this.GRID_SIZE - 1)
    ) {
      if (this[turnString][clickedNumX][clickedNumY] > 0) {
        this.react(clickedNumX, clickedNumY, this.turn);
      } else {
        tempP = JSON.parse(JSON.stringify(this[turnString]));
        tempP[clickedNumX][clickedNumY]++;
        this.changeTurn(this.turn === 1 ? 2 : 1);
        this[turnString] = tempP;
      }
    } else if (
      clickedNumX === 0 ||
      clickedNumY === 0 ||
      clickedNumX === this.GRID_SIZE - 1 ||
      clickedNumY === this.GRID_SIZE - 1
    ) {
      if (this[turnString][clickedNumX][clickedNumY] > 1) {
        this.react(clickedNumX, clickedNumY, this.turn);
      } else {
        tempP = JSON.parse(JSON.stringify(this[turnString]));
        tempP[clickedNumX][clickedNumY]++;
        this.changeTurn(this.turn === 1 ? 2 : 1);
        this[turnString] = tempP;
      }
    } else {
      if (this[turnString][clickedNumX][clickedNumY] > 2) {
        this.react(clickedNumX, clickedNumY, this.turn);
      } else {
        tempP = JSON.parse(JSON.stringify(this[turnString]));
        tempP[clickedNumX][clickedNumY]++;
        this.changeTurn(this.turn === 1 ? 2 : 1);
        this[turnString] = tempP;
      }
    }
    /**Edge and Corner Cases */
  };

  handleVirtualClick = (cords) => {
    if (cords.length !== 2) {
      return;
    }

    const clickedNumX = cords[0];
    const clickedNumY = cords[1];

    this.highlight.ox = clickedNumX + 1;
    this.highlight.oy = clickedNumY + 1;
    setTimeout(() => {
      this.highlight.ox = null;
      this.highlight.oy = null;
    }, 1000);

    let tempP;
    let turnString = this.turn === 1 ? "p1" : "p2";
    let otherTurnString = this.turn === 2 ? "p1" : "p2";

    if (this[otherTurnString][clickedNumX][clickedNumY] > 0) {
      return;
    }
    /**Edge and Corner Cases */
    this.sequenceId++;
    if (window.navigator.vibrate) {
      window.navigator.vibrate(150);
    }
    if (
      (clickedNumX === 0 && clickedNumY === 0) ||
      (clickedNumX === this.GRID_SIZE - 1 && clickedNumY === 0) ||
      (clickedNumX === 0 && clickedNumY === this.GRID_SIZE - 1) ||
      (clickedNumX === this.GRID_SIZE - 1 && clickedNumY === this.GRID_SIZE - 1)
    ) {
      if (this[turnString][clickedNumX][clickedNumY] > 0) {
        this.react(clickedNumX, clickedNumY, this.turn);
      } else {
        tempP = JSON.parse(JSON.stringify(this[turnString]));
        tempP[clickedNumX][clickedNumY]++;
        this.changeTurn(this.turn === 1 ? 2 : 1);
        this[turnString] = tempP;
      }
    } else if (
      clickedNumX === 0 ||
      clickedNumY === 0 ||
      clickedNumX === this.GRID_SIZE - 1 ||
      clickedNumY === this.GRID_SIZE - 1
    ) {
      if (this[turnString][clickedNumX][clickedNumY] > 1) {
        this.react(clickedNumX, clickedNumY, this.turn);
      } else {
        tempP = JSON.parse(JSON.stringify(this[turnString]));
        tempP[clickedNumX][clickedNumY]++;
        this.changeTurn(this.turn === 1 ? 2 : 1);
        this[turnString] = tempP;
      }
    } else {
      if (this[turnString][clickedNumX][clickedNumY] > 2) {
        this.react(clickedNumX, clickedNumY, this.turn);
      } else {
        tempP = JSON.parse(JSON.stringify(this[turnString]));
        tempP[clickedNumX][clickedNumY]++;
        this.changeTurn(this.turn === 1 ? 2 : 1);
        this[turnString] = tempP;
      }
    }
    /***/
  };

  handleWindowResize = () => {
    let canvas = this.refs.canvas;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvasWidth = canvas.clientWidth;
    canvasHeight = canvas.clientHeight;
    canvasWidth < canvasHeight
      ? (canvasHeight = canvasWidth)
      : (canvasWidth = canvasHeight);
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";
  };

  react = (x, y, player) => {
    let repeatLoop = true;
    let testing = 30;
    let finalMatrixP1 = [];
    let finalMatrixP2 = [];
    let movement = [];
    let loopCounter = 0;

    let activeMatrix =
      player === 1
        ? JSON.parse(JSON.stringify(this.p1))
        : JSON.parse(JSON.stringify(this.p2));
    let otherMatrix =
      player === 1
        ? JSON.parse(JSON.stringify(this.p2))
        : JSON.parse(JSON.stringify(this.p1));

    this.busy = true;
    activeMatrix[x][y]++;
    let activeMatrix1, otherMatrix1;
    while (testing > 0 && repeatLoop) {
      testing--;
      repeatLoop = false;
      movement[loopCounter] = [];
      activeMatrix1 = JSON.parse(JSON.stringify(activeMatrix));
      otherMatrix1 = JSON.parse(JSON.stringify(otherMatrix));
      for (let xx = 0; xx < this.GRID_SIZE; xx++) {
        for (let yy = 0; yy < this.GRID_SIZE; yy++) {
          if (
            (xx === 0 && yy === 0) ||
            (xx === this.GRID_SIZE - 1 && yy === 0) ||
            (xx === 0 && yy === this.GRID_SIZE - 1) ||
            (xx === this.GRID_SIZE - 1 && yy === this.GRID_SIZE - 1)
          ) {
            // corner
            if (activeMatrix[xx][yy] > 1) {
              repeatLoop = true;
              activeMatrix1[xx][yy] = 0;
              if (xx === 0 && yy === 0) {
                movement[loopCounter].push([xx, yy, "R"], [xx, yy, "D"]);
                activeMatrix1[xx + 1][yy] =
                  activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
                otherMatrix1[xx + 1][yy] = 0;
                activeMatrix1[xx][yy + 1] =
                  activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
                otherMatrix1[xx][yy + 1] = 0;
              } else if (xx === this.GRID_SIZE - 1 && yy === 0) {
                movement[loopCounter].push([xx, yy, "L"], [xx, yy, "D"]);
                activeMatrix1[xx - 1][yy] =
                  activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
                otherMatrix1[xx - 1][yy] = 0;
                activeMatrix1[xx][yy + 1] =
                  activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
                otherMatrix1[xx][yy + 1] = 0;
              } else if (xx === 0 && yy === this.GRID_SIZE - 1) {
                movement[loopCounter].push([xx, yy, "R"], [xx, yy, "U"]);
                activeMatrix1[xx + 1][yy] =
                  activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
                otherMatrix1[xx + 1][yy] = 0;
                activeMatrix1[xx][yy - 1] =
                  activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
                otherMatrix1[xx][yy - 1] = 0;
              } else {
                movement[loopCounter].push([xx, yy, "L"], [xx, yy, "U"]);
                activeMatrix1[xx - 1][yy] =
                  activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
                otherMatrix1[xx - 1][yy] = 0;
                activeMatrix1[xx][yy - 1] =
                  activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
                otherMatrix1[xx][yy - 1] = 0;
              }
            }
          } else if (
            xx === 0 ||
            yy === 0 ||
            xx === this.GRID_SIZE - 1 ||
            yy === this.GRID_SIZE - 1
          ) {
            // edge
            if (activeMatrix[xx][yy] > 2) {
              repeatLoop = true;
              activeMatrix1[xx][yy] = 0;
              if (xx === 0) {
                movement[loopCounter].push(
                  [xx, yy, "R"],
                  [xx, yy, "U"],
                  [xx, yy, "D"]
                );
                activeMatrix1[xx + 1][yy] =
                  activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
                otherMatrix1[xx + 1][yy] = 0;
                activeMatrix1[xx][yy - 1] =
                  activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
                otherMatrix1[xx][yy - 1] = 0;
                activeMatrix1[xx][yy + 1] =
                  activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
                otherMatrix1[xx][yy + 1] = 0;
              } else if (yy === 0) {
                movement[loopCounter].push(
                  [xx, yy, "R"],
                  [xx, yy, "L"],
                  [xx, yy, "D"]
                );
                activeMatrix1[xx + 1][yy] =
                  activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
                otherMatrix1[xx + 1][yy] = 0;
                activeMatrix1[xx - 1][yy] =
                  activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
                otherMatrix1[xx - 1][yy] = 0;
                activeMatrix1[xx][yy + 1] =
                  activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
                otherMatrix1[xx][yy + 1] = 0;
              } else if (xx === this.GRID_SIZE - 1) {
                movement[loopCounter].push(
                  [xx, yy, "L"],
                  [xx, yy, "U"],
                  [xx, yy, "D"]
                );
                activeMatrix1[xx - 1][yy] =
                  activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
                otherMatrix1[xx - 1][yy] = 0;
                activeMatrix1[xx][yy - 1] =
                  activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
                otherMatrix1[xx][yy - 1] = 0;
                activeMatrix1[xx][yy + 1] =
                  activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
                otherMatrix1[xx][yy + 1] = 0;
              } else {
                movement[loopCounter].push(
                  [xx, yy, "R"],
                  [xx, yy, "L"],
                  [xx, yy, "U"]
                );
                activeMatrix1[xx + 1][yy] =
                  activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
                otherMatrix1[xx + 1][yy] = 0;
                activeMatrix1[xx - 1][yy] =
                  activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
                otherMatrix1[xx - 1][yy] = 0;
                activeMatrix1[xx][yy - 1] =
                  activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
                otherMatrix1[xx][yy - 1] = 0;
              }
            }
          } else {
            // other
            if (activeMatrix[xx][yy] > 3) {
              repeatLoop = true;
              activeMatrix1[xx][yy] = 0;
              movement[loopCounter].push(
                [xx, yy, "R"],
                [xx, yy, "L"],
                [xx, yy, "U"],
                [xx, yy, "D"]
              );
              activeMatrix1[xx + 1][yy] =
                activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
              otherMatrix1[xx + 1][yy] = 0;
              activeMatrix1[xx - 1][yy] =
                activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
              otherMatrix1[xx - 1][yy] = 0;
              activeMatrix1[xx][yy - 1] =
                activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
              otherMatrix1[xx][yy - 1] = 0;
              activeMatrix1[xx][yy + 1] =
                activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
              otherMatrix1[xx][yy + 1] = 0;
            }
          }
        }
      }

      activeMatrix = activeMatrix1;
      otherMatrix = otherMatrix1;

      loopCounter++;
      // enter into finalMatrix here
      if (repeatLoop && player === 1) {
        finalMatrixP1.push(JSON.parse(JSON.stringify(activeMatrix)));
        finalMatrixP2.push(JSON.parse(JSON.stringify(otherMatrix)));
      } else if (repeatLoop && player === 2) {
        finalMatrixP2.push(JSON.parse(JSON.stringify(activeMatrix)));
        finalMatrixP1.push(JSON.parse(JSON.stringify(otherMatrix)));
      }
    }
    movement.splice(-1);

    this.reactMatrixP1 = finalMatrixP1.reverse();
    this.reactMatrixP2 = finalMatrixP2.reverse();
    this.reactMovement = movement.reverse();
    this.reactPlayer = player;
    this.reactSteps = finalMatrixP2.length;
    this.reactCords = [x, y];
    this.reactState = "init";
  };

  handleHover = (e) => {
    let canvas = this.refs.canvas;
    const rect = canvas.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverY = e.clientY - rect.top;
    const canvasX = canvas.clientWidth;
    const canvasY = canvas.clientHeight;

    const hoverNumX = Math.floor(hoverX / (canvasX / this.GRID_SIZE) + 1);
    const hoverNumY = Math.floor(hoverY / (canvasY / this.GRID_SIZE) + 1);
    if (
      !this.highlight ||
      hoverNumX !== this.highlight.x ||
      hoverNumY !== this.highlight.y
    ) {
      this.highlight = {
        x: hoverNumX,
        y: hoverNumY,
      };
    }
  };

  abortGame = (reason) => {
    switch (reason) {
      case "network": {
        this.props.history.replace("/");
        break;
      }
      case "quit": {
        break;
      }
      case "gameOverExit": {
        this.props.history.replace("/friend");
      }
    }
  };

  /**render*/
  render() {
    console.log(this.state.user2_message);
    console.log(this.state.user1_message);

    return (
      <>
        <FriendStats
          myName={this.state.myName}
          opponentName={this.state.opponentName}
          turn={this.state.turn}
          myUserNum={this.state.myUserNum}
          player1_color={this.PLAYER1_COLOR}
          player2_color={this.PLAYER2_COLOR}
          turnTime={this.state.turnTime}
        />
        <div className={styles.CanvasContainer}>
          <canvas
            ref="canvas"
            className={styles.Canvas}
            onClick={(e) => {
              this.handleClick(e);
            }}
            onMouseMove={(e) => {
              this.handleHover(e);
            }}
            onMouseOut={() => {
              this.highlight = {
                x: null,
                y: null,
              };
            }}
          />
        </div>
        <Message secret={this.secret} gameId={this.id} />
        {this.state.user1_message ? this.state.user1_message : null}
        {this.state.user2_message ? this.state.user2_message : null}
        <ConnectionStats
          abortGame={this.abortGame}
          retryNum={this.state.connectionRetryNum}
        />
        <MatchResults
          matchResult={this.state.matchResult}
          myName={this.myName}
          opponentName={this.opponentName}
          abortGame={this.abortGame}
          matchResultReason={this.state.matchResultReason}
        />
      </>
    );
  }
}

export default withRouter(CoreOnlineFriend);
