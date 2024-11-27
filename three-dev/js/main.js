import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import {
  color,
  fog,
  float,
  positionWorld,
  triNoise3D,
  positionView,
  normalWorld,
  uniform,
} from "three/tsl";

let camera, scene, renderer, controls;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let group = new THREE.Group();
group.name = "Interaction-Group";
let marker, baseReferenceSpace;
let INTERSECTION;
let teleportgroup = new THREE.Group();
teleportgroup.name = "Teleport-Group";

//container = document.querySelector(".vr");

function init() {
  scene = new THREE.Scene();
  scene.add(group);
  scene.add(teleportgroup);
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

  // custom fog
  const skyColor = color(0xf0f5f5);
  const groundColor = color(0xd0dee7);

  const fogNoiseDistance = positionView.z
    .negate()
    .smoothstep(0, camera.far - 300);

  const distance = fogNoiseDistance.mul(20).max(4);
  const alpha = 0.98;
  const groundFogArea = float(distance)
    .sub(positionWorld.y)
    .div(distance)
    .pow(3)
    .saturate()
    .mul(alpha);

  // a alternative way to create a TimerNode
  const timer = uniform(0).onFrameUpdate((frame) => frame.time);

  const fogNoiseA = triNoise3D(positionWorld.mul(0.005), 0.2, timer);
  const fogNoiseB = triNoise3D(positionWorld.mul(0.01), 0.2, timer.mul(1.2));

  const fogNoise = fogNoiseA.add(fogNoiseB).mul(groundColor);

  // apply custom fog
  scene.fogNode = fog(
    fogNoiseDistance.oneMinus().mix(groundColor, fogNoise),
    groundFogArea
  );
  scene.backgroundNode = normalWorld.y.max(0).mix(groundColor, skyColor);

  /* const headGeometry = new THREE.SphereGeometry(1, 32, 32);
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
  scene.add(rightEarWireframe); */

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

  marker = new THREE.Mesh(
    new THREE.CircleGeometry(0.25, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x808080 })
  );
  scene.add(marker);

  loadmodels();

  initVR();

  console.log(scene);
}

function initVR() {
  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));
  renderer.xr.addEventListener(
    "sessionstart",
    () => (baseReferenceSpace = renderer.xr.getReferenceSpace())
  );

  // controllers

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);
  controller1.addEventListener("squeezestart", onSqueezeStart);
  controller1.addEventListener("squeezeend", onSqueezeEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectend", onSelectEnd);
  controller2.addEventListener("squeezestart", onSqueezeStart);
  controller2.addEventListener("squeezeend", onSqueezeEnd);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  /*controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );*/
  const loader = new GLTFLoader().setPath("");

  loader.load("pyssy/scene.gltf", async function (gltf) {
    const model = gltf.scene;

    await renderer.compileAsync(model, camera, scene);

    model.scale.set(0.0003, 0.0003, 0.0003);
    model.rotation.y = THREE.MathUtils.degToRad(180);
    model.rotation.x = THREE.MathUtils.degToRad(-36.5);
    controllerGrip2.add(model);
  });

  scene.add(controllerGrip2);

  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);

  const line = new THREE.Line(geometry);
  line.name = "line";
  line.scale.z = 5;

  controller1.add(line.clone());
  controller2.add(line.clone());

  raycaster = new THREE.Raycaster();
}

function onSqueezeStart() {
  this.userData.isSqueezing = true;
  console.log("Controller squeeze started");
}

function onSqueezeEnd() {
  this.userData.isSqueezing = false;
  console.log("squeezeend");
  if (INTERSECTION) {
    const offsetPosition = {
      x: -INTERSECTION.x,
      y: -INTERSECTION.y,
      z: -INTERSECTION.z,
      w: 1,
    };
    const offsetRotation = new THREE.Quaternion();
    const transform = new XRRigidTransform(offsetPosition, offsetRotation);
    const teleportSpaceOffset =
      baseReferenceSpace.getOffsetReferenceSpace(transform);
    renderer.xr.setReferenceSpace(teleportSpaceOffset);
  }
}

function onSelectStart(event) {
  const controller = event.target;

  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];

    const object = intersection.object;

    controller.attach(object);

    controller.userData.selected = object;
  }

  controller.userData.targetRayMode = event.data.targetRayMode;
}

function onSelectEnd(event) {
  const controller = event.target;

  if (controller.userData.selected !== undefined) {
    const object = controller.userData.selected;
    group.attach(object);

    controller.userData.selected = undefined;
  }
}

function getIntersections(controller) {
  controller.updateMatrixWorld();

  raycaster.setFromXRController(controller);

  return raycaster.intersectObjects(group.children, true);
}

function intersectObjects(controller) {
  // Do not highlight in mobile-ar

  if (controller.userData.targetRayMode === "screen") return;

  // Do not highlight when already selected

  if (controller.userData.selected !== undefined) return;

  const line = controller.getObjectByName("line");
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];

    const object = intersection.object;
    object.traverse(function (node) {
      if (node.material) {
        node.material.transparent = true;
        node.material.opacity = 0.5;
      }
    });
    intersected.push(object);

    line.scale.z = intersection.distance;
  } else {
    line.scale.z = 5;
  }
}

function cleanIntersected() {
  while (intersected.length) {
    const object = intersected.pop();

    object.traverse(function (node) {
      if (node.material) {
        node.material.transparent = false;
        node.material.opacity = 1;
      }
    });
  }
}

init();

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

        group.add(model);

        model.position.set(2, 1.5, 2);
      });

      loader.load("lokki/lokkiväritetty.glb", async function (gltf) {
        const model = gltf.scene;

        await renderer.compileAsync(model, camera, scene);

        group.add(model);

        model.position.set(6, 0, 9);
      });

      loader.load("maailma/maailma.glb", async function (gltf) {
        const model = gltf.scene;

        await renderer.compileAsync(model, camera, scene);

        teleportgroup.add(model);

        model.position.set(0, 0, 0);
      });

      loader.load("barrel/barrel.gltf", async function (gltf) {
        const barrel = gltf.scene;

        await renderer.compileAsync(barrel, camera, scene);

        group.add(barrel);

        barrel.position.set(1, 3.5, -4);
      });

      loader.load("capy/scene.gltf", async function (gltf) {
        const model = gltf.scene;

        await renderer.compileAsync(model, camera, scene);

        group.add(model);

        model.position.set(3, 0, 7);
      });

      loader.load("torus/testi.gltf", async function (gltf) {
        const model = gltf.scene;

        await renderer.compileAsync(model, camera, scene);

        group.add(model);

        model.position.set(0, 1, 4);
      });
    });
}

function moveMarker() {
  INTERSECTION = undefined;
  if (controller1.userData.isSqueezing === true) {
    tempMatrix.identity().extractRotation(controller1.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    //const intersects = raycaster.intersectObjects([floor]);
    const intersects = raycaster.intersectObjects(teleportgroup.children, true);
    if (intersects.length > 0) {
      INTERSECTION = intersects[0].point;
      console.log(intersects[0]);
      console.log(INTERSECTION);
    }
  } else if (controller2.userData.isSqueezing === true) {
    tempMatrix.identity().extractRotation(controller2.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller2.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    // const intersects = raycaster.intersectObjects([floor]);
    const intersects = raycaster.intersectObjects(teleportgroup.children, true);
    if (intersects.length > 0) {
      INTERSECTION = intersects[0].point;
    }
  }
  if (INTERSECTION) marker.position.copy(INTERSECTION);
  marker.visible = INTERSECTION !== undefined;
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

renderer.setAnimationLoop(function () {
  cleanIntersected();
  intersectObjects(controller1);
  intersectObjects(controller2);
  moveMarker();
  controls.update();
  renderer.render(scene, camera);
});
