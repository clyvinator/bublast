import React from "react";
import styles from "./CoreOffline.module.css";
import { Howl, Howler } from "howler";
import moment from "moment";
import popAudio from "../../assets/pop.wav";
import popAudioMp3 from "../../assets/pop.mp3";
import popAudioWebm from "../../assets/pop.webm";

class CoreOffline extends React.Component {
  GRID_SIZE = 10;
  REACT_MOVEMENT_STEPS_INCREMENT = 4;
  PLAYER1_COLOR = "#F00";
  PLAYER2_COLOR = "#FF0";
  CANVAS_BG_COLOR = "#161C22";
  CANVAS_HIGHLIGHT_COLOR = "#2c3339";
  MARK2_ROTATE_INCREMENT = 0.008;
  MARK3_ROTATE_INCREMENT = 0.01;

  /**
   * Color utilities for gradient shading
   */
  hexToRgb = hex => {
    if (!hex) return { r: 255, g: 255, b: 255 };
    let cleaned = hex.replace('#', '');
    if (cleaned.length === 3) {
      cleaned = cleaned
        .split('')
        .map(ch => ch + ch)
        .join('');
    }
    const intVal = parseInt(cleaned, 16);
    return {
      r: (intVal >> 16) & 255,
      g: (intVal >> 8) & 255,
      b: intVal & 255
    };
  };

  clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  adjustRgb = (rgb, percent) => {
    const factor = 1 + percent;
    return {
      r: this.clamp(Math.round(rgb.r * factor), 0, 255),
      g: this.clamp(Math.round(rgb.g * factor), 0, 255),
      b: this.clamp(Math.round(rgb.b * factor), 0, 255)
    };
  };

  rgbToCss = (rgb, a = 1) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;

  /**
   * Creates a radial gradient that gives a spherical, 3D look.
   * The highlight is biased toward top-left and a darker rim at the edge.
   */
  getSphereGradient = (ctx, cx, cy, radius, baseColor) => {
    const base = this.hexToRgb(baseColor);
    const light = this.adjustRgb(base, 0.6);
    const mid = base;
    const shadow = this.adjustRgb(base, -0.4);
    const rim = this.adjustRgb(base, -0.6);

    const highlightCx = cx - radius * 0.35;
    const highlightCy = cy - radius * 0.35;
    const grad = ctx.createRadialGradient(
      highlightCx,
      highlightCy,
      radius * 0.1,
      cx,
      cy,
      radius
    );

    grad.addColorStop(0, this.rgbToCss(light, 1));
    grad.addColorStop(0.35, this.rgbToCss(mid, 1));
    grad.addColorStop(0.8, this.rgbToCss(shadow, 1));
    grad.addColorStop(1, this.rgbToCss(rim, 1));
    return grad;
  };

  pop = new Howl({
    src: [popAudioWebm, popAudio, popAudioMp3],
    onloaderror: (a, b) => {
      console.log(a, b);
    },
    onplayerror: (a, b) => {
      console.log(a, b);
    },
    // html5: true,
    preload: true
  });
  turn = 1;
  p1 = Array(this.GRID_SIZE)
    .fill(0)
    .map(() => Array(this.GRID_SIZE).fill(0));
  p2 = Array(this.GRID_SIZE)
    .fill(0)
    .map(() => Array(this.GRID_SIZE).fill(0));

  //Animations
  CANVAS_DIMENSION = 1000;
  animationRequestID;
  rotateCounter2 = 0;
  rotateCounter3 = 0;
  busy = false;
  beforeFPSTime = 0;

  //React
  reactPlayer;
  reactMovement;
  reactCords;
  reactSteps = 0;
  reactMatrixP1 = [];
  reactMatrixP2 = [];
  reactState; // init, move, settle, final
  reactMovementSteps = 0;

  componentDidMount() {
    let canvas = this.refs.canvas;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;
    canvasWidth < canvasHeight
      ? (canvasHeight = canvasWidth)
      : (canvasWidth = canvasHeight);
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";

    canvas.width = this.CANVAS_DIMENSION;
    canvas.height = this.CANVAS_DIMENSION;

    let ctx = canvas.getContext("2d");
    this.drawCanvas(ctx);

    window.addEventListener("resize", this.handleWindowResize);

    let AppElement = document.getElementById("App");
    if (AppElement && AppElement.style) {
      AppElement.style.backgroundImage = "unset";
    }
  }

  componentWillUnmount() {
    if (this.animationRequestID) {
      cancelAnimationFrame(this.animationRequestID);
    }
    window.removeEventListener("resize", this.handleWindowResize);
    console.log("HERE");

    let AppElement = document.getElementById("App");
    if (AppElement && AppElement.style) {
      AppElement.style.backgroundImage = "";
    }
  }

  drawGrid = ctx => {
    let highlightX, highlightY;

    if (this.highlight && this.highlight.x && this.highlight.y) {
      highlightX = this.highlight.x;
      highlightY = this.highlight.y;
    }
    for (let x = 0; x < this.GRID_SIZE + 1; x++) {
      for (let y = 0; y < this.GRID_SIZE + 1; y++) {
        /**hover*/
        if (highlightX === x + 1 && highlightY === y + 1) {
          ctx.fillStyle = this.CANVAS_HIGHLIGHT_COLOR;
          ctx.fillRect(
            (x * this.CANVAS_DIMENSION) / this.GRID_SIZE,
            (y * this.CANVAS_DIMENSION) / this.GRID_SIZE,
            this.CANVAS_DIMENSION / this.GRID_SIZE,
            this.CANVAS_DIMENSION / this.GRID_SIZE
          );
        }

        /**hover end */
        ctx.lineWidth = 3;
        ctx.strokeStyle =
          this.turn === 1 ? this.PLAYER1_COLOR : this.PLAYER2_COLOR;
        ctx.beginPath();
        ctx.moveTo((x * this.CANVAS_DIMENSION) / this.GRID_SIZE, 0);
        ctx.lineTo(
          (x * this.CANVAS_DIMENSION) / this.GRID_SIZE,
          this.CANVAS_DIMENSION
        );
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(0, (y * this.CANVAS_DIMENSION) / this.GRID_SIZE);
        ctx.lineTo(
          this.CANVAS_DIMENSION,
          (y * this.CANVAS_DIMENSION) / this.GRID_SIZE
        );

        ctx.stroke();
        ctx.closePath();
      }
    }
  };

  drawMarks = ctx => {
    /**dots */
    if (this.p1) {
      for (let x = 0; x < this.GRID_SIZE; x++) {
        for (let y = 0; y < this.GRID_SIZE; y++) {
          if (this.p1[x] && this.p1[x][y] > 0)
            this.marksRender(ctx, x, y, this.p1[x][y], this.PLAYER1_COLOR);
        }
      }
    }
    if (this.p2) {
      for (let x = 0; x < this.GRID_SIZE; x++) {
        for (let y = 0; y < this.GRID_SIZE; y++) {
          if (this.p2[x] && this.p2[x][y] > 0)
            this.marksRender(ctx, x, y, this.p2[x][y], this.PLAYER2_COLOR);
        }
      }
    }

    /** */
  };

  marksRender = (ctx, x, y, count, color) => {
    switch (count) {
      case 1:
        {
          const cx =
            (x * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2;
          const cy =
            (y * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2;
          const r = this.CANVAS_DIMENSION / this.GRID_SIZE / 4.2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = this.getSphereGradient(ctx, cx, cy, r, color);
          ctx.fill();
          ctx.closePath();
        }
        break;
      case 2:
        if (
          (x === 0 && y === 0) ||
          (x === this.GRID_SIZE - 1 && y === 0) ||
          (x === 0 && y === this.GRID_SIZE - 1) ||
          (x === this.GRID_SIZE - 1 && y === this.GRID_SIZE - 1)
        ) {
          break;
        }
        ctx.setTransform(
          1,
          0,
          0,
          1,
          (x * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2,
          (y * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2
        );
        ctx.rotate(this.rotateCounter2 * Math.PI);
        {
          const r = this.CANVAS_DIMENSION / this.GRID_SIZE / 4.2;
          // First sphere
          ctx.beginPath();
          ctx.arc(-15, -15, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = this.getSphereGradient(ctx, -15, -15, r, color);
          ctx.fill();
          ctx.closePath();
          // Second sphere
          ctx.beginPath();
          ctx.arc(15, 15, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = this.getSphereGradient(ctx, 15, 15, r, color);
          ctx.fill();
          ctx.closePath();
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        break;
      case 3:
        if (
          x === 0 ||
          y === 0 ||
          x === this.GRID_SIZE - 1 ||
          y === this.GRID_SIZE - 1
        ) {
          break;
        }
        if (
          (x === 0 && y === 0) ||
          (x === this.GRID_SIZE - 1 && y === 0) ||
          (x === 0 && y === this.GRID_SIZE - 1) ||
          (x === this.GRID_SIZE - 1 && y === this.GRID_SIZE - 1)
        ) {
          break;
        }
        ctx.setTransform(
          1,
          0,
          0,
          1,
          (x * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2,
          (y * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2
        );
        ctx.rotate(this.rotateCounter3 * Math.PI);
        {
          const r = this.CANVAS_DIMENSION / this.GRID_SIZE / 4.2;
          // First sphere
          ctx.beginPath();
          ctx.arc(-20, -20, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = this.getSphereGradient(ctx, -20, -20, r, color);
          ctx.fill();
          ctx.closePath();
          // Second sphere
          ctx.beginPath();
          ctx.arc(20, -20, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = this.getSphereGradient(ctx, 20, -20, r, color);
          ctx.fill();
          ctx.closePath();
          // Third sphere
          ctx.beginPath();
          ctx.arc(0, 20, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = this.getSphereGradient(ctx, 0, 20, r, color);
          ctx.fill();
          ctx.closePath();
        }
        break;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  playAudio = async () => {
    this.pop.play();
  };

  drawReactionMotion(ctx) {
    if (this.busy && this.reactSteps > 0) {
      if (this.reactSteps === 1 && this.reactState === "settle") {
        this.reactState = "final";
      }
      if (
        this.reactState === "init" &&
        this.reactPlayer > 0 &&
        this.reactCords &&
        this.reactCords.length > 0
      ) {
        this[this.reactPlayer === 1 ? "p1" : "p2"][this.reactCords[0]][
          this.reactCords[1]
        ] = 0;
        this.reactState = "move";
        this.reactMovementSteps = 0;
        this.playAudio("pop");
        if (window.navigator.vibrate) {
          window.navigator.vibrate(150);
        }
      } else if (this.reactState === "move") {
        let xNudge, yNudge;
        let tempMovement = this.reactMovement[this.reactSteps - 1];

        // console.log(tempMovement);
        for (let i = 0; i < tempMovement.length; i++) {
          xNudge = 0;
          yNudge = 0;
          switch (tempMovement[i][2]) {
            case "L":
              xNudge = -this.reactMovementSteps;
              break;
            case "R":
              xNudge = +this.reactMovementSteps;
              break;
            case "U":
              yNudge = -this.reactMovementSteps;
              break;
            case "D":
              yNudge = +this.reactMovementSteps;
              break;
          }
          const cx =
            (tempMovement[i][0] * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2 +
            xNudge;
          const cy =
            (tempMovement[i][1] * this.CANVAS_DIMENSION) / this.GRID_SIZE +
            this.CANVAS_DIMENSION / this.GRID_SIZE / 2 +
            yNudge;
          const r = this.CANVAS_DIMENSION / this.GRID_SIZE / 4;
          const color =
            this.reactPlayer === 1 ? this.PLAYER1_COLOR : this.PLAYER2_COLOR;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = this.getSphereGradient(ctx, cx, cy, r, color);
          ctx.fill();
          ctx.closePath();
        }
        this.reactMovementSteps += this.REACT_MOVEMENT_STEPS_INCREMENT;
        if (
          this.reactMovementSteps >=
          this.CANVAS_DIMENSION / this.GRID_SIZE / 1
        ) {
          this.reactState = "settle";
        }
      } else if (this.reactState === "settle") {
        this.reactSteps--;
        this.p1 = this.reactMatrixP1.pop();
        this.p2 = this.reactMatrixP2.pop();
        this.reactMovementSteps = 0;
        this.reactState = "move";
        this.playAudio("pop");
        if (window.navigator.vibrate) {
          window.navigator.vibrate(150);
        }
      } else if (this.reactState === "final") {
        this.reactSteps--;
        this.p1 = this.reactMatrixP1.pop();
        this.p2 = this.reactMatrixP2.pop();
        let p1Exists = false,
          p2Exists = false;

        for (let x = 0; x < this.GRID_SIZE; x++) {
          for (let y = 0; y < this.GRID_SIZE; y++) {
            if (this.p1[x][y] >= 1) {
              p1Exists = true;
            }
            if (this.p2[x][y] >= 1) {
              p2Exists = true;
            }
          }
        }

        if (!p1Exists || !p2Exists) {
          console.log("Player " + (!p1Exists ? "2" : "1") + " Wins!");
          this.reactMovementSteps = 0;

          this.reactPlayer = 0;
          this.reactMovement = [];
          this.reactCords = [];
          this.reactSteps = 0;
          this.reactMatrixP1 = [];
          this.reactMatrixP2 = [];
          this.reactState = "";
          this.reactMovementSteps = 0;
          this.turn = 1;
          setTimeout(() => {
            window.alert("Player " + (!p1Exists ? "2" : "1") + " Wins!");

            this.p1 = Array(this.GRID_SIZE)
              .fill(0)
              .map(() => Array(this.GRID_SIZE).fill(0));
            this.p2 = Array(this.GRID_SIZE)
              .fill(0)
              .map(() => Array(this.GRID_SIZE).fill(0));
            this.busy = false;
          }, 200);
        } else {
          this.reactMovementSteps = 0;

          this.reactPlayer = 0;
          this.reactMovement = [];
          this.reactCords = [];
          this.reactSteps = 0;
          this.reactMatrixP1 = [];
          this.reactMatrixP2 = [];
          this.reactState = "";
          this.reactMovementSteps = 0;
          this.busy = false;
          this.turn = this.turn === 1 ? 2 : 1;
          return;
        }
      }
    }
  }

  drawCanvas = ctx => {
    ctx.clearRect(0, 0, 1000, 1000);
    ctx.fillStyle = this.CANVAS_BG_COLOR;
    ctx.fillRect(0, 0, 1000, 1000);
    this.gameLoop(ctx);
  };

  gameLoop = ctx => {
    if (moment().utc().valueOf() > this.beforeFPSTime + 1000 / 80) {
      this.beforeFPSTime = moment().utc().valueOf();
      ctx.clearRect(0, 0, 1000, 1000);
      this.drawGrid(ctx);
      this.drawMarks(ctx);
      this.drawReactionMotion(ctx);

      this.rotateCounter2 += this.MARK2_ROTATE_INCREMENT;
      this.rotateCounter3 += this.MARK3_ROTATE_INCREMENT;
    }
    this.animationRequestID = requestAnimationFrame(() => {
      this.gameLoop(ctx);
    });
  };

  /**handles*/

  handleClick = e => {
    if (this.busy) {
      return;
    }
    let canvas = this.refs.canvas;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const canvasX = canvas.clientWidth;
    const canvasY = canvas.clientHeight;

    const clickedNumX = Math.floor(clickX / (canvasX / this.GRID_SIZE) + 1) - 1;

    const clickedNumY = Math.floor(clickY / (canvasY / this.GRID_SIZE) + 1) - 1;

    let tempP;
    let turnString = this.turn === 1 ? "p1" : "p2";
    let otherTurnString = this.turn === 2 ? "p1" : "p2";

    if (this[otherTurnString][clickedNumX][clickedNumY] > 0) {
      return;
    }
    if (window.navigator.vibrate) {
      window.navigator.vibrate(150);
    }
    /**Edge and Corner Cases */
    if (
      (clickedNumX === 0 && clickedNumY === 0) ||
      (clickedNumX === this.GRID_SIZE - 1 && clickedNumY === 0) ||
      (clickedNumX === 0 && clickedNumY === this.GRID_SIZE - 1) ||
      (clickedNumX === this.GRID_SIZE - 1 && clickedNumY === this.GRID_SIZE - 1)
    ) {
      if (this[turnString][clickedNumX][clickedNumY] > 0) {
        this.react(clickedNumX, clickedNumY, this.turn);
      } else {
        tempP = JSON.parse(JSON.stringify(this[turnString]));
        tempP[clickedNumX][clickedNumY]++;
        this.turn = this.turn === 1 ? 2 : 1;
        this[turnString] = tempP;
      }
    } else if (
      clickedNumX === 0 ||
      clickedNumY === 0 ||
      clickedNumX === this.GRID_SIZE - 1 ||
      clickedNumY === this.GRID_SIZE - 1
    ) {
      if (this[turnString][clickedNumX][clickedNumY] > 1) {
        this.react(clickedNumX, clickedNumY, this.turn);
      } else {
        tempP = JSON.parse(JSON.stringify(this[turnString]));
        tempP[clickedNumX][clickedNumY]++;
        this.turn = this.turn === 1 ? 2 : 1;
        this[turnString] = tempP;
      }
    } else {
      if (this[turnString][clickedNumX][clickedNumY] > 2) {
        this.react(clickedNumX, clickedNumY, this.turn);
      } else {
        tempP = JSON.parse(JSON.stringify(this[turnString]));
        tempP[clickedNumX][clickedNumY]++;
        this.turn = this.turn === 1 ? 2 : 1;
        this[turnString] = tempP;
      }
    }

    /**Edge and Corner Cases */
  };

  react = (x, y, player) => {
    let repeatLoop = true;
    let testing = 30;
    let finalMatrixP1 = [];
    let finalMatrixP2 = [];
    let movement = [];
    let loopCounter = 0;

    let activeMatrix =
      player === 1
        ? JSON.parse(JSON.stringify(this.p1))
        : JSON.parse(JSON.stringify(this.p2));
    let otherMatrix =
      player === 1
        ? JSON.parse(JSON.stringify(this.p2))
        : JSON.parse(JSON.stringify(this.p1));

    this.busy = true;
    activeMatrix[x][y]++;
    let activeMatrix1, otherMatrix1;
    while (testing > 0 && repeatLoop) {
      testing--;
      repeatLoop = false;
      movement[loopCounter] = [];
      activeMatrix1 = JSON.parse(JSON.stringify(activeMatrix));
      otherMatrix1 = JSON.parse(JSON.stringify(otherMatrix));
      for (let xx = 0; xx < this.GRID_SIZE; xx++) {
        for (let yy = 0; yy < this.GRID_SIZE; yy++) {
          if (
            (xx === 0 && yy === 0) ||
            (xx === this.GRID_SIZE - 1 && yy === 0) ||
            (xx === 0 && yy === this.GRID_SIZE - 1) ||
            (xx === this.GRID_SIZE - 1 && yy === this.GRID_SIZE - 1)
          ) {
            // corner
            if (activeMatrix[xx][yy] > 1) {
              repeatLoop = true;
              activeMatrix1[xx][yy] = 0;
              if (xx === 0 && yy === 0) {
                movement[loopCounter].push([xx, yy, "R"], [xx, yy, "D"]);
                activeMatrix1[xx + 1][yy] =
                  activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
                otherMatrix1[xx + 1][yy] = 0;
                activeMatrix1[xx][yy + 1] =
                  activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
                otherMatrix1[xx][yy + 1] = 0;
              } else if (xx === this.GRID_SIZE - 1 && yy === 0) {
                movement[loopCounter].push([xx, yy, "L"], [xx, yy, "D"]);
                activeMatrix1[xx - 1][yy] =
                  activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
                otherMatrix1[xx - 1][yy] = 0;
                activeMatrix1[xx][yy + 1] =
                  activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
                otherMatrix1[xx][yy + 1] = 0;
              } else if (xx === 0 && yy === this.GRID_SIZE - 1) {
                movement[loopCounter].push([xx, yy, "R"], [xx, yy, "U"]);
                activeMatrix1[xx + 1][yy] =
                  activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
                otherMatrix1[xx + 1][yy] = 0;
                activeMatrix1[xx][yy - 1] =
                  activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
                otherMatrix1[xx][yy - 1] = 0;
              } else {
                movement[loopCounter].push([xx, yy, "L"], [xx, yy, "U"]);
                activeMatrix1[xx - 1][yy] =
                  activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
                otherMatrix1[xx - 1][yy] = 0;
                activeMatrix1[xx][yy - 1] =
                  activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
                otherMatrix1[xx][yy - 1] = 0;
              }
            }
          } else if (
            xx === 0 ||
            yy === 0 ||
            xx === this.GRID_SIZE - 1 ||
            yy === this.GRID_SIZE - 1
          ) {
            // edge

            // console.log("REACT-EDGE");
            if (activeMatrix[xx][yy] > 2) {
              repeatLoop = true;
              activeMatrix1[xx][yy] = 0;
              if (xx === 0) {
                movement[loopCounter].push(
                  [xx, yy, "R"],
                  [xx, yy, "U"],
                  [xx, yy, "D"]
                );
                activeMatrix1[xx + 1][yy] =
                  activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
                otherMatrix1[xx + 1][yy] = 0;
                activeMatrix1[xx][yy - 1] =
                  activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
                otherMatrix1[xx][yy - 1] = 0;
                activeMatrix1[xx][yy + 1] =
                  activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
                otherMatrix1[xx][yy + 1] = 0;
              } else if (yy === 0) {
                movement[loopCounter].push(
                  [xx, yy, "R"],
                  [xx, yy, "L"],
                  [xx, yy, "D"]
                );
                activeMatrix1[xx + 1][yy] =
                  activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
                otherMatrix1[xx + 1][yy] = 0;
                activeMatrix1[xx - 1][yy] =
                  activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
                otherMatrix1[xx - 1][yy] = 0;
                activeMatrix1[xx][yy + 1] =
                  activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
                otherMatrix1[xx][yy + 1] = 0;
              } else if (xx === this.GRID_SIZE - 1) {
                movement[loopCounter].push(
                  [xx, yy, "L"],
                  [xx, yy, "U"],
                  [xx, yy, "D"]
                );
                activeMatrix1[xx - 1][yy] =
                  activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
                otherMatrix1[xx - 1][yy] = 0;
                activeMatrix1[xx][yy - 1] =
                  activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
                otherMatrix1[xx][yy - 1] = 0;
                activeMatrix1[xx][yy + 1] =
                  activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
                otherMatrix1[xx][yy + 1] = 0;
              } else {
                movement[loopCounter].push(
                  [xx, yy, "R"],
                  [xx, yy, "L"],
                  [xx, yy, "U"]
                );
                activeMatrix1[xx + 1][yy] =
                  activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
                otherMatrix1[xx + 1][yy] = 0;
                activeMatrix1[xx - 1][yy] =
                  activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
                otherMatrix1[xx - 1][yy] = 0;
                activeMatrix1[xx][yy - 1] =
                  activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
                otherMatrix1[xx][yy - 1] = 0;
              }
            }
          } else {
            // other

            // console.log("REACT-OTHER");
            if (activeMatrix[xx][yy] > 3) {
              repeatLoop = true;
              activeMatrix1[xx][yy] = 0;
              movement[loopCounter].push(
                [xx, yy, "R"],
                [xx, yy, "L"],
                [xx, yy, "U"],
                [xx, yy, "D"]
              );
              activeMatrix1[xx + 1][yy] =
                activeMatrix[xx + 1][yy] + otherMatrix[xx + 1][yy] + 1;
              otherMatrix1[xx + 1][yy] = 0;
              activeMatrix1[xx - 1][yy] =
                activeMatrix[xx - 1][yy] + otherMatrix[xx - 1][yy] + 1;
              otherMatrix1[xx - 1][yy] = 0;
              activeMatrix1[xx][yy - 1] =
                activeMatrix[xx][yy - 1] + otherMatrix[xx][yy - 1] + 1;
              otherMatrix1[xx][yy - 1] = 0;
              activeMatrix1[xx][yy + 1] =
                activeMatrix[xx][yy + 1] + otherMatrix[xx][yy + 1] + 1;
              otherMatrix1[xx][yy + 1] = 0;
            }
          }
        }
      }

      activeMatrix = activeMatrix1;
      otherMatrix = otherMatrix1;

      loopCounter++;

      // enter into finalMatrix here
      if (repeatLoop && player === 1) {
        finalMatrixP1.push(JSON.parse(JSON.stringify(activeMatrix)));
        finalMatrixP2.push(JSON.parse(JSON.stringify(otherMatrix)));
      } else if (repeatLoop && player === 2) {
        finalMatrixP2.push(JSON.parse(JSON.stringify(activeMatrix)));
        finalMatrixP1.push(JSON.parse(JSON.stringify(otherMatrix)));
      }
    }
    movement.splice(-1);

    this.reactMatrixP1 = finalMatrixP1.reverse();
    this.reactMatrixP2 = finalMatrixP2.reverse();
    this.reactMovement = movement.reverse();
    this.reactPlayer = player;
    this.reactSteps = finalMatrixP2.length;
    this.reactCords = [x, y];
    this.reactState = "init";
  };

  handleWindowResize = () => {
    let canvas = this.refs.canvas;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvasWidth = canvas.clientWidth;
    canvasHeight = canvas.clientHeight;
    canvasWidth < canvasHeight
      ? (canvasHeight = canvasWidth)
      : (canvasWidth = canvasHeight);
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";
  };

  handleHover = e => {
    let canvas = this.refs.canvas;
    const rect = canvas.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverY = e.clientY - rect.top;
    const canvasX = canvas.clientWidth;
    const canvasY = canvas.clientHeight;

    const hoverNumX = Math.floor(hoverX / (canvasX / this.GRID_SIZE) + 1);
    const hoverNumY = Math.floor(hoverY / (canvasY / this.GRID_SIZE) + 1);
    if (
      !this.highlight ||
      hoverNumX !== this.highlight.x ||
      hoverNumY !== this.highlight.y
    ) {
      this.highlight = {
        x: hoverNumX,
        y: hoverNumY
      };
    }
  };

  /**render*/
  render() {
    return (
      <div className={styles.CanvasContainer}>
        <canvas
          ref="canvas"
          className={styles.Canvas}
          onClick={e => {
            this.handleClick(e);
          }}
          onMouseMove={e => {
            this.handleHover(e);
          }}
          onMouseOut={() => {
            this.highlight = {
              x: null,
              y: null
            };
          }}
        />
      </div>
    );
  }
}

export default CoreOffline;
