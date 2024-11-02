import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

let camera, scene, renderer, controls;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  const headGeometry = new THREE.SphereGeometry(1, 32, 32);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 1, 0);
  scene.add(head);

  const earGeometry = new THREE.ConeGeometry(0.3, 0.7, 3);
  const earMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
  const leftEar = new THREE.Mesh(earGeometry, earMaterial);
  leftEar.position.set(-0.6, 2, 0);
  leftEar.rotation.set(0, 0, -Math.PI / -6);
  scene.add(leftEar);

  const rightEar = new THREE.Mesh(earGeometry, earMaterial);
  rightEar.position.set(0.6, 2, 0);
  rightEar.rotation.set(0, 0, Math.PI / -6);
  scene.add(rightEar);

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x000000,
  });

  const headWireframe = new THREE.Mesh(headGeometry, wireframeMaterial);
  headWireframe.position.set(0, 1, 0);
  scene.add(headWireframe);

  const leftEarWireframe = new THREE.Mesh(earGeometry, wireframeMaterial);
  leftEarWireframe.position.set(-0.6, 1.8, 0);
  leftEarWireframe.rotation.set(0, 0, -Math.PI / 6);
  scene.add(leftEarWireframe);

  const rightEarWireframe = new THREE.Mesh(earGeometry, wireframeMaterial);
  rightEarWireframe.position.set(0.6, 1.8, 0);
  rightEarWireframe.rotation.set(0, 0, Math.PI / 6);
  scene.add(rightEarWireframe);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
  scene.add(ambientLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.update();

  window.addEventListener("resize", resize, false);

  animate();

  loadmodels();
}

function loadmodels() {
  new RGBELoader()
    .setPath("hdri/")
    .load("qwantani_dusk_2_1k.hdr", function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;

      const loader = new GLTFLoader().setPath("");

      loader.load("kenkä/kenkä.gltf", async function (gltf) {
        const model = gltf.scene;

        await renderer.compileAsync(model, camera, scene);

        scene.add(model);

        model.position.set(2, 0, 2);
      });

      loader.load("barrel/barrel.gltf", async function (gltf) {
        const model = gltf.scene;

        await renderer.compileAsync(model, camera, scene);

        scene.add(model);

        model.position.set(1, 0, 1);
      });

      loader.load("capy/scene.gltf", async function (gltf) {
        const model = gltf.scene;

        await renderer.compileAsync(model, camera, scene);

        scene.add(model);

        model.position.set(3, 0, 0);
      });

      loader.load("torus/testi.gltf", async function (gltf) {
        const model = gltf.scene;

        await renderer.compileAsync(model, camera, scene);

        scene.add(model);

        model.position.set(0, 0, 3);
      });
    });
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init();
