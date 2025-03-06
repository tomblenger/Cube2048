import * as THREE from 'three';
import { Text } from 'troika-three-text'
import { RoundedBoxGeometry } from "three/addons";

const PERSON = 0;
const GHOST = 1;
const FOOD = 2;
const INITIAL = 1;

const TIME_SPACE_BOT = 50;
const MAX_BOT = 3;

const moveSpeed = {
  x: 0.05,
  y: 0.05
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
const color = [
  'rgb(205, 92, 92)',
  'rgb(21, 90, 147)',
  'rgb(65, 255, 148)',
  'rgb(202, 138, 111)',
  'rgb(120, 30, 213)',
  'rgb(200, 172, 160)'];

var bProduce = true;
var star;
var bots = [];
var food = [];
var lineX = [];
var cycleBot = 0;
var cycleFood = 0;
var mouse = new THREE.Vector2();

function getColor(size) {
  return color[Math.floor(Math.log2(size)) % 7 - 1];
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
    //tail and text
    this.tail = [];
    this.text = new Text();
    this.eat = false;
    this.count = 0;

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
    this.geometry = new RoundedBoxGeometry(this.sizeDef, this.sizeDef, this.sizeDef,3, 0.08);
    this.scale = 1;
    for (let i = 0; i < this.count; i++) this.scale *= 1.05;

    this.color = getColor(this.size);

    //create material from color
    this.material = new THREE.MeshStandardMaterial({ color: this.color, roughness: false});//, metalness: 0.4 

    //create cube
    this.cube = new THREE.Mesh(this.geometry, this.material);
    this.cube.scale.set(this.scale, this.scale, this.scale);

    //set parameters for the position randomize
    if (this.type === PERSON) {
      this.pos = [Math.random(), Math.random(), 0.2];
    } else {
      this.pos = [randomizePosition(maxWidth), randomizePosition(maxHeight), 0];
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
    this.text.text = `${this.size}`;
    this.text.fontSize = 0.3;
    this.text.fontWeight = 'bold'
    this.text.color = '#ffffff';
    this.setPos();
  }

  createText() {
    //create text and draw
    this.text.fontSize = 0.3;
    this.text.fontWeight = 'bold'
    this.text.color = '#ffffff';
    this.text.geometry.center();
    scene.add(this.text)
  }

  setPos(pos = undefined) {
    if (!pos) pos = this.pos;
    if (pos[0] > maxScaledWidth) pos[0] = maxScaledWidth;
    if (pos[0] < -maxScaledWidth) pos[0] = -maxScaledWidth;
    if (pos[1] > maxScaledHeight) pos[1] = maxScaledHeight;
    if (pos[1] < -maxScaledHeight) pos[1] = -maxScaledHeight;

    this.pos = pos;
    this.cube.position.set(pos[0], pos[1], 0.1);
    this.text.position.set( this.cube.position.x-this.sizeDef/4, this.cube.position.y+this.sizeDef/3, this.sizeDef);
    this.text.rotation.x = -Math.PI / 9;
  }

  setAngle(angle) {
    this.cube.rotation.z = angle;
  }

  connectTail(children) {
    this.tail.push(children);
  }

  eatFoodAround() {
    var buf = [];
    if (this.type == PERSON) {
      this.food = [...food, ...bots];
    }


    food.forEach((monster, i) => {
      const minDist = monster.sizeDef;
      let deltaY = monster.pos[1] - this.pos[1];
      if (deltaY < 0) deltaY = -deltaY;
      let deltaX = monster.pos[0] - this.pos[0];
      if (deltaX < 0) deltaX = -deltaX;
      if ((deltaX < minDist) && deltaY < minDist) {
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

      // this.
      this.next.x = this.next.x + (Math.random() - 0.5);
      if(this.pos[0] == maxScaledWidth) this.next.x = -Math.random()
      if(this.pos[0] == -maxScaledWidth) this.next.x = Math.random()
      this.next.y = this.next.y + (Math.random() - 0.5);
      if(this.pos[1] == maxScaledHeight) this.next.y = -Math.random()
      if(this.pos[1] == -maxScaledHeight) this.next.y = Math.random()
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
          alert();
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
          console.log(this.pos);
          if (this.pos[0] == maxScaledWidth) item.pos[0] = maxScaledWidth - item.sizeDef * (j + 1);
          else if (this.pos[0] == -maxScaledWidth) item.pos[0] = -maxScaledWidth + item.sizeDef * (j + 1);
          if (this.pos[1] == maxScaledHeight) item.pos[1] = maxScaledHeight - item.sizeDef * (j + 1);
          else if (this.pos[1] == -maxScaledHeight) item.pos[1] = -maxScaledHeight + item.sizeDef * (j + 1);
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
  const geometry = new THREE.PlaneGeometry(maxScaledWidth * 2 + 0.5, maxScaledHeight * 2 + 0.5);
  const material = new THREE.MeshBasicMaterial({
    color: 'rgb(31,54,97)',
    side: THREE.DoubleSide,
    transparent: false, // Disable transparency
    wireframe: false,
    // metalness: 0.8
  });
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
}

function drawX() {
  const material = new THREE.LineDashedMaterial({
    color: 'rgb(43,93,150)',
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
  if (cycleFood < 100) cycleFood++;
  else {
    cycleFood = 0;
    if (bProduce) {
      if (food.length < 50) {
        let buf = Math.floor(Math.random() * 1000) % 5;
        food.push(new Cube(GHOST, INITIAL));
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
      bots.push(new Cube(GHOST, INITIAL));
      bots[bots.length - 1].create();
      for (let i = 0; i < buf; i++) bots[bots.length - 1].updateSize();
    }
  }
}

function lightControl() {
  const light0 = new THREE.DirectionalLight(0xffffff, 3);
  light0.position.set(0, 300, 200).normalize();
  scene.add(light0);

  const light1 = new THREE.DirectionalLight(0xffffff, 1);
  light1.position.set(400, 300, 140).normalize();
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0xffffff, 1);
  light2.position.set(400, -300, 150).normalize();
  scene.add(light2);

  const light3 = new THREE.DirectionalLight(0xffffff, 1);
  light3.position.set(-400, -300, 50).normalize();
  scene.add(light3);
}

function animate() {
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
    bots.forEach((bot) => {
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
  if (bots.length > 0) {
    bots.forEach((bot) => {
      bot.eatFoodAround();
    });
  }
}
//----------------------------------------start pro--------------------------------------------//

//add Mouse Move Event
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.delta = 1 - (event.clientX / sizes.width) * 2;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
});

document.addEventListener('click', (event) => {
  bProduce = false;
});

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

//create star, this is just you.
star = new Cube(PERSON, INITIAL);
star.create();

//initialization
addPlane();
drawX();
// drawY();

//engine
animate();
