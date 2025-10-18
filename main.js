import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "./jsm/loaders/KTX2Loader.js";

let renderer, camera, scene, controls, stats, pmremGenerator, envMap;
const Sizes = { Width: window.innerWidth, Height: window.innerHeight };
const targetObjects = [];
const Animation1 = [];
let currentIntersects = [];
let HoveredObject = null;
let GlobeDetails = { object: null, speed: 0.08 };
let ChairDetails = {
  Speed: 0.0015,
  ToRight: true,
  MaxTimes: 500,
  Time: 0,
  Hover: false,
};
let textureKey, links, VideoTexture, audio, videoBox;
let RightCabinDoor, LeftCabinDoor, Blade, Hours, Mins, Secs, ChairTop, pointer;
let SocialAlert = 0;
let MainController = false;
let texturesToLoad=0 ,texturesLoaded = 0;
function initializeScene() {
  const container = document.getElementById("container");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7692e7);
  container.appendChild(renderer.domElement);
}
function initializeCamera() {
  camera = new THREE.PerspectiveCamera(
    45,
    Sizes.Width / Sizes.Height,
    0.1,
    100
  );
  camera.position.set(5.6, 4, 5.6);
}
function initializeRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  }
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(Sizes.Width, Sizes.Height);
}
function initializeControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.3, 0.5, 0.3);
  controls.enableDamping = true;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2;
  controls.minAzimuthAngle = -Math.PI / 35;
  controls.maxAzimuthAngle = Math.PI / 2;
  controls.minDistance = 0;
  controls.maxDistance = 20;
  controls.zoomSpeed = 2;
  controls.update();
}
function initializeEnvironment() {
  pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();
  const envTex = pmremGenerator.fromScene(envScene, 0.04);
  envMap = envTex.texture;
  scene.environment = envMap;
}

function initializeMedia() {
  audio = document.createElement("audio");
  videoBox = Object.assign(document.createElement("video"), {
    src: "assets/Video.mp4",
    loop: true,
    muted: true,
    autoplay: false,
    playsInline: true,
  });

  VideoTexture = new THREE.VideoTexture(videoBox);
}
function initializeLoaders() {
  textureKey = {
    First: "ktx2/FirstBedChairTexture.ktx2",
    Second: "ktx2/SecondWallAssetsTexture.ktx2",
    Third: "ktx2/ThirdTableTexture.ktx2",
    Fourth: "ktx2/FourthRoomTexture.ktx2",
    Earth: "ktx2/WorldMap.ktx2",
  };

  links = {
    GitHub: "https://github.com/mrabhin03",
    Insta: "https://www.instagram.com/mr_abhin._",
    Linkedin: "https://www.linkedin.com/in/abhin-m-632954256/",
  };
}

function initializeEventListeners() {
  ["mousemove", "touchstart"].forEach((evt) =>
    window.addEventListener(evt, handlePointerMove, { passive: false })
  );

  ["click", "touchend"].forEach((evt) =>
    window.addEventListener(evt, handlePointerClick, { passive: false })
  );

  renderer.domElement.addEventListener(
    "webglcontextlost",
    handleContextLost,
    false
  );
}
function handlePointerMove(e) {
  const x = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
  const y = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
  pointer.x = (x / window.innerWidth) * 2 - 1;
  pointer.y = -(y / window.innerHeight) * 2 + 1;
}

function handlePointerClick(e) {
  if (e.target.closest("#container")) {
    e.preventDefault();

    if (currentIntersects.length > 0) {
      const obj = currentIntersects[0].object;
      if (obj.name.includes("AboutImage")) {
        openAboutMe();
        return;
      }
      for (const [key, url] of Object.entries(links)) {
        if (obj.name.includes(key)) {
          const win = window.open();
          win.opener = null;
          win.location = url;
          break;
        }
      }
    }
  }
}

function handleContextLost(event) {
  event.preventDefault();
  clearScene();
  window.location.reload();
}

function handleResize() {
  Sizes.Width = window.innerWidth;
  Sizes.Height = window.innerHeight;
  camera.aspect = Sizes.Width / Sizes.Height;
  camera.updateProjectionMatrix();
  renderer.setSize(Sizes.Width, Sizes.Height);
  windowReSizer();
}

function clearScene() {
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement = null;
  }

  if (scene) {
    scene.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      if (object.material.isMaterial) {
        cleanMaterial(object.material);
      } else {
        for (const material of object.material) cleanMaterial(material);
      }
    });
  }
}

function cleanMaterial(material) {
  material.dispose();
  for (const key in material) {
    const value = material[key];
    if (value && typeof value === "object" && "minFilter" in value) {
      value.dispose();
    }
  }
}

function windowReSizer() {
  if (window.innerWidth > 850) {
    controls.maxDistance = 10;
    const offset = new THREE.Vector3();
    offset.copy(camera.position).sub(controls.target).setLength(9);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  } else if (window.innerWidth > 450) {
    controls.maxDistance = 15;
    const offset = new THREE.Vector3();
    offset.copy(camera.position).sub(controls.target).setLength(15);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  } else {
    controls.maxDistance = 20;
    const offset = new THREE.Vector3();
    offset.copy(camera.position).sub(controls.target).setLength(15);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }
}

function load3D() {
  initializeCamera();
  initializeRenderer();
  initializeScene();
  initializeControls();
  initializeEnvironment();
  initializeMedia();
  initializeLoaders();
  initializeEventListeners();
  pointer = new THREE.Vector2();
  const Sizes = { Width: window.innerWidth, Height: window.innerHeight };

  window.addEventListener("resize", handleResize);
  window.addEventListener("beforeunload", clearScene);

  

  const manager = new THREE.LoadingManager();
  // manager.onStart = (url, itemsLoaded, itemsTotal) => console.log(`Started loading: ${url} (${itemsLoaded}/${itemsTotal})`);
  manager.onLoad = () => {
    console.log("Loading Complete");
    audio.src = "assets/Background_Music.mp3";
    audio.loop = true;
  };

  // manager.onProgress = (url, itemsLoaded, itemsTotal) => console.log(`Loading: ${url} (${itemsLoaded}/${itemsTotal})`);
  // manager.onError = (url) => console.log(`Error loading ${url}`);
  const tex = new THREE.TextureLoader(manager);

  const dracoLoader = new DRACOLoader().setDecoderPath("jsm/libs/draco/gltf/");
  const loader = new GLTFLoader(manager).setDRACOLoader(dracoLoader);

  const raycaster = new THREE.Raycaster();
  const stats = new Stats();

  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("jsm/libs/basis/")
    .detectSupport(renderer);

    loader.load(
      "assets/TheRoom.glb",
      (gltf) => {
        const model = gltf.scene;
        model.position.set(0, -1, 0);
        scene.add(model);
        model.traverse((child) => {
          if (!child.isMesh) return;
          for (const key of Object.keys(textureKey)) {
            if (child.name.includes(key)) {
              texturesToLoad++;
              break;
            }
          }
        });
    
        model.traverse((child) => {
          if (!child.isMesh) return;
    
          for (const [key, path] of Object.entries(textureKey)) {
            if (child.name.includes(key)) {
              ktx2Loader.load(path, (tex) => {
                tex.encoding = THREE.sRGBEncoding;
                tex.minFilter = THREE.LinearMipmapLinearFilter;
                tex.magFilter = THREE.LinearFilter;
    
                child.material = new THREE.MeshBasicMaterial({ map: tex });
    
                if (key === "Earth") {
                  GlobeDetails.object = child;
                  child.material = new THREE.MeshStandardMaterial({
                    map: tex,
                    roughness: 0.7,
                    metalness: 0.4,
                    color: child.material.color.clone().multiplyScalar(0.6),
                  });
                  targetObjects.push(child);
                }
    
                texturesLoaded++;
                if (texturesLoaded === texturesToLoad) {
                  renderer.compile(scene, camera);
                  renderer.setAnimationLoop(animate);
                }
              });
              break;
            }
          }
    
          if (child.name.includes("Monitor")) {
            VideoTexture.flipY = false;
            VideoTexture.colorSpace = THREE.SRGBColorSpace;
            child.material = new THREE.MeshBasicMaterial({ map: VideoTexture });
          } else if (child.name.includes("Animation2")) {
            if (child.name.includes("ChairTop")) {
              ChairTop = child;
              targetObjects.push(child);
            }
            saveOriginalTransform(child);
            child.position.x += 2;
            child.rotation.y += 3;
            Animation1.push(child);
          } else if (/Interact|Hover|Animation1|Earth/.test(child.name)) {
            saveOriginalTransform(child);
            targetObjects.push(child);
            if (
              child.name.includes("Animation1") ||
              child.name.includes("Hover")
            ) {
              Animation1.push(child);
              child.scale.set(0, 0, 0);
            }
          } else if (
            child.name.includes("Hover") ||
            child.name.includes("Animation3")
          ) {
            Animation1.push(child);
            child.scale.set(2, 2, 2);
            if (child.name.includes("Animation3")) {
              child.scale.set(1.2, 1.2, 1.2);
            }
          } else if (child.name.includes("MainCabinBox")) {
            targetObjects.push(child);
          } else if (child.name.includes("DoorRight")) {
            saveOriginalTransform(child);
            RightCabinDoor = child;
            RightCabinDoor.MainRotation = child.rotation.clone();
          } else if (child.name.includes("DoorLeft")) {
            saveOriginalTransform(child);
            LeftCabinDoor = child;
            LeftCabinDoor.MainRotation = child.rotation.clone();
          }
    
          if (child.name.includes("Blade")) Blade = child;
          if (child.name.includes("Clock-Hours")) Hours = child;
          if (child.name.includes("Clock-Min")) Mins = child;
          if (child.name.includes("Clock-Sec")) Secs = child;
        });
    
        if (texturesToLoad === 0) {
          renderer.compile(scene, camera);
          renderer.setAnimationLoop(animate);
        }
      },
      undefined,
      console.error
    );
    

  function saveOriginalTransform(obj) {
    obj.userData.MainScale = obj.scale.clone();
    obj.userData.MainRotation = obj.rotation.clone();
    obj.userData.MainPosition = obj.position.clone();
  }

  let Hoverings = false;

  function playHoverAnimation(obj, isPlaying) {
    if (obj.name.includes("MainCabinBox")) {
      gsap.to(LeftCabinDoor.rotation, {
        y: isPlaying
          ? LeftCabinDoor.MainRotation.y - 2
          : LeftCabinDoor.MainRotation.y,
        duration: 1,
        ease: "power1.inOut",
      });
      gsap.to(RightCabinDoor.rotation, {
        y: isPlaying
          ? RightCabinDoor.MainRotation.y + 2
          : RightCabinDoor.MainRotation.y,
        duration: 1,
        ease: "power1.inOut",
      });
      return;
    }
    if (obj.name.includes("ChairTop")) {
      ChairDetails.Hover = isPlaying;
      gsap.to(obj.scale, {
        x: isPlaying
          ? obj.userData.MainScale.x * 1.2
          : obj.userData.MainScale.x,
        y: isPlaying
          ? obj.userData.MainScale.y * 1.2
          : obj.userData.MainScale.y,
        z: isPlaying
          ? obj.userData.MainScale.z * 1.2
          : obj.userData.MainScale.z,
        duration: 0.5,
        ease: "bounce.out",
      });
      return;
    }
    if (obj.name.includes("Earth")) {
      GlobeDetails.speed = isPlaying ? 0.6 : 0.1;
      return;
    }
    if (obj.name.includes("Hover")) {
      Hoverings = isPlaying;
    }
    gsap.killTweensOf(obj.scale);
    gsap.to(obj.scale, {
      x: isPlaying ? obj.userData.MainScale.x * 1.2 : obj.userData.MainScale.x,
      y: isPlaying ? obj.userData.MainScale.y * 1.2 : obj.userData.MainScale.y,
      z: isPlaying ? obj.userData.MainScale.z * 1.2 : obj.userData.MainScale.z,
      duration: 0.5,
      ease: "bounce.out",
    });
  }

  function mapValue(v) {
    return (v - 1) * (6.33 / 59);
  }
  function clockTime() {
    const now = new Date();
    const hrs = (now.getHours() % 12 || 12) * 5 + now.getMinutes() / 10;
    Hours.rotation.x = -mapValue(hrs);
    Mins.rotation.x = -mapValue(now.getMinutes() + 1);
    Secs.rotation.x = -mapValue(now.getSeconds() + 1);
  }

  function SocialPosterAlert() {
    SocialAlert++;
    if (!Hoverings) {
      if (SocialAlert >= 1000) {
        let delay = 0.1;
        Animation1.forEach((child) => {
          if (child.name.includes("Hover")) {
            gsap.to(child.scale, {
              x: 1.4,
              y: 1.4,
              z: 1.4,
              duration: 0.5,
              delay: (delay += 0.3),
              yoyo: true,
              repeat: 1,
              ease: "power1.inOut",
            });
          }
        });
        SocialAlert = 50;
      }
    } else {
      SocialAlert = 50;
    }
  }
  let loadStart = false;
  function animate() {
    SocialPosterAlert();
    
    if (!loadStart) {
      if (SocialAlert > 30) {
        Start3DPage();
        loadStart = true;
      }
    } else {
      
      if (MainController) {
        raycaster.setFromCamera(pointer, camera);
        currentIntersects = raycaster.intersectObjects(targetObjects);
        if (currentIntersects.length > 0) {
          const selected = currentIntersects[0].object;
          if (
            ["Hover", "ChairTop", "Animation1", "Earth", "MainCabinBox"].some(
              (k) => selected.name.includes(k)
            )
          ) {
            if (HoveredObject !== selected) {
              if (HoveredObject) playHoverAnimation(HoveredObject, false);
              playHoverAnimation(selected, true);
              HoveredObject = selected;
            }
          }
          document.body.style.cursor = selected.name.includes("Interact")
            ? "pointer"
            : "default";
        } else {
          if (HoveredObject) playHoverAnimation(HoveredObject, false);
          HoveredObject = null;
          document.body.style.cursor = "default";
        }
      }
      clockTime();
      controls.update();
      if (GlobeDetails.object)
        GlobeDetails.object.rotateOnAxis(
          new THREE.Vector3(0, 1, 0),
          GlobeDetails.speed
        );
      if (!ChairDetails.Hover && ChairTop) {
        ChairTop.rotation.y += ChairDetails.ToRight
          ? -ChairDetails.Speed
          : ChairDetails.Speed;
        ChairDetails.Time += ChairDetails.ToRight ? 1 : -1;
        if (
          ChairDetails.Time === 0 ||
          ChairDetails.Time === ChairDetails.MaxTimes
        )
          ChairDetails.ToRight = !ChairDetails.ToRight;
      }
      if (Blade) Blade.rotation.x -= 0.08;
    }
    stats.update();
    renderer.render(scene, camera);
  }
}

function Start3DPage() {
  windowReSizer();
  document.getElementById(
    "LoadInnerText"
  ).innerHTML = `<div><button class="btn" onclick="active()"><i class="animation"></i>Enter<i class="animation"></i></button></div>`;
}
window.load3D = load3D;

function Unmute(object) {
  if (audio.paused) {
    videoBox.play();
    object.children[0].name = "volume-high-outline";
    audio.play().catch((error) => {
      console.error("Playback failed:", error);
    });
  } else {
    videoBox.pause();
    object.children[0].name = "volume-mute-outline";
    audio.pause();
  }
}
function ActivateOfflines() {
  videoBox.play();
  audio.play().catch((error) => {
    console.error("Playback failed:", error);
  });
  openAnimation();
}

function openAnimation() {
  let delay1 = 0.3;
  let delay2 = 0.2;
  Animation1.forEach((child) => {
    if (child.name.includes("Animation1")) {
      gsap.to(child.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 2,
        ease: "bounce.out",
        delay: (delay1 += 0.1),
      });
    } else if (child.name.includes("Animation2")) {
      gsap.to(child.position, {
        x: child.userData.MainPosition.x,
        duration: 2,
        ease: "power3.out",
        delay: 0.4,
      });
      gsap.to(child.rotation, {
        y: child.userData.MainRotation.y,
        duration: 2,
        ease: "power3.out",
        delay: 0.4,
      });
    } else if (
      child.name.includes("Hover") ||
      child.name.includes("Animation3")
    ) {
      gsap.to(child.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 2,
        ease: "bounce.out",
        delay: (delay2 += 0.2),
      });
    }
  });
  setTimeout(() => {
    removeHovers();
    MainController = true;
  }, 3000);
}

function openAboutMe() {
  const UserBox = document.getElementById("UserMain");
  if (UserBox.classList.contains("open")) {
    UserBox.classList.remove("open");
    removeHovers();
  } else {
    UserBox.classList.add("open");
  }
}

function removeHovers() {
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      if (!rules) continue;

      for (let i = rules.length - 1; i >= 0; i--) {
        const rule = rules[i];
        if (rule.selectorText && rule.selectorText.includes(":hover")) {
          sheet.deleteRule(i);
        }
      }
    } catch (e) {
      // Some stylesheets (e.g., cross-origin) will throw errors — safely ignore them
    }
  }
}
function MyProfiles() {
  const targetPosition = new THREE.Vector3(
    1.308619800518191,
    2.4226005234356385,
    -0.6493794525893896
  );
  const targetControl = new THREE.Vector3(
    0.12197057767125419,
    1.8907698972714018,
    -0.6493794525893897
  );

  // Animate camera position
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: 2,
    ease: "power2.inOut",
  });

  gsap.to(controls.target, {
    x: targetControl.x,
    y: targetControl.y,
    z: targetControl.z,
    duration: 2,
    ease: "power2.inOut",
    onUpdate: () => {
      controls.update();
    },
  });

  SocialAlert = 950;
}

window.Unmute = Unmute;
window.ActivateOfflines = ActivateOfflines;
window.openAboutMe = openAboutMe;
window.MyProfiles = MyProfiles;
