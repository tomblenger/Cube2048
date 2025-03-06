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

var star;
var ref = 0;
var count = 0;
var eatCount = 0;
var food = [];
var lineX = [];
var lineY = [];
var bufPos = [];
var bufAngle = [];
var mouse = new THREE.Vector2();
var color = [	'#ff4000', '#ff8000', '#ffbf00', '#ffff00', '#bfff00',	'#80ff00', '#40ff00', '#00ff00', '#00ff40', '#00ff80'];

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
    let scale = 1;
    for (let i = 0; i < this.count; i++) scale *= 1.05;

    //detect color
    // if (this.type == PERSON) this.color = 0x55ccdd;
    // else if (this.type == FOOD) this.color = 0x0000ff;
    // else this.color = 0x00ff00;
    this.color = getColor(this.size);

    //create material from color
    this.material = new THREE.MeshBasicMaterial({ color: this.color });

    //create cube
    this.cube = new THREE.Mesh(this.geometry, this.material);
    this.cube.scale.set(scale, scale, scale);

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
    let scale = 1;
    for (let i = 0; i < this.count; i++) scale *= 1.05;
    this.cube.scale.set(scale, scale, scale);
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

function findNearFood() {
  var buf = [];
  food.forEach((monster, i) => {
    const minDist = monster.sizeDef;
    let deltaY = Math.abs(monster.pos[1] - star.pos[1]);
    let deltaX = Math.abs(monster.pos[0] - star.pos[0]);
    if ((deltaX < minDist) && deltaY < minDist) {
      if (monster.size <= star.size) {
        star.bCrash = false;
        if (monster.eat == false) {
          star.connectTail(new Cube(PERSON, monster.size));
          star.tail[star.tail.length - 1].create();
          monster.pos[0] = star.pos[0];
          monster.pos[1] = star.pos[1];
          monster.pos[2] = star.pos[2];
          star.setPos();
          monster.eat = true;
          scene.remove(monster.cube);
          scene.remove(monster.text);
          buf.push(i);
        } else {
          let alpha = Math.atan2(mouse.x, mouse.y);
          if (mouse.x > 0) {
            if (mouse.y < 0) {
              alpha = Math.PI - alpha;
            }
          } else {
            if (mouse.y < 0) {
              alpha = Math.PI + alpha;
            } else {
              alpha = -alpha;
            }
          }
        }
      } else {
        monster.pos[0] = star.pos[0] + (deltaX + 0.15) * mouse.x / Math.abs(mouse.x);
        monster.pos[1] = star.pos[1] + (deltaY + 0.15) * mouse.y / Math.abs(mouse.y);
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

function setStarBuffer() {
  if (mouse.x == 0 && mouse.y == 0) ref = 1;
  else ref = moveSpeed.x / Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);

  bufAngle.push(Math.atan2(mouse.y, mouse.x));
  bufPos.push([star.pos[0], star.pos[1], star.pos[2]]);
}

function setStarPosAngle() {
  star.setAngle(bufAngle[bufAngle.length - 1]);
    star.pos[0] += ref * mouse.x;
    star.pos[1] += ref * mouse.y;
    star.setPos();
}

function eatFoodEngine() {
  star.tail.sort((a, b) => b.size - a.size)
  let i = 0, len = star.tail.length;
  while(i < len) {
    if (i == 0) {
          console.log("star", star.size, star.tail)
      if (star.tail[i].size == star.size) {
        if(eatCount > 20)
        {
          eatCount = 0;
          star.updateSize();
          scene.remove(star.tail[i].cube);
          scene.remove(star.tail[i].text);
          star.tail = deleteFromArray(star.tail, i);
        } else eatCount ++;
      }
    } else {
          console.log("star", star.size, star.tail)
      if (star.tail[i].size == star.tail[i - 1].size) {
        if(eatCount > 20) {
          star.tail[i - 1].updateSize();
          scene.remove(star.tail[i].cube);
          scene.remove(star.tail[i].text);
          star.tail = deleteFromArray(star.tail, i);
          eatCount = 0;
        } else {
          eatCount++;
        }
      }
    }
    len = star.tail.length;
    i++;
  }
}

function traceEngine() {
  star.tail.forEach((item, j) => {
    const arrIndex = bufAngle.length - (j + 1) * 20;
    if (arrIndex > 0) {
      item.setAngle(bufAngle[arrIndex]);
      if (bufPos[arrIndex]) {
        item.pos[0] = bufPos[arrIndex][0];
        item.pos[1] = bufPos[arrIndex][1];
        item.pos[2] = bufPos[arrIndex][2];
        item.setPos();
      }
    }
    else {
      if (j > 1) item.setAngle(star.tail[j - 1].cube.rotation.z);
      else item.setAngle(star.cube.rotation.z)
      item.setPos(star.tail[j-1].pos[arrIndex]);
    }
  })
}

function cameraCtrl() {
  camera.position.x = star.pos[0];
  camera.position.y = star.pos[1];
}

function makeFood() {
  if (count < 100) count++;
  else {
    count = 0;
    let buf = Math.floor(Math.random() * 1000) % 5;
    food.push(new Cube(GHOST, INITIAL));
    food[food.length - 1].create();
    for (let i = 0; i < buf; i++) food[food.length - 1].updateSize();
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (star) {
    //set position and angle
    setStarBuffer();
    setStarPosAngle();

    //engines
    eatFoodEngine();
    traceEngine();

    //camera control
    cameraCtrl();
  }
  render();

  makeFood();
  findNearFood();
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