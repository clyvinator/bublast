import React from "react";
import styles from "./ConnectionStats.module.css";

const ConnectionStats = props => {
  if (props.retryNum > 18) {
    console.log("aborting game due to network issues...");
    props.abortGame("network");
    return null;
  } else if (props.retryNum > 8) {
    return (
      <div className={styles.ConnectionStatsOverlay}>
        <div className={styles.ConnectionStatsContainer}>
          Poor Connection. Connecting...
        </div>
      </div>
    );
  } else if (props.retryNum > 3) {
    return (
      <div className={styles.ConnectionStatsContainer}>
        Poor Connection. Connecting...
      </div>
    );
  } else {
    return null;
  }
};

export default ConnectionStats;
