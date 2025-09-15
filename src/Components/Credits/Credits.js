import React from "react";
import styles from "./Credits.module.css";

const Credits = () => {
  return (
    <div className={styles.CreditsDiv}>
      <div>
        {"emojis: "}
        <a href="https://twemoji.twitter.com/">https://twemoji.twitter.com/</a>
      </div>
      <div>
        {"audio: "}
        <a href="https://www.zapsplat.com/">https://www.zapsplat.com/</a>
      </div>
    </div>
  );
};

export default Credits;
