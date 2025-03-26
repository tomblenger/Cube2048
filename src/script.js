import * as THREE from 'three';
import { Text } from 'troika-three-text'
import { RoundedBoxGeometry } from "three/addons";


const saveSettingsButton = document.getElementById('saveSettingsButton');
const settingsButton = document.getElementById('settingsButton');
const settingsForm = document.getElementById('settingsForm');
const playerName = document.getElementById("playerName");
const controllerCanvas = document.getElementById('controllerCanvas');
const customAlert = document.getElementById("customAlert");
const desktopMode = document.getElementById("com");
const mobileMode = document.getElementById("phone");
const cancelButton = document.getElementById('closeSettingsButton');
const webgl = document.getElementById('webgl');
const gameForm = document.getElementById("game-form");
const ctx = controllerCanvas.getContext('2d');
const style = document.getElementById('colorStyle');


const PERSON = 0;
const FOOD = 1;
const BOT = 2;
const TAIL = 3;
const INITIAL = 1;

const TIME_SPACE_BOT = 100;
const TIME_SPACE_TABLE = 200;
const MAX_BOT = 30;
const MAX_INIT_FOOD = 20;
const MAX_FOOD = 30;
const TIME_SPACE_FOOD = 40;
const EAT_COUNT = 35;

const SIZE = 0;
const DISTANCE = 1;
const ANTI_DISTANCE = 2;
const RAND = 3;

let nameText;
let frameCount = 0;
let runningReplay = true;
let cubeName = "PPP";
let colorStyle = 'style1';
let difficulty = "easy";
let threeAngle;
let touch = false;
let controllable = false;
let isIncreasable = false;
let moveSpeed = { x: 0.035, y: 0.035 };
let moveSpeedStar = { x: 0.035, y: 0.035 };
let openForm = false;
let isDragging = false;
let currentControllerPos = { x: window.innerWidth - 97, y: window.innerHeight - 97 };
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
    'rgb(27, 92, 214)',
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
    'rgb(110, 251, 239)',
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
let eatTailBuf = null;
let mouseCount = 0;
let gameOverCount = 0;
let controllerControl = false;
let frameBufferCount = 0;

var trace = [];

let innerCircleX = controllerCanvas.width / 2;
let innerCircleY = controllerCanvas.height / 2;

let touchSize = {
    width: 300,
    height: 250
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
    halfBefore = arr.slice(0, index);
    if ((index + 1) < arr.length) halfAfter = arr.slice(index + 1, arr.length);
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
        this.edge = false;
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

        if (this.type === PERSON) {
            this.pos = [0, 0, 0];
        } else {
            this.pos = [randomizePosition(maxScaledWidth), randomizePosition(maxScaledHeight), 1];
        }
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
        let textPosX = -this.sizeDef / 2.2;
        let textPosY = this.sizeDef / 2.8;

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
            textPosX = this.sizeDef / 2.8;
            textPosY = this.sizeDef / 2
        }

        this.text.position.set(textPosX, textPosY, textPosZ);
    }

    setAngle(angle) {
        this.cube.rotation.z = angle;
    }

    connectTail(children) {
        this.tail.push(children);
    }

    playSound() {
        let sound = new Audio("sound.wav"); // Create a new instance
        // let distance = (star.pos[0] - this.pos[0]) ** 2 + (star.pos[1] - this.pos[1]) ** 2;

        sound.volume = 0.5;
        sound.play(); // Play a separate instance
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
            this.playSound();
        }
    }

    eatFoodAround() {

        food.forEach((monster, i) => {
            if (bufFood.length !== 0) {
                food = deleteIndexesFromArray(food, bufFood);
                bufFood = [];
            }
            const minDist = monster.sizeDef;
            let deltaY = monster.pos[1] - this.pos[1];
            if (deltaY < 0) deltaY = -deltaY;
            let deltaX = monster.pos[0] - this.pos[0];
            if (deltaX < 0) deltaX = -deltaX;
            if (deltaX < minDist && deltaY < minDist) {
                this.playSound();
                if (monster.size <= this.size) {
                    monster.eat = true;
                    scene.remove(monster.cube);
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
                    if (mouse.x > 0) monster.pos[0] = this.pos[0] + (deltaX + 0.15);
                    else monster.pos[0] = this.pos[0] - (deltaX + 0.15);
                    if (mouse.y > 0) monster.pos[1] = this.pos[1] + (deltaY + 0.15);
                    else monster.pos[1] = this.pos[1] - (deltaY + 0.15);
                    monster.setPos();
                }
            }
        });
    }

    eatBotAround() {

        bots.forEach((monster, i) => {
            if (bufBots.length !== 0) {
                bots = deleteIndexesFromArray(bots, bufBots);
                bufBots = [];
            }
            if (i !== botState) {
                const minDist = monster.sizeDef;
                let deltaY = monster.pos[1] - this.pos[1];
                if (deltaY < 0) deltaY = -deltaY;
                let deltaX = monster.pos[0] - this.pos[0];
                if (deltaX < 0) deltaX = -deltaX;
                if ((deltaX < minDist) && deltaY < minDist) {
                    if (monster.size < this.size) {
                        this.playSound();
                        scene.remove(monster.cube);
                        scene.remove(monster.text);
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
                            this.playSound();
                            let eatBuf;
                            let restBuf;
                            eatBuf = bot.tail.slice(i, bot.tail.length);

                            restBuf = bot.tail.slice(0, i);
                            bot.tail = restBuf;
                            for (let k = i; k < bot.tail.length; k++) {
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
        this.ref = (mouse.x === 0 && mouse.y === 0) ? 1 : moveSpeedStar.x / Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
        if(this.bufPos.length < 15) {
            this.bufAngle.push(Math.atan2(mouse.y, mouse.x));
            this.bufPos.push([...this.pos]);
        } else {
            let buf = this.bufPos[this.bufPos.length - 1];
            let distance = (buf[0] - this.pos[0]) ** 2 + (buf[1] - this.pos[1]) ** 2;
            console.log(distance);
            if(distance > 0.0004) {
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
        this.tail.sort((a, b) => b.size - a.size);
        let len = this.tail.length;
        let i = len - 1;
        while (i >= 0) {
            const currentTail = this.tail[i];
            const prevTail = this.tail[i - 1];
            if (i === 0) {
                if(this.eatToHeadCount > EAT_COUNT) {
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
                } else this.eatToHeadCount ++;
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
                    this.eatCount ++;
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
                if(this.edge) traceHis = this.size < 100 ? 16 : 17;
                else traceHis = this.size < 100 ? 13 : 14;
            }
            
            let arrIndex = Math.max(0, this.bufAngle.length - (j + 1) * traceHis);

            item.setAngle(this.bufAngle[arrIndex]);

            if (this.bufPos[arrIndex]) {
                let [x, y, z] = this.bufPos[arrIndex];
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
}

function addPlane() {
    const width = maxScaledWidth * 2 + 0.5;
    const height = maxScaledHeight * 2 + 0.5;

    // Initialize Fog before adding objects
    scene.fog = new THREE.FogExp2(0xdddddd, 0.08);

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

function drawController(x = controllerCanvas.width / 2, y = controllerCanvas.height / 2) {
    const centerX = controllerCanvas.width / 2;
    const centerY = controllerCanvas.height / 2;

    ctx.clearRect(0, 0, controllerCanvas.width, controllerCanvas.height);

    // Outer Circle with Gradient & Glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, outerRadius);
    gradient.addColorStop(0, '#2e8588');
    gradient.addColorStop(1, 'rgba(46, 133, 136, 0.5)'); // Transparent outer ring effect

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#42eacb';
    ctx.shadowColor = '#42eacb';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow for next elements

    // Inner Circle
    ctx.beginPath();
    ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#48558e'; // Inner circle color
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1ebfb3'; // Inner circle border
    ctx.stroke();

    // Directional Arrows
    const arrowOffsets = [
        [centerX, centerY - outerRadius + 15, 'up'],
        [centerX, centerY + outerRadius - 15, 'down'],
        [centerX - outerRadius + 15, centerY, 'left'],
        [centerX + outerRadius - 15, centerY, 'right']
    ];

    arrowOffsets.forEach(([ax, ay, dir]) => drawArrow(ax, ay, dir));
}

function drawArrow(x, y, direction, arrowSize = 25) {
    if (!ctx) return; // Ensure the canvas context exists

    ctx.fillStyle = '#42eacb'; // Arrow color
    ctx.beginPath();

    const halfSize = arrowSize / 2;

    const arrowShapes = {
        up: [
            [x - halfSize, y + halfSize],
            [x + halfSize, y + halfSize],
            [x, y - arrowSize]
        ],
        down: [
            [x - halfSize, y - halfSize],
            [x + halfSize, y - halfSize],
            [x, y + arrowSize]
        ],
        left: [
            [x + halfSize, y - halfSize],
            [x + halfSize, y + halfSize],
            [x - arrowSize, y]
        ],
        right: [
            [x - halfSize, y - halfSize],
            [x - halfSize, y + halfSize],
            [x + arrowSize, y]
        ]
    };

    if (!arrowShapes[direction]) {
        console.warn("Invalid direction:", direction);
        return;
    }

    arrowShapes[direction].forEach(([px, py], index) => {
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });

    ctx.closePath();
    ctx.fill();
}

function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    if (isIncreasable) {
        frameBufferCount++;
        if (frameBufferCount < 300) {
            console.log("BUFFERCOUNT", frameBufferCount)
            moveSpeedStar = {
                ...moveSpeedStar,
                x: 0.05,
                y: 0.05
            }
            console.log("NEW", moveSpeedStar)
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

    makeFood(star.cube.size);
    makeBot();
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

//----------------------------------------start pro--------------------------------------------//

window.onload = function() {
    drawController();
};

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mousemove', (event) => {
    if (!star) return;
    nameText.rotation.z = -star.cube.rotation.z;

    canvasPos = getElementPositions(webgl);

    const deltaSize = {
        width: -currentControllerPos.x + outerRadius,
        height: -currentControllerPos.y + outerRadius
    };
    if (touch) {
        if (controllable && isDragging) {
            const dx = currentControllerPos.x - event.clientX;
            const dy = currentControllerPos.y - event.clientY;
            const calRadius = (dx * dx + dy * dy);

            if (calRadius < outerRadius * outerRadius && touchSize.width) {
                mouse.x = (event.clientX + deltaSize.width) / touchSize.width * 2 - 1;
                console.log("mouse.x", mouse.x)
                mouse.delta = 1 - (event.clientX + deltaSize.width) / touchSize.width * 2;
                mouse.y = -(event.clientY + deltaSize.height) / touchSize.width * 2 + 1;
            }
        }
    } else {
        if (sizes.width && sizes.height) {
            mouse.x = (event.clientX / sizes.width) * 2 - 1;
            mouse.delta = 1 - (event.clientX / sizes.width) * 2;
            mouse.y = -(event.clientY / sizes.height) * 2 + 1;
        }
    }
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

controllerCanvas.addEventListener('dblclick', () => {
    controllerControl = !controllerControl;

    if (controllerControl) {
        window.addEventListener('mousemove', handleMouseDown)

    } else {
        window.removeEventListener('mousemove', handleMouseDown);
    }
})

// Named function for the mousedown event
function handleMouseDown(event) {
    let bufPos = { x: 0, y: 0 };
    bufPos.x = event.clientX;
    bufPos.y = event.clientY;
    let bottom = window.innerHeight - bufPos.y - outerRadius;
    let right = window.innerWidth - bufPos.x - outerRadius;
    controllerCanvas.style.bottom = `${bottom}px`;
    controllerCanvas.style.right = `${right}px`;

    currentControllerPos.x = bufPos.x;
    currentControllerPos.y = bufPos.y;
    return currentControllerPos;
}

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

// webgl.addEventListener('click', () => {
//     if (touch) {

//     } else {
//     }
// });
webgl.addEventListener('mousedown', () => {
    if (frameBufferCount < 600 && frameBufferCount > 250) {
        isIncreasable = false;
    } else isIncreasable = true;
    console.log("ISINCRESEABLE", isIncreasable)
})

webgl.addEventListener('mouseup', () => {
    controllable = false;
    isIncreasable = false;
    console.log("ISINCRESEABLE", isIncreasable)

});

function startGame() {
    running = true;
    animate();
}

settingsButton.addEventListener('click', () => {
    openForm = !openForm;
    if (openForm) {
        settingsForm.classList.remove('hidden');
        settingsForm.classList.add('block');
    } else {
        settingsForm.classList.remove('block');
        settingsForm.classList.add('hidden');
    }
});

// Add event listener for the save button
saveSettingsButton.addEventListener('click', function() {
    // Get the current value of the settings
    // distance = distanceSlider.value; // get the updated distance value
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
        if (desktopMode.checked) {
            touch = false;
        } else if (mobileMode.checked) {
            touch = true;
        }
        gameForm.style.display = "none";
        document.addEventListener("click", startGame, { once: true });
    } catch (err) {
        console.log("Submit Catch Error", err)
    }
});

//create canvas, scene, camera and renderer
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Use ACES tone mapping for more natural results

initPro();
mainEngine();