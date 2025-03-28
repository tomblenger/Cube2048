import * as THREE from 'three';
import { Text } from 'troika-three-text'
import { RoundedBoxGeometry } from "three/addons";
import nipplejs from 'nipplejs';

const saveSettingsButton = document.getElementById('saveSettingsButton');
const settingsButton = document.getElementById('settingsButton');
const settingsForm = document.getElementById('settingsForm');
const playerName = document.getElementById("playerName");
const controllerCanvas = document.getElementById('controllerCanvas');
const customAlert = document.getElementById("customAlert");
const cancelButton = document.getElementById('closeSettingsButton');
const webgl = document.getElementById('webgl');
const gameForm = document.getElementById("game-form");
const style = document.getElementById('colorStyle');
const audioElement = document.getElementById('myAudio');
const joystickContainer = document.getElementById('joystick-container');

const PERSON = 0;
const FOOD = 1;
const BOT = 2;
const TAIL = 3;
const INITIAL = 1;

const TIME_SPACE_BOT = 100;
const TIME_SPACE_TABLE = 200;
const MAX_BOT = 20;
const MAX_INIT_FOOD = 30;
const MAX_FOOD = 1000;
const TIME_SPACE_FOOD = 100;
const EAT_COUNT = 35;

const SIZE = 0;
const DISTANCE = 1;
const ANTI_DISTANCE = 2;
const RAND = 3;


const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};
const maxWidth = sizes.width * 2;
const maxHeight = sizes.height * 2;
const screenScale = 200;
const maxScaledWidth = maxWidth / screenScale;
const maxScaledHeight = maxHeight / screenScale;
const audioContext = new(window.AudioContext || window.webkitAudioContext)();

const scaledSize = {
    width: sizes.width / screenScale * 2,
    height: sizes.height / screenScale * 2
}

const color1 = [
    'rgb(205, 92, 92)', //2
    'rgb(40,140,228)', //4
    'rgb(51,250,140)', //8
    'rgb(147,95,250)', //16
    'rgb(249,149,78)', //32
    'rgb(252,240,65)', //64
    'rgb(55,80,248)',
    'rgb(251,253,96)', //256
    'rgb(3,252,228)',
    'rgb(250,196,227)',
    'rgb(249,251,110)',
];

const color2 = [
    'rgb(47, 230, 138)', //2
    'rgb(180, 17, 172)', //4
    'rgb(179, 231, 37)', //8
    'rgb(48, 189, 199)', //16
    'rgb(241, 50, 92)', //32
    'rgb(28, 162, 196)', //64
    'rgb(248, 245, 55)',
    'rgb(58, 7, 73)', //256
    'rgb(123, 235, 108)',
    'rgb(199, 196, 50)',
    'rgb(27, 92, 214)'
];

const color3 = [
    'rgb(92, 109, 205)', //2
    'rgb(49, 171, 175)', //4
    'rgb(250, 147, 51)', //8
    'rgb(250, 95, 95)', //16
    'rgb(249, 78, 249)', //32
    'rgb(65, 230, 252)', //64
    'rgb(55, 248, 142)',
    'rgb(96, 253, 245)', //256
    'rgb(252, 3, 3)',
    'rgb(209, 250, 196)',
    'rgb(110, 251, 239)'
];


let nameText;
let frameCount = 0;
let runningReplay = true;
let cubeName = "PPP";
let colorStyle = 'style1';
let difficulty = "easy";
let threeAngle;
let isMobile = false;
let isIncreasable = false;
let moveSpeed = { x: 0.035, y: 0.035 };
let moveSpeedStar = { x: 0.035, y: 0.035 };
let openForm = false;
let currentControllerPos = { x: 50, y: 50 };
let touchSize = { width: 100, height: 100 }
let joyX;
let joyY;
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
let gameOverCount = 0;
let frameBufferCount = 0;
let trace = [];
let isPlaying = false;
let source = null; // Global variable for the current audio source
let joystick;



function playAudio(cubeType) {
    if (!isPlaying && cubeType === PERSON) {
        isPlaying = true;
        audioElement.currentTime = 0;
        audioElement.play();
        isPlaying = false;
    }
}

function pauseAudio() {
    audioElement.pause();
}

function replayAudio() {
    audioElement.currentTime = 0; // Reset to the beginning
    audioElement.play(); // Play the audio again
}

function playSound() {
    // If a sound is already playing, stop it before starting a new one
    if (source) {
        source.stop();
    }

    // Fetch and decode the audio file
    fetch("sound.mp3")
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => {
            // Create a new source for the sound
            source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start(1000);

            // Optionally, restart the sound when it ends
            source.onended = () => {
                playSound(); // Automatically restart when the sound finishes
            };
        })
        .catch(error => {
            console.error('Error playing the sound:', error)
        });
}

function restartSound() {
    playSound(); // This will restart the sound
}

function isPointInRectangle(px, py, rect) {
    function crossProduct(ax, ay, bx, by) {
        return ax * by - ay * bx;
    }

    function isSameSide(p1x, p1y, p2x, p2y, ax, ay, bx, by) {
        let cp1 = crossProduct(bx - ax, by - ay, p1x - ax, p1y - ay);
        let cp2 = crossProduct(bx - ax, by - ay, p2x - ax, p2y - ay);
        return cp1 * cp2 >= 0;
    }

    let [x0, y0, x1, y1, x2, y2, x3, y3] = rect;

    return (
        isSameSide(px, py, x2, y2, x0, y0, x1, y1) &&
        isSameSide(px, py, x3, y3, x1, y1, x2, y2) &&
        isSameSide(px, py, x0, y0, x2, y2, x3, y3) &&
        isSameSide(px, py, x1, y1, x3, y3, x0, y0)
    );
}

function isLineIntersecting(ax, ay, bx, by, cx, cy, dx, dy) {
    function orientation(px, py, qx, qy, rx, ry) {
        let val = (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
        return val > 0 ? 1 : val < 0 ? -1 : 0;
    }

    function onSegment(px, py, qx, qy, rx, ry) {
        return Math.min(px, qx) <= rx && rx <= Math.max(px, qx) &&
            Math.min(py, qy) <= ry && ry <= Math.max(py, qy);
    }

    let o1 = orientation(ax, ay, bx, by, cx, cy);
    let o2 = orientation(ax, ay, bx, by, dx, dy);
    let o3 = orientation(cx, cy, dx, dy, ax, ay);
    let o4 = orientation(cx, cy, dx, dy, bx, by);

    if (o1 !== o2 && o3 !== o4) return true; // General case

    if (o1 === 0 && onSegment(ax, ay, bx, by, cx, cy)) return true;
    if (o2 === 0 && onSegment(ax, ay, bx, by, dx, dy)) return true;
    if (o3 === 0 && onSegment(cx, cy, dx, dy, ax, ay)) return true;
    if (o4 === 0 && onSegment(cx, cy, dx, dy, bx, by)) return true;

    return false;
}

function isLineRectangleOverlapping(line, rect) {
    let [x0, y0, x1, y1, x2, y2, x3, y3] = rect;
    let [px1, py1] = line[0], [px2, py2] = line[1];

    // Case 1: Either endpoint is inside the rectangle
    if (isPointInRectangle(px1, py1, rect) || isPointInRectangle(px2, py2, rect)) {
        return true;
    }

    // Case 2: Line intersects any rectangle edge
    let edges = [
        [x0, y0, x1, y1],
        [x1, y1, x2, y2],
        [x2, y2, x3, y3],
        [x3, y3, x0, y0]
    ];

    return edges.some(edge => isLineIntersecting(px1, py1, px2, py2, ...edge));
}

function getElementPositions(element) {
    const rect = element.getBoundingClientRect();
    return {
        width: rect.right + window.scrollX,
        height: rect.bottom + window.scrollY
    };
}

function getColor(size) {
    try {
        const buf = Math.floor(Math.log2(size / 2)) % 11;
        const colorMap = {
            'style1': color1,
            'style2': color2,
            'style3': color3
        };
        return colorMap[colorStyle][buf];
    } catch (err) {
        console.error("Get Color Error:", err);
        return null;
    }
}

function randomizePosition(max) {
    return (Math.random() * 2 - 1) * max;
}

function deleteFromArray(arr, index) {
    let halfBefore, halfAfter;
    // scene.remove(arr[index].cube);
    halfBefore = arr.slice(0, index);
    // if ((index + 1) < arr.length) halfAfter = arr.slice(index + 1, arr.length);
    if (index < arr.length) halfAfter = arr.slice(index + 1, arr.length);
    else halfAfter = [];
    let buf = arr[index] && arr[index].tail && arr[index].tail.length;

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
    constructor(type, size = INITIAL) {
        //tail and text
        this.tail = [];
        this.text = new Text();
        this.eat = false;
        this.count = 0;
        this.direction = RAND;
        this.newtail = [];
        this.mergeCount = 0;

        this.next = {
            x: 0,
            y: 0
        }

        this.botRouteCount = 0;
        this.ref = 0;
        this.eatCount = 0;
        this.eatToHeadCount = 0;
        // this.frameCount = frameBufferCount;
        this.bufPos = [];
        this.bufAngle = [];

        this.count = Math.log2(size);
        this.sizeDef = INITIAL * 0.1 + 0.3;
        this.size = size;
        this.type = type;
        this.geometry = new RoundedBoxGeometry(this.sizeDef, this.sizeDef, this.sizeDef, 3, 0.05);
        this.scale = 1;
        for (let i = 0; i < this.count; i++) this.scale *= 1.05;
        this.color = getColor(this.size) | colorStyle === 'style1' ? color1[0] : colorStyle === 'style2' ? color2[0] : color3[0];
        this.material = new THREE.MeshStandardMaterial({ color: this.color, roughness: false });

        this.cube = new THREE.Mesh(this.geometry, this.material);
        this.cube.scale.set(this.scale, this.scale, this.scale);

        // Create Full Clock Background
        this.clockGeometry = new THREE.CircleGeometry(this.sizeDef / 3, 64);
        this.clockMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: true, transparent: true });
        this.clock = new THREE.Mesh(this.clockGeometry, this.clockMaterial);

        // Create Timer Sector (Dynamic)
        this.timerMaterial = new THREE.MeshStandardMaterial({ color: 0x373952, roughness: false });
        this.timerGeometry = new THREE.RingGeometry(0, this.sizeDef / 4, 64, 1, 0, 0); // Full circle initially
        this.timerMesh = new THREE.Mesh(this.timerGeometry, this.timerMaterial);
        this.timerMesh.rotation.z = Math.PI / 2;
        this.clock.add(this.timerMesh);
        this.timerMesh.position.z = 0.001

        if (this.type === PERSON) {
            this.pos = [0, 0, 0];
        } else {
            this.pos = [randomizePosition(maxScaledWidth), randomizePosition(maxScaledHeight), 0];
        }
        this.setCornerPosition();
    }

    create(pos = undefined) {
        if (this.eat === false) scene.add(this.cube);
        this.setPos(pos);
        this.createText();
        if (this.size === INITIAL) this.updateSize();
    }

    updateSize() {
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
        this.text.text = this.size < 1000 ? `${this.size}` : `${Math.floor(this.size / 1000)}K`;
        this.text.fontSize = this.size < 1000 ? 0.2 : 0.3;
        this.text.fontSize = 0.2;
        this.text.fontWeight = 'bold'
        this.text.color = '#ffffff';
        this.text.geometry.center();
        this.text.rotation.z = this.cube.rotation.z - Math.PI / 2
        this.cube.add(this.text);
        // this.cube.add(this.clockFace)
    }

    setPos(pos = this.pos) {
        this.text.text = this.size < 1000 ? `${this.size}` : `${Math.floor(this.size / 1000)}K`;
        this.text.fontSize = this.size < 1000 ? 0.2 : 0.3;
        this.text.fontWeight = 'bold';
        this.text.color = '#ffffff';

        pos = pos || this.pos;
        pos[0] = Math.min(Math.max(pos[0], -maxScaledWidth), maxScaledWidth);
        pos[1] = Math.min(Math.max(pos[1], -maxScaledHeight), maxScaledHeight);

        this.pos = pos;
        this.cube.position.set(pos[0], pos[1], 0.1);
        // this.clockFace.position.set(pos[0], pos[1], 1);

        const textPosZ = this.sizeDef - 0.199;
        let textPosX;
        let textPosY;

        if (this.size < 10) {
            textPosX = this.sizeDef / 2.8;
            textPosY = this.sizeDef / 6;
        } else if (this.size < 100) {
            textPosX = this.sizeDef / 2.8;
            textPosY = this.sizeDef / 3;
        } else if (this.size <= 1000) {
            textPosX = this.sizeDef / 2.8;
            textPosY = this.sizeDef / 2.2;
        } else {
            textPosX = this.sizeDef / 1.8;
            textPosY = this.sizeDef / 2.2
        }

        this.text.position.set(textPosX, textPosY, textPosZ);

        this.setCornerPosition();
    }

    setAngle(angle) {
        this.cube.rotation.z = angle;
        this.setCornerPosition();
        // if(this.type === PERSON) console.log(this.cube.rotation.z);
    }

    setCornerPosition() {
        this.p_snake = this.sizeDef * 0.7071 * Math.sin(Math.PI / 4 + this.cube.rotation.z);
        this.q_snake = this.sizeDef * 0.7071 * Math.cos(Math.PI / 4 + this.cube.rotation.z);
        this.corner = [
            this.pos[0] + this.q_snake, this.pos[1] + this.p_snake,
            this.pos[0] - this.p_snake, this.pos[1] + this.q_snake,
            this.pos[0] - this.q_snake, this.pos[1] - this.p_snake,
            this.pos[0] + this.p_snake, this.pos[1] - this.q_snake
        ];
    }

    connectTail(children) {
        this.tail.push(children);
        children.eat = false;
    }

    eatPlayerAround(player) {
        if (this.size <= player.size) return;

        const minDist = this.sizeDef + 0.13;
        const deltaX = Math.abs(player.pos[0] - this.pos[0]);
        const deltaY = Math.abs(player.pos[1] - this.pos[1]);

        if (deltaX < minDist && deltaY < minDist) {
            customAlert.style.display = 'flex';
            document.getElementById("alertTitle").innerHTML = `Killed ${botState}`;
            document.getElementById("countNum").innerHTML = `${this.size}`;
            running = false;
            runningReplay = true;
        }
    }

    eatFoodAround() {
        let deltaX = 0,
            deltaY = 0;
        let alpha = 0;
        let bCrash = false;
        let bOverlap = false;
        food.forEach((monster, i) => {
            if (bufFood.length !== 0) {
                food = deleteIndexesFromArray(food, bufFood);
                bufFood = [];
            }
            const minDist = monster.sizeDef;
            bCrash = false;
            bOverlap = false;
            deltaY = monster.pos[1] - this.pos[1];
            if (deltaY < 0) deltaY = -deltaY;
            deltaX = monster.pos[0] - this.pos[0];
            if (deltaX < 0) deltaX = -deltaX;
            if (deltaX < 1.5 * minDist && deltaY < 1.5 * minDist) {

                for (let j = 0; j < 4; j++) {
                    if (isPointInRectangle(monster.corner[j * 2], monster.corner[j * 2 + 1], this.corner)) bCrash = true;
                    if (isPointInRectangle(this.corner[j * 2], this.corner[j * 2 + 1], monster.corner)) bCrash = true;
                }
                if (isLineRectangleOverlapping([
                        [this.corner[6], this.corner[7]],
                        [this.corner[0], this.corner[1]]
                    ], monster.corner)) {
                    bOverlap = true;
                }
            }
            if (bCrash) {
                if (monster.size <= this.size) {
                    monster.eat = true;
                    playAudio(this.type);
                    scene.remove(food[i].cube);
                    tailBuf = new Cube(TAIL, INITIAL);
                    tailBuf.create();
                    while (true) {
                        if (monster.size === tailBuf.size) break;
                        tailBuf.updateSize();
                    }
                    this.connectTail(tailBuf);
                    this.setPos();

                    let index = bufFood.findIndex(item => item === i);
                    if (index === -1) bufFood.push(i);
                } else {
                    if (bOverlap) {
                        let bufCenterAngle = Math.atan2((monster.pos[1] - this.pos[1]), (monster.pos[0] - this.pos[0])) - this.cube.rotation.z;
                        if (bufCenterAngle > 0) monster.cube.rotation.z -= Math.PI / 2000;
                        else if (bufCenterAngle < 0) monster.cube.rotation.z += Math.PI / 2000;
                        monster.pos[0] = monster.pos[0] + Math.cos(this.cube.rotation.z) * moveSpeedStar.x;
                        monster.pos[1] = monster.pos[1] + Math.sin(this.cube.rotation.z) * moveSpeedStar.x;
                        monster.setPos();
                        monster.setAngle(monster.cube.rotation.z);
                        monster.setCornerPosition();
                    }
                }
            }
        });
    }

    eatBotAround() {
        let deltaX = 0,
            deltaY = 0;
        let alpha = 0;
        let bCrash = false;
        let bOverlap = false;

        bots.forEach((monster, i) => {
            if (bufBots.length !== 0) {
                bots = deleteIndexesFromArray(bots, bufBots);
                bufBots = [];
            }
            if (i !== botState) {
                const minDist = monster.sizeDef;
                bCrash = false;
                bOverlap = false;
                deltaY = monster.pos[1] - this.pos[1];
                if (deltaY < 0) deltaY = -deltaY;
                deltaX = monster.pos[0] - this.pos[0];
                if (deltaX < 0) deltaX = -deltaX;
                if (deltaX < 1.5 * minDist && deltaY < 1.5 * minDist) {

                    for (let j = 0; j < 4; j++) {
                        if (isPointInRectangle(monster.corner[j * 2], monster.corner[j * 2 + 1], this.corner)) bCrash = true;
                        if (isPointInRectangle(this.corner[j * 2], this.corner[j * 2 + 1], monster.corner)) bCrash = true;
                    }
                    if (isLineRectangleOverlapping([
                            [this.corner[6], this.corner[7]],
                            [this.corner[0], this.corner[1]]
                        ], monster.corner)) {
                        bOverlap = true;
                    }
                }
                if (bCrash) {
                    if (monster.size < this.size) {
                        playAudio(this.type);
                        scene.remove(bots[i].cube);
                        scene.remove(bots[i].text);
                        tailBuf = new Cube(TAIL, INITIAL);
                        tailBuf.create();
                        while (true) {
                            if (monster.size === tailBuf.size) break;
                            tailBuf.updateSize();
                        }
                        this.connectTail(tailBuf);
                        this.setPos();
                        monster.eat = true;

                        let index = bufBots.findIndex(bufBot => bufBot === i);
                        if (index === -1) bufBots.push(i);
                    } else {
                        if (bOverlap) {
                            let bufCenterAngle = Math.atan2((monster.pos[1] - this.pos[1]), (monster.pos[0] - this.pos[0])) - this.cube.rotation.z;
                            if (bufCenterAngle > 0) monster.cube.rotation.z -= Math.PI / 2000;
                            else if (bufCenterAngle < 0) monster.cube.rotation.z += Math.PI / 2000;
                            monster.pos[0] = monster.pos[0] + Math.cos(this.cube.rotation.z) * moveSpeedStar.x;
                            monster.pos[1] = monster.pos[1] + Math.sin(this.cube.rotation.z) * moveSpeedStar.x;
                            monster.setPos();
                            monster.setAngle(monster.cube.rotation.z);
                            monster.setCornerPosition();
                        }
                    }
                }
            }
        });
    }

    eatTailAround() {
        let neighbor = [...bots, star]
        neighbor.forEach(bot => {
            let tailLength = bot.tail.length
            if (tailLength) {
                bot.tail.forEach((item, i) => {
                    const minDist = item.sizeDef;
                    let deltaY = item.pos[1] - this.pos[1];
                    if (deltaY < 0) deltaY = -deltaY;
                    let deltaX = item.pos[0] - this.pos[0];
                    if (deltaX < 0) deltaX = -deltaX;
                    if ((deltaX < minDist) && deltaY < minDist) {
                        if (item.size < this.size) {
                            let eatBuf;
                            let restBuf;
                            eatBuf = bot.tail.slice(i, bot.tail.length);

                            restBuf = bot.tail.slice(0, i);
                            bot.tail = restBuf;
                            for (let k = i; k < bot.tail.length; k++) {
                                playAudio(this.type);
                                scene.remove(bot.tail[k].cube);
                                scene.remove(bot.tail[k].text);
                            }

                            eatBuf.forEach((item, i) => {
                                this.connectTail(item);
                                this.setPos();
                                item.eat = true;
                            });
                        }
                    }
                })
            }
        });
    }

    setStarBuffer() {
        this.ref = ((mouse.x === 0 && mouse.y === 0)) ? 1 : moveSpeedStar.x / Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
        if (this.bufPos.length < 15) {
            this.bufAngle.push(Math.atan2(mouse.y, mouse.x));
            this.bufPos.push([...this.pos]);
        } else {
            let buf = this.bufPos[this.bufPos.length - 1];
            let distance = (buf[0] - this.pos[0]) ** 2 + (buf[1] - this.pos[1]) ** 2;
            if (distance > 0.0004) {
                this.edge = distance <= 0.0006;
                this.bufAngle.push(Math.atan2(mouse.y, mouse.x));
                this.bufPos.push([...this.pos]);
            }
        }
    }

    setStarPosAngle() {
        this.setAngle(this.bufAngle[this.bufAngle.length - 1]);
        this.pos[0] += this.ref * mouse.x;
        this.pos[1] += this.ref * mouse.y;
        this.setPos();
        this.setCornerPosition();
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
        this.setCornerPosition();
    }

    mergeTailEngine() {
        this.tail.sort((a, b) => b.size - a.size);
        let len = this.tail.length;
        let i = len - 1;
        while (i >= 0) {
            const currentTail = this.tail[i];
            const prevTail = this.tail[i - 1];
            if (i === 0) {
                if (this.eatToHeadCount > EAT_COUNT) {
                    if (currentTail.size === this.size) {
                        scene.remove(currentTail.cube);
                        scene.remove(currentTail.text);
                        this.eatCount = 0;
                        this.updateSize();
                        this.tail = deleteFromArray(this.tail, i);
                        len--;
                        this.eatCount = 0;
                        this.eatToHeadCount = 0;
                        return;
                    } else if (currentTail.size > this.size) {
                        scene.remove(currentTail.cube);
                        scene.remove(currentTail.text)
                        while (this.size < currentTail.size) {
                            this.updateSize();
                        }
                        this.tail = deleteFromArray(this.tail, i);
                        this.eatCount = 0;
                        this.eatToHeadCount = 0;
                        return;
                    }
                    this.eatToHeadCount = 0;
                } else this.eatToHeadCount++;
            } else if (currentTail.size === prevTail.size) {
                if (this.eatCount > EAT_COUNT) {
                    scene.remove(currentTail.cube);
                    scene.remove(currentTail.text);
                    prevTail.updateSize();
                    this.tail = deleteFromArray(this.tail, i);
                    this.eatCount = 0;
                    this.eatToHeadCount = 0;
                    len--;
                    return;
                } else {
                    this.eatCount++;
                }
            }
            i--;
        }
    }

    traceEngine() {
        if (this.bufAngle.length > 2000) this.bufAngle.splice(0, this.bufAngle.length - 2000);
        if (this.bufPos.length > 2000) this.bufPos.splice(0, this.bufPos.length - 2000);

        this.tail.forEach((item, j) => {
            let traceHis;
            if (mouseCount === 0) {
                if (j > 0) {
                    switch (this.tail[j - 1].size) {
                        case 2048:
                            traceHis = 20;
                            break;
                        case 1024:
                            traceHis = 19;
                            break;
                        case 512:
                            traceHis = 19;
                            break;
                        case 256:
                            traceHis = 18;
                            break;
                        case 128:
                            traceHis = 18;
                            break;
                        case 64:
                            traceHis = 17;
                            break;
                        case 32:
                            traceHis = 16;
                            break;
                        case 16:
                            traceHis = 15;
                            break;
                        case 8:
                            traceHis = 14;
                            break;
                        case 2:
                        case 4:
                            traceHis = 13;
                            break;
                        default:
                            traceHis = 21;
                            break;
                    }
                    if (this.edge) traceHis += 2;
                } else {
                    switch (this.size) {
                        case 2048:
                            traceHis = 20;
                            break;
                        case 1024:
                            traceHis = 19;
                            break;
                        case 512:
                            traceHis = 19;
                            break;
                        case 256:
                            traceHis = 18;
                            break;
                        case 128:
                            traceHis = 18;
                            break;
                        case 64:
                            traceHis = 17;
                            break;
                        case 32:
                            traceHis = 16;
                            break;
                        case 16:
                            traceHis = 15;
                            break;
                        case 8:
                            traceHis = 14;
                            break;
                        case 2:
                        case 4:
                            traceHis = 13;
                            break;
                        default:
                            traceHis = 21;
                            break;
                    }
                    if (this.edge) traceHis += 2;
                }

                if (moveSpeedStar.x > moveSpeed.x) traceHis -= 3;
            }
            if (j > 0) item.arrIndex = this.tail[j - 1].arrIndex - traceHis;
            else item.arrIndex = this.bufAngle.length - traceHis;

            item.setAngle(this.bufAngle[item.arrIndex]);

            if (this.bufPos[item.arrIndex]) {
                let [x, y, z] = this.bufPos[item.arrIndex];
                //
                // let offsetX = item.sizeDef * (j + 1);
                // let offsetY = item.sizeDef * (j + 1);
                //
                // if (Math.abs(mouse.y) < 0.03) {
                //     if (this.pos[0] === maxScaledWidth) x = maxScaledWidth - offsetX;
                //     else if (this.pos[0] === -maxScaledWidth) x = -maxScaledWidth + offsetX;
                // } else {
                //     if (this.pos[0] === maxScaledWidth) x = maxScaledWidth;
                //     else if (this.pos[0] === -maxScaledWidth) x = -maxScaledWidth;
                // }
                //
                // if (Math.abs(mouse.x) < 0.03) {
                //     if (this.pos[1] === maxScaledHeight) y = maxScaledHeight - offsetY;
                //     else if (this.pos[1] === -maxScaledHeight) y = -maxScaledHeight + offsetY;
                // } else {
                //     if (this.pos[1] === maxScaledHeight) y = maxScaledHeight;
                //     else if (this.pos[1] === -maxScaledHeight) y = -maxScaledHeight;
                // }

                item.pos = [x, y, z];
                item.setPos();
            }
            item.setCornerPosition();
        });
    }

    findNeighbor() {
        this.food = [];
        this.enemies = [];
        let neighbors = [...bots, ...food, star];
        countEnemy = 0;

        // Define boundaries once
        const rect = {
            left: this.pos[0] - scaledSize.width,
            right: this.pos[0] + scaledSize.width,
            top: this.pos[1] + scaledSize.height,
            bottom: this.pos[1] - scaledSize.height
        };

        neighbors.forEach((neighbor, i) => {
            if (botState === i) return;

            const nx = neighbor.pos[0];
            const ny = neighbor.pos[1];

            if (nx > rect.left && nx < rect.right && ny < rect.top && ny > rect.bottom) {
                const dx = nx - this.pos[0];
                const dy = ny - this.pos[1];
                const distance = dx * dx + dy * dy;
                const theta = dx !== 0 ? dy / dx : 0;

                if (neighbor.size > this.size && (neighbor.type === BOT || neighbor.type === PERSON)) {
                    this.enemies.push({ size: neighbor.size, x: dx, y: dy, distance, theta });
                } else if (neighbor.size < this.size) {
                    this.food.push({ size: neighbor.size, x: dx, y: dy, distance, theta });
                }

                countEnemy++;
            }
        });
    }

    detectDirection() {
        const prob5to5 = difficulty === 'easy' ? Math.random() <= 0.15 : difficulty === 'medium' ? Math.random() < 0.5 : Math.random() < 0.9; // 1.5 out of 10
        const prob3to7 = difficulty === 'easy' ? Math.random() <= 0.3 : difficulty === 'medium' ? Math.random() < 0.5 : Math.random() < 0.9; // 3 out of 10

        if (this.enemies.length === 0) {
            if (this.food.length === 0) {
                this.toRandom();
                this.direction = RAND;
            } else {
                this.direction = prob5to5 ? DISTANCE : SIZE;
                prob5to5 ? this.toDistance() : this.toSize();
            }
            return;
        }

        if (this.food.length === 0 || prob3to7) {
            this.toAntiDistance();
            this.direction = ANTI_DISTANCE;
        } else {
            this.direction = prob5to5 ? DISTANCE : SIZE;
            prob5to5 ? this.toDistance() : this.toSize();
        }
    }

    toSize() {
        if (!this.food.length) return;

        let def = this.food.reduce((max, item) => (item.size > max.size ? item : max), this.food[0]);

        const theta = def.theta;
        this.next.x = def.x > 0 ? 1 : -1;
        this.next.y = def.x > 0 ? theta : -theta;

        this.ref = moveSpeed.x / Math.sqrt(1 + this.next.y ** 2);
    }

    toDistance() {
        if (!this.food.length) return;

        let def = this.food.reduce((min, item) => (item.distance < min.distance ? item : min), this.food[0]);

        const theta = def.theta;
        this.next.x = def.x > 0 ? 1 : -1;
        this.next.y = def.x > 0 ? theta : -theta;

        this.ref = moveSpeed.x / Math.sqrt(1 + this.next.y ** 2);
    }

    toAntiDistance() {
        if (!this.enemies.length) return;

        let def = this.enemies.reduce((min, item) => (item.distance < min.distance ? item : min), this.enemies[0]);

        this.next.x = def.x > 0 ? -1 : 1;
        this.next.y = def.x > 0 ? -def.theta : def.theta;

        if (this.pos[0] === maxScaledWidth) this.next.x = -Math.random();
        if (this.pos[0] === -maxScaledWidth) this.next.x = Math.random();
        if (this.pos[1] === maxScaledHeight) this.next.y = -Math.random();
        if (this.pos[1] === -maxScaledHeight) this.next.y = Math.random();

        this.ref = moveSpeed.x / Math.sqrt(1 + this.next.y ** 2);
    }

    toRandom() {
        this.next.x += (Math.random() - 0.5);
        this.next.y += (Math.random() - 0.5);

        // Adjust movement at screen edges
        if (this.pos[0] >= maxScaledWidth) this.next.x = -Math.random();
        if (this.pos[0] <= -maxScaledWidth) this.next.x = Math.random();
        if (this.pos[1] >= maxScaledHeight) this.next.y = -Math.random();
        if (this.pos[1] <= -maxScaledHeight) this.next.y = Math.random();

        // Prevent zero movement
        if (this.next.x === 0 && this.next.y === 0) {
            this.next.x = Math.random() * 0.1 - 0.05; // Small random value
            this.next.y = Math.random() * 0.1 - 0.05;
        }

        this.ref = moveSpeed.x / Math.sqrt(this.next.x ** 2 + this.next.y ** 2);
    }

    drawTimer() {
        let angle;
        angle = (1 - frameBufferCount / 300) * Math.PI * 2
        this.clock.position.set(this.pos[0], this.pos[1], 1);
        this.clock.rotation.x = Math.PI / 4
        scene.add(this.clock);
        this.timerGeometry.dispose();
        this.timerGeometry.copy(new THREE.RingGeometry(0, this.sizeDef / 4, 64, 1, 0, angle)); // Adjust sector
    }

    removeTimer() {
        scene.remove(this.clock);
    }
}

function addPlane() {
    const width = maxScaledWidth * 2 + 0.5;
    const height = maxScaledHeight * 2 + 0.5;

    // Create Plane
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
        color: 0x105188, // Hex color is more efficient
        side: THREE.DoubleSide,
        transparent: false,
        wireframe: false,
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
}

function drawX() {
    const material = new THREE.LineDashedMaterial({
        color: 'rgb(123,182,255)',
        dashSize: 0.04, // Length of dashes (small for dots)
        gapSize: 0.5, // Space between dashes (adjust for dot effect)
        linewidth: 20
    });
    const yCount = maxScaledHeight;

    for (let i = -yCount; i < yCount; i += 0.5) {
        const points = [
            new THREE.Vector3(-1 * maxScaledWidth + 0.03, i, 0),
            new THREE.Vector3(maxScaledWidth - 0.03, i, 0)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        lineX[i + yCount] = new THREE.Line(geometry, material);
        lineX[i + yCount].position.z = 0.01;
        lineX[i + yCount].computeLineDistances();
        scene.add(lineX[i + yCount]);
    }
}

function render() {
    renderer.setSize(sizes.width, sizes.height);
    renderer.render(scene, camera);
}

function cameraCtrl() {
    if (!star || !star.pos) { return; }

    const [x, y] = star.pos; // Destructure for better readability
    camera.position.set(x, y - 3, 5);
    camera.rotation.x = Math.PI / 7;
}

function makeInitialFood() {
    for (let i = 0; i < MAX_INIT_FOOD; i++) {
        const item = new Cube(FOOD, INITIAL);
        item.create();
        food.push(item);
    }
}

function makeInitHideTail(cube) {
    for (let i = 0; i < 10; i++) {
        const tailSegment = new Cube(TAIL, INITIAL);
        tailSegment.create();
        cube.newtail.push(tailSegment);
        scene.remove(tailSegment.cube);
    }
}

function makeInitHideBots() {
    for (let i = 0; i < MAX_BOT; i++) {
        const bot = new Cube(BOT, INITIAL);
        bot.create();
        replayBots.push(bot);
        scene.remove(bot.cube);
    }
}

function makeFood(size = 2) {
    if (cycleFood < TIME_SPACE_FOOD) {
        cycleFood++;
        return;
    }

    cycleFood = 0;

    // if (star.size > 256) MAX_FOOD = 3;
    if (bProduce && food.length < MAX_FOOD) {
        const newFood = new Cube(FOOD, INITIAL);
        newFood.create();
        food.push(newFood);

        // const sizeUpdates = (Math.random() * 5) | 0; // Random number 0-4
        const sizeUpdates = (Math.random() * 4 * Math.log2(size));
        for (let i = 0; i < sizeUpdates; i++) {
            newFood.updateSize();
        }
    }
}

function makeBot() {
    if (cycleBot < TIME_SPACE_BOT) {
        cycleBot++;
    } else {
        cycleBot = 0;
        if (bots.length < MAX_BOT) {
            let botIndex = bots.length; // Track the index of the new bot
            let newBot = new Cube(BOT, INITIAL);
            newBot.create();

            let botText = new Text();
            botText.fontSize = 0.13;
            botText.fontWeight = 'bold';
            botText.color = '#ffffff';
            botText.geometry.center();
            botText.position.z = 0.3;
            botText.text = `Bot${botIndex}`; // Assign correct label
            botText.rotation.z = -newBot.cube.rotation.z;

            newBot.cube.add(botText); // Attach text to the newly created bot
            bots.push(newBot); // Store the new bot in the array

            // Randomly resize the new bot (0 to 4 times)
            let buf = Math.floor(Math.random() * 5);
            for (let i = 0; i < buf; i++) {
                newBot.updateSize();
            }
        }
    }
}

function lightControl() {
    const lightPositions = [
        [0, 300, 200],
        [0, -40, 140],
        [400, -300, 150],
        [-400, -300, 50]
    ];

    lightPositions.forEach(pos => {
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(...pos);
        scene.add(light);
    });
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
    if (cube.tail.length !== 0) {
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
        else if (cube.size < info.size) cube.updateSize();
        else cube.smallerSize();
    }
    if (cube.newtail.length !== 0) {
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
    if (!star || !bots || !food) return; // Ensure data exists

    let tStar = extract(star);
    let tBot = bots.map(bot => extract(bot)); // Use .map() instead of .forEach()
    let tFood = food.map(foodItem => extract(foodItem));

    trace.push({ star: tStar, bot: tBot, food: tFood });

    // Limit trace history to prevent excessive memory usage (e.g., keep last 100 states)
    if (trace.length > 1000) trace.shift();
}

function initPro() {
    lightControl();

    // Create name text
    nameText = new Text();
    nameText.fontSize = 0.1;
    nameText.fontWeight = 'bold';
    nameText.color = '#ffffff';
    nameText.text = `you`;
    nameText.geometry.center();

    // Create a triangle marker (🔺)
    threeAngle = new Text();
    threeAngle.fontSize = 0.4;
    threeAngle.fontWeight = 'bold';
    threeAngle.color = '#ffffff';
    threeAngle.fillOpacity = 0.7;
    threeAngle.position.set(0.6, 0.25, 0);
    threeAngle.rotation.z = -Math.PI / 2;
    threeAngle.text = `🔺`;

    // Create player cube
    star = new Cube(PERSON, INITIAL);
    star.create();
    nameText.position.set(star.pos[0] - 0.2, 0, 0.6);

    // Attach texts to star
    star.cube.add(nameText);
    star.cube.add(threeAngle);
    makeInitialFood();
    // Hide tails and bots initially
    makeInitHideTail(star);
    makeInitHideBots();
    replayBots.forEach(bot => makeInitHideTail(bot));

    // Add additional elements
    addPlane();
    drawX();
}

function updateTable(person, bots) {
    if (cycleTable < TIME_SPACE_TABLE) {
        cycleTable++;
        return;
    }

    cycleTable = 0; // Reset cycleTable after update

    const updateCube = bots.map((bot, index) => ({
        cube: bot,
        id: `Bot ${index}`
    })).concat({ cube: person, id: "You" });

    // Sort cubes by size in descending order and take the top 5
    const sortData = updateCube.sort((a, b) => b.cube.size - a.cube.size).slice(0, 5);

    const tbody = document.querySelector('#leaderboard tbody');
    tbody.innerHTML = ''; // Clear the table before updating

    sortData.forEach((data, i) => {
        const row = document.createElement('tr');
        row.classList.toggle("highlight", data.id === "You"); // Highlight player row

        row.innerHTML = `
            <td class="rank">${i + 1}</td>
            <td class="name ${data.id === "You" ? 'player-name' : ''}">${data.id === "You" ? (typeof cubeName !== "undefined" ? cubeName : "You") : data.id}</td>
            <td class="score">${data.cube.size}</td>
        `;

        tbody.appendChild(row);
    });
}

function detectDevice() {
    if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
            navigator.userAgent,
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
            navigator.userAgent.substr(0, 4),
        )
    ) {
        return true;
    } else {
        return false;
    }
}

function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    if (isIncreasable) {
        frameBufferCount++;
        if (frameBufferCount < 300) {
            moveSpeedStar = {
                ...moveSpeedStar,
                x: 0.05,
                y: 0.05
            }
        } else {
            isIncreasable = false;
            frameBufferCount = 600;
        }
    } else {
        moveSpeedStar = moveSpeed
        frameBufferCount--;
        if (frameBufferCount < 0) { frameBufferCount = 0 }
    }


    if (star) {

        star.setStarBuffer();
        star.setStarPosAngle();
        star.mergeTailEngine();
        star.traceEngine();
        if (isIncreasable) {
            star.drawTimer();
        } else {
            star.removeTimer();
        }

        nameText.text = cubeName;

        cameraCtrl();
    }

    bots.forEach((bot, i) => {
        botState = i;
        bot.setBotBuffer();
        bot.setBotPosAngle();
        bot.mergeTailEngine();
        bot.traceEngine();
    });

    render();

    if (star) {
        star.eatFoodAround();
        star.eatBotAround();
        star.eatTailAround();
    }
    bots.forEach((bot, i) => {
        botState = i;
        bot.eatPlayerAround(star);
        bot.eatFoodAround();
        bot.eatBotAround();
        bot.eatTailAround();
    });

    updateTable(star, bots);
    setHistory();
    makeFood(star.cube.size);
    makeBot();
}

function mainEngine() {
    animate();
    running = false;
}

function viewReplayEngine() {
    if (!runningReplay) return;
    requestAnimationFrame(viewReplayEngine);

    if (frameCount < trace.length - 2) {
        frameCount++;
    } else {
        if (gameOverCount < 1) {
            customAlert.style.display = 'flex';
        } else {
            document.getElementById("die").style.display = 'flex';
        }
        return;
    }

    // Restore the star position
    star = restore(star, trace[frameCount].star);
    nameText.rotation.z = -star.cube.rotation.z;

    // Restore food positions
    trace[frameCount].food.forEach((info, i) => {
        if (food[i]) {
            food[i] = restore(food[i], info);
        }
    });

    // Restore bots
    replayBots.forEach(bot => scene.remove(bot.cube)); // Remove previous bots
    trace[frameCount].bot.forEach((info, i) => {
        replayBots[i] = restore(replayBots[i] || new Cube(BOT, INITIAL), info);
    });

    cameraCtrl();
    render();
}

function removeAll() {
    // Remove all objects from the scene efficiently
    while (scene.children.length > 0) {
        const object = scene.children[0];
        scene.remove(object);

        // Dispose of geometry, materials, and textures properly
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(mat => mat.dispose());
            } else {
                object.material.dispose();
            }
        }
        if (object.texture) object.texture.dispose();
    }

    // Remove star and its tails
    if (star) {
        scene.remove(star.cube);
        star.tail.forEach(item => scene.remove(item.cube));
        star.newtail.forEach(item => scene.remove(item.cube));
    }

    // Remove bots and their tails
    bots.forEach(bot => {
        scene.remove(bot.cube);
        bot.tail.forEach(item => scene.remove(item.cube));
    });

    // Remove food
    food.forEach(item => scene.remove(item.cube));

    // Remove replay bots and their tails
    replayBots.forEach(bot => {
        scene.remove(bot.cube);
        bot.tail.forEach(item => scene.remove(item.cube));
    });

    // Clear arrays
    bots.length = 0;
    food.length = 0;
    replayBots.length = 0;

    // Clear and reset leaderboard
    const tbody = document.querySelector('#leaderboard tbody');
    if (tbody) {
        tbody.innerHTML = '';
        const row = document.createElement('tr');
        row.classList.add('highlight');
        row.innerHTML = `
            <td class="rank">1</td>
            <td class="name player-name">You</td>
            <td class="score">2</td>
        `;
        tbody.appendChild(row);
    }
}

function toggleSetting() {
    openForm = !openForm;
    if (openForm) {
        settingsForm.classList.remove('hidden');
        settingsForm.classList.add('block');
    } else {
        settingsForm.classList.remove('block');
        settingsForm.classList.add('hidden');
    }
}

//----------------------------------------start pro--------------------------------------------//

if (detectDevice()) {
    isMobile = true;
} else {
    isMobile = false;
}

settingsButton.addEventListener('click', toggleSetting);
settingsButton.addEventListener('touchstart', toggleSetting);
settingsButton.addEventListener('touchend', toggleSetting);

if (isMobile) {

    gameForm.addEventListener("submit", function(event) {
        try {
            event.preventDefault();
            cubeName = playerName.value;
            gameForm.style.display = "none";
            document.addEventListener("touchend", startGame, { once: true });
        } catch (err) {}
    });

    function startGame() {

        running = true;
        animate();
    }

    document.addEventListener('touchmove', (event) => {
        if (!star) return;
        nameText.rotation.z = -star.cube.rotation.z;

        let touch = event.touches[0];
        joyX = touch.clientX;
        joyY = window.innerHeight - touch.clientY;

        const dx = joyX - currentControllerPos.x;
        const dy = joyY - currentControllerPos.y;
        const calRadius = (dx * dx + dy * dy);

        const touchWidth = touchSize.width;
        const touchHeight = touchSize.height;
        if (calRadius < touchWidth * touchWidth) {
            mouse.x = joyX / touchWidth * 2 - 1;
            mouse.y = joyY / touchHeight * 2 - 1;
        }
    });

    document.getElementById("closeAlert").addEventListener("touchend", function() {
        document.getElementById("customAlert").style.display = 'none';
        removeAll();
        runningReplay = false;
        gameOverCount = 0;
        running = false;
        initPro()
        makeInitialFood();
        animate();

        gameForm.style.display = "block";
    });

    document.getElementById("viewReplay").addEventListener("touchend", function() {
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

    window.onload = function() {
        const joystickContainer = document.getElementById("joystick-container");
        if (!joystickContainer) {
            console.error("joystick-container not found!");
            return;
        }

        joystick = nipplejs.create({
            zone: joystickContainer,
            mode: "dynamic",
            color: "blue",
            size: 100
        });
    };

    // Add event listener for the save button
    saveSettingsButton.addEventListener('touchend', function() {

        colorStyle = style.value;

        difficulty = document.getElementById('difficulty').value;
        settingsForm.classList.remove('block');
        settingsForm.classList.add('hidden');
    });

    cancelButton.addEventListener('touchend', () => {
        settingsForm.classList.remove('block');
        settingsForm.classList.add('hidden');
    })

    joystickContainer.style.display = 'block';
} else {
    document.addEventListener('mousemove', (event) => {
        if (!star) return;
        nameText.rotation.z = -star.cube.rotation.z;

        // canvasPos = getElementPositions(webgl);

        mouse.x = (event.clientX / sizes.width) * 2 - 1;
        mouse.y = -(event.clientY / sizes.height) * 2 + 1;
    });

    document.getElementById("closeAlert").addEventListener("click", function() {
        document.getElementById("customAlert").style.display = 'none';
        removeAll();
        runningReplay = false;
        gameOverCount = 0;
        running = false;
        initPro()
        makeInitialFood();
        animate();

        gameForm.style.display = "block";
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

    webgl.addEventListener('mousedown', () => {
        if (frameBufferCount < 600 && frameBufferCount > 250) {
            isIncreasable = false;
        } else isIncreasable = true;
    })

    webgl.addEventListener('mouseup', () => { isIncreasable = false; });

    // Add event listener for the save button
    saveSettingsButton.addEventListener('click', function() {
        colorStyle = style.value;

        difficulty = document.getElementById('difficulty').value;
        settingsForm.classList.remove('block');
        settingsForm.classList.add('hidden');
    });

    cancelButton.addEventListener('click', () => {
        settingsForm.classList.remove('block');
        settingsForm.classList.add('hidden');
    })

    gameForm.addEventListener("submit", function(event) {
        try {
            event.preventDefault(); // Prevent the default form submission
            cubeName = playerName.value;
            gameForm.style.display = "none";
            document.addEventListener("click", startGame, { once: true });
        } catch (err) {}
    });

    function startGame() {
        running = true;
        animate();
    }
};

//create canvas, scene, camera and renderer
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });

renderer.toneMapping = THREE.ACESFilmicToneMapping;

initPro();
mainEngine();