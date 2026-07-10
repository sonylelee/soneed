import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// =====================
// 기본 세팅
// =====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, -0.9, 7.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.innerHTML = '';
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.appendChild(renderer.domElement);

// =====================
// 드래그 컨트롤
// =====================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 12;
controls.target.set(0, -0.1, 0.5);

let autoCameraMove = true;
let isUserDragging = false;

controls.addEventListener('start', () => {
  isUserDragging = true;
  autoCameraMove = false;
});

controls.addEventListener('end', () => {
  isUserDragging = false;
});

// =====================
// 조명
// =====================
const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
light1.position.set(5, 6, 6);
scene.add(light1);

const light2 = new THREE.DirectionalLight(0xffffff, 0.7);
light2.position.set(-4, 3, 4);
scene.add(light2);

const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

// =====================
// 재질
// =====================
const boneMat = new THREE.MeshStandardMaterial({
  color: 0xe7e1d4,
  roughness: 0.95,
  metalness: 0.02
});

const boneMat2 = new THREE.MeshStandardMaterial({
  color: 0xd8cebf,
  roughness: 0.98,
  metalness: 0.01
});

const darkMat = new THREE.MeshStandardMaterial({
  color: 0x111111,
  roughness: 1
});

const pointMatRightSubject = new THREE.MeshStandardMaterial({ color: 0x66ccff });
const pointMatLeftSubject = new THREE.MeshStandardMaterial({ color: 0xff9966 });
const mastoidMat = new THREE.MeshStandardMaterial({ color: 0xff66cc });
const eyePointMat = new THREE.MeshStandardMaterial({ color: 0xffff66 });
const browPointMat = new THREE.MeshStandardMaterial({ color: 0x99ff99 });
const parietalBackMat = new THREE.MeshStandardMaterial({ color: 0x99ccff });

const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
const centerLineMat = new THREE.LineBasicMaterial({ color: 0xff3333 });
const eyeLineMat = new THREE.LineBasicMaterial({ color: 0xffff66 });
const browLineMat = new THREE.LineBasicMaterial({ color: 0x99ff99 });
const mastoidLineMat = new THREE.LineBasicMaterial({ color: 0xff66cc });
const parietalDepthLineMat = new THREE.LineBasicMaterial({ color: 0x99ccff });

// =====================
// 전체 루트
// =====================
const skullRoot = new THREE.Group();
scene.add(skullRoot);

const analysisGroup = new THREE.Group();
skullRoot.add(analysisGroup);

// 해골 이미지를 세로로 늘였다 줄였다 하기 위한 래퍼
// (analysisGroup 안에 있으므로 점/선과 같은 좌표계에서 세로 스케일이 적용됨)
const skullScaleWrapper = new THREE.Group();
analysisGroup.add(skullScaleWrapper);

// =====================
// 중심선
// =====================
const centerLinePoints = [
  new THREE.Vector3(0, 1.8, 0.6),
  new THREE.Vector3(0, -1.8, 0.6),
];
const centerLineGeo = new THREE.BufferGeometry().setFromPoints(centerLinePoints);
const centerLine = new THREE.Line(centerLineGeo, centerLineMat);
analysisGroup.add(centerLine);

// =====================
// 유틸
// =====================
function makePoint(material, size = 0.07) {
  const geo = new THREE.SphereGeometry(size, 16, 16);
  return new THREE.Mesh(geo, material);
}

function makeDynamicLine(material) {
  const geo = new THREE.BufferGeometry();
  const line = new THREE.Line(geo, material);
  analysisGroup.add(line);
  return line;
}

function setLinePoints(line, points) {
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(points);
}

// =====================
// 피사체 기준
// 피사체 우측 = 화면 왼쪽
// 피사체 좌측 = 화면 오른쪽
// =====================
const subjectRightPoints = {};
const subjectLeftPoints = {};
const centerPoints = {};

const baseLevels = {
  jaw: -1.25,
  cheek: -0.25,
  brow: 0.65,
  crown: 1.45
};

const baseX = {
  jaw: 0.75,
  cheek: 0.92,
  brow: 0.62,
  crown: 0.48
};

// 중심점
for (const [key, y] of Object.entries(baseLevels)) {
  const p = makePoint(boneMat2, 0.05);
  p.position.set(0, y, 0.6);
  analysisGroup.add(p);
  centerPoints[key] = p;
}

// 우측점
for (const [key, y] of Object.entries(baseLevels)) {
  const p = makePoint(pointMatRightSubject, 0.065);
  p.position.set(-baseX[key], y, 0.6);
  analysisGroup.add(p);
  subjectRightPoints[key] = p;
}

// 좌측점
for (const [key, y] of Object.entries(baseLevels)) {
  const p = makePoint(pointMatLeftSubject, 0.065);
  p.position.set(baseX[key], y, 0.6);
  analysisGroup.add(p);
  subjectLeftPoints[key] = p;
}

// =====================
// 유양돌기 포인트
// =====================
const rightMastoidPoint = makePoint(mastoidMat, 0.075);
const leftMastoidPoint = makePoint(mastoidMat, 0.075);
analysisGroup.add(rightMastoidPoint);
analysisGroup.add(leftMastoidPoint);

rightMastoidPoint.position.set(-1.02, -0.82, -0.10);
leftMastoidPoint.position.set(1.02, -0.82, -0.10);

// =====================
// 두정골 후방 기준점
// =====================
const rightParietalBackPoint = makePoint(parietalBackMat, 0.06);
const leftParietalBackPoint = makePoint(parietalBackMat, 0.06);
analysisGroup.add(rightParietalBackPoint);
analysisGroup.add(leftParietalBackPoint);

// =====================
// 라인
// =====================
const rightVerticalLine = makeDynamicLine(lineMat);
const leftVerticalLine = makeDynamicLine(lineMat);

const jawLine = makeDynamicLine(lineMat);
const cheekLine = makeDynamicLine(lineMat);
const browLine = makeDynamicLine(lineMat);
const crownLine = makeDynamicLine(lineMat);

const centerVerticalLine = makeDynamicLine(new THREE.LineBasicMaterial({ color: 0x999999 }));

const rightCrownToMastoidLine = makeDynamicLine(mastoidLineMat);
const leftCrownToMastoidLine = makeDynamicLine(mastoidLineMat);

const rightCrownDepthLine = makeDynamicLine(parietalDepthLineMat);
const leftCrownDepthLine = makeDynamicLine(parietalDepthLineMat);

// =====================
// 눈 / 눈썹 포인트
// =====================
const rightEyePoint = makePoint(eyePointMat, 0.055);
const leftEyePoint = makePoint(eyePointMat, 0.055);
const rightBrowPoint = makePoint(browPointMat, 0.05);
const leftBrowPoint = makePoint(browPointMat, 0.05);

analysisGroup.add(rightEyePoint);
analysisGroup.add(leftEyePoint);
analysisGroup.add(rightBrowPoint);
analysisGroup.add(leftBrowPoint);

const eyeLine = makeDynamicLine(eyeLineMat);
const browGuideLine = makeDynamicLine(browLineMat);

// =====================
// 해골 보조메쉬
// =====================
const skullMeshGroup = new THREE.Group();
analysisGroup.add(skullMeshGroup);
skullMeshGroup.visible = false;

// === 진짜 두개골 GLB 로드 (배경용) ===
const gltfLoader = new GLTFLoader();
let skullModelLoaded = null;

gltfLoader.load(
  './skull.glb',
  (gltf) => {
    skullModelLoaded = gltf.scene;

    // 모든 메시에 반투명 처리 (분석선과 점이 잘 보이게)
    skullModelLoaded.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = new THREE.MeshStandardMaterial({
          color: 0xe7e1d4,
          roughness: 0.95,
          metalness: 0.02,
          transparent: true,
          opacity: 0.55,
          depthWrite: false
        });
      }
    });

    skullModelLoaded.rotation.x = -75 * Math.PI / 180;
    skullModelLoaded.rotation.y = 0;
    skullModelLoaded.rotation.z = 0;
    skullModelLoaded.position.y = 0.2;
    skullModelLoaded.scale.setScalar(1.4);

    // 래퍼에 추가 → 기울기/회전 슬라이더는 물론, 길이 슬라이더에도 같이 따라감
    skullScaleWrapper.add(skullModelLoaded);

    console.log('skull.glb 로드 완료');
  },
  (xhr) => {
    if (xhr.lengthComputable) {
      const percent = Math.round((xhr.loaded / xhr.total) * 100);
      console.log(`두개골 로딩 ${percent}%`);
    }
  },
  (error) => {
    console.error('skull.glb 로드 실패:', error);
  }
);

// 눈구멍
const orbitGeo = new THREE.SphereGeometry(0.22, 24, 24);
orbitGeo.scale(1.0, 1.2, 0.7);

const rightOrbit = new THREE.Mesh(orbitGeo, darkMat);
const leftOrbit = new THREE.Mesh(orbitGeo, darkMat);
skullMeshGroup.add(rightOrbit);
skullMeshGroup.add(leftOrbit);

// 코
const noseGroup = new THREE.Group();
skullMeshGroup.add(noseGroup);

const noseBridgeGeo = new THREE.BoxGeometry(0.12, 0.32, 0.1);
const noseBridge = new THREE.Mesh(noseBridgeGeo, boneMat2);
noseGroup.add(noseBridge);

const noseTipGeo = new THREE.ConeGeometry(0.14, 0.38, 3);
const noseTip = new THREE.Mesh(noseTipGeo, boneMat2);
noseTip.rotation.z = Math.PI;
noseTip.position.set(0, -0.08, 0.02);
noseGroup.add(noseTip);

const nasalGeo = new THREE.ConeGeometry(0.07, 0.16, 3);
const nasal = new THREE.Mesh(nasalGeo, darkMat);
nasal.rotation.z = Math.PI;
nasal.position.set(0, -0.13, 0.08);
noseGroup.add(nasal);

// 광대
const cheekMassGeo = new THREE.SphereGeometry(0.18, 24, 24);
cheekMassGeo.scale(1.5, 0.55, 0.9);

const rightCheekMass = new THREE.Mesh(cheekMassGeo, boneMat2);
const leftCheekMass = new THREE.Mesh(cheekMassGeo, boneMat2);
skullMeshGroup.add(rightCheekMass);
skullMeshGroup.add(leftCheekMass);

// 턱
const jawMassGeo = new THREE.SphereGeometry(0.42, 32, 32);
jawMassGeo.scale(1.15, 0.55, 0.82);
const jawMass = new THREE.Mesh(jawMassGeo, boneMat2);
skullMeshGroup.add(jawMass);

const chinGeo = new THREE.SphereGeometry(0.16, 24, 24);
chinGeo.scale(0.95, 0.8, 0.75);
const chin = new THREE.Mesh(chinGeo, boneMat2);
skullMeshGroup.add(chin);

// 이마 띠
const browRidgeGeo = new THREE.SphereGeometry(0.18, 24, 24);
browRidgeGeo.scale(2.3, 0.45, 0.7);
const browRidge = new THREE.Mesh(browRidgeGeo, boneMat2);
skullMeshGroup.add(browRidge);

// 우/좌 두정골 후방 덩어리
const parietalLobeGeo = new THREE.SphereGeometry(0.24, 28, 28);
parietalLobeGeo.scale(0.85, 0.65, 1.25);

const rightParietalLobe = new THREE.Mesh(parietalLobeGeo, boneMat);
const leftParietalLobe = new THREE.Mesh(parietalLobeGeo, boneMat);
skullMeshGroup.add(rightParietalLobe);
skullMeshGroup.add(leftParietalLobe);

// =====================
// UI
// =====================
const ui = document.createElement('div');
ui.style.position = 'fixed';
ui.style.top = '20px';
ui.style.left = '20px';
ui.style.padding = '16px';
ui.style.background = 'rgba(255,255,255,0.93)';
ui.style.borderRadius = '12px';
ui.style.width = '360px';
ui.style.maxHeight = 'calc(100vh - 40px)';
ui.style.overflowY = 'auto';
ui.style.fontFamily = 'sans-serif';
ui.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
document.body.appendChild(ui);

ui.innerHTML = `
  <div style="font-weight:bold; font-size:18px; margin-bottom:12px;">소니드 3D 얼굴분석</div>

  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px;">
    <button id="frontView">정면</button>
    <button id="sideView">측면</button>
    <button id="topView">상면</button>
    <button id="backView">후면</button>
    <button id="resetView">리셋</button>
  </div>

  <label>투구 기울기 차이</label>
  <input id="earTilt" type="range" min="-20" max="20" value="0" style="width:100%;" />
  <div id="earTiltValue">0°</div>

  <br/>

  <label>투구 회전</label>
  <input id="faceRotation" type="range" min="-25" max="25" value="0" style="width:100%;" />
  <div id="faceRotationValue">0°</div>

  <hr/>

  <div style="font-weight:bold; margin:8px 0;">1층 턱라인 길이</div>
  <label>우측</label>
  <input id="jawRightY" type="range" min="-1.8" max="-0.7" step="0.01" value="-1.25" style="width:100%;" />
  <div id="jawRightYValue">-1.25</div>

  <label>좌측</label>
  <input id="jawLeftY" type="range" min="-1.8" max="-0.7" step="0.01" value="-1.25" style="width:100%;" />
  <div id="jawLeftYValue">-1.25</div>

  <hr/>

  <div style="font-weight:bold; margin:8px 0;">2층 광대라인 길이</div>
  <label>우측</label>
  <input id="cheekRightY" type="range" min="-0.8" max="0.3" step="0.01" value="-0.25" style="width:100%;" />
  <div id="cheekRightYValue">-0.25</div>

  <label>좌측</label>
  <input id="cheekLeftY" type="range" min="-0.8" max="0.3" step="0.01" value="-0.25" style="width:100%;" />
  <div id="cheekLeftYValue">-0.25</div>

  <hr/>

  <div style="font-weight:bold; margin:8px 0;">3층 이마라인 길이</div>
  <label>우측</label>
  <input id="browRightY" type="range" min="0.1" max="1.1" step="0.01" value="0.65" style="width:100%;" />
  <div id="browRightYValue">0.65</div>

  <label>좌측</label>
  <input id="browLeftY" type="range" min="0.1" max="1.1" step="0.01" value="0.65" style="width:100%;" />
  <div id="browLeftYValue">0.65</div>

  <hr/>

  <div style="font-weight:bold; margin:8px 0;">4층 마루뼈 후방 길이</div>
  <label>우측</label>
  <input id="parietalRightDepth" type="range" min="0.7" max="1.5" step="0.01" value="1" style="width:100%;" />
  <div id="parietalRightDepthValue">1.00</div>

  <label>좌측</label>
  <input id="parietalLeftDepth" type="range" min="0.7" max="1.5" step="0.01" value="1" style="width:100%;" />
  <div id="parietalLeftDepthValue">1.00</div>

  <hr/>

  <div style="font-weight:bold; margin:8px 0;">유양돌기 위치(후면 기준)</div>
  <label>우측 높이</label>
  <input id="mastoidRightY" type="range" min="-1.2" max="-0.4" step="0.01" value="-0.82" style="width:100%;" />
  <div id="mastoidRightYValue">-0.82</div>

  <label>좌측 높이</label>
  <input id="mastoidLeftY" type="range" min="-1.2" max="-0.4" step="0.01" value="-0.82" style="width:100%;" />
  <div id="mastoidLeftYValue">-0.82</div>

  <br/>

  <label>코 휨</label>
  <input id="noseCurve" type="range" min="-25" max="25" value="0" style="width:100%;" />
  <div id="noseCurveValue">0°</div>

  <br/>

  <div id="resultBox" style="
    margin-top:12px;
    padding:12px;
    background:#f5f5f5;
    border-radius:8px;
    font-size:13px;
    line-height:1.6;
  ">
    ✔ 분석 결과가 여기에 표시됩니다
  </div>
`;

for (const button of ui.querySelectorAll('button')) {
  button.style.padding = '6px 10px';
  button.style.border = '1px solid #ccc';
  button.style.borderRadius = '8px';
  button.style.background = '#fff';
  button.style.cursor = 'pointer';
}

// =====================
// 입력 연결
// =====================
const earTiltInput = document.getElementById('earTilt');
const faceRotationInput = document.getElementById('faceRotation');

const jawRightYInput = document.getElementById('jawRightY');
const jawLeftYInput = document.getElementById('jawLeftY');

const cheekRightYInput = document.getElementById('cheekRightY');
const cheekLeftYInput = document.getElementById('cheekLeftY');

const browRightYInput = document.getElementById('browRightY');
const browLeftYInput = document.getElementById('browLeftY');

const parietalRightDepthInput = document.getElementById('parietalRightDepth');
const parietalLeftDepthInput = document.getElementById('parietalLeftDepth');

const mastoidRightYInput = document.getElementById('mastoidRightY');
const mastoidLeftYInput = document.getElementById('mastoidLeftY');

const noseCurveInput = document.getElementById('noseCurve');

const earTiltValue = document.getElementById('earTiltValue');
const faceRotationValue = document.getElementById('faceRotationValue');

const jawRightYValue = document.getElementById('jawRightYValue');
const jawLeftYValue = document.getElementById('jawLeftYValue');

const cheekRightYValue = document.getElementById('cheekRightYValue');
const cheekLeftYValue = document.getElementById('cheekLeftYValue');

const browRightYValue = document.getElementById('browRightYValue');
const browLeftYValue = document.getElementById('browLeftYValue');

const parietalRightDepthValue = document.getElementById('parietalRightDepthValue');
const parietalLeftDepthValue = document.getElementById('parietalLeftDepthValue');

const mastoidRightYValue = document.getElementById('mastoidRightYValue');
const mastoidLeftYValue = document.getElementById('mastoidLeftYValue');

const noseCurveValue = document.getElementById('noseCurveValue');

const frontViewBtn = document.getElementById('frontView');
const sideViewBtn = document.getElementById('sideView');
const topViewBtn = document.getElementById('topView');
const backViewBtn = document.getElementById('backView');
const resetViewBtn = document.getElementById('resetView');
const resultBox = document.getElementById('resultBox');

// =====================
// 카메라 목표
// =====================
let targetCameraPosition = new THREE.Vector3(0, -0.9, 7.2);
let targetLookAt = new THREE.Vector3(0, -0.1, 0.5);

// =====================
// 카메라 버튼
// =====================
frontViewBtn.addEventListener('click', () => {
  autoCameraMove = true;
  targetCameraPosition.set(0, -0.9, 7.2);
  targetLookAt.set(0, -0.1, 0.5);
});

sideViewBtn.addEventListener('click', () => {
  autoCameraMove = true;
  targetCameraPosition.set(7.2, -0.7, 0);
  targetLookAt.set(0, -0.1, 0.4);
});

topViewBtn.addEventListener('click', () => {
  autoCameraMove = true;
  targetCameraPosition.set(0, 7.0, 0.2);
  targetLookAt.set(0, 0.2, 0.1);
});

backViewBtn.addEventListener('click', () => {
  autoCameraMove = true;
  targetCameraPosition.set(0, -0.2, -7.2);
  targetLookAt.set(0, 0.1, 0.0);
});

resetViewBtn.addEventListener('click', () => {
  autoCameraMove = true;
  targetCameraPosition.set(0, -0.9, 7.2);
  targetLookAt.set(0, -0.1, 0.5);

  earTiltInput.value = 0;
  faceRotationInput.value = 0;

  jawRightYInput.value = -1.25;
  jawLeftYInput.value = -1.25;

  cheekRightYInput.value = -0.25;
  cheekLeftYInput.value = -0.25;

  browRightYInput.value = 0.65;
  browLeftYInput.value = 0.65;

  parietalRightDepthInput.value = 1;
  parietalLeftDepthInput.value = 1;

  mastoidRightYInput.value = -0.82;
  mastoidLeftYInput.value = -0.82;

  noseCurveInput.value = 0;
});

// =====================
// 업데이트 함수들
// =====================
function updateLayerPoints() {
  const jawRightY = Number(jawRightYInput.value);
  const jawLeftY = Number(jawLeftYInput.value);

  const cheekRightY = Number(cheekRightYInput.value);
  const cheekLeftY = Number(cheekLeftYInput.value);

  const browRightY = Number(browRightYInput.value);
  const browLeftY = Number(browLeftYInput.value);

  const mastoidRightY = Number(mastoidRightYInput.value);
  const mastoidLeftY = Number(mastoidLeftYInput.value);

  subjectRightPoints.jaw.position.set(-baseX.jaw, jawRightY, 0.62);
  subjectRightPoints.cheek.position.set(-baseX.cheek, cheekRightY, 0.62);
  subjectRightPoints.brow.position.set(-baseX.brow, browRightY, 0.62);
  subjectRightPoints.crown.position.set(-baseX.crown, baseLevels.crown, 0.35);

  subjectLeftPoints.jaw.position.set(baseX.jaw, jawLeftY, 0.62);
  subjectLeftPoints.cheek.position.set(baseX.cheek, cheekLeftY, 0.62);
  subjectLeftPoints.brow.position.set(baseX.brow, browLeftY, 0.62);
  subjectLeftPoints.crown.position.set(baseX.crown, baseLevels.crown, 0.35);

  centerPoints.jaw.position.set(0, (jawRightY + jawLeftY) / 2, 0.6);
  centerPoints.cheek.position.set(0, (cheekRightY + cheekLeftY) / 2, 0.6);
  centerPoints.brow.position.set(0, (browRightY + browLeftY) / 2, 0.6);
  centerPoints.crown.position.set(0, baseLevels.crown, 0.35);

  rightMastoidPoint.position.set(-1.02, mastoidRightY, -0.10);
  leftMastoidPoint.position.set(1.02, mastoidLeftY, -0.10);

  setLinePoints(rightVerticalLine, [
    subjectRightPoints.jaw.position.clone(),
    subjectRightPoints.cheek.position.clone(),
    subjectRightPoints.brow.position.clone(),
    subjectRightPoints.crown.position.clone()
  ]);

  setLinePoints(leftVerticalLine, [
    subjectLeftPoints.jaw.position.clone(),
    subjectLeftPoints.cheek.position.clone(),
    subjectLeftPoints.brow.position.clone(),
    subjectLeftPoints.crown.position.clone()
  ]);

  setLinePoints(jawLine, [
    subjectRightPoints.jaw.position.clone(),
    centerPoints.jaw.position.clone(),
    subjectLeftPoints.jaw.position.clone()
  ]);

  setLinePoints(cheekLine, [
    subjectRightPoints.cheek.position.clone(),
    centerPoints.cheek.position.clone(),
    subjectLeftPoints.cheek.position.clone()
  ]);

  setLinePoints(browLine, [
    subjectRightPoints.brow.position.clone(),
    centerPoints.brow.position.clone(),
    subjectLeftPoints.brow.position.clone()
  ]);

  setLinePoints(crownLine, [
    subjectRightPoints.crown.position.clone(),
    centerPoints.crown.position.clone(),
    subjectLeftPoints.crown.position.clone()
  ]);

  setLinePoints(centerVerticalLine, [
    centerPoints.jaw.position.clone(),
    centerPoints.cheek.position.clone(),
    centerPoints.brow.position.clone(),
    centerPoints.crown.position.clone()
  ]);

  setLinePoints(rightCrownToMastoidLine, [
    subjectRightPoints.crown.position.clone(),
    rightMastoidPoint.position.clone()
  ]);

  setLinePoints(leftCrownToMastoidLine, [
    subjectLeftPoints.crown.position.clone(),
    leftMastoidPoint.position.clone()
  ]);
}

function updateParietalBackPoints() {
  const rightDepth = Number(parietalRightDepthInput.value);
  const leftDepth = Number(parietalLeftDepthInput.value);

  rightParietalBackPoint.position.set(
    subjectRightPoints.crown.position.x,
    subjectRightPoints.crown.position.y,
    0.35 - (rightDepth - 1) * 1.5
  );

  leftParietalBackPoint.position.set(
    subjectLeftPoints.crown.position.x,
    subjectLeftPoints.crown.position.y,
    0.35 - (leftDepth - 1) * 1.5
  );

  setLinePoints(rightCrownDepthLine, [
    subjectRightPoints.crown.position.clone(),
    rightParietalBackPoint.position.clone()
  ]);

  setLinePoints(leftCrownDepthLine, [
    subjectLeftPoints.crown.position.clone(),
    leftParietalBackPoint.position.clone()
  ]);
}

function updateEyeAndBrowPoints() {
  const rightEyeBaseY =
    (subjectRightPoints.brow.position.y + subjectRightPoints.cheek.position.y) / 2 + 0.02;
  const leftEyeBaseY =
    (subjectLeftPoints.brow.position.y + subjectLeftPoints.cheek.position.y) / 2 + 0.02;

  rightEyePoint.position.set(
    subjectRightPoints.brow.position.x * 0.72,
    rightEyeBaseY,
    1.08
  );

  leftEyePoint.position.set(
    subjectLeftPoints.brow.position.x * 0.72,
    leftEyeBaseY,
    1.08
  );

  rightBrowPoint.position.set(
    subjectRightPoints.brow.position.x * 0.82,
    subjectRightPoints.brow.position.y + 0.04,
    0.96
  );

  leftBrowPoint.position.set(
    subjectLeftPoints.brow.position.x * 0.82,
    subjectLeftPoints.brow.position.y + 0.04,
    0.96
  );

  setLinePoints(eyeLine, [
    rightEyePoint.position.clone(),
    leftEyePoint.position.clone()
  ]);

  setLinePoints(browGuideLine, [
    rightBrowPoint.position.clone(),
    leftBrowPoint.position.clone()
  ]);
}

function updateSkullMeshes() {
  const noseCurve = Number(noseCurveInput.value);
  const rightDepth = Number(parietalRightDepthInput.value);
  const leftDepth = Number(parietalLeftDepthInput.value);
  const depthDiff = leftDepth - rightDepth;

  rightOrbit.position.copy(rightEyePoint.position);
  leftOrbit.position.copy(leftEyePoint.position);

  rightCheekMass.position.copy(subjectRightPoints.cheek.position);
  rightCheekMass.position.z = 0.82;

  leftCheekMass.position.copy(subjectLeftPoints.cheek.position);
  leftCheekMass.position.z = 0.82;

  browRidge.position.set(
    0,
    (subjectRightPoints.brow.position.y + subjectLeftPoints.brow.position.y) / 2,
    0.92
  );

  rightParietalLobe.position.set(
    -0.42,
    baseLevels.crown - 0.02 - depthDiff * 0.03,
    -0.02 - (rightDepth - 1) * 1.25
  );
  rightParietalLobe.scale.z = 1.0 + (rightDepth - 1) * 1.15;

  leftParietalLobe.position.set(
    0.42,
    baseLevels.crown - 0.02 + depthDiff * 0.03,
    -0.02 - (leftDepth - 1) * 1.25
  );
  leftParietalLobe.scale.z = 1.0 + (leftDepth - 1) * 1.15;

  const jawMidY = (subjectRightPoints.jaw.position.y + subjectLeftPoints.jaw.position.y) / 2;
  const jawDiffY = subjectLeftPoints.jaw.position.y - subjectRightPoints.jaw.position.y;

  jawMass.position.set(0, jawMidY + 0.12, 0.42);
  jawMass.rotation.z = jawDiffY * 0.9;

  chin.position.set(
    jawDiffY * 0.25,
    jawMidY - 0.18,
    0.66
  );

  noseGroup.position.set(
    noseCurve * 0.004,
    ((subjectRightPoints.brow.position.y + subjectLeftPoints.brow.position.y) / 2) - 0.62,
    1.02
  );
  noseGroup.rotation.z = THREE.MathUtils.degToRad(noseCurve);
}

// =====================
// 해골 이미지 세로 길이 조절
// 1층/2층/3층 "길이" 슬라이더 값에 맞춰 해골(skull.glb)을
// 세로로 늘였다 줄였다 한다.
// =====================
const baseCenterY = (baseLevels.jaw + baseLevels.crown) / 2; // 얼굴 세로 중앙(기본값)

function updateSkullStretch() {
  if (!skullModelLoaded) return; // 아직 로딩 안 됐으면 스킵

  const jawAvg = (Number(jawRightYInput.value) + Number(jawLeftYInput.value)) / 2;
  const cheekAvg = (Number(cheekRightYInput.value) + Number(cheekLeftYInput.value)) / 2;
  const browAvg = (Number(browRightYInput.value) + Number(browLeftYInput.value)) / 2;
  const crown = baseLevels.crown; // 마루뼈(정수리)는 고정

  // 각 층 길이의 "기본 대비 비율"
  const s1 = (cheekAvg - jawAvg) / (baseLevels.cheek - baseLevels.jaw);   // 1층 (턱→광대)
  const s2 = (browAvg - cheekAvg) / (baseLevels.brow - baseLevels.cheek); // 2층 (광대→이마)
  const s3 = (crown - browAvg) / (baseLevels.crown - baseLevels.brow);    // 3층 (이마→정수리)

  // 세 층 비율의 평균 → 전체 세로 스케일. 어떤 슬라이더를 움직여도 반응함.
  let verticalScale = (s1 + s2 + s3) / 3;
  verticalScale = Math.min(Math.max(verticalScale, 0.4), 2.2); // 안전 범위로 제한

  // 얼굴 중앙이 실제 점 위치를 따라가도록 세로 위치 보정
  const faceCenter = (jawAvg + crown) / 2;

  skullScaleWrapper.scale.y = verticalScale;
  skullScaleWrapper.position.y = faceCenter - baseCenterY * verticalScale;
}

// =====================
// 애니메이션
// =====================
function animate() {
  requestAnimationFrame(animate);

  const earTilt = Number(earTiltInput.value);
  const faceRotation = Number(faceRotationInput.value);
  const noseCurve = Number(noseCurveInput.value);

  updateLayerPoints();
  updateParietalBackPoints();
  updateEyeAndBrowPoints();
  updateSkullMeshes();
  updateSkullStretch();

  // 투구 회전은 중앙 기준 좌우로 더 확실히
  analysisGroup.rotation.z = THREE.MathUtils.degToRad(earTilt);
  analysisGroup.rotation.y = THREE.MathUtils.degToRad(faceRotation * 1.8);

  // 정면에서는 4층 마루뼈 숨김
  const frontByTarget =
    targetCameraPosition.z > 6 && Math.abs(targetCameraPosition.x) < 1;

  const frontByCamera =
    camera.position.z > 5.5 && Math.abs(camera.position.x) < 1.2;

  const isFrontView = frontByTarget && frontByCamera;

  rightParietalLobe.visible = !isFrontView;
  leftParietalLobe.visible = !isFrontView;
  rightParietalBackPoint.visible = !isFrontView;
  leftParietalBackPoint.visible = !isFrontView;
  rightCrownDepthLine.visible = !isFrontView;
  leftCrownDepthLine.visible = !isFrontView;

  earTiltValue.textContent = `${earTilt}°`;
  faceRotationValue.textContent = `${faceRotation}°`;

  jawRightYValue.textContent = Number(jawRightYInput.value).toFixed(2);
  jawLeftYValue.textContent = Number(jawLeftYInput.value).toFixed(2);

  cheekRightYValue.textContent = Number(cheekRightYInput.value).toFixed(2);
  cheekLeftYValue.textContent = Number(cheekLeftYInput.value).toFixed(2);

  browRightYValue.textContent = Number(browRightYInput.value).toFixed(2);
  browLeftYValue.textContent = Number(browLeftYInput.value).toFixed(2);

  parietalRightDepthValue.textContent = Number(parietalRightDepthInput.value).toFixed(2);
  parietalLeftDepthValue.textContent = Number(parietalLeftDepthInput.value).toFixed(2);

  mastoidRightYValue.textContent = Number(mastoidRightYInput.value).toFixed(2);
  mastoidLeftYValue.textContent = Number(mastoidLeftYInput.value).toFixed(2);

  noseCurveValue.textContent = `${noseCurve}°`;

  let resultText = '';

  if (earTilt > 3) resultText += '✔ 투구 기울기 기준 좌측으로 기울어지는 패턴<br/>';
  if (earTilt < -3) resultText += '✔ 투구 기울기 기준 우측으로 기울어지는 패턴<br/>';

  if (faceRotation > 3) resultText += '✔ 투구 회전: 우측 회전 패턴<br/>';
  if (faceRotation < -3) resultText += '✔ 투구 회전: 좌측 회전 패턴<br/>';

  const jawRightY = Number(jawRightYInput.value);
  const jawLeftY = Number(jawLeftYInput.value);
  const cheekRightY = Number(cheekRightYInput.value);
  const cheekLeftY = Number(cheekLeftYInput.value);
  const browRightY = Number(browRightYInput.value);
  const browLeftY = Number(browLeftYInput.value);

  const rightJawToCheek = cheekRightY - jawRightY;
  const leftJawToCheek = cheekLeftY - jawLeftY;

  const rightCheekToBrow = browRightY - cheekRightY;
  const leftCheekToBrow = browLeftY - cheekLeftY;

  if (rightJawToCheek > leftJawToCheek + 0.08) resultText += '✔ 1층→2층 길이: 우측이 더 김<br/>';
  if (leftJawToCheek > rightJawToCheek + 0.08) resultText += '✔ 1층→2층 길이: 좌측이 더 김<br/>';

  if (rightCheekToBrow > leftCheekToBrow + 0.08) resultText += '✔ 2층→3층 길이: 우측이 더 김<br/>';
  if (leftCheekToBrow > rightCheekToBrow + 0.08) resultText += '✔ 2층→3층 길이: 좌측이 더 김<br/>';

  const rightParietalDepth = Number(parietalRightDepthInput.value);
  const leftParietalDepth = Number(parietalLeftDepthInput.value);

  if (rightParietalDepth > leftParietalDepth + 0.06) {
    resultText += '✔ 4층 마루뼈 후방 길이: 우측이 더 김<br/>';
  }
  if (leftParietalDepth > rightParietalDepth + 0.06) {
    resultText += '✔ 4층 마루뼈 후방 길이: 좌측이 더 김<br/>';
  }

  const rightParietalToMastoidHeight =
    subjectRightPoints.crown.position.y - rightMastoidPoint.position.y;
  const leftParietalToMastoidHeight =
    subjectLeftPoints.crown.position.y - leftMastoidPoint.position.y;

  if (rightParietalToMastoidHeight > leftParietalToMastoidHeight + 0.08) {
    resultText += '✔ 마루뼈→유양돌기 높이차: 우측이 더 큼<br/>';
  }
  if (leftParietalToMastoidHeight > rightParietalToMastoidHeight + 0.08) {
    resultText += '✔ 마루뼈→유양돌기 높이차: 좌측이 더 큼<br/>';
  }

  if (noseCurve > 5) resultText += '✔ 코가 \\ 방향으로 휘는 패턴<br/>';
  if (noseCurve < -5) resultText += '✔ 코가 / 방향으로 휘는 패턴<br/>';

  if (resultText === '') {
    resultText = '✔ 현재 입력값 기준 큰 구조적 비대칭 신호 없음';
  }

  resultBox.innerHTML = resultText;

  if (autoCameraMove && !isUserDragging) {
    camera.position.lerp(targetCameraPosition, 0.08);
    controls.target.lerp(targetLookAt, 0.08);

    if (
      camera.position.distanceTo(targetCameraPosition) < 0.01 &&
      controls.target.distanceTo(targetLookAt) < 0.01
    ) {
      autoCameraMove = false;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});