import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights for glow effect
const light = new THREE.PointLight(0x00aaff, 1, 100);
light.position.set(0, 0, 5);
scene.add(light);

// Outer Circle
const outerGeometry = new THREE.CircleGeometry(2, 32);
const outerMaterial = new THREE.MeshBasicMaterial({
  color: 0x00aaff,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.5,
  antialias: true
});
const outerCircle = new THREE.Mesh(outerGeometry, outerMaterial);
scene.add(outerCircle);

// Inner Circle
const innerGeometry = new THREE.CircleGeometry(0.9, 32);
const innerMaterial = new THREE.MeshBasicMaterial({
  color: 0x33aaff,
  transparent: true,
  opacity: 0.6,
  antialias: true,
});
const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
scene.add(innerCircle);

// Create Arrows
const arrowGeometry = new THREE.ConeGeometry(0.4, 0.4, 3);
const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, antialias: true });

const arrows = [];
const arrowPositions = [
  { x: 0, y: 1.6, z: 0, rotationZ: 0 }, // Top
  { x: 1.6, y: 0, z: 0, rotationZ: Math.PI / 2 }, // Right
  { x: 0, y: -1.6, z: 0, rotationZ: Math.PI }, // Bottom
  { x: -1.6, y: 0, z: 0, rotationZ: -Math.PI / 2 }, // Left
];

arrowPositions.forEach(pos => {
  const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
  arrow.position.set(pos.x, pos.y, pos.z);
  arrow.rotation.z = pos.rotationZ;
  scene.add(arrow);
  arrows.push(arrow);
});

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Resize Handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
