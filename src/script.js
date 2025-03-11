import * as THREE from 'three';
import { Text } from 'troika-three-text'
import { RoundedBoxGeometry } from "three/addons";
import {iridescence} from "three/nodes";
import {ShaderLib as item} from "three";

let savedFrames = [];

const controllerCanvas = document.getElementById('controllerCanvas');
const webgl = document.getElementById('webgl');
const gameForm = document.getElementById("game-form");
const ctx = controllerCanvas.getContext('2d');

const PERSON = 0;
const FOOD = 1;
const BOT = 2;
const TAIL = 3;
const INITIAL = 1;

const TIME_SPACE_BOT = 100;
const TIME_SPACE_TABLE = 200;
const MAX_BOT = 20;
const MAX_INIT_FOOD = 30;
const MAX_FOOD = 40;
const TIME_SPACE_FOOD = 40;

const SIZE = 0;
const DISTANCE = 1;
const ANTI_DISTANCE = 2;
const RAND = 3;

let nameText;
let countReplay = 0;
let frameCount = 0;
let bufReplay = [];
let runningReplay = true;
let playerName = "PPP";
let replay = false;
let threeAngle;
let touch = false;
let controllable = false;
let moveSpeed = {
  x: 0.035,
  y: 0.035
};
let moveSpeedStar = moveSpeed;

let isDragging = false;
let canvasPos = {
  width: 400,
  height: 400,
};
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};
const outerRadius = 97; // Outer circle radius
const innerRadius = 50; // Inner circle radius
const maxWidth = sizes.width * 2;
const maxHeight = sizes.height * 2;
const screenScale = 200;
const maxScaledWidth = maxWidth / screenScale;
const maxScaledHeight = maxHeight / screenScale;

const scaledSize = {
  width: sizes.width / screenScale * 2,
  height: sizes.height / screenScale * 2
}

const color = [
  'rgb(205, 92, 92)',//2
  'rgb(40,140,228)',//4
  'rgb(51,250,140)',//8
  'rgb(147,95,250)',//16
  'rgb(249,149,78)',//32
  'rgb(252,240,65)',//64
  'rgb(55,80,248)',
  'rgb(251,253,96)',//256
  'rgb(3,252,228)',
  'rgb(250,196,227)',
  'rgb(249,251,110)',
];

let bProduce = true;
let star;
let replayBots = [];
let bots = [];
let food = [];
let lineX = [];
let botState = 0;
let countEnemy;
let cycleBot = 0;
let cycleFood = 0;
let cycleTable = 0;
let mouse = new THREE.Vector2();
let running = true;
let bufFood = [];
let bufBots = [];
let tailBuf = null;
let mouseCount = 0;

var trace = [];
let bufPos = 0;
let traceCount = 0;

let innerCircleX = controllerCanvas.width / 2;
let innerCircleY = controllerCanvas.height / 2;

let touchSize = {
  width: 300,
  height: 250
}

function getElementPositions(element) {
  const rect = element.getBoundingClientRect();

  return {
    // leftTop: { x: rect.left + window.scrollX, y: rect.top + window.scrollY },  // Left-Top corner
    // rightBottom: {
    width: rect.right + window.scrollX, height: rect.bottom + window.scrollY
    // }  // Right-Bottom corner
  };
}

function getColor(size) {
  let buf = Math.floor(Math.log2(size / 2)) % 11
  return color[buf];
}

function randomizePosition(max) {
  let position;
  position = (Math.random() - 0.5) * 2 * max;
  return position;
}

function insertArray(arr, item, index) {
  let halfBefore, halfAfter;
  halfBefore = arr.slice(0, index);
  halfBefore.push(item);
  if ((index + 1) < arr.length) halfAfter = arr.slice(index, arr.length);
  else halfAfter = [];

  return halfBefore.concat(halfAfter);
}

function deleteFromArray(arr, index) {
  let halfBefore, halfAfter;
  halfBefore = arr.slice(0, index);
  if ((index + 1) < arr.length) halfAfter = arr.slice(index + 1, arr.length);
  else halfAfter = [];
  let buf = arr[index].tail.length;
  if (buf !== 0) {
    for (let i = 0; i < buf; i++) {
      arr[index].tail[i].type = FOOD;
      food.push(arr[index].tail[i]);
    }
  }
  return halfBefore.concat(halfAfter);
}

function deleteIndexesFromArray(arr, indexArr) {
  for (let i = 0; i < indexArr.length; i++) {
    arr = deleteFromArray(arr, indexArr[i] - i);
  }
  return arr;
}

class Cube {
  constructor(type, size) {
    //tail and text
    this.tail = [];
    this.text = new Text();
    this.eat = false;
    this.count = 0;
    this.direction = RAND;
    this.newtail = [];

    this.next = {
      x: 0,
      y: 0
    }

    this.botRouteCount = 0;
    this.ref = 0;
    this.eatCount = 0;
    this.bufPos = [];
    this.bufAngle = [];

    //if size is not defined
    if (size === undefined) size = INITIAL; //Math.floor(Math.log2(Math.floor(Math.random() * 1000 + 2)));
    else this.count = Math.log2(size);
    //init size and type
    this.sizeDef = INITIAL * 0.1 + 0.3;
    this.size = size;
    this.type = type;

    //create geometry
    this.geometry = new RoundedBoxGeometry(this.sizeDef, this.sizeDef, this.sizeDef,3, 0.05);
    this.scale = 1;
    for (let i = 0; i < this.count; i++) this.scale *= 1.05;

    this.color = getColor(this.size) | color[0];

    //create material from color
    this.material = new THREE.MeshStandardMaterial({ color: this.color, roughness: false});

    //create cube
    this.cube = new THREE.Mesh(this.geometry, this.material);
    this.cube.scale.set(this.scale, this.scale, this.scale);

    //set parameters for the position randomize
    if (this.type === PERSON) {
      this.pos = [0, 0, 0];
    } else {
      this.pos = [randomizePosition(maxScaledWidth), randomizePosition(maxScaledHeight), 0];
    }
  }

  create(pos = undefined) {
    //add cube to the scene and set position and draw text on the top of cubic
    if(this.eat === false) scene.add(this.cube);
    this.setPos(pos);
    this.createText();
    if(this.size === INITIAL) this.updateSize();
  }

  updateSize() {
    //update the cube size into two times
    this.size = this.size * 2;

    this.color = getColor(this.size);
    this.material.color.set(this.color);

    this.count++;
    this.scale *= 1.05;
    this.cube.scale.set(this.scale, this.scale, this.scale);
    this.setPos();
  }

  smallerSize() {
    this.size = this.size / 2;

    this.color = getColor(this.size);
    this.material.color.set(this.color);

    this.count++;
    this.scale /= 1.05;
    this.cube.scale.set(this.scale, this.scale, this.scale);
    this.setPos();
  }

  createText() {
    //create text and draw
    this.text.text = this.size < 1000 ? `${this.size}` : `${Math.floor(this.size / 1000)}K`;
    this.text.fontSize = this.size < 1000 ? 0.2 : 0.3;
    this.text.fontSize = 0.2;
    this.text.fontWeight = 'bold'
    this.text.color = '#ffffff';
    this.text.geometry.center();
    this.cube.add(this.text)
  }

  setPos(pos = undefined) {
    this.text.text = this.size < 1000 ? `${this.size}` : `${Math.floor(this.size / 1000)}K`;
    this.text.fontSize = this.size < 1000 ? 0.2 : 0.3;
    this.text.fontWeight = 'bold'
    this.text.color = '#ffffff';
    if (!pos) pos = this.pos;
    if (pos[0] > maxScaledWidth) pos[0] = maxScaledWidth;
    if (pos[0] < -maxScaledWidth) pos[0] = -maxScaledWidth;
    if (pos[1] > maxScaledHeight) pos[1] = maxScaledHeight;
    if (pos[1] < -maxScaledHeight) pos[1] = -maxScaledHeight;

    this.pos = pos;
    this.cube.position.set(pos[0], pos[1], 0.1);
    if (this.size < 10) {
      this.text.position.set( - this.sizeDef/5.8, this.sizeDef/2.8, this.sizeDef - 0.199);
    } else if (this.size < 100) {
      this.text.position.set( - this.sizeDef/3.3 , this.sizeDef/2.8, this.sizeDef - 0.199);
    } else if (this.size < 1000) {
      this.text.position.set( - this.sizeDef/2.2 , this.sizeDef/2.8, this.sizeDef - 0.199);
    } else {
      this.text.position.set( - this.sizeDef/2.2 , this.sizeDef/1.8, this.sizeDef - 0.199);
    }
    // this.text.rotation.z = -Math.PI / 2;
  }

  setAngle(angle) {
    this.cube.rotation.z = angle;
  }

  connectTail(children) {
    this.tail.push(children);
  }

  eatPlayerAround(player) {
    if (this.size > player.size) {
      const minDist = this.sizeDef + 0.13;
      let deltaY = player.pos[1] - this.pos[1];
      if (deltaY < 0) deltaY = -deltaY;
      let deltaX = player.pos[0] - this.pos[0];
      if (deltaX < 0) deltaX = -deltaX;
      if ((deltaX < minDist) && deltaY < minDist) {
        document.getElementById("customAlert").style.display = 'flex';
        document.getElementById("alertTitle").innerHTML = `GAME OVER ${botState}`;
        running = false;
      }
    }
  }

  eatFoodAround() {
    // if (this.type === PERSON) {
    if (bufFood.length !== 0) {
      food = deleteIndexesFromArray(food, bufFood);
      bufFood = [];
    }
    food.forEach((monster, i) => {
      const minDist = monster.sizeDef;
      let deltaY = monster.pos[1] - this.pos[1];
      if (deltaY < 0) deltaY = -deltaY;
      let deltaX = monster.pos[0] - this.pos[0];
      if (deltaX < 0) deltaX = -deltaX;
      if (deltaX < minDist && deltaY < minDist) {
        if (monster.size <= this.size) {
          tailBuf = new Cube(TAIL, INITIAL);
          tailBuf.create();
          while (true) {
            if (monster.size === tailBuf.size) break;
            tailBuf.updateSize();
          }
          this.connectTail(tailBuf);
          // monster.pos[0] = this.pos[0];
          // monster.pos[1] = this.pos[1];
          // monster.pos[2] = this.pos[2];
          this.setPos();
          monster.eat = true;
          scene.remove(monster.cube);
          // scene.remove(monster.text);
          let index = bufFood.findIndex(item => item === i);
          if(index === -1) bufFood.push(i);
        } else {
          if (mouse.x > 0) monster.pos[0] = this.pos[0] + (deltaX + 0.15);
          else monster.pos[0] = this.pos[0] - (deltaX + 0.15);
          if (mouse.y > 0) monster.pos[1] = this.pos[1] + (deltaY + 0.15);
          else monster.pos[1] = this.pos[1] - (deltaY + 0.15);
          monster.setPos();
        }
      }
    });
    // }
  }

  eatBotAround() {
    if (bufBots.length !== 0) {
      bots = deleteIndexesFromArray(bots, bufBots);
      bufBots = [];
    }
    bots.forEach((monster, i) => {
      if (i !== botState) {
        const minDist = monster.sizeDef;
        let deltaY = monster.pos[1] - this.pos[1];
        if (deltaY < 0) deltaY = -deltaY;
        let deltaX = monster.pos[0] - this.pos[0];
        if (deltaX < 0) deltaX = -deltaX;
        if ((deltaX < minDist) && deltaY < minDist) {
          if (monster.size < this.size) {

            tailBuf = new Cube(TAIL, INITIAL);
            tailBuf.create();
            while (true) {
              if (monster.size === tailBuf.size) break;
              tailBuf.updateSize();
            }
            this.connectTail(tailBuf);
            // monster.pos[0] = this.pos[0];
            // monster.pos[1] = this.pos[1];
            // monster.pos[2] = this.pos[2];
            this.setPos();
            monster.eat = true;
            scene.remove(monster.cube);
            scene.remove(monster.text);
            let index = bufBots.findIndex(bufBot => bufBot === i);
            if(index === -1) bufBots.push(i);
          } else {
            if (mouse.x > 0) monster.pos[0] = this.pos[0] + (deltaX + 0.15);
            else monster.pos[0] = this.pos[0] - (deltaX + 0.15);
            if (mouse.y > 0) monster.pos[1] = this.pos[1] + (deltaY + 0.15);
            else monster.pos[1] = this.pos[1] - (deltaY + 0.15);
            monster.setPos();
          }
        }
      }
    });
  }

  setStarBuffer() {
    if (mouse.x === 0 && mouse.y === 0) this.ref = 1;
    else this.ref = moveSpeedStar.x / Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);

    this.bufAngle.push(Math.atan2(mouse.y, mouse.x));
    this.bufPos.push([this.pos[0], this.pos[1], this.pos[2]]);
  }

  setStarPosAngle() {
    this.setAngle(this.bufAngle[this.bufAngle.length - 1]);
    this.pos[0] += this.ref * mouse.x;
    this.pos[1] += this.ref * mouse.y;
    this.setPos();
  }

  setBotBuffer() {
    if (this.botRouteCount < 20) this.botRouteCount++;
    else {
      this.botRouteCount = 0;
      this.findNeighbor();
      this.detectDirection();
    }

    this.bufAngle.push(Math.atan2(this.next.y, this.next.x));
    this.bufPos.push([this.pos[0], this.pos[1], this.pos[2]]);
  }

  setBotPosAngle() {
    this.setAngle(this.bufAngle[this.bufAngle.length - 1]);
    this.pos[0] += this.ref * this.next.x;
    this.pos[1] += this.ref * this.next.y;
    this.setPos();
  }

  mergeTailEngine() {
    this.tail.sort((a, b) => b.size - a.size)
    let i = 0, len = this.tail.length;
    while(i < len) {
      if (i === 0) {
        if (this.tail[i].size === this.size) {
          if(this.eatCount > 20)
          {
            this.eatCount = 0;
            this.updateSize();
            scene.remove(this.tail[i].cube);
            scene.remove(this.tail[i].text);
            this.tail = deleteFromArray(this.tail, i);
            len--;
            return ;
          } else this.eatCount ++;
        } else if (this.tail[i].size > this.size) {
          // alert();
          while (this.size < this.tail[i].size) {
            this.updateSize();
          }
          this.tail = deleteFromArray(this.tail, i);
          return ;
        }
      } else {
        if (this.tail[i].size === this.tail[i - 1].size) {
          if(this.eatCount > 20) {
            this.tail[i - 1].updateSize();
            scene.remove(this.tail[i].cube);
            scene.remove(this.tail[i].text);
            this.tail = deleteFromArray(this.tail, i);
            this.eatCount = 0;
            len--;
            return ;
          } else {
            this.eatCount++;
          }
        }
      }
      // len = this.tail.length;
      i++;
    }
  }

  traceEngine() {
    if(this.bufAngle.length > 2000) this.bufAngle.slice(this.bufAngle.length - 2000, this.bufAngle.length);
    if (this.bufPos.length > 2000) this.bufPos.slice(this.bufPos.length - 2000, this.bufPos.length);

    this.tail.forEach((item, j) => {
      let traceHis = 8;
      if (mouseCount === 0) traceHis = 12;
      let arrIndex = Math.floor(this.bufAngle.length - (j + 1) * traceHis);
      if( arrIndex < 0) arrIndex = 0;
      item.setAngle(this.bufAngle[arrIndex]);
      if (this.bufPos[arrIndex]) {
        item.pos[0] = this.bufPos[arrIndex][0];
        item.pos[1] = this.bufPos[arrIndex][1];
        item.pos[2] = this.bufPos[arrIndex][2];
        if (mouse.y < 0.03 && mouse.y > -0.03) {
          if (this.pos[0] === maxScaledWidth) item.pos[0] = maxScaledWidth - item.sizeDef * (j + 1);
          else if (this.pos[0] === -maxScaledWidth) item.pos[0] = -maxScaledWidth + item.sizeDef * (j + 1);
        } else {
          if (this.pos[0] === maxScaledWidth) item.pos[0] = maxScaledWidth;
          else if (this.pos[0] === -maxScaledWidth) item.pos[0] = -maxScaledWidth;
        }
        if (mouse.x < 0.03 && mouse.x > -0.03) {
          if (this.pos[1] === maxScaledHeight) item.pos[1] = maxScaledHeight - item.sizeDef * (j + 1);
          else if (this.pos[1] === -maxScaledHeight) item.pos[1] = -maxScaledHeight + item.sizeDef * (j + 1);
        } else {
          if (this.pos[1] === maxScaledHeight) item.pos[1] = maxScaledHeight;
          else if (this.pos[1] === -maxScaledHeight) item.pos[1] = -maxScaledHeight;
        }
        item.setPos();
      }
    })
  }

  findNeighbor() {
    this.food = [];
    this.enemies = [];
    let neighbors = [...bots, ...food, star];
    countEnemy = 0;
    neighbors.forEach((neighbor, i) => {
      if (botState !== i) {
        this.rect = {
          left: this.pos[0] - scaledSize.width,
          right: this.pos[0] + scaledSize.width,
          top: this.pos[1] + scaledSize.height,
          bottom: this.pos[1] - scaledSize.height
        }
        if (neighbor.pos[0] > this.rect.left &&
            neighbor.pos[0] < this.rect.right &&
            neighbor.pos[1] < this.rect.top &&
            neighbor.pos[1] > this.rect.bottom)
        {
          let x = neighbor.pos[0] - this.pos[0];
          let y = neighbor.pos[1] - this.pos[1];
          let distance = x * x + y * y;
          let theta;
          if (x === 0) theta = 0;
          else theta = y / x;

          if (neighbor.size > this.size &&
              (neighbor.type === BOT || neighbor.type === PERSON))
            this.enemies.push({ size: neighbor.size, x: x, y: y, distance, theta });
          else if (neighbor.size < this.size)
            this.food.push({ size: neighbor.size, x: x, y: y, distance, theta });

          countEnemy++;
        }
      }
    });
  }

  detectDirection() {
    let prob5to5 = (Math.random() * 10) <= 1.5;
    let prob3to7 = (Math.random() * 10) <= 3;
    // if (prob3to7) {
    //   switch (this.direction) {
    //     case RAND: this.toRandom(); break;
    //     case DISTANCE: this.toDistance(); break;
    //     case ANTI_DISTANCE: this.toAntiDistance(); break;
    //     case SIZE: this.toSize(); break;
    //     default: this.toRandom();
    //   }
    // } else
    {
      if (this.enemies.length === 0) {
        if (this.food.length === 0) {
          this.toRandom();//E: X, F: X
          this.direction = RAND;
        } else {//E: X, F: O
          if (prob5to5) {
            this.toDistance(); // to distance minimum food
            this.direction = DISTANCE;
          } else {
            this.toSize(); //to size maximum food
            this.direction = SIZE;
          }
        }
      } else {
        if (this.food.length === 0) {  //E: O, F: X
          // if (prob5to5) this.toAntiDistance(); //to anti distance minimum
          // else this.toAntiTheta(); //to anti theta average
          this.toAntiDistance();
          this.direction = ANTI_DISTANCE;
        } else {//E: O, F: O
          if (prob3to7) {
            // if (prob5to5) this.toAntiDistance();
            // else this.toAntiTheta();
            this.toAntiDistance();
            this.direction = ANTI_DISTANCE;
          } else {
            if (prob5to5) {
              this.toDistance();
              this.direction = DISTANCE;
            }
            else {
              this.toSize();
              this.direction = SIZE;
            }
          }
        }
      }
    }
  }

  toSize() {
    let def = this.food[0];
    this.food.forEach(item => {
      if (item.size > def.size) def = item;
    })
    if (def.x > 0) {
      this.next.x = 1;
      this.next.y = def.theta;
    }
    else {
      this.next.x = -1;
      this.next.y = -def.theta;
    }
    this.ref = moveSpeed.x / Math.sqrt(1 + this.next.y * this.next.y);
  }

  toDistance() {
    let def = this.food[0];
    this.food.forEach(item => {
      if (item.distance > def.distance) def = item;
    })
    if (def.x > 0) {
      this.next.x = 1;
      this.next.y = def.theta;
    }
    else {
      this.next.x = -1;
      this.next.y = -def.theta;
    }
    this.ref = moveSpeed.x / Math.sqrt(1 + this.next.y * this.next.y);
  }

  toAntiDistance() {
    let def = this.enemies[0];
    this.enemies.forEach(item => {
      if (item.distance < def.distance) def = item;
    })
    if (def.x > 0) {
      this.next.x = -1;
      this.next.y = -def.theta;
      if (this.pos[0] === maxScaledWidth) this.next.x = -Math.random();
      if (this.pos[0] === -maxScaledWidth) this.next.x = Math.random();
    }
    else {
      this.next.x = 1;
      this.next.y = def.theta;
      if (this.pos[1] === maxScaledHeight) this.next.y = -Math.random()
      if (this.pos[1] === -maxScaledHeight) this.next.y = Math.random()
    }
    this.ref = moveSpeed.x / Math.sqrt(1 + this.next.y * this.next.y);
  }

  toRandom() {
    this.next.x = this.next.x + (Math.random() - 0.5);
    if (this.pos[0] === maxScaledWidth) this.next.x = -Math.random();
    if (this.pos[0] === -maxScaledWidth) this.next.x = Math.random();

    this.next.y = this.next.y + (Math.random() - 0.5);
    if (this.pos[1] === maxScaledHeight) this.next.y = -Math.random()
    if (this.pos[1] === -maxScaledHeight) this.next.y = Math.random()
    if (this.next.x === 0 && this.next.y === 0) this.ref = 1;
    else this.ref = moveSpeed.x / Math.sqrt(this.next.x * this.next.x + this.next.y * this.next.y);
  }
}

function addPlane() {
  const geometry = new THREE.PlaneGeometry(maxScaledWidth * 2 + 0.5, maxScaledHeight * 2 + 0.5);
  const material = new THREE.MeshBasicMaterial({
    color: 'rgb(16,81,136)',
    side: THREE.DoubleSide,
    transparent: false, // Disable transparency
    wireframe: false,
  });
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
  scene.fog = new THREE.FogExp2(0xdddddd, 0.08);
}

function drawX() {
  const material = new THREE.LineDashedMaterial({
    color: 'rgb(123,182,255)',
    dashSize: 0.04,     // Length of dashes (small for dots)
    gapSize: 0.5,      // Space between dashes (adjust for dot effect)
    linewidth: 20
  });
  const yCount = maxScaledHeight;

  for(let i = -yCount; i < yCount; i += 0.5) {
    const points = [
      new THREE.Vector3(-1 * maxScaledWidth + 0.03, i, 0),
      new THREE.Vector3(maxScaledWidth - 0.03, i, 0)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    lineX[i+yCount] = new THREE.Line(geometry, material);
    lineX[i+yCount].position.z = 0.01;
    lineX[i+yCount].computeLineDistances();
    scene.add(lineX[i+yCount]);
  }
}

function render() {
  renderer.setSize(sizes.width, sizes.height);
  renderer.render(scene, camera);
}

function cameraCtrl() {
  camera.position.x = star.pos[0];
  camera.position.y = star.pos[1] - 3;
  camera.position.z = 5;
  camera.rotation.x = Math.PI / 7;
}

function makeInitialFood() {
  for (let i = 0; i < MAX_INIT_FOOD; i++) {
    food.push(new Cube(FOOD, INITIAL));
    food[food.length - 1].create();
  }
}

function makeInitHideTail(cube) {
  for (let i = 0; i < 10; i++) {
    cube.newtail.push(new Cube(TAIL, INITIAL));
    cube.newtail[cube.newtail.length - 1].create();
    scene.remove(cube.newtail[cube.newtail.length - 1].cube);
  }
}

function makeInitHideBots() {
  for (let i = 0; i < MAX_BOT; i++) {
    replayBots.push(new Cube(BOT, INITIAL));
    replayBots[replayBots.length - 1].create();
    scene.remove(replayBots[replayBots.length - 1].cube);
  }
}


function makeFood() {
  if (cycleFood < TIME_SPACE_FOOD) cycleFood++;
  else {
    cycleFood = 0;
    if (bProduce) {
      if (food.length < MAX_FOOD) {
        let buf = Math.floor(Math.random() * 1000) % 5;
        food.push(new Cube(FOOD, INITIAL));
        food[food.length - 1].create();
        for (let i = 0; i < buf; i++) food[food.length - 1].updateSize();
      }
    }
  }
}

function makeBot() {
  if (cycleBot < TIME_SPACE_BOT) cycleBot++;
  else {
    cycleBot = 0;
    if (bots.length < MAX_BOT) {
      let buf = Math.floor(Math.random() * 100) % 5;
      bots.push(new Cube(BOT, INITIAL));
      bots[bots.length - 1].create();

      let botText = new Text();
      botText.fontSize = 0.15;
      botText.fontWeight = 'bold';
      botText.color = '#ffffff';
      botText.geometry.center();
      botText.position.z = 0.3;

      for (let i = 0; i < bots.length; i++) {
        botText.text = `Bot${i}`
        bots[bots.length-1].cube.add(botText);
        // document.addEventListener('mousemove', () => {
        //   botText.rotation.z = bots[i].cube.rotation.z * (-1)
        // });
      }

      for (let i = 0; i < buf; i++) bots[bots.length - 1].updateSize();
    }
  }
}

function lightControl() {
  const light0 = new THREE.DirectionalLight(0xffffff, 1);
  light0.position.set(0, 300, 200).normalize();
  scene.add(light0);

  const light1 = new THREE.DirectionalLight(0xffffff, 1);
  light1.position.set(0, -40, 140).normalize();
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0xffffff, 1);
  light2.position.set(400, -300, 150).normalize();
  scene.add(light2);

  const light3 = new THREE.DirectionalLight(0xffffff, 1);
  light3.position.set(-400, -300, 50).normalize();
  scene.add(light3);
}

function extract(cube) {
  let buf = {
    x: 0,
    y: 0,
    direction: 0,
    size: 2,
    tail: [],
    text: ''
  }
  buf.x = cube.pos[0];
  buf.y = cube.pos[1];
  buf.direction = cube.cube.rotation.z;
  buf.size = cube.size;
  buf.text = cube.text;
  if(cube.tail.length !== 0) {
    cube.tail.forEach(item => buf.tail.push(extract(item)));
  }
  return buf;
}

function restore(cube, info) {
  scene.add(cube.cube);
  cube.pos[0] = info.x;
  cube.pos[1] = info.y;
  cube.cube.rotation.z = info.direction;
  cube.setPos();
  while (true) {
    if (cube.size === info.size) break;
    else if(cube.size < info.size) cube.updateSize();
    else cube.smallerSize();
  }
  if(cube.newtail.length !== 0) {
    cube.newtail.forEach(item => {
      scene.remove(item.cube)
    })

    info.tail.forEach((item, i) => {
      cube.newtail[i].pos[0] = item.x;
      cube.newtail[i].pos[1] = item.y;
      cube.newtail[i].cube.rotation.z = item.direction;
      cube.newtail[i].setPos();
      while (true) {
        if (cube.newtail[i].size === item.size) break;
        else if (cube.newtail[i].size < item.size) cube.newtail[i].updateSize();
        else cube.newtail[i].smallerSize();
      }
      scene.add(cube.newtail[i].cube);
    });
  }
  return cube;
}

function setHistory() {

  let tStar, tBot = [], tFood = [];
  tStar = extract(star);

  bots.forEach(bot => tBot.push(extract(bot)));

  food.forEach(foodItem => tFood.push(extract(foodItem)));

  trace.push({
    star: tStar,
    bot: tBot,
    food: tFood,
  });
}

function initPro() {
  lightControl();

  nameText = new Text();
  nameText.fontSize = 0.1;
  nameText.fontWeight = 'bold'
  nameText.color = '#ffffff';
  nameText.geometry.center();
  nameText.position.x = -0.2
  nameText.position.z = 0.6
  nameText.text = `you`

  threeAngle = new Text();
  threeAngle.fontSize = 0.4;
  threeAngle.fontWeight = 'bold';
  threeAngle.color = '#ffffff';
  threeAngle.geometry.center();
  threeAngle.fillOpacity = 0.7
  threeAngle.position.x = 0.6
  threeAngle.position.y = 0.25
  threeAngle.rotation.z = -Math.PI / 2
  threeAngle.text = `🔺`;

  star = new Cube(PERSON, INITIAL);
  star.create();
  star.cube.add(nameText);
  star.cube.add(threeAngle);
  makeInitHideTail(star);
  makeInitHideBots();
  replayBots.forEach(bot => makeInitHideTail(bot));
  addPlane();
  drawX();
}

function getHistory(count) {
  /*
    let storedKeys = Object.keys(localStorage).filter(key => key.startsWith("trace_"));
    let storedValues = [], mergedValues = [];
    if(storedKeys.length !== 0) {
      storedValues = storedKeys.map(key => JSON.parse(localStorage.getItem(key)));
      mergedValues = storedValues.reduce((acc, curr) => acc.concat(curr), []);
    }
    let traceView = [...mergedValues, ...trace[bufPos]];
    traceView = JSON.stringify(traceView);
    document.getElementById('logView').innerHTML = `${traceView}`;
  */
  return JSON.parse(localStorage.getItem(`history_${count}`));
}

function updateTable(person, bots) {

  if (cycleTable < TIME_SPACE_TABLE) cycleTable++;
  else {
    const updateCube = bots.map((bot, index) => {
      return {
        cube: bot,
        id: index
      }
    }).concat({cube: person, id: "You"});

    const sortData = updateCube.sort((a, b) => b.cube.size - a.cube.size);

    const sortLimit = sortData.filter((data, key) => key < 5)
    const tbody = document.querySelector('#leaderboard tbody');
    tbody.innerHTML = '';

    // Populate the table with sorted data

    sortLimit.forEach(data => {
      const row = document.createElement('tr');
      const name = data.id === "You" ? "You" : `Bot ${data.id}`
      row.innerHTML = `
      <td class="text-center border border-white border-separated py-1">${name}</td>
      <td class="text-center border border-white border-separated py-1">${data.cube.size}</td>
    `;
      tbody.appendChild(row);
    });
  }
}

function drawController(x, y) {
  const centerX = controllerCanvas.width / 2;
  const centerY = controllerCanvas.height / 2;

  // Clear the canvas before redrawing
  ctx.clearRect(0, 0, controllerCanvas.width, controllerCanvas.height);

  // Draw the outer circle with gradient and glow effect
  const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, outerRadius);
  gradient.addColorStop(0, '#2e8588');
  gradient.addColorStop(1, 'rgba(46, 133, 136, 0.5)'); // Transparent outer ring effect

  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#42eacb'; // Glowing border
  ctx.shadowColor = '#42eacb';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0; // Reset shadow for next elements

  // Draw the inner circle
  ctx.beginPath();
  if(x === undefined || y === undefined) {
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  } else {
    ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  }
  ctx.fillStyle = '#48558e'; // Inner circle color
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1ebfb3'; // Inner circle border
  ctx.stroke();

  // Draw directional arrows
  drawArrow(centerX, centerY - outerRadius + 15, 'up');       // Up
  drawArrow(centerX, centerY + outerRadius - 15, 'down');   // Down
  drawArrow(centerX - outerRadius + 15, centerY, 'left');   // Left
  drawArrow(centerX + outerRadius - 15, centerY, 'right'); // Right
}

function drawArrow(x, y, direction) {
  ctx.fillStyle = '#42eacb'; // Arrow color
  ctx.beginPath();

  const arrowSize = 25; // Slightly bigger arrow size

  if (direction === 'up') {
    ctx.moveTo(x - arrowSize / 2, y + arrowSize / 2);
    ctx.lineTo(x + arrowSize / 2, y + arrowSize / 2);
    ctx.lineTo(x, y - arrowSize);
  } else if (direction === 'down') {
    ctx.moveTo(x - arrowSize / 2, y - arrowSize / 2);
    ctx.lineTo(x + arrowSize / 2, y - arrowSize / 2);
    ctx.lineTo(x, y + arrowSize);
  } else if (direction === 'left') {
    ctx.moveTo(x + arrowSize / 2, y - arrowSize / 2);
    ctx.lineTo(x + arrowSize / 2, y + arrowSize / 2);
    ctx.lineTo(x - arrowSize, y);
  } else if (direction === 'right') {
    ctx.moveTo(x - arrowSize / 2, y - arrowSize / 2);
    ctx.lineTo(x - arrowSize / 2, y + arrowSize / 2);
    ctx.lineTo(x + arrowSize, y);
  }
  ctx.fill();
}

function animate() {
  if (!running) return;
  requestAnimationFrame(animate);

  if (star) {
    star.setStarBuffer();
    star.setStarPosAngle();
    star.mergeTailEngine();
    star.traceEngine();

    nameText.text = playerName;
    cameraCtrl();
  }

  if (bots.length > 0) {
    bots.forEach((bot, i) => {
      botState = i;
      bot.setBotBuffer();
      bot.setBotPosAngle();
      bot.mergeTailEngine();
      bot.traceEngine();
    })
  }

  render();

  makeFood();
  makeBot();

  star.eatFoodAround();
  star.eatBotAround();

  if (bots.length > 0) {
    bots.forEach((bot, i) => {
      botState = i;
      bot.eatPlayerAround(star);
    });
    bots.forEach((bot, i) => {
      botState = i;
      bot.eatFoodAround();
      bot.eatBotAround();
    });
  }

  updateTable(star, bots);
  setHistory();
}

function mainEngine() {
  makeInitialFood();
  animate();
  running = false;
}

function include(item, rect) {
  return item.x > rect.left &&
      item.x < rect.right &&
      item.y > rect.bottom &&
      item.y < rect.top;
}

function viewReplayEngine() {

  if (!runningReplay) return;
  requestAnimationFrame(viewReplayEngine);

  if(frameCount < trace.length-2) frameCount ++;
  else runningReplay = false;
  {
    star = restore(star, trace[frameCount].star);
    nameText.rotation.z = (-1) * star.cube.rotation.z;
    //food
    trace[frameCount].food.forEach((info, i) => {
      if (food.length > i) food[i] = restore(food[i], info);
    })
    //bots
    replayBots.forEach(bot => scene.remove(bot.cube))
    trace[frameCount].bot.forEach((info, i) => {
      replayBots[i] = restore(replayBots[i], info);
    })
  }
  cameraCtrl();
  render();
}

//----------------------------------------start pro--------------------------------------------//

window.onload = function() {
  drawController();
};
document.addEventListener('mouseup', () => {
  isDragging = false;
});

document.addEventListener('mousemove', (event) => {
  nameText.rotation.z = (-1) * star.cube.rotation.z;
  canvasPos = getElementPositions(webgl);
  let deltaSize = {
    width: -canvasPos.width + 300,
    height: -canvasPos.height + 250,
  }
  if(touch) {
    if(controllable && isDragging) {
      let calRadius = ((canvasPos.width - outerRadius / 2 - event.clientX) * (canvasPos.width - outerRadius / 2 - event.clientX) +
          (canvasPos.height - outerRadius / 2 - event.clientY) * (canvasPos.height - outerRadius / 2 - event.clientY)) / 4;
      if (calRadius < (outerRadius * outerRadius)) {
        mouse.x = (event.clientX + deltaSize.width) / touchSize.width * 2 - 1;
        mouse.delta = 1 - (event.clientX + deltaSize.width) / touchSize.width * 2;
        mouse.y = -(event.clientY + deltaSize.height) / touchSize.width * 2 + 1;
      }
    }
  } else {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.delta = 1 - (event.clientX / sizes.width) * 2;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  }
});

document.getElementById("closeAlert").addEventListener("click", function() {
  document.getElementById("customAlert").style.display = 'none';
});

document.getElementById("viewReplay").addEventListener("click", function() {
  document.getElementById("customAlert").style.display = 'none';
  scene.remove(star.cube);

  star.tail.forEach((item) => scene.remove(item.cube));
  star.newtail.forEach(item => scene.remove(item.cube));

  bots.forEach(bot => {
    scene.remove(bot.cube);
    bot.tail.forEach((item) => scene.remove(item.cube));
  });

  food.forEach(item => scene.remove(item.cube));
  viewReplayEngine();
});

controllerCanvas.addEventListener('mousedown', (event) => {
  const mouseX = event.offsetX;
  const mouseY = event.offsetY;

  const dx = mouseX - innerCircleX;
  const dy = mouseY - innerCircleY;

  if (Math.sqrt(dx * dx + dy * dy) <= innerRadius) {
    isDragging = true;
  }
});

controllerCanvas.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;

    const dx = mouseX - controllerCanvas.width / 2;
    const dy = mouseY - controllerCanvas.height / 2;

    // Calculate the distance between the center and the mouse position
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If the distance is less than or equal to the outer circle radius, move the inner circle
    if (distance <= outerRadius - innerRadius) {
      innerCircleX = mouseX;
      innerCircleY = mouseY;
    } else {
      // If the distance exceeds the boundary, set the inner circle at the maximum allowed distance
      const angle = Math.atan2(dy, dx);
      innerCircleX = controllerCanvas.width / 2 + (outerRadius - innerRadius) * Math.cos(angle);
      innerCircleY = controllerCanvas.height / 2 + (outerRadius - innerRadius) * Math.sin(angle);
    }

    // Redraw the controller with the updated inner circle position
    drawController(innerCircleX, innerCircleY);
  }
});

controllerCanvas.addEventListener('mouseleave', () => {
  isDragging = false;
  drawController()
});

controllerCanvas.addEventListener('mousedown', () => {
  controllable = true;
});

controllerCanvas.addEventListener('mouseup', () => {
  drawController();
})

webgl.addEventListener('click', () => {
  if(touch) {

  } else {
    if (mouseCount === 0) {
      moveSpeedStar.x = 0.06;
      moveSpeedStar.y = 0.06;
      mouseCount = 1;
    } else {
      moveSpeedStar.x = 0.035;
      moveSpeedStar.y = 0.035;
      mouseCount = 0;
    }
  }
});

webgl.addEventListener('mouseup', () => {
  controllable = false;

});

gameForm.addEventListener("submit", function(event) {
  event.preventDefault(); // Prevent the default form submission

  // Get the player name from the input field
  playerName = document.getElementById("playerName").value;

  // Get the selected play mode (either "Com play" or "Phone play")
  if (document.getElementById("com").checked) {
    touch = false;
  } else if (document.getElementById("phone").checked) {
    touch = true;
  }

  // Display the collected values (you can use them as needed in your game logic)
  // You can proceed with further actions like hiding the form or starting the game
  gameForm.style.display = "none";

  document.addEventListener("click", startGame, { once: true });
});

function startGame() {
  running = true;
  animate();
}

//create canvas, scene, camera and renderer
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Use ACES tone mapping for more natural results

initPro();
mainEngine();
