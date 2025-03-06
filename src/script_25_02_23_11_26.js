import * as THREE from 'three';
import { Text } from 'troika-three-text'
import { RoundedBoxGeometry } from "three/addons";

const PERSON = 0;
const FOOD = 1;
const BOT = 2;
const TAIL = 3;
const INITIAL = 1;

const TIME_SPACE_BOT = 100;
const MAX_BOT = 20;
const MAX_INIT_FOOD = 30;
const MAX_FOOD = 100;
const TIME_SPACE_FOOD = 40;

const SIZE = 0;
const DISTANCE = 1;
const ANTI_DISTANCE = 2;
const RAND = 3;

const moveSpeed = {
  x: 0.05,
  y: 0.05
};
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};
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

var bProduce = true;
var star;
var bots = [];
var food = [];
var lineX = [];
var botState = 0;
var countEnemy;
var cycleBot = 0;
var cycleFood = 0;
var mouse = new THREE.Vector2();
var running = true;
var deltaRef = 1000;

function getColor(size) {
  return color[Math.floor(Math.log2(size / 2)) % 11];
}

function randomizePosition(max) {
  let buf;
  // let cubeBuf = [...food, ...bots, star];
  let position;
  let delta, delta2;
  let index = 0;
  let countPos = 0;
  console.log(max);
  while (index > -1) {
    console.log(countPos);
    // console.log("ref", deltaRef/2);
    countPos ++;
    position = (Math.random() - 0.5) * 2 * max;
    // position = buf / screenScale;
    index = food.findIndex((item) => {
      delta = item.pos[0] - position;
      if (delta < 0) delta = -delta;
      delta2 = item.pos[1] - position;
      if (delta2 < 0) delta2 = -delta2;
      if (delta < deltaRef || delta2 < deltaRef) return true;
      else return false;
    })
  }
  return position;
}

function insertArray(arr, item, index) {
  var halfBefore, halfAfter;
  halfBefore = arr.slice(0, index);
  halfBefore.push(item);
  if ((index + 1) < arr.length) halfAfter = arr.slice(index, arr.length);
  else halfAfter = [];

  return halfBefore.concat(halfAfter);
}

function deleteFromArray(arr, index) {
  var halfBefore, halfAfter;
  halfBefore = arr.slice(0, index);
  if ((index + 1) < arr.length) halfAfter = arr.slice(index + 1, arr.length);
  else halfAfter = [];
  let buf = arr[index].tail.length;
  if (buf != 0) {
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
    if (size == undefined) size = INITIAL; //Math.floor(Math.log2(Math.floor(Math.random() * 1000 + 2)));
    else this.count = Math.log2(size);
    //init size and type
    this.sizeDef = INITIAL * 0.1 + 0.3;
    this.size = size;
    this.type = type;

    //create geometry
    this.geometry = new RoundedBoxGeometry(this.sizeDef, this.sizeDef, this.sizeDef,3, 0.05);
    this.scale = 1;
    for (let i = 0; i < this.count; i++) this.scale *= 1.05;

    this.color = getColor(this.size);

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
    if(this.eat == false) scene.add(this.cube);
    this.setPos(pos);
    this.createText();
    if(this.size == INITIAL) this.updateSize();
  }

  updateSize() {
    //update the cube size into two times
    this.size = this.size * 2;

    this.color = getColor(this.size);
    this.material.color.set(this.color);

    this.count++;
    this.scale *= 1.05;
    this.cube.scale.set(this.scale, this.scale, this.scale);
    this.text.text = this.size < 1000 ? `${this.size}` : `${parseInt(this.size / 1000)}K`;
    this.text.fontSize = this.size < 1000 ? 0.2 : 0.3;
    this.text.fontWeight = 'bold'
    this.text.color = '#ffffff';
    this.setPos();
  }

  createText() {
    //create text and draw
    this.text.fontSize = 0.2;
    this.text.fontWeight = 'bold'
    this.text.color = '#ffffff';
    this.text.geometry.center();
    this.cube.add(this.text)
  }

  setPos(pos = undefined) {
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
        alert(`GAME OVER ${botState}`);
        running = false;
      }
    }
  }

  eatFoodAround() {
    var bufFood = [];
    // if (this.type == PERSON) {
    food.forEach((monster, i) => {
      const minDist = monster.sizeDef;
      let deltaY = monster.pos[1] - this.pos[1];
      if (deltaY < 0) deltaY = -deltaY;
      let deltaX = monster.pos[0] - this.pos[0];
      if (deltaX < 0) deltaX = -deltaX;
      if (deltaX < minDist && deltaY < minDist) {
        if (monster.size <= this.size) {
          this.connectTail(new Cube(TAIL, monster.size));
          this.tail[this.tail.length - 1].create();
          // monster.pos[0] = this.pos[0];
          // monster.pos[1] = this.pos[1];
          // monster.pos[2] = this.pos[2];
          this.setPos();
          monster.eat = true;
          scene.remove(monster.cube);
          scene.remove(monster.text);
          bufFood.push(i);
        } else {
          if (mouse.x > 0) monster.pos[0] = this.pos[0] + (deltaX + 0.15);
          else monster.pos[0] = this.pos[0] - (deltaX + 0.15);
          if (mouse.y > 0) monster.pos[1] = this.pos[1] + (deltaY + 0.15);
          else monster.pos[1] = this.pos[1] - (deltaY + 0.15);
          monster.setPos();
        }
      }
    });
    if (bufFood.length != 0) {
      food = deleteIndexesFromArray(food, bufFood);
    }
    // }
  }


  eatBotAround() {
    var bufBots = [];
    bots.forEach((monster, i) => {
      if (i != botState) {
        const minDist = monster.sizeDef;
        let deltaY = monster.pos[1] - this.pos[1];
        if (deltaY < 0) deltaY = -deltaY;
        let deltaX = monster.pos[0] - this.pos[0];
        if (deltaX < 0) deltaX = -deltaX;
        if ((deltaX < minDist) && deltaY < minDist) {
          if (monster.size < this.size) {

            this.connectTail(new Cube(TAIL, monster.size));
            this.tail[this.tail.length - 1].create();
            // monster.pos[0] = this.pos[0];
            // monster.pos[1] = this.pos[1];
            // monster.pos[2] = this.pos[2];
            this.setPos();
            monster.eat = true;
            scene.remove(monster.cube);
            scene.remove(monster.text);
            let bAdd = true;
            for (let j = 0; j < bufBots.length; j++) {
              if (bufBots[j] == i) bAdd = false;
            }
            if(bAdd) bufBots.push(i);
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
    if (bufBots.length != 0) {
      bots = deleteIndexesFromArray(bots, bufBots);
    }
  }

  findNearestFood() {
  }

  setStarBuffer() {
    if (mouse.x == 0 && mouse.y == 0) this.ref = 1;
    else this.ref = moveSpeed.x / Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);

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
      if (i == 0) {
        if (this.tail[i].size == this.size) {
          if(this.eatCount > 20)
          {
            this.eatCount = 0;
            this.updateSize();
            scene.remove(this.tail[i].cube);
            scene.remove(this.tail[i].text);
            this.tail = deleteFromArray(this.tail, i);
            len--;
          } else this.eatCount ++;
        } else if (this.tail[i].size > this.size) {
          // alert();
          while (this.size < this.tail[i].size) {
            this.updateSize();
          }
          this.tail = deleteFromArray(this.tail, i);
        }
      } else {
        if (this.tail[i].size == this.tail[i - 1].size) {
          if(this.eatCount > 20) {
            this.tail[i - 1].updateSize();
            scene.remove(this.tail[i].cube);
            scene.remove(this.tail[i].text);
            this.tail = deleteFromArray(this.tail, i);
            this.eatCount = 0;
            len--;
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
      const arrIndex = Math.floor(this.bufAngle.length - (j + 1) * 12);
      if (arrIndex > 0) {
        item.setAngle(this.bufAngle[arrIndex]);
        if (this.bufPos[arrIndex]) {
          item.pos[0] = this.bufPos[arrIndex][0];
          item.pos[1] = this.bufPos[arrIndex][1];
          item.pos[2] = this.bufPos[arrIndex][2];
          if (mouse.y < 0.03 && mouse.y > -0.03) {
            if (this.pos[0] == maxScaledWidth) item.pos[0] = maxScaledWidth - item.sizeDef * (j + 1);
            else if (this.pos[0] == -maxScaledWidth) item.pos[0] = -maxScaledWidth + item.sizeDef * (j + 1);
          } else {
            if (this.pos[0] == maxScaledWidth) item.pos[0] = maxScaledWidth;
            else if (this.pos[0] == -maxScaledWidth) item.pos[0] = -maxScaledWidth;
          }
          if (mouse.y < 0.03 && mouse.y > -0.03) {
            if (this.pos[1] == maxScaledHeight) item.pos[1] = maxScaledHeight - item.sizeDef * (j + 1);
            else if (this.pos[1] == -maxScaledHeight) item.pos[1] = -maxScaledHeight + item.sizeDef * (j + 1);
          } else {
            if (this.pos[1] == maxScaledHeight) item.pos[1] = maxScaledHeight;
            else if (this.pos[1] == -maxScaledHeight) item.pos[1] = -maxScaledHeight;
          }
          item.setPos();
        }
      }
      else {
        if (j > 1) item.setAngle(this.tail[j - 1].cube.rotation.z);
        else item.setAngle(this.cube.rotation.z)
        item.setPos(this.tail[j-1].pos[arrIndex]);
      }
    })
  }

  findNeighbor() {
    this.food = [];
    this.enemies = [];
    let neighbors = [...bots, ...food, star];
    countEnemy = 0;
    neighbors.forEach((neighbor, i) => {
      if (botState != i) {
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
          if (x == 0) theta = 0;
          else theta = y / x;

          if (neighbor.size > this.size &&
            (neighbor.type == BOT || neighbor.type == PERSON))
            this.enemies.push({ size: neighbor.size, x: x, y: y, distance, theta });
          else if (neighbor.size < this.size)
            this.food.push({ size: neighbor.size, x: x, y: y, distance, theta });

          countEnemy++;
        }
      }
    });
  }

  detectDirection() {
    let prob5to5 = (Math.random() * 10) <= 5 ? true : false;
    let prob3to7 = (Math.random() * 10) <= 3 ? true : false;
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
      if (this.enemies.length == 0) {
        if (this.food.length == 0) {
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
        if (this.food.length == 0) {  //E: O, F: X
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
      if (this.pos[0] == maxScaledWidth) this.next.x = -Math.random();
      if (this.pos[0] == -maxScaledWidth) this.next.x = Math.random();
    }
    else {
      this.next.x = 1;
      this.next.y = def.theta;
      if (this.pos[1] == maxScaledHeight) this.next.y = -Math.random()
      if (this.pos[1] == -maxScaledHeight) this.next.y = Math.random()
    }
    this.ref = moveSpeed.x / Math.sqrt(1 + this.next.y * this.next.y);
  }

  toAntiTheta() {
    // let def = this.enemies[0];
    let def = star;
    this.enemies.forEach(item => {
      
    })

  }

  toRandom() {
    this.next.x = this.next.x + (Math.random() - 0.5);
    if (this.pos[0] == maxScaledWidth) this.next.x = -Math.random();
    if (this.pos[0] == -maxScaledWidth) this.next.x = Math.random();

    this.next.y = this.next.y + (Math.random() - 0.5);
    if (this.pos[1] == maxScaledHeight) this.next.y = -Math.random()
    if (this.pos[1] == -maxScaledHeight) this.next.y = Math.random()
    if (this.next.x == 0 && this.next.y == 0) this.ref = 1;
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
      botText.fontSize = 0.2;
      botText.fontWeight = 'bold'
      botText.color = '#ffffff';
      botText.geometry.center();

      // botText.position.x = -0.3
      // botText.position.y = -0.2

      botText.position.x = -0.25
      botText.position.y = -0.2

      for (let i = 0; i < bots.length; i++) {
        botText.text = `Bot${i}`
        bots[bots.length-1].cube.add(botText);
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

function animate() {
  if (!running) return;
  requestAnimationFrame(animate);

  if (star) {
    //set position and angle
    star.setStarBuffer();
    star.setStarPosAngle();

    //engines
    star.mergeTailEngine();
    star.traceEngine();

    //camera control
    cameraCtrl();
  }
  if (bots.length > 1) {
    bots.forEach((bot, i) => {
      botState = i;
      bot.setBotBuffer();
      bot.setBotPosAngle();
      //engines
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
    // setInterval(() => {
      bots.forEach((bot, i) => {
        botState = i;
        bot.eatPlayerAround(star);
      });
    //   console.log("settime");
    // }, 40);
    bots.forEach((bot, i) => {
      botState = i;
      bot.eatFoodAround();
      bot.eatBotAround();
    });
  }
}

function makeInitialFood() {
  for (let i = 0; i < MAX_INIT_FOOD; i++) {
    // buf = Math.floor(Math.random() * 1000) % 5;
    food.push(new Cube(FOOD, INITIAL));
    food[food.length - 1].create();
    // for (let j = 0; j < buf; j++) food[food.length - 1].updateSize();
  }
}
//----------------------------------------start pro--------------------------------------------//

//add Mouse Move Event
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.delta = 1 - (event.clientX / sizes.width) * 2;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
});

// document.addEventListener('click', (event) => {
//   bProduce = false;
// });

//create canvas, scene, camera and renderer
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});

// Lighting
lightControl();

renderer.toneMapping = THREE.ACESFilmicToneMapping; // Use ACES tone mapping for more natural results



let nameText = new Text();

nameText.fontSize = 0.2;
nameText.fontWeight = 'bold'
nameText.color = '#ffffff';
nameText.geometry.center();

nameText.position.x = -0.3
nameText.position.y = -0.2

nameText.text = `Player`

//create star, this is just you.
star = new Cube(PERSON, INITIAL);
star.create();
star.cube.add(nameText);
deltaRef = star.sizeDef / 2;

//initialization
addPlane();
drawX();
// drawY();

makeInitialFood();
//engine
animate();