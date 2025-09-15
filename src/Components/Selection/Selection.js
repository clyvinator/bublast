import React from "react";
import styles from "./Selection.module.css";
import Logo from "../../assets/logo_NoBG.png";
import { motion } from "framer-motion";

class Selection extends React.Component {
  state = {};
  render() {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.SelectionLogoDiv}>
          <img className={styles.SelectionLogoImg} src={Logo} />
        </div>
        <div className={styles.SelectionOptionDiv}>
          <button
            className={styles.Button + " " + styles.OnlineButton}
            onClick={() => {
              this.props.history.push("/global");
            }}
          >
            Play Online
          </button>
          <div
            style={{ marginTop: "-0.8rem", color: "gray", fontSize: "0.8rem" }}
          >
            Ranking and Leaderboard coming soon
          </div>
        </div>
        <div className={styles.SelectionOptionDiv}>
          <button
            className={styles.Button + " " + styles.FriendButton}
            onClick={() => {
              this.props.history.push("/friend");
            }}
          >
            Play Online With a Friend
          </button>
        </div>
        <div className={styles.SelectionOptionDiv}>
          <button
            className={styles.Button + " " + styles.OfflineButton}
            onClick={() => {
              this.props.history.push("/playOffline");
            }}
          >
            Play Offline
          </button>
        </div>
        <div className={styles.SelectionFooter}>
          <span>
            <a href="https://www.cookiepolicygenerator.com/live.php?token=S1duwpnOHVkwSbfFixRyewa6GqSOzF9S">
              Cookie Policy
            </a>
          </span>
          <span>
            <a href="https://www.privacypolicytemplate.net/live.php?token=0AalFKt1stfHAd1PTv6JGxc5Ag4jOhw0">
              Privacy Policy
            </a>
          </span>
          <span>
            <a href="/credits">Credits</a>
          </span>
        </div>
      </motion.div>
    );
  }
}

export default Selection;
