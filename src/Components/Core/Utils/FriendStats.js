import React from "react";
import styles from "./FriendStats.module.css";
import moment from "moment";

class FriendStats extends React.Component {
  state = {};

  manageTurnTime = () => {
    if (
      this.state.turnTimeEnd &&
      this.state.turnTimeEnd > 0 &&
      this.state.diff &&
      this.state.diff > -1
    ) {
      let nowt = moment().utc().valueOf();
      let newDiff = this.state.turnTimeEnd - nowt;
      if (newDiff > -1) {
        let reverseTimeLeftPercentage = (newDiff * 100) / this.state.diff;
        if (reverseTimeLeftPercentage < 3) {
          reverseTimeLeftPercentage = 0;
        }
        this.setState({ timeLeftPercentage: reverseTimeLeftPercentage });
      }
    }
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    if (
      nextProps.turnTime &&
      nextProps.turnTime > 0 &&
      nextProps.turnTime !== prevState.turnTimeEnd
    ) {
      let tt = parseInt(nextProps.turnTime);
      let nowt = moment().utc().valueOf();
      let diff;
      if (tt > nowt) {
        diff = tt - nowt;
      } else {
        diff = 0;
      }
      return {
        turnTimeEnd: nextProps.turnTime,
        diff: diff,
      };
    } else if (nextProps.turnTime && nextProps.turnTime === -1) {
      return {
        turnTimeEnd: 0,
        diff: 0,
      };
    } else {
      return prevState;
    }
  }

  componentDidMount() {
    this.timer = setInterval(this.manageTurnTime, 80);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  render() {
    return (
      <div className={styles.FriendStatsContainer}>
        <div className={styles.FriendStatsColumn}>
          <div className={styles.FriendStatsName}>
            <p>{this.props.myName + "(you)"}</p>
            <p>
              <span
                className={styles.FriendStatsVisual}
                style={{
                  backgroundColor:
                    this.props.myUserNum === 1
                      ? this.props.player1_color
                      : this.props.player2_color,
                }}
              ></span>
            </p>
          </div>
        </div>
        <div
          className={
            styles.FriendStatsColumn + " " + styles.FriendStatsMiddleColumn
          }
        >
          <div>
            <span className={styles.FriendStatsName}>
              {this.props.turn === this.props.myUserNum
                ? "Your"
                : this.props.opponentName + "'s"}
            </span>
            {" turn"}
          </div>
        </div>
        <div className={styles.FriendStatsColumn}>
          <div className={styles.FriendStatsName}>
            <p>{this.props.opponentName}</p>
            <p>
              <span
                className={styles.FriendStatsVisual}
                style={{
                  backgroundColor:
                    this.props.myUserNum === 1
                      ? this.props.player2_color
                      : this.props.player1_color,
                }}
              ></span>
            </p>
          </div>
        </div>
        <div
          className={styles.FriendStatsTime}
          style={{ width: this.state.timeLeftPercentage + "%" }}
        />
      </div>
    );
  }
}

export default FriendStats;
