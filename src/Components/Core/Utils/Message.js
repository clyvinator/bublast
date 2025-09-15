import React from "react";
import styles from "./Message.module.css";
import n1 from "../../../assets/negative_emojis/1.png";
import n2 from "../../../assets/negative_emojis/2.png";
import n3 from "../../../assets/negative_emojis/3.png";
import n4 from "../../../assets/negative_emojis/4.png";
import p1 from "../../../assets/positive_emojis/1.png";
import p2 from "../../../assets/positive_emojis/2.png";
import p3 from "../../../assets/positive_emojis/3.png";
import p4 from "../../../assets/positive_emojis/4.png";

class Message extends React.Component {
  state = { message: "" };
  API_URL = process.env.REACT_APP_API_URL;

  handleMessageSend = () => {
    this.inputRef.blur();
    if (!this.props.gameId || !this.props.secret) {
      return;
    }
    const t = this.state.message;
    if (!t || t.length < 1 || t.length > 25) {
      return;
    } else {
      this.setState({
        inputDisabled: true,
        message: "",
        sentPreviewContent: this.state.message,
      });
      setTimeout(() => {
        this.setState({ sentPreviewContent: null });
      }, 800);
      let abort = new AbortController();
      setTimeout(() => {
        abort.abort();
      }, 2000);
      let signal = abort.signal;
      fetch(this.API_URL + "sendMessage", {
        signal,
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: this.props.gameId,
          secret: this.props.secret,
          message: t,
        }),
      }).then((res) => {
        res.json().then((apiRes) => {
          console.log(apiRes);
        });
      });
      setTimeout(() => {
        this.setState({ inputDisabled: false });
      }, 3000);
    }
  };

  handleSendEmoji = (emojiCode) => {
    let emojiToPreview;
    switch (emojiCode) {
      case "n1":
        emojiToPreview = (
          <div className={styles.DisplayMessageEmojiPreview}>
            <img src={n1} />
          </div>
        );
        break;
      case "n2":
        emojiToPreview = (
          <div className={styles.DisplayMessageEmojiPreview}>
            <img src={n2} />
          </div>
        );
        break;
      case "n3":
        emojiToPreview = (
          <div className={styles.DisplayMessageEmojiPreview}>
            <img src={n3} />
          </div>
        );
        break;
      case "n4":
        emojiToPreview = (
          <div className={styles.DisplayMessageEmojiPreview}>
            <img src={n4} />
          </div>
        );
        break;
      case "p1":
        emojiToPreview = (
          <div className={styles.DisplayMessageEmojiPreview}>
            <img src={p1} />
          </div>
        );
        break;
      case "p2":
        emojiToPreview = (
          <div className={styles.DisplayMessageEmojiPreview}>
            <img src={p2} />
          </div>
        );
        break;
      case "p3":
        emojiToPreview = (
          <div className={styles.DisplayMessageEmojiPreview}>
            <img src={p3} />
          </div>
        );
        break;
      case "p4":
        emojiToPreview = (
          <div className={styles.DisplayMessageEmojiPreview}>
            <img src={p4} />
          </div>
        );
        break;
      default:
        console.log("DEFAULT");
    }
    this.setState({
      inputDisabled: true,
      message: "",
      emojiToPreview: emojiToPreview,
    });
    setTimeout(() => {
      this.setState({ emojiToPreview: null });
    }, 800);
    let abort = new AbortController();
    setTimeout(() => {
      abort.abort();
    }, 2000);
    let signal = abort.signal;
    fetch(this.API_URL + "sendMessage", {
      signal,
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gameId: this.props.gameId,
        secret: this.props.secret,
        message: ":" + emojiCode + ":",
      }),
    }).then((res) => {
      res.json().then((apiRes) => {
        console.log(apiRes);
      });
    });
    setTimeout(() => {
      this.setState({ inputDisabled: false });
    }, 3000);
  };

  render() {
    return (
      <div
        className={
          styles.MessageContainer +
          (this.state.inputDisabled ? " " + styles.Disabled : "")
        }
      >
        {this.state.sentPreviewContent ? (
          <div className={styles.SentPreview}>
            {this.state.sentPreviewContent}
          </div>
        ) : null}
        {this.state.emojiToPreview ? this.state.emojiToPreview : null}
        <div className={styles.MessageSmileyLeftContainer}>
          <div
            className={styles.EmojiContainer}
            onClick={() => {
              this.handleSendEmoji("n1");
            }}
          >
            <img className={styles.EmojiImg} src={n1} />
          </div>
          <div
            className={styles.EmojiContainer}
            onClick={() => {
              this.handleSendEmoji("n2");
            }}
          >
            <img className={styles.EmojiImg} src={n2} />
          </div>
          <div
            className={styles.EmojiContainer}
            onClick={() => {
              this.handleSendEmoji("n3");
            }}
          >
            <img className={styles.EmojiImg} src={n3} />
          </div>
          <div
            className={styles.EmojiContainer}
            onClick={() => {
              this.handleSendEmoji("n4");
            }}
          >
            <img className={styles.EmojiImg} src={n4} />
          </div>
        </div>
        <div className={styles.MessageTextContainer}>
          <input
            disabled={this.state.inputDisabled}
            value={this.state.message}
            placeholder="Message"
            maxLength={25}
            ref={(r) => {
              this.inputRef = r;
            }}
            onChange={(e) => {
              this.setState({
                message:
                  e.target.value.length <= 25
                    ? e.target.value
                    : this.state.message,
              });
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                this.handleMessageSend();
              }
            }}
          ></input>
        </div>
        <div className={styles.MessageSmileyRightContainer}>
          <div
            className={styles.EmojiContainer}
            onClick={() => {
              this.handleSendEmoji("p1");
            }}
          >
            <img className={styles.EmojiImg} src={p1} />
          </div>
          <div
            className={styles.EmojiContainer}
            onClick={() => {
              this.handleSendEmoji("p2");
            }}
          >
            <img className={styles.EmojiImg} src={p2} />
          </div>
          <div
            className={styles.EmojiContainer}
            onClick={() => {
              this.handleSendEmoji("p3");
            }}
          >
            <img className={styles.EmojiImg} src={p3} />
          </div>
          <div
            className={styles.EmojiContainer}
            onClick={() => {
              this.handleSendEmoji("p4");
            }}
          >
            <img className={styles.EmojiImg} src={p4} />
          </div>
        </div>
      </div>
    );
  }
}

export default Message;
