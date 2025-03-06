import * as THREE from 'three';
import { Text } from 'troika-three-text'

const PERSON = 0;
const GHOST = 1;
const FOOD = 2;
const INITIAL = 2;

const moveSpeed = {
  x: 0.03,
  y: 0.03
};
const sizes = {
  width: 800,
  height: 600
};
const maxWidth = sizes.width * 2;
const maxHeight = sizes.height * 2;
const screenScale = 200;
const maxScaledWidth = maxWidth / screenScale;
const maxScaledHeight = maxHeight / screenScale;
const color = [	'#ff4000', '#ff8000', '#ffbf00', '#ffff00', '#bfff00',	'#80ff00', '#40ff00', '#00ff00', '#00ff40', '#00ff80'];

var star;
var bots = [];
var food = [];
var lineX = [];
var lineY = [];
var cycleBot = 0;
var cycleFood = 0;
var mouse = new THREE.Vector2();

function setColor() {
  let R, G, B;
  for (let i = 0; i < 12; i++) {
    R = Math.floor(Math.random() * 255);
    G = Math.floor(Math.random() * 255);
    B = Math.floor(Math.random() * 255);
    color.push(R << 16 + G << 8 + B);
  }
  console.log(color);
}

function getColor(size) {
  return color[Math.floor(Math.log2(size))];
}

function randomizePosition(max) {
  var buf = Math.random() * max;
  var position = buf / screenScale;
  if (Math.floor(buf) % 2 == 0) position = -position;
  // alert(position);
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

  return halfBefore.concat(halfAfter);
}

class Cube {
  constructor(type, size) {
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

    // if(this.size > INITIAL) alert("asf")
    //create geometry
    this.geometry = new THREE.BoxGeometry(this.sizeDef, this.sizeDef, this.sizeDef);
    this.scale = 1;
    for (let i = 0; i < this.count; i++) this.scale *= 1.05;

    //detect color
    // if (this.type == PERSON) this.color = 0x55ccdd;
    // else if (this.type == FOOD) this.color = 0x0000ff;
    // else this.color = 0x00ff00;
    this.color = getColor(this.size);

    //create material from color
    this.material = new THREE.MeshBasicMaterial({ color: this.color });

    //create cube
    this.cube = new THREE.Mesh(this.geometry, this.material);
    this.cube.scale.set(this.scale, this.scale, this.scale);

    //set parameters for the position randomize
    if (this.type === PERSON) this.pos = [Math.random(), Math.random(), 0];
    else this.pos = [randomizePosition(maxWidth), randomizePosition(maxHeight), 0];

    //tail and text
    this.tail = [];
    this.text = new Text();
    this.eat = false;
    this.count = 0;
    this.bCrash = false;
  }

  create(pos=undefined) {
    //add cube to the scene and set position and draw text on the top of cubic
    scene.add(this.cube);
    this.setPos(pos);
    this.createText();
  }

  updateSize() {
    //update the cube size into two times
    this.size = this.size * 2;

    this.color = getColor(this.size);
    this.material.color.set(this.color);

    this.count++;
    this.scale *= 1.05;
    this.cube.scale.set(this.scale, this.scale, this.scale);
    this.text.text = `${this.size}`;
    this.text.fontSize = 0.2;
    this.setPos();
  }

  createText() {
    //create text and draw
    scene.add(this.text)
    this.text.text = `${this.size}`;
    this.text.fontSize = 0.2;
    this.text.color = 0x00FF00;
  }

  setPos(pos = undefined) {
    if (!pos) pos = this.pos;
    if (pos[0] > maxScaledWidth) pos[0] = maxScaledWidth;
    if (pos[0] < -maxScaledWidth) pos[0] = -maxScaledWidth;
    if (pos[1] > maxScaledHeight) pos[1] = maxScaledHeight;
    if (pos[1] < -maxScaledHeight) pos[1] = -maxScaledHeight;

    this.pos = pos;
    this.cube.position.set(pos[0], pos[1], 0);
    this.text.position.set( this.cube.position.x, this.cube.position.y-0.3, 0);
  }

  setAngle(angle) {
    this.cube.rotation.z = angle;
  }

  connectTail(children) {
    // let i = this.tail.findIndex(item => item.size <= children.size);
    // this.tail = insertArray(this.tail, children, i);
    this.tail.push(children);
  }

  findNearFood() {
    var buf = [];
    food.forEach((monster, i) => {
      const minDist = monster.sizeDef;
      let deltaY = monster.pos[1] - this.pos[1];
      if (deltaY < 0) deltaY = -deltaY;
      let deltaX = monster.pos[0] - this.pos[0];
      if (deltaX < 0) deltaX = -deltaX;
      if ((deltaX < minDist) && deltaY < minDist) {
        if (monster.size <= this.size) {
          this.connectTail(new Cube(PERSON, monster.size));
          this.tail[this.tail.length - 1].create();
          monster.pos[0] = this.pos[0];
          monster.pos[1] = this.pos[1];
          monster.pos[2] = this.pos[2];
          this.setPos();
          monster.eat = true;
          scene.remove(monster.cube);
          scene.remove(monster.text);
          buf.push(i);
        } else {
          if (mouse.x > 0) monster.pos[0] = this.pos[0] + (deltaX + 0.15);
          else monster.pos[0] = this.pos[0] - (deltaX + 0.15);
          if (mouse.y > 0) monster.pos[1] = this.pos[1] + (deltaY + 0.15);
          else monster.pos[1] = this.pos[1] - (deltaY + 0.15);
          monster.setPos();
        }
      }
    });
    if (buf.length != 0) {
      for (let i = 0; i < buf.length; i++) {
        food = deleteFromArray(food, buf[i]);
      }
    }
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

      // this.
      this.next.x = this.next.x + (Math.random() - 0.5);
      if(this.pos[0] == maxWidth) this.next.x = -Math.random()
      if(this.pos[0] == -maxWidth) this.next.x = Math.random()
      this.next.y = this.next.y + (Math.random() - 0.5);
      if(this.pos[1] == maxHeight) this.next.y = -Math.random()
      if(this.pos[1] == -maxHeight) this.next.y = Math.random()
      if (this.next.x == 0 && this.next.y == 0) this.ref = 1;
      else this.ref = moveSpeed.x / Math.sqrt(this.next.x * this.next.x + this.next.y * this.next.y);
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

  eatFoodEngine() {
    this.tail.sort((a, b) => b.size - a.size)
    let i = 0, len = this.tail.length;
    while(i < len) {
      if (i == 0) {
            console.log("star", this.size, this.tail)
        if (this.tail[i].size == this.size) {
          if(this.eatCount > 20)
          {
            this.eatCount = 0;
            this.updateSize();
            scene.remove(this.tail[i].cube);
            scene.remove(this.tail[i].text);
            this.tail = deleteFromArray(this.tail, i);
          } else this.eatCount ++;
        }
      } else {
            console.log("star", this.size, this.tail)
        if (this.tail[i].size == this.tail[i - 1].size) {
          if(this.eatCount > 20) {
            this.tail[i - 1].updateSize();
            scene.remove(this.tail[i].cube);
            scene.remove(this.tail[i].text);
            this.tail = deleteFromArray(this.tail, i);
            this.eatCount = 0;
          } else {
            this.eatCount++;
          }
        }
      }
      len = this.tail.length;
      i++;
    }
  }

  traceEngine() {
    this.tail.forEach((item, j) => {
      const arrIndex = this.bufAngle.length - (j + 1) * 20;
      if (arrIndex > 0) {
        item.setAngle(this.bufAngle[arrIndex]);
        if (this.bufPos[arrIndex]) {
          item.pos[0] = this.bufPos[arrIndex][0];
          item.pos[1] = this.bufPos[arrIndex][1];
          item.pos[2] = this.bufPos[arrIndex][2];
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
}

function addPlane() {
  const geometry = new THREE.PlaneGeometry(maxScaledWidth * 2, maxScaledHeight * 2);
  const material = new THREE.MeshBasicMaterial({
    color: 0x000055,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
    wireframe: false
  });
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
}

function drawX() {
  const material = new THREE.LineBasicMaterial({
    color: 0x0054500
  });
  const yCount = sizes.height / 10;

  for(let i = -yCount; i < yCount; i++) {
    const points = [
      new THREE.Vector3(-1 * sizes.width, i, 0),
      new THREE.Vector3(sizes.width, i, 0)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    lineX[i+yCount] = new THREE.Line(geometry, material);
    lineX[i+yCount].position.z = -0.1;

    scene.add(lineX[i+yCount]);
  }
}

function drawY() {
  const material = new THREE.LineBasicMaterial({
    color: 0x0054500
  });

  const xCount = sizes.width / 10;
  for(let i = -xCount; i < xCount; i++) {
    const points = [
      new THREE.Vector3(i, -sizes.height, 0),
      new THREE.Vector3(i, sizes.height, 0)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    lineY[i+xCount] = new THREE.Line(geometry, material);
    lineY[i+xCount].position.z = -0.1;

    scene.add(lineY[i+xCount]);
  }
}

function render() {
  renderer.setSize(sizes.width, sizes.height);
  renderer.render(scene, camera);
}

function cameraCtrl() {
  camera.position.x = star.pos[0];
  camera.position.y = star.pos[1];
}

function makeFood() {
  if (cycleFood < 100) cycleFood++;
  else {
    cycleFood = 0;
    if (food.length < 50) {
      let buf = Math.floor(Math.random() * 1000) % 5;
      food.push(new Cube(GHOST, INITIAL));
      food[food.length - 1].create();
      for (let i = 0; i < buf; i++) food[food.length - 1].updateSize();
    }
  }
}

function makeBot() {
  if (cycleBot < 100) cycleBot++;
  else {
    cycleBot = 0;
    if (bots.length < 7) {
      let buf = Math.floor(Math.random() * 100) % 5;
      bots.push(new Cube(GHOST, INITIAL));
      bots[bots.length - 1].create();
      for (let i = 0; i < buf; i++) bots[bots.length - 1].updateSize();
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (star) {
    //set position and angle
    star.setStarBuffer();
    star.setStarPosAngle();

    //engines
    star.eatFoodEngine();
    star.traceEngine();

    //camera control
    cameraCtrl();
  }
  if (bots.length > 1) {
    bots.forEach((bot) => {
      bot.setBotBuffer();
      bot.setBotPosAngle();
      //engines
      bot.eatFoodEngine();
      bot.traceEngine();
    })
  }
  render();

  makeFood();
  makeBot();
  star.findNearFood();
}

//----------------------------------------start pro--------------------------------------------//
// setColor();

//add Mouse Move Event
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.delta = 1 - (event.clientX / sizes.width) * 2;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
});

//create canvas, scene, camera and renderer
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.z = 3;
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});

//create star, this is just you.
star = new Cube(PERSON, INITIAL);
star.create();

//initialization
addPlane();
drawX();
drawY();

//engine
animate();