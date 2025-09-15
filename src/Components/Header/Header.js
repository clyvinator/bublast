import React from "react";
import styles from "./Header.module.css";
import { withCookies } from "react-cookie";

class Header extends React.Component {
  render() {
    let userStatus;
    const { cookies } = this.props;

    const sessionId = cookies.get("sessionId");
    const userId = cookies.get("userId");
    if (!sessionId || !userId) {
      userStatus = (
        <div className={styles.HeaderUserStatus}>
          <a href="/login" style={{ color: "inherit", textDecoration: "none" }}>
            <button className={styles.HeaderButton}> Login</button>
          </a>
          <a
            href="/register"
            style={{
              color: "inherit",
              textDecoration: "none",
              height: "100%",
              width: "100%"
            }}
          >
            <button className={styles.HeaderButton}>Register </button>
          </a>
        </div>
      );
    } else {
      userStatus = (
        <div className={styles.HeaderUserStatus}>
          <button className={styles.HeaderButton}>{userId}</button>
          <div
            className={styles.HeaderUserInfo}
            onClick={() => {
              cookies.remove("userId", { path: "/" });
              cookies.remove("sessionId", { path: "/" });
              document.location.reload();
            }}
          >
            Logout
          </div>
        </div>
      );
    }
    return (
      <div className={styles.HeaderMainDiv}>
        <div className={styles.HeaderHome}>
          <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
            <button className={styles.HeaderButton}>Home </button>
          </a>
        </div>
        {userStatus}
      </div>
    );
  }
}

export default withCookies(Header);
