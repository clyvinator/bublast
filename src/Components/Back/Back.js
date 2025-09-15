import React from "react";
import styles from "./Back.module.css";

class Back extends React.Component {
  render() {
    return (
      <div
        className={styles.BackDiv}
        onClick={() => {
          this.props && this.props.handleBack && this.props.handleBack();
        }}
      >
        Back
      </div>
    );
  }
}

export default Back;
