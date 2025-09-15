import React from "react";
import Header from "../Header/Header";
import Selection from "../Selection/Selection";
import FriendOptions from "../Selection/FriendOptions/FriendOptions";
import FriendCode from "../Selection/FriendOptions/FriendCode/FriendCode";
import EnterCode from "../Selection/FriendOptions/EnterCode/EnterCode";
import GlobalLanding from "../Selection/Global/GlobalLanding";
import GameScreen from "../GameScreen/GameScreen";
import Login from "../User/Login/Login";
import Register from "../User/Register/Register";
import P404 from "../P404/P404";
import Credits from "../Credits/Credits";
import styles from "./Landing.module.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import moment from "moment";

class Landing extends React.Component {
  // goFullScreen = () => {
  //   let elem = document.body;
  //   if (
  //     (document.fullScreenElement !== undefined &&
  //       document.fullScreenElement === null) ||
  //     (document.msFullscreenElement !== undefined &&
  //       document.msFullscreenElement === null) ||
  //     (document.mozFullScreen !== undefined && !document.mozFullScreen) ||
  //     (document.webkitIsFullScreen !== undefined &&
  //       !document.webkitIsFullScreen)
  //   ) {
  //     if (elem.requestFullScreen) {
  //       elem.requestFullScreen();
  //     } else if (elem.mozRequestFullScreen) {
  //       elem.mozRequestFullScreen();
  //     } else if (elem.webkitRequestFullScreen) {
  //       elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
  //     } else if (elem.msRequestFullscreen) {
  //       elem.msRequestFullscreen();
  //     }
  //   }
  // };

  // exitFullScreen = () => {
  //   if (document.cancelFullScreen) {
  //     document.cancelFullScreen();
  //   } else if (document.mozCancelFullScreen) {
  //     document.mozCancelFullScreen();
  //   } else if (document.webkitCancelFullScreen) {
  //     document.webkitCancelFullScreen();
  //   } else if (document.msExitFullscreen) {
  //     document.msExitFullscreen();
  //   }
  // };

  render() {
    return (
      <>
        <Header />
        <div className={styles.BodyDiv}>
          <Router>
            <AnimatePresence>
              <Switch>
                <Route
                  exact
                  path="/playOffline"
                  component={() => <GameScreen gameScreenId={1} />}
                ></Route>
                <Route
                  exact
                  path="/playFriend"
                  component={() => <GameScreen gameScreenId={2} />}
                ></Route>
                <Route
                  exact
                  path="/play"
                  component={() => <GameScreen gameScreenId={3} />}
                ></Route>
                <Route exact path="/friend" component={FriendOptions}></Route>
                <Route exact path="/friend/code" component={FriendCode}></Route>
                <Route exact path="/friend/enter" component={EnterCode}></Route>
                <Route exact path="/global" component={GlobalLanding}></Route>
                <Route exact path="/login" component={Login}></Route>
                <Route exact path="/register" component={Register}></Route>
                <Route exact path="/credits" component={Credits}></Route>
                <Route exact path="/" component={Selection}></Route>
                <Route Component={P404} />
              </Switch>
            </AnimatePresence>
          </Router>
        </div>
      </>
    );
  }
}

export default Landing;
