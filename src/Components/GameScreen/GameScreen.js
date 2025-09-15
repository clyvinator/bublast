import React from "react";
import CoreOffline from "../Core/CoreOffline";
import CoreOnlineFriend from "../Core/CoreOnlineFriend";
import CoreOnline from "../Core/CoreOnline";
import { withRouter } from "react-router-dom";

const GameScreen = props => {
  switch (props.gameScreenId) {
    case 1: {
      return <CoreOffline />;
    }
    case 2: {
      if (
        !props.location ||
        !props.location.state ||
        !props.location.state.myUserNum ||
        !props.location.state.turn ||
        !props.location.state.secret ||
        !props.location.state.myName ||
        !props.location.state.id ||
        !props.location.state.opponentName
      ) {
        props.history.push("/friend");
        return null;
      } else {
        return (
          <CoreOnlineFriend
            myUserNum={props.location.state.myUserNum}
            turn={props.location.state.turn}
            secret={props.location.state.secret}
            opponentName={props.location.state.opponentName}
            myName={props.location.state.myName}
            id={props.location.state.id}
          />
        );
      }
    }
    case 3: {
      if (
        !props.location ||
        !props.location.state ||
        !props.location.state.myUserNum ||
        !props.location.state.turn ||
        !props.location.state.secret ||
        !props.location.state.myName ||
        !props.location.state.id ||
        !props.location.state.opponentName
      ) {
        props.history.push("/");
        return null;
      } else {
        return (
          <CoreOnline
            myUserNum={props.location.state.myUserNum}
            turn={props.location.state.turn}
            secret={props.location.state.secret}
            opponentName={props.location.state.opponentName}
            myName={props.location.state.myName}
            id={props.location.state.id}
          />
        );
      }
    }
    default: {
      props.history.push("/");
      return null;
    }
  }
};

export default withRouter(GameScreen);
