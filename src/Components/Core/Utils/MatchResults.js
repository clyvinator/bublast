import React from "react";
import styles from "./MatchResults.module.css";

const MatchResults = props => {
  if (props.matchResult) {
    return (
      <div className={styles.MatchResultsOverlay}>
        <div className={styles.MatchResultsContainer}>
          <div className={styles.MatchResultsHeader}>
            {"You vs " + props.opponentName}
          </div>
          <div className={styles.MatchResultsVerdict}>{props.matchResult}</div>
          <div className={styles.MatchResultsAdditionalVerdictInfo}>{props.matchResultReason}</div>
          <div className={styles.MatchResultsButtons}>
            <button
              className={styles.Button}
              onClick={() => {
                props.abortGame("gameOverExit");
              }}
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    return null;
  }
};

export default MatchResults;
