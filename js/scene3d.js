// Bag of Dungeon 3D — 3D scene module (dice rolling, camera, hero/monster miniatures,
// tile rendering, spell effects, lighting). This stays as one ES module because its
// internal state (scene, camera, renderer, hero model, dice groups, etc.) is shared
// via closure across all of these systems — splitting it into separate dice.js/camera.js
// files would mean turning ~30 private variables into explicit exports/imports, which is
// a much bigger, riskier refactor than a file reorganisation. See the chat notes for why.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const LIGHTING_STORAGE_KEY='bod3dLightingV94';
const LIGHTING_DEFAULT_KEY='bod3dLightingCustomDefaultV1';
const DEFAULT_LIGHTING={
 enabled:true,
 brightness:25,
 radius:2.5,
 falloff:.5,
 ambient:0,
 shadow:17,
 softness:0,
 exposure:.45,
 colour:'#ffcc99',
 follow:true
};
const LIGHT_PRESETS={
 bright:{brightness:74,radius:5,falloff:5,ambient:88,shadow:55,softness:5,exposure:1.45,colour:'#fff2d8',follow:true},
 dungeon:{brightness:68,radius:3.5,falloff:3.75,ambient:68,shadow:80,softness:3,exposure:1.24,colour:'#ffd09a',follow:true},
 torch:{brightness:86,radius:3,falloff:3,ambient:52,shadow:88,softness:2.5,exposure:1.18,colour:'#ffb15c',follow:true},
 dark:{brightness:58,radius:2.5,falloff:2.5,ambient:34,shadow:92,softness:2,exposure:.95,colour:'#ff9a45',follow:true}
};
function loadLighting(){
 return {...DEFAULT_LIGHTING};
}
let lighting=loadLighting();
function saveLighting(){
 localStorage.setItem(LIGHTING_STORAGE_KEY,JSON.stringify(lighting));
}
function saveLightingAsDefault(){
 localStorage.setItem(
  LIGHTING_DEFAULT_KEY,
  JSON.stringify(lighting)
 );
}
function loadLightingDefault(){
 try{
  const saved=JSON.parse(
   localStorage.getItem(LIGHTING_DEFAULT_KEY)||'null'
  );
  return saved?{...DEFAULT_LIGHTING,...saved}:null;
 }catch(e){
  return null;
 }
}

const canvas=document.getElementById('threeBoard');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=lighting.exposure;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x010100);
scene.fog=new THREE.FogExp2(0x010100,.085);

const camera=new THREE.PerspectiveCamera(38,1,.1,100);
camera.position.set(8.5,11,12);

const controls=new OrbitControls(camera,canvas);
controls.target.set(0,.4,0);
controls.enableDamping=true;
controls.dampingFactor=.08;
controls.enablePan=true;
controls.minDistance=5;
controls.maxDistance=34;
controls.minPolarAngle=THREE.MathUtils.degToRad(20);
controls.maxPolarAngle=THREE.MathUtils.degToRad(78);

const ambientLight=new THREE.HemisphereLight(0x3a4252,0x0a0704,lighting.ambient/100);
scene.add(ambientLight);

const sun=new THREE.DirectionalLight(0xffd9ad,.15+(lighting.shadow/100)*.9);
sun.position.set(6,14,5);
sun.castShadow=true;
sun.shadow.mapSize.set(4096,4096);
sun.shadow.bias=-.00035;
sun.shadow.normalBias=.035;
sun.shadow.camera.left=-16;
sun.shadow.camera.right=16;
sun.shadow.camera.top=16;
sun.shadow.camera.bottom=-16;
scene.add(sun);

const heroLight=new THREE.PointLight(lighting.colour,lighting.brightness*5.6,(lighting.radius+lighting.falloff)*2.05+3,1.8);
heroLight.position.set(0,4.2,0);
heroLight.castShadow=true;
heroLight.shadow.mapSize.set(2048,2048);
heroLight.shadow.bias=-.0003;
heroLight.shadow.radius=lighting.softness;
scene.add(heroLight);

const table=new THREE.Mesh(
 new THREE.PlaneGeometry(70,70),
 new THREE.MeshStandardMaterial({color:0x0c0906,roughness:.97})
);
table.rotation.x=-Math.PI/2;
table.position.y=-.06;
table.receiveShadow=true;
scene.add(table);

const boardGroup=new THREE.Group();
scene.add(boardGroup);

const textureLoader=new THREE.TextureLoader();
const gltfLoader=new GLTFLoader();

// v10.94 — Two-colour reusable 3D dice roller with tunable board-game bounce physics and face calibration.
// Hero dice use diceblack.glb; monster dice use dicered.glb.
// Dice remain on the board until the next roll, then the previous dice are cleared.
const diceGroup=new THREE.Group();
scene.add(diceGroup);
const diceSourcePromises={hero:null,monster:null};
let diceRollToken=0;
const DEFAULT_DICE_TOP_QUATERNIONS={
 6:new THREE.Quaternion(),
 1:new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI,0,0)),
 3:new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,-Math.PI/2)),
 4:new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0, Math.PI/2)),
 2:new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0)),
 5:new THREE.Quaternion().setFromEuler(new THREE.Euler( Math.PI/2,0,0))
};
const DICE_CAL_STORAGE='bod3d-dice-calibration-v2';
function cloneDefaultDiceCalibration(){
 return {hero:{},monster:{}};
}
function loadDiceCalibration(){
 const out=cloneDefaultDiceCalibration();
 ['hero','monster'].forEach(role=>{
  for(let face=1;face<=6;face++)out[role][face]=DEFAULT_DICE_TOP_QUATERNIONS[face].clone();
 });
 try{
  const saved=JSON.parse(localStorage.getItem(DICE_CAL_STORAGE)||'{}');
  ['hero','monster'].forEach(role=>{
   for(let face=1;face<=6;face++){
    const q=saved?.[role]?.[face];
    if(Array.isArray(q)&&q.length===4)out[role][face]=new THREE.Quaternion(q[0],q[1],q[2],q[3]).normalize();
   }
  });
 }catch(e){console.warn('Dice calibration could not be loaded',e);}
 return out;
}
const DICE_FACE_QUATERNIONS=loadDiceCalibration();
const DICE_TUNING={
 duration:1050,
 dropHeight:2.5,
 bounce1:1,
 bounce2:.02,
 bounce3:.06,
 spread:.55,
 outward:1.02,
 gap:.9,
 size:.62,
 floorOffset:.03
};
let diceCalibrationDie=null;
let diceCalibrationRole='hero';
let diceCalibrationFace=6;
function diceRestY(){return TILE_THICKNESS+DICE_TUNING.floorOffset;}
function clearDice3D(){
 while(diceGroup.children.length){
  const o=diceGroup.children.pop();
  o?.traverse?.(n=>{if(n.geometry&&n.userData?.diceOwnedGeometry)n.geometry.dispose?.();});
 }
}
function cancelAndClearDice3D(){
 diceRollToken++;
 clearDice3D();
}
async function getDiceSource(role='hero'){
 role=role==='monster'?'monster':'hero';
 if(!diceSourcePromises[role]){
  const file=role==='monster'?'dicered.glb':'diceblack.glb';
  diceSourcePromises[role]=gltfLoader.loadAsync(`assets/models/${file}?v=${encodeURIComponent(VERSION)}`)
   .then(g=>g.scene)
   .catch(err=>{console.error(`Failed to load ${file}`,err);return null;});
 }
 return diceSourcePromises[role];
}
function prepareDieClone(source){
 const raw=source.clone(true);
 raw.traverse(o=>{
  if(o.isMesh){
   o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material?.clone?.()||o.material;
   o.castShadow=true;o.receiveShadow=true;
  }
 });
 const box=new THREE.Box3().setFromObject(raw);
 const size=box.getSize(new THREE.Vector3());
 const maxDim=Math.max(size.x,size.y,size.z)||1;
 raw.scale.multiplyScalar(DICE_TUNING.size/maxDim);
 raw.updateMatrixWorld(true);
 const scaled=new THREE.Box3().setFromObject(raw);
 const c=scaled.getCenter(new THREE.Vector3());
 const root=new THREE.Group();
 // Centre the actual die geometry on the root pivot in ALL axes. Rotating a root whose
 // pivot sits on the model's bottom makes the cube orbit around that bottom point and can
 // produce different apparent resting heights for different GLB exports/faces.
 raw.position.set(-c.x,-c.y,-c.z);
 root.add(raw);
 root.updateMatrixWorld(true);
 return root;
}
function settledDieRootY(die,targetQuat){
 // The GLBs can have different origins. Geometry is centred on the root first, then we measure
 // the final rotated die and place its true geometric bottom on the shared board surface.
 const oldPos=die.position.clone();
 const oldQuat=die.quaternion.clone();
 const oldScale=die.scale.clone();
 die.position.set(0,0,0);
 die.quaternion.copy(targetQuat);
 die.scale.set(1,1,1);
 die.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(die);
 const rootY=diceRestY()-box.min.y;
 die.position.copy(oldPos);
 die.quaternion.copy(oldQuat);
 die.scale.copy(oldScale);
 die.updateMatrixWorld(true);
 return rootY;
}
function diceLayout(role,count){
 const mobile=window.innerWidth<=800;
 const tileTop=diceRestY();
 if(combatScene?.heroCombatPosition&&combatScene?.monsterCombatPosition){
  const hero=combatScene.heroCombatPosition.clone();
  const monster=combatScene.monsterCombatPosition.clone();
  const axis=monster.clone().sub(hero);axis.y=0;
  if(axis.lengthSq()<.001)axis.set(1,0,0);else axis.normalize();
  const outward=mobile?Math.min(DICE_TUNING.outward,.72):Math.max(DICE_TUNING.outward,.92);
  const centre=(role==='monster'?monster.clone().addScaledVector(axis,outward):hero.clone().addScaledVector(axis,-outward));
  centre.y=tileTop;
  const across=new THREE.Vector3(-axis.z,0,axis.x);
  const gap=mobile?Math.min(DICE_TUNING.gap,.48):DICE_TUNING.gap;
  return Array.from({length:count},(_,i)=>centre.clone().addScaledVector(across,(i-(count-1)/2)*gap));
 }
 const px=(latestState?.player?.x||0)*TILE;
 const pz=(latestState?.player?.y||0)*TILE;
 return Array.from({length:count},(_,i)=>new THREE.Vector3(px+(i-(count-1)/2)*DICE_TUNING.gap,tileTop,pz+1.05));
}
function diceBounceHeight(t,d){
 // Four grounded phases: drop -> rebound -> smaller rebound -> tiny settling hop.
 if(t<.42){
  const u=t/.42;
  return d.dropHeight*(1-u*u);
 }
 if(t<.68){
  const u=(t-.42)/.26;
  return d.bounce1*4*u*(1-u);
 }
 if(t<.86){
  const u=(t-.68)/.18;
  return d.bounce2*4*u*(1-u);
 }
 if(t<1){
  const u=(t-.86)/.14;
  return d.bounce3*4*u*(1-u);
 }
 return 0;
}
async function rollDiceSet(values,role='hero',token=++diceRollToken){
 values=(Array.isArray(values)?values:[values]).map(Number).filter(v=>v>=1&&v<=6).slice(0,6);
 if(!values.length)return [];
 const source=await getDiceSource(role);
 if(!source||token!==diceRollToken)return [];
 const targets=diceLayout(role,values.length);
 const dice=[];
 values.forEach((value,i)=>{
  const die=prepareDieClone(source);
  const target=targets[i];
  const roleSign=role==='monster'?1:-1;
  const lateralSign=(i-(values.length-1)/2)||((i%2)*2-1);
  const settleDir=new THREE.Vector3(roleSign*.85,0,lateralSign*.72).normalize();
  const settleOffset=settleDir.multiplyScalar(DICE_TUNING.spread*(.65+Math.random()*.7));
  const finalPos=target.clone().add(settleOffset);
  const targetQuat=DICE_FACE_QUATERNIONS[role][value].clone();
  finalPos.y=settledDieRootY(die,targetQuat);
  const startPos=target.clone();
  startPos.y=finalPos.y+DICE_TUNING.dropHeight;
  startPos.x+=roleSign*(.16+Math.random()*.12);
  startPos.z+=(Math.random()-.5)*.18;
  die.scale.setScalar(.01);
  die.userData={
   value,
   start:performance.now()+i*80,
   duration:DICE_TUNING.duration+Math.random()*140,
   startPos,
   targetPos:finalPos,
   targetQuat,
   bounce1:DICE_TUNING.bounce1*(.9+Math.random()*.2),
   bounce2:DICE_TUNING.bounce2*(.9+Math.random()*.2),
   bounce3:DICE_TUNING.bounce3*(.85+Math.random()*.3),
   dropHeight:DICE_TUNING.dropHeight,
   spin:new THREE.Vector3((2.7+Math.random()*1.4)*Math.PI,(3.2+Math.random()*1.8)*Math.PI,(2.8+Math.random()*1.4)*Math.PI)
  };
  die.position.copy(startPos);
  diceGroup.add(die);dice.push(die);
 });
 const animateDice=now=>{
  if(token!==diceRollToken)return;
  let alive=false;
  dice.forEach(die=>{
   const d=die.userData;
   const t=Math.max(0,Math.min(1,(now-d.start)/d.duration));
   if(t<1)alive=true;
   // Horizontal movement eases toward a slightly separated resting position.
   const moveEase=1-Math.pow(1-t,2.4);
   die.position.lerpVectors(d.startPos,d.targetPos,moveEase);
   // Always calculate Y from the exact tile-top plane so the die cannot sink below it.
   die.position.y=d.targetPos.y+diceBounceHeight(t,d);
   // Fast tumbling during the drop, progressively calmer after the first impact.
   const tumbleT=Math.min(1,t/.82);
   const qSpin=new THREE.Quaternion().setFromEuler(new THREE.Euler(
    d.spin.x*tumbleT,
    d.spin.y*tumbleT,
    d.spin.z*tumbleT
   ));
   const settle=Math.max(0,Math.min(1,(t-.70)/.30));
   const smooth=settle*settle*(3-2*settle);
   die.quaternion.copy(qSpin).slerp(d.targetQuat,smooth);
   die.scale.setScalar(Math.min(1,t/.10));
  });
  if(alive)requestAnimationFrame(animateDice);
  else{
   // Snap precisely to final tile-plane position and correct face; remain until next roll.
   dice.forEach(die=>{
    die.position.copy(die.userData.targetPos);
    die.position.y=die.userData.targetPos.y;
    die.quaternion.copy(die.userData.targetQuat);
    die.scale.setScalar(1);
   });
  }
 };
 requestAnimationFrame(animateDice);
 return dice;
}
async function rollDice3D(values,role='hero'){
 const token=++diceRollToken;
 clearDice3D();
 await rollDiceSet(values,role,token);
}
async function rollCombatDice3D(heroValues,monsterValues){
 const token=++diceRollToken;
 clearDice3D();
 await Promise.all([getDiceSource('hero'),getDiceSource('monster')]);
 if(token!==diceRollToken)return;
 await Promise.all([
  rollDiceSet(heroValues,'hero',token),
  rollDiceSet(monsterValues,'monster',token)
 ]);
}
async function showDiceCalibration(role='hero',face=6){
 role=role==='monster'?'monster':'hero';face=Math.max(1,Math.min(6,Number(face)||6));
 const token=++diceRollToken;clearDice3D();
 const source=await getDiceSource(role);if(!source||token!==diceRollToken)return;
 const die=prepareDieClone(source);
 const positions=diceLayout(role,1);
 die.position.copy(positions[0]);die.position.y=diceRestY();
 die.quaternion.copy(DICE_FACE_QUATERNIONS[role][face]);
 diceGroup.add(die);
 diceCalibrationDie=die;diceCalibrationRole=role;diceCalibrationFace=face;
}
function rotateDiceCalibration(axis='y',degrees=90){
 if(!diceCalibrationDie)return;
 const angle=THREE.MathUtils.degToRad(Number(degrees)||0);
 const e=new THREE.Euler(axis==='x'?angle:0,axis==='y'?angle:0,axis==='z'?angle:0,'XYZ');
 const q=new THREE.Quaternion().setFromEuler(e);
 diceCalibrationDie.quaternion.multiply(q).normalize();
}
function saveDiceCalibration(role=diceCalibrationRole,face=diceCalibrationFace){
 role=role==='monster'?'monster':'hero';face=Math.max(1,Math.min(6,Number(face)||6));
 if(!diceCalibrationDie)return;
 DICE_FACE_QUATERNIONS[role][face].copy(diceCalibrationDie.quaternion).normalize();
 const serial={hero:{},monster:{}};
 ['hero','monster'].forEach(r=>{for(let f=1;f<=6;f++){const q=DICE_FACE_QUATERNIONS[r][f];serial[r][f]=[q.x,q.y,q.z,q.w];}});
 try{localStorage.setItem(DICE_CAL_STORAGE,JSON.stringify(serial));}catch(e){console.warn('Dice calibration could not be saved',e);}
}
function setDiceTuning(partial={}){
 Object.keys(DICE_TUNING).forEach(key=>{
  if(partial[key]!==undefined&&Number.isFinite(Number(partial[key])))DICE_TUNING[key]=Number(partial[key]);
 });
 return {...DICE_TUNING};
}
window.BODDice3D={
 roll:rollDice3D,
 rollCombat:rollCombatDice3D,
 clear:cancelAndClearDice3D,
 tuning:DICE_TUNING,
 setTuning:setDiceTuning,
 showCalibration:showDiceCalibration,
 rotateCalibration:rotateDiceCalibration,
 saveCalibration:saveDiceCalibration,
 calibration:DICE_FACE_QUATERNIONS
};

// v10.98 — explicit Developer Dice controller. Inline handlers use this so controls
// work regardless of when the Developer Console itself was wired.
(function installExplicitDiceDeveloperController(){
 const STORAGE='bod3dDiceTuningV1102';
 const DEFAULTS={duration:1050,dropHeight:2.5,bounce1:1,bounce2:.02,bounce3:.06,spread:.55,gap:.9,floorOffset:.03};
 const status=(msg)=>{const el=document.getElementById('devDiceStatus');if(el)el.textContent=msg;};
 const stop=(e)=>{if(e){e.preventDefault?.();e.stopPropagation?.();}return false;};
 const r6=()=>1+Math.floor(Math.random()*6);
 const role=()=>document.getElementById('diceCalRole')?.value||'hero';
 const face=()=>Number(document.getElementById('diceCalFace')?.value||6);
 const settingsText=()=>{const t=window.BODDice3D.tuning;return `BOD3D Dice Settings\nDuration: ${t.duration}\nDrop Height: ${t.dropHeight}\nBounce 1: ${t.bounce1}\nBounce 2: ${t.bounce2}\nBounce 3: ${t.bounce3}\nSeparation: ${t.spread}\nSpacing: ${t.gap}\nFloor Offset: ${t.floorOffset}`;};
 const sync=()=>{
  const map={diceDuration:['duration','diceDurationValue',v=>Math.round(v)+' ms'],diceDrop:['dropHeight','diceDropValue',v=>Number(v).toFixed(2)],diceBounce1:['bounce1','diceBounce1Value',v=>Number(v).toFixed(2)],diceBounce2:['bounce2','diceBounce2Value',v=>Number(v).toFixed(2)],diceSpread:['spread','diceSpreadValue',v=>Number(v).toFixed(2)],diceGap:['gap','diceGapValue',v=>Number(v).toFixed(2)],diceFloorOffset:['floorOffset','diceFloorOffsetValue',v=>Number(v).toFixed(3)]};
  Object.entries(map).forEach(([id,[key,vid,fmt]])=>{const el=document.getElementById(id),v=document.getElementById(vid);if(el)el.value=window.BODDice3D.tuning[key];if(v)v.textContent=fmt(window.BODDice3D.tuning[key]);});
 };
 const saveTune=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(window.BODDice3D.tuning));}catch(e){}};
 window.BODDiceDev={
  testHero(e){status('Rolling 2 black hero dice…');Promise.resolve(window.BODDice3D.roll([r6(),r6()],'hero')).then(()=>status('Black dice test complete.'));return stop(e);},
  testMonster(e){status('Rolling 2 red monster dice…');Promise.resolve(window.BODDice3D.roll([r6(),r6()],'monster')).then(()=>status('Red dice test complete.'));return stop(e);},
  testCombat(e){status('Rolling hero and monster combat dice…');Promise.resolve(window.BODDice3D.rollCombat([r6(),r6()],[r6(),r6()])).then(()=>status('Combat dice test complete.'));return stop(e);},
  clear(e){window.BODDice3D.clear();status('Dice cleared.');return stop(e);},
  showFace(e){window.BODDice3D.showCalibration(role(),face());status(`Showing ${role()==='hero'?'black':'red'} die face ${face()}.`);return stop(e);},
  saveFace(e){window.BODDice3D.saveCalibration(role(),face());status(`Saved ${role()==='hero'?'black':'red'} die face ${face()}.`);toast('Dice face calibration saved');return stop(e);},
  rotate(e,axis,angle){window.BODDice3D.rotateCalibration(axis,angle);status(`Rotated calibration die ${axis.toUpperCase()} ${angle>0?'+':''}${angle}°.`);return stop(e);},
  async copy(e){const text=settingsText();let copied=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);copied=true;}}catch(err){}if(copied){status('Dice settings copied to clipboard.');toast('Dice settings copied');}else{status('Clipboard unavailable — settings shown in copy box.');window.prompt('Copy these dice settings:',text);}return stop(e);},
  reset(e){window.BODDice3D.setTuning(DEFAULTS);saveTune();sync();status('Dice settings reset to defaults.');toast('Dice settings reset');return stop(e);}
 };
 setTimeout(()=>{sync();status('Dice controls ready.');},0);
})();

// v10.96 — persistent developer dice settings + reliable late button wiring.
(function installDiceDeveloperReliability(){
 const STORAGE='bod3dDiceTuningV1102';
 const DEFAULTS={duration:1050,dropHeight:2.5,bounce1:1,bounce2:.02,bounce3:.06,spread:.55,gap:.9,floorOffset:.03};
 try{
  const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');
  if(saved&&typeof saved==='object')window.BODDice3D.setTuning(saved);
 }catch(e){}
 const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(window.BODDice3D.tuning));}catch(e){}};
 const syncUI=()=>{
  const map={diceDuration:['duration',v=>Math.round(v)+' ms'],diceDrop:['dropHeight',v=>Number(v).toFixed(2)],diceBounce1:['bounce1',v=>Number(v).toFixed(2)],diceBounce2:['bounce2',v=>Number(v).toFixed(2)],diceSpread:['spread',v=>Number(v).toFixed(2)],diceGap:['gap',v=>Number(v).toFixed(2)],diceFloorOffset:['floorOffset',v=>Number(v).toFixed(3)]};
  Object.entries(map).forEach(([id,[key,fmt]])=>{const el=document.getElementById(id);if(!el)return;el.value=window.BODDice3D.tuning[key];const val=document.getElementById(id+'Value')||document.getElementById(id.replace('dice','dice')+'Value');});
  const vals={diceDurationValue:['duration',v=>Math.round(v)+' ms'],diceDropValue:['dropHeight',v=>Number(v).toFixed(2)],diceBounce1Value:['bounce1',v=>Number(v).toFixed(2)],diceBounce2Value:['bounce2',v=>Number(v).toFixed(2)],diceSpreadValue:['spread',v=>Number(v).toFixed(2)],diceGapValue:['gap',v=>Number(v).toFixed(2)],diceFloorOffsetValue:['floorOffset',v=>Number(v).toFixed(3)]};
  Object.entries(vals).forEach(([id,[key,fmt]])=>{const el=document.getElementById(id);if(el)el.textContent=fmt(window.BODDice3D.tuning[key]);});
 };
 const copySettings=async()=>{
  const t=window.BODDice3D.tuning;
  const text=`BOD3D Dice Settings\nDuration: ${t.duration}\nDrop Height: ${t.dropHeight}\nBounce 1: ${t.bounce1}\nBounce 2: ${t.bounce2}\nBounce 3: ${t.bounce3}\nSeparation: ${t.spread}\nSpacing: ${t.gap}\nFloor Offset: ${t.floorOffset}`;
  try{await navigator.clipboard.writeText(text);toast('Dice settings copied');}catch(e){prompt('Copy these dice settings:',text);}
 };
 document.addEventListener('input',e=>{
  const ids={diceDuration:'duration',diceDrop:'dropHeight',diceBounce1:'bounce1',diceBounce2:'bounce2',diceSpread:'spread',diceGap:'gap',diceFloorOffset:'floorOffset'};
  const key=ids[e.target?.id];if(!key)return;
  window.BODDice3D.setTuning({[key]:Number(e.target.value)});save();syncUI();
 });
 // Delegated click fallback means these work even if the original console wiring ran before BODDice3D existed.
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('button');if(!b)return;
  const r6=()=>1+Math.floor(Math.random()*6);
  let handled=true;
  if(b.id==='devTestHeroDice'){window.BODDice3D.roll([r6(),r6()],'hero');}
  else if(b.id==='devTestMonsterDice'){window.BODDice3D.roll([r6(),r6()],'monster');}
  else if(b.id==='devTestCombatDice'){window.BODDice3D.rollCombat([r6(),r6()],[r6(),r6()]);}
  else if(b.id==='devClearDice'){window.BODDice3D.clear();}
  else if(b.id==='diceCalShow'){window.BODDice3D.showCalibration(document.getElementById('diceCalRole')?.value||'hero',Number(document.getElementById('diceCalFace')?.value||6));}
  else if(b.id==='diceCalSave'){window.BODDice3D.saveCalibration(document.getElementById('diceCalRole')?.value||'hero',Number(document.getElementById('diceCalFace')?.value||6));toast('Dice face calibration saved');}
  else if(b.dataset?.diceCalAxis){window.BODDice3D.rotateCalibration(b.dataset.diceCalAxis,Number(b.dataset.diceCalAngle||0));}
  else if(b.id==='devCopyDiceSettings'){copySettings();}
  else if(b.id==='devResetDiceSettings'){window.BODDice3D.setTuning(DEFAULTS);save();syncUI();toast('Dice settings reset');}
  else handled=false;
  if(handled){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 setTimeout(syncUI,0);
})();


const heroPreviewCanvas=document.getElementById('heroPreviewCanvas');
const heroPreviewWrap=document.getElementById('heroPreviewWrap');
const heroPreviewLoading=document.getElementById('heroPreviewLoading');
const heroPreviewFallback=document.getElementById('heroPreviewFallback');
let heroPreviewRenderer=null,heroPreviewScene=null,heroPreviewCamera=null,heroPreviewModel=null;
let heroPreviewRAF=0,heroPreviewPaused=false,heroPreviewToken=0,heroPreviewClockStart=performance.now();

function initHeroPreview(){
 if(!heroPreviewCanvas||heroPreviewRenderer)return;
 heroPreviewRenderer=new THREE.WebGLRenderer({canvas:heroPreviewCanvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 heroPreviewRenderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 heroPreviewRenderer.outputColorSpace=THREE.SRGBColorSpace;
 heroPreviewRenderer.shadowMap.enabled=true;
 heroPreviewRenderer.shadowMap.type=THREE.PCFSoftShadowMap;
 heroPreviewScene=new THREE.Scene();
 heroPreviewCamera=new THREE.PerspectiveCamera(30,1,.01,100);
 heroPreviewCamera.position.set(0,1.3,4.8);
 const hemi=new THREE.HemisphereLight(0xfff0d0,0x17110b,2.2);
 heroPreviewScene.add(hemi);
 const keyLight=new THREE.DirectionalLight(0xffd6a0,4.2);
 keyLight.position.set(-3,5,4);keyLight.castShadow=true;
 heroPreviewScene.add(keyLight);
 const rimLight=new THREE.DirectionalLight(0xa9c7ff,2.4);
 rimLight.position.set(4,2,-3);
 heroPreviewScene.add(rimLight);
 const floor=new THREE.Mesh(
  new THREE.CircleGeometry(1.25,64),
  new THREE.ShadowMaterial({color:0x000000,opacity:.42})
 );
 floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;
 heroPreviewScene.add(floor);
 new ResizeObserver(resizeHeroPreview).observe(heroPreviewWrap);
 resizeHeroPreview();
 animateHeroPreview();
 window.BODHeroPreview.select(selectedCharacter());
}
function resizeHeroPreview(){
 if(!heroPreviewRenderer||!heroPreviewWrap)return;
 const r=heroPreviewWrap.getBoundingClientRect();
 const w=Math.max(1,Math.floor(r.width)),h=Math.max(1,Math.floor(r.height));
 heroPreviewRenderer.setSize(w,h,false);
 heroPreviewCamera.aspect=w/h;heroPreviewCamera.updateProjectionMatrix();
}
function clearHeroPreviewModel(){
 if(!heroPreviewModel)return;
 heroPreviewScene.remove(heroPreviewModel);
 heroPreviewModel.traverse(o=>{
  if(o.geometry)o.geometry.dispose?.();
  if(o.material){
   const mats=Array.isArray(o.material)?o.material:[o.material];
   mats.forEach(m=>m.dispose?.());
  }
 });
 heroPreviewModel=null;
}
function fitHeroPreviewModel(model){
 model.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(model);
 const size=box.getSize(new THREE.Vector3());
 const maxDim=Math.max(size.x,size.y,size.z)||1;
 const targetHeight=1.15; // reference: small miniature standing in the corridor, not filling the frame
 const scale=targetHeight/(size.y||maxDim);
 model.scale.setScalar(scale);
 model.updateMatrixWorld(true);
 const scaledBox=new THREE.Box3().setFromObject(model);
 const scaledSize=scaledBox.getSize(new THREE.Vector3());
 const scaledCenter=scaledBox.getCenter(new THREE.Vector3());

 // Centre the model on the pivot that will be rotated (see selectHeroPreview),
 // not on the model itself — a model's own position offset does not move its
 // rotation origin, so this alone would still let it swing around whatever
 // point its source .glb happens to use as (0,0,0), same as Sirrus vs. the rest.
 model.position.x-=scaledCenter.x;
 model.position.z-=scaledCenter.z;
 model.position.y-=scaledBox.min.y;
 heroPreviewCamera.position.set(0,scaledSize.y*.42,Math.max(4.2,scaledSize.y*1.95));
 heroPreviewCamera.lookAt(0,scaledSize.y*.70,0);
 heroPreviewCamera.updateProjectionMatrix();
}
function normaliseHeroPreviewMaterials(model){
 model.traverse(o=>{
  if(!o.isMesh)return;
  o.castShadow=true;o.receiveShadow=true;
  if(o.material){
   const source=Array.isArray(o.material)?o.material:[o.material];
   const cloned=source.map(m=>{
    const c=m.clone();
    c.transparent=false;c.opacity=1;c.depthWrite=true;c.side=THREE.FrontSide;
    if('metalness' in c)c.metalness=Math.min(Number(c.metalness)||0,.35);
    if('roughness' in c)c.roughness=Math.max(Number(c.roughness)||.65,.45);
    c.needsUpdate=true;return c;
   });
   o.material=Array.isArray(o.material)?cloned:cloned[0];
  }
 });
}
async function selectHeroPreview(character){
 initHeroPreview();
 const token=++heroPreviewToken;
 heroPreviewLoading?.classList.remove('hidden');
 if(heroPreviewFallback)heroPreviewFallback.style.display='none';
 const src=modelPath(characterModelFile(character));
 try{
  const gltf=await gltfLoader.loadAsync(src);
  if(token!==heroPreviewToken)return false;
  clearHeroPreviewModel();
  const raw=gltf.scene;
  normaliseHeroPreviewMaterials(raw);
  fitHeroPreviewModel(raw);

  // Rotate this pivot, not "raw" directly. The pivot's own origin is exactly
  // the model's visual centre (raw is offset to sit centred inside it), so
  // spinning the pivot turns the hero in place instead of swinging it
  // around whatever point its source .glb happens to use as its origin.
  const pivot=new THREE.Group();
  pivot.add(raw);
  pivot.rotation.y=-Math.PI/2;
  heroPreviewModel=pivot;
  heroPreviewScene.add(heroPreviewModel);
  heroPreviewClockStart=performance.now();
  heroPreviewLoading?.classList.add('hidden');
  return true;
 }catch(err){
  if(token!==heroPreviewToken)return false;
  clearHeroPreviewModel();
  heroPreviewLoading?.classList.add('hidden');
  if(heroPreviewFallback)heroPreviewFallback.style.display='flex';
  console.warn('Hero preview model failed:',src,err);
  return false;
 }
}
function animateHeroPreview(now=performance.now()){
 heroPreviewRAF=requestAnimationFrame(animateHeroPreview);
 if(heroPreviewPaused||!heroPreviewRenderer||!heroPreviewScene||!heroPreviewCamera)return;
 if(heroPreviewModel){
  const rotationSeconds=8;
  const elapsed=(now-heroPreviewClockStart)/1000;
  heroPreviewModel.rotation.y=-Math.PI/2+(elapsed/rotationSeconds)*Math.PI*2;
 }
 heroPreviewRenderer.render(heroPreviewScene,heroPreviewCamera);
}
window.BODHeroPreview={
 select:selectHeroPreview,
 pause(){heroPreviewPaused=true;},
 resume(){heroPreviewPaused=false;resizeHeroPreview();}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initHeroPreview);
else initHeroPreview();

const textureCache=new Map();
const modelCache=new Map();
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
let enabled=true;
let latestState=null;
let cameraInitialised=false;
let cameraLockedToHero=true;
let lastCameraHeroPosition=null;
let renderToken=0;
let heroModel=null;
let heroRotationCurrent=null;
let heroTurn=null;
let heroPositionCurrent=null;
let heroMove=null;
let pendingCombatTileKey=null;
let combatScene=null;
let cameraTween=null;
let rangedCameraScene=null;

// Monster reveal drop-in: how high above the tile the monster starts, how
// long the fall takes, and the in-flight list of drops currently animating.
const MONSTER_DROP_HEIGHT=0;
const MONSTER_COMBAT_ENTRY_HEIGHT=12;
const MONSTER_DROP_MS=0;
// Final combat framing uses a 620 ms camera tween. Fresh melee monsters remain
// hidden for that move plus a full two-second dramatic hold, then enter from
// above the top of the framed view and fall into their right-side position.
const MONSTER_REVEAL_PAUSE_MS=0;
const monsterDrops=[];
let cameraShakeState=null;

function triggerCameraShake(duration=240,magnitude=.14){
 cameraShakeState={started:performance.now(),duration,magnitude};
}

function startMonsterDrop(pivot,restY,monsterName,delay=0,monsterState=null){
 // v10.90: grounded monster reveal — no vertical drop.
 pivot.position.y=restY;
 if(monsterState)monsterState._dropped=true;
 const reveal=()=>{
  try{
   pivot.scale.setScalar(.82);
   const started=performance.now();
   const duration=180;
   const animate=now=>{
    const t=Math.min(1,(now-started)/duration);
    const eased=1-Math.pow(1-t,3);
    pivot.scale.setScalar(.82+.18*eased);
    if(t<1)requestAnimationFrame(animate);
   };
   requestAnimationFrame(animate);
  }catch(e){}
  triggerCameraShake(140,.08);
  if(monsterName)playSound(monsterLandSoundKey(monsterName));
 };
 if(delay>0)setTimeout(reveal,delay);else reveal();
}

function monsterIsDropping(pivot){
 return monsterDrops.some(drop=>drop.pivot===pivot);
}

function landMonster(drop){
 drop.pivot.position.y=drop.restY;
 // Only mark this monster as having completed its reveal once it really lands.
 // This keeps the landing sound tied to the physical impact rather than model creation.
 if(drop.monsterState)drop.monsterState._dropped=true;
 triggerCameraShake(240,.16);
 if(drop.monsterName)playSound(monsterLandSoundKey(drop.monsterName));
}

const spellEffects=[];
const spellEffectGroup=new THREE.Group();
spellEffectGroup.name='Spell Effects';
scene.add(spellEffectGroup);
const HERO_TURN_MS=180;
const HERO_MOVE_MS=220;
const TILE=2.05;
const TILE_THICKNESS=.10;
const TILE_SIDE_COLOUR=0x4C3D2A;

function tileDistanceFromHero(x,y){
 if(!latestState||!latestState.player)return 0;
 const dx=x-latestState.player.x;
 const dy=y-latestState.player.y;
 return Math.sqrt(dx*dx+dy*dy);
}
function darknessForTile(x,y){
 if(!lighting.enabled)return 0;
 if(!lighting.enabled)return 0;

 const d=tileDistanceFromHero(x,y);
 const radius=Math.max(1,lighting.radius);
 const falloff=Math.max(.5,lighting.falloff);
 if(d<=radius)return 0;

 const t=THREE.MathUtils.clamp((d-radius)/falloff,0,1);

 // Keep explored board readable while preserving a visible pool of light.
 const maximumDarkness=THREE.MathUtils.lerp(.95,.3,lighting.ambient/100);
 const brightnessRelief=THREE.MathUtils.lerp(.85,.55,lighting.brightness/100);

 return t*t*maximumDarkness*brightnessRelief;
}
function objectVisibleAtTile(x,y){
 if(!lighting.enabled)return true;
 return true;
}

const tileFiles={
 start:'start.png',exit:'exit.png',straight:'straight.png',corner:'corner.png',
 t:'tjunction.png',cross:'crossroad.png',spike:'spiketrap.png',pool:'healingpool.png'
};

function slug(name){
 return String(name||'').toLowerCase().replace(/[’']/g,'').replace(/&/g,'and')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function monsterFile(name){
 const special={'Red Dragon':'dragon.glb'};
 return special[name]||slug(name)+'.glb';
}
function monsterPng(name){
 if(window.assetSrc){
  const src=window.assetSrc(name);
  if(src)return src;
 }
 if(name==='Red Dragon')return 'assets/monsters/dragon.png';
 return 'assets/monsters/'+slug(name)+'.png';
}
function heroPng(character){return 'assets/heroes/'+slug(character.name)+'.png';}

function facingRadians(facing){
 // Assumes the exported character faces South (+Z) at rotation 0.
 // Each movement direction rotates the miniature by exactly 90 degrees.
 return ({S:0,W:-Math.PI/2,N:Math.PI,E:Math.PI/2})[facing]??0;
}

function monsterFacingRadians(monsterX,monsterY,player){
 // Assumes monster GLBs face South (+Z) at rotation 0.
 if(!player)return 0;
 const dx=player.x-monsterX;
 const dz=player.y-monsterY;
 if(dx===0&&dz===0)return 0;
 return Math.atan2(dx,dz);
}

function shortestAngleDelta(from,to){
 let delta=(to-from)%(Math.PI*2);
 if(delta>Math.PI)delta-=Math.PI*2;
 if(delta<-Math.PI)delta+=Math.PI*2;
 return delta;
}

function loadTexture(path){
 if(textureCache.has(path))return textureCache.get(path);
 const promise=new Promise(resolve=>{
  textureLoader.load(path,t=>{
   t.colorSpace=THREE.SRGBColorSpace;
   t.anisotropy=renderer.capabilities.getMaxAnisotropy();
   resolve(t);
  },undefined,()=>resolve(null));
 });
 textureCache.set(path,promise);
 return promise;
}
function loadModel(path){
 if(modelCache.has(path))return modelCache.get(path);
 const promise=new Promise(resolve=>{
  gltfLoader.load(
   path,
   g=>{
    console.info('Loaded GLB:',path);
    resolve(g.scene);
   },
   undefined,
   error=>{
    console.error('Failed to load GLB:',path,error);
    resolve(null);
   }
  );
 });
 modelCache.set(path,promise);
 return promise;
}
function clearBoard(){
 // Keep the current hero alive during ordinary board redraws.
 // Recreating the GLB on every step caused intermittent disappearing models.
 const preservedHero=heroModel&&heroModel.parent===boardGroup?heroModel:null;

 heroTurn=null;
 heroMove=null;

 const children=[...boardGroup.children];
 children.forEach(obj=>{
  if(obj===preservedHero)return;

  boardGroup.remove(obj);
  obj.traverse?.(o=>{
   if(o.geometry&&!o.userData.cached)o.geometry.dispose?.();
   if(o.material&&!o.userData.cached){
    const mats=Array.isArray(o.material)?o.material:[o.material];
    mats.forEach(m=>m.dispose?.());
   }
  });
 });

 heroModel=preservedHero;
}
function markClickable(obj,type,key){
 obj.userData.actionType=type;
 obj.userData.tileKey=key;
 obj.traverse?.(o=>{o.userData.actionType=type;o.userData.tileKey=key;});
}

function seededFraction(seed,index){
 const x=Math.sin((seed+index*1013)*12.9898)*43758.5453;
 return x-Math.floor(x);
}

function addBloodStain(x,y,seed=1,offsetX=0,offsetZ=0){
 const group=new THREE.Group();

 // Keep the main pool slightly off-centre so corner loot remains visible.
 const poolShiftX=(seededFraction(seed,90)-.5)*.22;
 const poolShiftZ=(seededFraction(seed,91)-.5)*.22;

 group.position.set(
  x*TILE+offsetX+poolShiftX,
  TILE_THICKNESS+.006,
  y*TILE+offsetZ+poolShiftZ
 );
 group.rotation.x=-Math.PI/2;
 group.rotation.z=seededFraction(seed,1)*Math.PI*2;
 group.renderOrder=2;

 const makeBloodMaterial=(opacity=.72)=>new THREE.MeshBasicMaterial({
  // Solid tile-surface decal: miniatures correctly occlude the blood.
  color:opacity>.66?0x65130f:0x7a2119,
  transparent:false,
  opacity:1,
  depthTest:true,
  depthWrite:true,
  side:THREE.DoubleSide,
  polygonOffset:true,
  polygonOffsetFactor:-2,
  polygonOffsetUnits:-2
 });

 // Uneven central pool.
 const blobs=7;
 for(let i=0;i<blobs;i++){
  const radius=.10+seededFraction(seed,i+2)*.17;
  const blob=new THREE.Mesh(
   new THREE.CircleGeometry(radius,20),
   makeBloodMaterial(.60+seededFraction(seed,i+42)*.18)
  );
  const angle=seededFraction(seed,i+12)*Math.PI*2;
  const distance=seededFraction(seed,i+22)*.23;
  blob.position.set(
   Math.cos(angle)*distance,
   Math.sin(angle)*distance,
   i*.00035
  );
  blob.scale.set(
   .75+seededFraction(seed,i+31)*.75,
   .45+seededFraction(seed,i+32)*.65,
   1
  );
  group.add(blob);
 }

 // Fine splatter droplets radiating away from the corpse.
 const droplets=14;
 for(let i=0;i<droplets;i++){
  const radius=.018+seededFraction(seed,i+102)*.035;
  const drop=new THREE.Mesh(
   new THREE.CircleGeometry(radius,12),
   makeBloodMaterial(.48+seededFraction(seed,i+132)*.28)
  );
  const angle=seededFraction(seed,i+112)*Math.PI*2;
  const distance=.28+seededFraction(seed,i+122)*.42;
  drop.position.set(
   Math.cos(angle)*distance,
   Math.sin(angle)*distance,
   .004+i*.00015
  );
  drop.scale.y=.55+seededFraction(seed,i+142)*.7;
  group.add(drop);
 }

 boardGroup.add(group);
 return group;
}

const CORPSE_OVERRIDES={
 reacher:{axis:'x',angle:76,sideOffset:.05},
 'giant-snake':{axis:'x',angle:26,sideOffset:.05},
 snake:{axis:'x',angle:26,sideOffset:.05},
 dragon:{axis:'z',angle:72,sideOffset:.10},
 'mirror-monster':{axis:'z',angle:86,sideOffset:.04}
};

function chooseCorpsePose(modelPath,size,fallSide=1){
 const key=modelKeyFromPath(modelPath);
 const override=CORPSE_OVERRIDES[key];

 if(override){
  return {
   axis:override.axis,
   angle:THREE.MathUtils.degToRad(override.angle)*(fallSide||1),
   sideOffset:override.sideOffset||0
  };
 }

 // Lay the model's vertical height into whichever horizontal direction has
 // more spare room. This gives thin zombies and broad tentacled creatures
 // different, geometry-aware fall directions.
 const axis=size.x<=size.z?'z':'x';

 // Tall narrow figures fall almost flat. Broad/low figures use a gentler tilt.
 const horizontal=Math.max(size.x,size.z,.001);
 const tallness=size.y/horizontal;
 const degrees=THREE.MathUtils.clamp(
  68+tallness*12,
  72,
  88
 );

 return {
  axis,
  angle:THREE.MathUtils.degToRad(degrees)*(fallSide||1),
  sideOffset:THREE.MathUtils.clamp(horizontal*.045,.02,.13)
 };
}

async function addCorpseMiniature(corpse,x,y,token){
 const file=monsterFile(corpse.name);
 const path='assets/models/'+file;
 const source=await loadModel(path);
 if(token!==renderToken)return;
 if(!source){
  // No GLB yet for this monster — still show something instead of an invisible kill.
  await addSprite(monsterPng(corpse.name),x,y,.85,.04,null,null,token);
  addBloodStain(x,y,corpse.bloodSeed||1,corpse.offsetX||0,corpse.offsetZ||0);
  return;
 }

 const model=source.clone(true);
 model.traverse(o=>{
  if(!o.isMesh)return;
  o.castShadow=true;
  o.receiveShadow=true;
  o.userData.cached=true;

  const materials=Array.isArray(o.material)?o.material:[o.material];
  materials.forEach(material=>{
   if(!material)return;
   material=material.clone?.()||material;
   if(material.color){
    material.color.multiplyScalar(.62);
   }
   if(material.emissive)material.emissive.setHex(0x000000);
   material.roughness=Math.max(.88,material.roughness??.88);
   material.needsUpdate=true;
   o.material=material;
  });
 });

 const originalBox=new THREE.Box3().setFromObject(model);
 const originalSize=originalBox.getSize(new THREE.Vector3());
 const targetHeight=targetSceneHeightForModel(path);
 model.scale.setScalar(targetHeight/Math.max(originalSize.y,.001));
 model.updateMatrixWorld(true);

 const scaledBox=new THREE.Box3().setFromObject(model);
 const centre=scaledBox.getCenter(new THREE.Vector3());
 const standingSize=scaledBox.getSize(new THREE.Vector3());

 // Rotate around the model's true geometric centre via this intermediate
 // group, not the .glb's own baked-in origin — a source model authored
 // off-centre (e.g. a low, sprawled creature) would otherwise swing through
 // a huge arc when tipped, instead of toppling roughly in place.
 model.position.set(-centre.x,-centre.y,-centre.z);
 const fallGroup=new THREE.Group();
 fallGroup.add(model);

 const pivot=new THREE.Group();
 pivot.position.set(
  x*TILE+(corpse.offsetX||0),
  TILE_THICKNESS+.018,
  y*TILE+(corpse.offsetZ||0)
 );
 pivot.rotation.y=corpse.rotationY||0;

 // Choose the fall direction from the model's actual scaled dimensions.
 // The system can see the outer geometry bounds, although it does not know anatomy.
 const pose=chooseCorpsePose(path,standingSize,corpse.fallSide||1);

 if(pose.axis==='x'){
  fallGroup.rotation.x=pose.angle;
  fallGroup.position.z+=(corpse.fallSide||1)*pose.sideOffset;
 }else{
  fallGroup.rotation.z=pose.angle;
  fallGroup.position.x+=(corpse.fallSide||1)*pose.sideOffset;
 }

 pivot.add(fallGroup);
 pivot.userData.isCorpse=true;
 pivot.userData.monsterName=corpse.name;
 boardGroup.add(pivot);

 // Rotation changes the model's vertical bounds. Measure the finished fallen
 // miniature and lift/lower the whole pivot so its lowest point rests on the tile.
 // A small negative bias is deliberate: some source models measure slightly
 // wrong (e.g. a rig's bind pose vs its actual posed shape), so it's safer to
 // sink a corpse a touch into the stone than to have it float above it.
 const CORPSE_EMBED_BIAS=.035;
 pivot.updateMatrixWorld(true);
 const fallenBounds=new THREE.Box3().setFromObject(pivot);
 const tileSurface=TILE_THICKNESS+.022-CORPSE_EMBED_BIAS;
 if(Number.isFinite(fallenBounds.min.y)){
  pivot.position.y+=tileSurface-fallenBounds.min.y;
  pivot.updateMatrixWorld(true);
 }

 // Re-centre using the finished fallen outline, then clamp the corpse so wide
 // tentacles, weapons and bases stay reasonably close to the encounter tile.
 const groundedBounds=new THREE.Box3().setFromObject(pivot);
 const groundedCentre=groundedBounds.getCenter(new THREE.Vector3());
 const desiredX=x*TILE+(corpse.offsetX||0);
 const desiredZ=y*TILE+(corpse.offsetZ||0);

 pivot.position.x+=desiredX-groundedCentre.x;
 pivot.position.z+=desiredZ-groundedCentre.z;
 pivot.updateMatrixWorld(true);

 const finalBounds=new THREE.Box3().setFromObject(pivot);
 const halfTile=TILE*.72;
 const minAllowedX=x*TILE-halfTile;
 const maxAllowedX=x*TILE+halfTile;
 const minAllowedZ=y*TILE-halfTile;
 const maxAllowedZ=y*TILE+halfTile;

 if(finalBounds.min.x<minAllowedX)pivot.position.x+=minAllowedX-finalBounds.min.x;
 if(finalBounds.max.x>maxAllowedX)pivot.position.x-=finalBounds.max.x-maxAllowedX;
 if(finalBounds.min.z<minAllowedZ)pivot.position.z+=minAllowedZ-finalBounds.min.z;
 if(finalBounds.max.z>maxAllowedZ)pivot.position.z-=finalBounds.max.z-maxAllowedZ;

 addBloodStain(
  x,
  y,
  corpse.bloodSeed||1,
  corpse.offsetX||0,
  corpse.offsetZ||0
 );

 return pivot;
}

async function addTile(key,t,token){
 const [x,y]=key.split(',').map(Number);
 const file=tileFiles[t.kind]||'crossroad.png';
 const tex=await loadTexture('assets/tiles/'+file);
 if(token!==renderToken)return;
 // Shallow punchboard body. Its brown edge is visible beneath the artwork.
 const sideMaterial=new THREE.MeshStandardMaterial({
  color:TILE_SIDE_COLOUR,
  roughness:.96,
  metalness:0
 });
 const tileBody=new THREE.Mesh(
  new THREE.BoxGeometry(TILE-.025,TILE_THICKNESS,TILE-.025),
  sideMaterial
 );
 tileBody.position.set(x*TILE,TILE_THICKNESS*.5,y*TILE);
 tileBody.rotation.y=-(t.rot||0)*Math.PI/2;
 tileBody.castShadow=true;
 tileBody.receiveShadow=true;
 markClickable(tileBody,'tile',key);
 boardGroup.add(tileBody);

 // Keep the existing PNG as a separate top face so its orientation remains unchanged.
 const topMaterial=new THREE.MeshStandardMaterial({
  map:tex||null,
  color:tex?0xffffff:0xd8c79a,
  roughness:.86,
  metalness:0,
  side:THREE.DoubleSide
 });
 const mesh=new THREE.Mesh(
  new THREE.PlaneGeometry(TILE-.025,TILE-.025),
  topMaterial
 );
 mesh.rotation.x=-Math.PI/2;
 mesh.rotation.z=-(t.rot||0)*Math.PI/2;
 mesh.position.set(x*TILE,TILE_THICKNESS+.002,y*TILE);
 mesh.receiveShadow=true;
 markClickable(mesh,'tile',key);
 boardGroup.add(mesh);

 const darkness=darknessForTile(x,y);
 if(darkness>0){
  const shadeMaterial=new THREE.MeshBasicMaterial({
   color:0x000000,
   transparent:true,
   opacity:Math.min(.9,darkness),
   depthWrite:false,
   side:THREE.DoubleSide
  });
  const shade=new THREE.Mesh(
   new THREE.PlaneGeometry(TILE-.015,TILE-.015),
   shadeMaterial
  );
  shade.rotation.x=-Math.PI/2;
  shade.position.set(x*TILE,TILE_THICKNESS+.018,y*TILE);
  shade.renderOrder=20;
  boardGroup.add(shade);
 }

 if(t.itemPending&&!t.itemUsed)await addSprite('assets/ui/item.png',x,y,.66,.05,'items',key,token);
 if(t.hasRing){
  const ringSprite=await addSprite(
   'assets/ui/ring.png',
   x,
   y,
   .62,
   .64,
   null,
   key,
   token
  );

  if(ringSprite){
   ringSprite.renderOrder=500;
   ringSprite.userData.floatObject=true;
   ringSprite.userData.floatBaseY=ringSprite.position.y;
   ringSprite.userData.floatAmplitude=.085;
   ringSprite.userData.floatSpeed=1.25;
   ringSprite.userData.floatPhase=(x*1.73+y*2.19);
   ringSprite.userData.isRing=true;

   // Soft gold halo beneath the hovering Ring.
   const halo=new THREE.Mesh(
    new THREE.CircleGeometry(.48,32),
    new THREE.MeshBasicMaterial({
     color:0xffc84a,
     transparent:true,
     opacity:.28,
     depthWrite:false,
     blending:THREE.AdditiveBlending,
     side:THREE.DoubleSide
    })
   );
   halo.rotation.x=-Math.PI/2;
   halo.position.set(x*TILE,TILE_THICKNESS+.025,y*TILE);
   halo.renderOrder=35;
   halo.userData.ringHalo=true;
   halo.userData.floatPhase=ringSprite.userData.floatPhase;
   boardGroup.add(halo);

   const ringLight=new THREE.PointLight(0xffc14d,5.5,4.2,2);
   ringLight.position.set(x*TILE,1.05,y*TILE);
   ringLight.userData.ringLight=true;
   ringLight.userData.floatPhase=ringSprite.userData.floatPhase;
   boardGroup.add(ringLight);
  }
 }
 if(t.droppedItems&&t.droppedItems.length){
  const stack=t.droppedItems.slice(0,8);
  const itemSize=.46;
  const verticalGap=.22;

  // Keep dropped loot away from the centre, where heroes and corpses stand.
  // Items fill the four tile corners first; extras stack above those corners.
  const cornerOffsets=[
   {x:-.62,z:-.62},
   {x:.62,z:-.62},
   {x:-.62,z:.62},
   {x:.62,z:.62}
  ];

  for(let i=0;i<stack.length;i++){
   const item=stack[i];
   const corner=cornerOffsets[i%cornerOffsets.length];
   const level=Math.floor(i/cornerOffsets.length);
   const stackHeight=.24+(level*verticalGap);

   const sprite=await addSprite(
    'assets/items/'+slug(item.name)+'.png',
    x,
    y,
    itemSize,
    stackHeight,
    'items',
    key,
    token
   );

   if(sprite){
    sprite.position.x+=corner.x;
    sprite.position.z+=corner.z;
    sprite.renderOrder=200+i;
    sprite.userData.itemCorner=i%cornerOffsets.length;
    sprite.userData.floatObject=true;
    sprite.userData.floatBaseY=sprite.position.y;
    sprite.userData.floatAmplitude=.032;
    sprite.userData.floatSpeed=.82;
    sprite.userData.floatPhase=(x*1.41+y*2.07+i*1.37);

    // Transparent sprites are normally depth-sorted against the blood planes.
    // Disable depth testing for loot so the complete icon always remains visible.
    if(sprite.material){
     sprite.material.depthTest=true;
     sprite.material.depthWrite=false;
     sprite.material.depthFunc=THREE.AlwaysDepth;
     sprite.material.transparent=true;
     sprite.material.alphaTest=.04;
     sprite.material.needsUpdate=true;
    }

    // Force loot into a final overlay pass. Transparent blood planes can still
    // sort over a Sprite at steep camera angles, so clear only the depth buffer
    // immediately before drawing each item and render it last.
    sprite.renderOrder=10000+i;
    sprite.frustumCulled=false;
    sprite.onBeforeRender=(renderer)=>{
     renderer.clearDepth();
    };

    // Small dark backing disc keeps the icon readable over blood and corpses.
    const backing=new THREE.Mesh(
     new THREE.CircleGeometry(itemSize*.43,24),
     new THREE.MeshBasicMaterial({
      color:0x1b140f,
      transparent:true,
      opacity:.78,
      depthWrite:false,
      polygonOffset:true,
      polygonOffsetFactor:-4,
      polygonOffsetUnits:-4
     })
    );
    backing.rotation.x=-Math.PI/2;
    backing.position.set(
     sprite.position.x,
     TILE_THICKNESS+.075+(level*.01),
     sprite.position.z
    );
    backing.material.depthTest=true;
    backing.material.depthWrite=false;
    backing.material.depthFunc=THREE.AlwaysDepth;
    backing.renderOrder=9990+i;
    backing.frustumCulled=false;
    backing.onBeforeRender=(renderer)=>{
     renderer.clearDepth();
    };
    boardGroup.add(backing);
   }
  }
 }
 if(t.corpses&&t.corpses.length){
  // Keep the persistent blood history, but do not draw tipped-over corpse models.
  for(const corpse of t.corpses){
   addBloodStain(
    x,
    y,
    corpse.bloodSeed||1,
    corpse.offsetX||0,
    corpse.offsetZ||0
   );
  }
 }

 if((t.monsterPending)||(t.monster&&t.monster.health>0)){
  if(t.monster&&(t.monster.revealed||t.monster.peeked)){
   // Only the very first time this monster instance is drawn should it drop
   // in from above with a ground-shake and landing sound. Every later
   // redraw (movement, tile placement, camera moves) must place it quietly
   // at rest, or it would appear to fall again on every re-render.
   const playDrop=!t.monster._dropped;
   await addMonsterMiniature(
    'assets/models/'+monsterFile(t.monster.name),
    monsterPng(t.monster.name),
    x,
    y,
    'monster',
    key,
    token,
    monsterFacingRadians(x,y,latestState&&latestState.player),
    playDrop,
    t.monster.name,
    t.monster
   );
  }else{
   await addSprite('assets/ui/hiddenmonster.png',x,y,.9,.1,'hidden',key,token);
  }
 }
}
async function addSprite(path,x,y,size,height,type,key,token){
 const tex=await loadTexture(path);
 if(token!==renderToken||!tex)return;
 const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});
 const s=new THREE.Sprite(mat);
 s.scale.set(size,size,1);
 s.position.set(x*TILE,TILE_THICKNESS+height+size*.5,y*TILE);
 const darkness=darknessForTile(x,y);
 s.visible=objectVisibleAtTile(x,y);
 // Keep monster PNG fallbacks fully opaque. Applying dungeon darkness through
 // alpha made creatures such as the Goblin look transparent against the tile.
 // Tint the sprite instead, while retaining alpha only for the PNG cut-out.
 if(type==='monster'){
  s.material.opacity=1;
  s.material.color.setScalar(Math.max(.22,1-darkness*.78));
 }else{
  s.material.opacity=Math.max(.15,1-darkness);
 }
 if(type)markClickable(s,type,key);
 boardGroup.add(s);
 return s;
}
function combatScreenRightVector(){
 const forward=new THREE.Vector3();
 camera.getWorldDirection(forward);
 forward.y=0;
 if(forward.lengthSq()<.0001)forward.set(0,0,-1);
 forward.normalize();
 return new THREE.Vector3(-forward.z,0,forward.x).normalize();
}
function preCombatSidePosition(tileKey,side){
 const [tx,tz]=String(tileKey||'0,0').split(',').map(Number);
 const centre=new THREE.Vector3(tx*TILE,TILE_THICKNESS,tz*TILE);
 return centre.addScaledVector(combatScreenRightVector(),TILE*.52*side);
}

async function addMonsterMiniature(modelPath,pngPath,x,y,type,key,token,rotationY=0,playDrop=false,monsterName='',monsterState=null){
 const source=await loadModel(modelPath);
 if(token!==renderToken)return;
 if(!source){
  await addSprite(pngPath,x,y,1.05,.05,type,key,token);
  return;
 }

 const model=source.clone(true);
 model.traverse(o=>{
  if(o.isMesh){
   o.castShadow=true;
   o.receiveShadow=true;

   // Clone materials per miniature. This prevents one model's darkness/opacity
   // changes from altering the cached GLB or another monster using that material.
   if(o.material){
    o.material=Array.isArray(o.material)
     ?o.material.map(material=>material.clone())
     :o.material.clone();

    const materials=Array.isArray(o.material)?o.material:[o.material];
    materials.forEach(material=>{
     // Some exported GLBs, notably the Goblin, can retain Alpha Blend settings.
     // Start every living miniature fully solid; distance darkness is applied below.
     material.transparent=false;
     material.opacity=1;
     material.alphaTest=0;
     material.depthTest=true;
     material.depthWrite=true;
     material.side=THREE.FrontSide;
     material.needsUpdate=true;
     material.userData=material.userData||{};
     material.userData.bodMiniatureMaterial=true;
    });
   }

   // Geometry remains shared with the cached GLB and must not be disposed.
   o.userData.cached=true;
  }
 });

 // Scale first.
 const originalBox=new THREE.Box3().setFromObject(model);
 const originalSize=originalBox.getSize(new THREE.Vector3());
 const targetHeight=targetSceneHeightForModel(modelPath);
 const scale=targetHeight/Math.max(originalSize.y,.001);
 model.scale.setScalar(scale);
 model.updateMatrixWorld(true);

 // Centre the GLB around a local pivot.
 const scaledBox=new THREE.Box3().setFromObject(model);
 const centre=scaledBox.getCenter(new THREE.Vector3());
 model.position.set(
  -centre.x,
  -scaledBox.min.y+.025,
  -centre.z
 );

 // The pivot stays exactly at the centre of the dungeon tile.
 // Only the child model turns, so it cannot orbit away from the tile.
 const pivot=new THREE.Group();
 pivot.position.set(x*TILE,TILE_THICKNESS,y*TILE);
 // During a fresh melee reveal, place the monster over the screen-right
 // combat position before it falls. The hero uses the matching left side.
 if(playDrop&&pendingCombatTileKey===key){
  const preCombatMonsterPosition=preCombatSidePosition(key,1);
  pivot.position.x=preCombatMonsterPosition.x;
  pivot.position.z=preCombatMonsterPosition.z;
 }
 pivot.rotation.y=rotationY;
 pivot.add(model);
 pivot.visible=objectVisibleAtTile(x,y);
 // Reveal drop: start elevated above the tile. startMonsterDrop() (called
 // once the pivot is in the scene, below) animates it down to TILE_THICKNESS.
 const dropRestY=TILE_THICKNESS;
 if(playDrop)pivot.position.y=dropRestY+MONSTER_DROP_HEIGHT;
 const darkness=darknessForTile(x,y);
 model.traverse(o=>{
  if(!o.material)return;
  const materials=Array.isArray(o.material)?o.material:[o.material];
  materials.forEach(material=>{
   if(material.emissive)material.emissive.setHex(0x000000);

   // Living miniatures stay opaque. Darkness is represented by colour rather
   // than alpha, preventing the Goblin and other GLBs appearing ghost-like.
   material.transparent=false;
   material.opacity=1;
   material.depthWrite=true;
   material.depthTest=true;

   if(material.color){
    const base=material.userData.bodBaseColour
     ?new THREE.Color(material.userData.bodBaseColour)
     :material.color.clone();
    if(!material.userData.bodBaseColour){
     material.userData.bodBaseColour='#'+base.getHexString();
    }
    const shade=Math.max(.18,1-darkness*.82);
    material.color.copy(base).multiplyScalar(shade);
   }
   material.needsUpdate=true;
  });
 });

 markClickable(pivot,type,key);
 boardGroup.add(pivot);
 if(playDrop)startMonsterDrop(
  pivot,
  dropRestY,
  monsterName,
  pendingCombatTileKey===key?MONSTER_REVEAL_PAUSE_MS:0,
  monsterState
 );
 return pivot;
}

async function addMiniature(modelPath,pngPath,x,y,type,key,token,rotationY=0){
 const source=await loadModel(modelPath);
 if(token!==renderToken)return;
 if(!source){await addSprite(pngPath,x,y,1.05,.05,type,key,token);return;}
 const model=source.clone(true);
 model.traverse(o=>{
  if(o.isMesh){
   o.castShadow=true;
   o.receiveShadow=true;

   // Keep the cached GLB resources alive when lighting changes redraw the board.
   o.userData.cached=true;
  }
 });
 const box=new THREE.Box3().setFromObject(model);
 const size=box.getSize(new THREE.Vector3());

 // Fall back to PNG if a GLB loads but contains no usable visible geometry.
 if(
  !Number.isFinite(size.x) ||
  !Number.isFinite(size.y) ||
  !Number.isFinite(size.z) ||
  size.y<=0.001
 ){
  console.warn('Invalid or empty GLB, using PNG fallback:',modelPath);
  await addSprite(pngPath,x,y,1.05,.05,type,key,token);
  return;
 }

 const targetHeight=targetSceneHeightForModel(modelPath);
 const scale=targetHeight/Math.max(size.y,.001);
 model.scale.setScalar(scale);
 model.updateMatrixWorld(true);
 const scaled=new THREE.Box3().setFromObject(model);
 const centre=scaled.getCenter(new THREE.Vector3());

 // Centre the model at the pivot's local origin, then rotate the pivot
 // (not the model). Rotating the model directly would spin it around
 // whatever origin its source .glb happens to use, not its own visual
 // centre, making it appear to swing/orbit instead of turning in place.
 model.position.set(-centre.x,-scaled.min.y+.025,-centre.z);
 const pivot=new THREE.Group();
 pivot.position.set(x*TILE,TILE_THICKNESS,y*TILE);
 pivot.rotation.y=rotationY;
 pivot.add(model);
 markClickable(pivot,type,key);
 boardGroup.add(pivot);
 return pivot;
}
async function addHero(character,player,token){
 const file=characterModelFile(character);
 const path=`assets/models/${file}?v=${encodeURIComponent(VERSION)}`;
 const targetRotation=facingRadians(player.facing||'S');
 const startRotation=heroRotationCurrent===null
  ? targetRotation
  : heroRotationCurrent;

 const targetPosition={
  x:player.x*TILE,
  y:TILE_THICKNESS,
  z:player.y*TILE
 };

 // For a newly revealed melee encounter, the hero moves into the left-side
 // fighting position before the delayed monster drop begins on the right.
 const heroTileKey=player.x+','+player.y;
 if(pendingCombatTileKey===heroTileKey){
  const preCombatHeroPosition=preCombatSidePosition(heroTileKey,-1);
  targetPosition.x=preCombatHeroPosition.x;
  targetPosition.z=preCombatHeroPosition.z;
 }

 // The hero root is a clean, stable game-space group. Its position is always
 // the exact centre of a dungeon tile and its rotation is always the facing.
 // The imported GLB is centred once as a child and is never re-centred again.
 if(
  heroModel &&
  heroModel.parent===boardGroup &&
  heroModel.userData.heroId===character.id
 ){
  const startPosition={
   x:heroModel.position.x,
   y:heroModel.position.y,
   z:heroModel.position.z
  };

  const rotationDelta=shortestAngleDelta(startRotation,targetRotation);
  if(Math.abs(rotationDelta)<.001){
   heroModel.rotation.y=targetRotation;
   heroRotationCurrent=targetRotation;
   heroTurn=null;
  }else{
   heroTurn={
    model:heroModel,
    start:startRotation,
    delta:rotationDelta,
    started:performance.now(),
    duration:HERO_TURN_MS,
    target:targetRotation
   };
  }

  const moved=
   Math.abs(targetPosition.x-startPosition.x)>.001 ||
   Math.abs(targetPosition.z-startPosition.z)>.001;

  if(moved){
   heroMove={
    model:heroModel,
    start:startPosition,
    target:targetPosition,
    started:performance.now(),
    duration:HERO_MOVE_MS
   };
  }else{
   heroModel.position.set(
    targetPosition.x,
    targetPosition.y,
    targetPosition.z
   );
   heroPositionCurrent={...targetPosition};
   heroMove=null;
  }

  heroModel.userData.heroGridX=player.x;
  heroModel.userData.heroGridY=player.y;
  heroModel.visible=true;
  return heroModel;
 }

 const source=await loadModel(path);
 if(token!==renderToken)return;

 if(!source){
  // PNG fallback still uses a clean root so movement remains identical.
  const root=new THREE.Group();
  root.position.set(
   targetPosition.x,
   targetPosition.y,
   targetPosition.z
  );
  root.rotation.y=targetRotation;
  root.userData.heroId=character.id;
  root.userData.heroGridX=player.x;
  root.userData.heroGridY=player.y;
  root.userData.heroFallback=true;

  const texture=await loadTexture(heroPng(character));
  if(token!==renderToken)return;

  if(texture){
   const material=new THREE.SpriteMaterial({
    map:texture,
    transparent:true,
    depthTest:true,
    depthWrite:false
   });
   const sprite=new THREE.Sprite(material);
   sprite.scale.set(1.05,1.05,1);
   sprite.position.y=.55;
   root.add(sprite);
  }

  boardGroup.add(root);
  heroModel=root;
  heroRotationCurrent=targetRotation;
  heroPositionCurrent={...targetPosition};
  return root;
 }

 const visual=source.clone(true);
 visual.traverse(object=>{
  if(!object.isMesh)return;

  object.castShadow=true;
  object.receiveShadow=true;
  object.userData.cached=true;
  object.renderOrder=1000;

  const materials=Array.isArray(object.material)
   ? object.material
   : [object.material];

  materials.forEach(material=>{
   if(!material)return;
   material.depthTest=true;
   material.depthWrite=true;
   material.transparent=false;
   material.opacity=1;
   material.needsUpdate=true;
  });
 });

 // Normalise physical height first.
 visual.updateMatrixWorld(true);
 const originalBounds=new THREE.Box3().setFromObject(visual);
 const originalSize=originalBounds.getSize(new THREE.Vector3());

 if(
  !Number.isFinite(originalSize.x) ||
  !Number.isFinite(originalSize.y) ||
  !Number.isFinite(originalSize.z) ||
  originalSize.y<=.001
 ){
  console.warn('Invalid hero GLB:',path);
  return;
 }

 const targetHeight=targetSceneHeightForModel(path);
 visual.scale.setScalar(
  targetHeight/Math.max(originalSize.y,.001)
 );
 visual.updateMatrixWorld(true);

 // Centre the visible geometry once inside the clean root. The bottom of the
 // miniature rests at local Y=0 and its horizontal centre is local X/Z=0.
 const scaledBounds=new THREE.Box3().setFromObject(visual);
 const scaledCentre=scaledBounds.getCenter(new THREE.Vector3());

 visual.position.x-=scaledCentre.x;
 visual.position.z-=scaledCentre.z;
 visual.position.y-=scaledBounds.min.y;
 visual.updateMatrixWorld(true);

 const root=new THREE.Group();
 root.position.set(
  targetPosition.x,
  targetPosition.y,
  targetPosition.z
 );
 root.rotation.y=targetRotation;
 root.renderOrder=1000;
 root.userData.heroId=character.id;
 root.userData.heroGridX=player.x;
 root.userData.heroGridY=player.y;
 root.userData.heroBaseY=TILE_THICKNESS;
 root.userData.heroVisual=visual;

 root.add(visual);
 boardGroup.add(root);

 heroModel=root;
 heroRotationCurrent=targetRotation;

 // A new hero normally starts on its target tile. If a previous valid tracking
 // position exists, slide the clean root from there without touching the child.
 const previous=heroPositionCurrent
  ? {...heroPositionCurrent}
  : {...targetPosition};

 root.position.set(previous.x,previous.y,previous.z);

 const moved=
  Math.abs(targetPosition.x-previous.x)>.001 ||
  Math.abs(targetPosition.z-previous.z)>.001;

 if(moved){
  heroMove={
   model:root,
   start:previous,
   target:targetPosition,
   started:performance.now(),
   duration:HERO_MOVE_MS
  };
 }else{
  root.position.set(
   targetPosition.x,
   targetPosition.y,
   targetPosition.z
  );
  heroPositionCurrent={...targetPosition};
  heroMove=null;
 }

 return root;
}

function fitCamera(state){
 const keys=Object.keys(state.tiles||{});
 if(!keys.length)return;
 const pts=keys.map(k=>k.split(',').map(Number));
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const cx=(Math.min(...xs)+Math.max(...xs))*TILE/2;
 const cz=(Math.min(...ys)+Math.max(...ys))*TILE/2;
 controls.target.set(cx,.35,cz);
}
function centreCameraOnHero(){
 if(!latestState||!latestState.player)return;

 const target=new THREE.Vector3(
  latestState.player.x*TILE,
  .45,
  latestState.player.y*TILE
 );

 // Keep the current viewing angle and distance, but move the whole
 // camera rig so the adventurer becomes the centre of the screen.
 const offset=camera.position.clone().sub(controls.target);
 controls.target.copy(target);
 camera.position.copy(target).add(offset);
 controls.update();
}
function lockCameraToWorldPosition(position){
 if(!cameraLockedToHero||!position)return;
 const target=new THREE.Vector3(position.x,.45,position.z);
 if(!lastCameraHeroPosition){
  lastCameraHeroPosition=target.clone();
 }
 const delta=target.clone().sub(lastCameraHeroPosition);
 if(delta.lengthSq()>0){
  controls.target.add(delta);
  camera.position.add(delta);
  lastCameraHeroPosition.copy(target);
 }
}
function resetCameraHeroTracking(){
 if(heroPositionCurrent){
  lastCameraHeroPosition=new THREE.Vector3(
   heroPositionCurrent.x,
   .45,
   heroPositionCurrent.z
  );
 }else if(latestState&&latestState.player){
  lastCameraHeroPosition=new THREE.Vector3(
   latestState.player.x*TILE,
   .45,
   latestState.player.y*TILE
  );
 }else{
  lastCameraHeroPosition=null;
 }
}
function northUp(){
 if(!latestState||!latestState.player)return;
 const target=new THREE.Vector3(
  latestState.player.x*TILE,
  .45,
  latestState.player.y*TILE
 );
 const distance=camera.position.distanceTo(controls.target);
 const height=Math.max(6,camera.position.y-controls.target.y);
 controls.target.copy(target);
 camera.position.set(target.x,target.y+height,target.z+Math.max(6,distance*.78));
 controls.update();
}
function updateCompass(){
 const arrow=document.getElementById('compassArrow');
 if(!arrow)return;

 const direction=new THREE.Vector3();
 camera.getWorldDirection(direction);

 // Compass labels stay fixed on screen while the arrow shows world North.
 // Using -Z corrects the previous 180-degree reversal.
 const angle=Math.atan2(direction.x,-direction.z);
 arrow.style.transform=`rotate(${-THREE.MathUtils.radToDeg(angle)}deg)`;
}

function findMonsterAtTile(tileKey){
 return boardGroup.children.find(obj=>
  obj.userData?.actionType==='monster' &&
  obj.userData?.tileKey===tileKey
 )||null;
}
function yawTowards(from,to){
 return Math.atan2(to.x-from.x,to.z-from.z);
}
function startCameraTween(position,target,duration=620){
 cameraTween={
  startPosition:camera.position.clone(),
  startTarget:controls.target.clone(),
  endPosition:position.clone(),
  endTarget:target.clone(),
  started:performance.now(),
  duration
 };
}
function stageCombatScene(tileKey){
 if(!tileKey||!heroModel)return false;
 const monster=findMonsterAtTile(tileKey);
 if(!monster)return false;

 const monsterDropping=monsterIsDropping(monster);

 if(combatScene&&combatScene.tileKey===tileKey&&combatScene.monster===monster)return true;

 const [tx,tz]=tileKey.split(',').map(Number);
 const centre=new THREE.Vector3(tx*TILE,TILE_THICKNESS,tz*TILE);

 const forward=new THREE.Vector3();
 camera.getWorldDirection(forward);
 forward.y=0;
 if(forward.lengthSq()<.0001)forward.set(0,0,-1);
 forward.normalize();

 const right=new THREE.Vector3(-forward.z,0,forward.x).normalize();

 const heroStart={position:heroModel.position.clone(),rotationY:heroModel.rotation.y};
 const monsterStart={position:monster.position.clone(),rotationY:monster.rotation.y};

 // Measure the actual miniatures, including broad bases, weapons and tails.
 heroModel.updateMatrixWorld(true);
 monster.updateMatrixWorld(true);
 const heroSize=new THREE.Box3().setFromObject(heroModel)
  .getSize(new THREE.Vector3());
 const monsterSize=new THREE.Box3().setFromObject(monster)
  .getSize(new THREE.Vector3());

 const heroRadius=Math.max(heroSize.x,heroSize.z)*.5;
 const monsterRadius=Math.max(monsterSize.x,monsterSize.z)*.5;
 const requiredDistance=heroRadius+monsterRadius+.24;
 const separation=THREE.MathUtils.clamp(
  requiredDistance*.5,
  TILE*.36,
  TILE*.92
 );

 const heroTarget=centre.clone().addScaledVector(right,-separation);
 const monsterTarget=centre.clone().addScaledVector(right,separation);
 heroTarget.y=heroStart.position.y;
 monsterTarget.y=monsterStart.position.y;

 heroModel.position.copy(heroTarget);
 // During the reveal hold/drop, move the monster horizontally into its final
 // screen-right fighting position without cancelling its vertical fall.
 if(monsterDropping){
  monster.position.x=monsterTarget.x;
  monster.position.z=monsterTarget.z;
 }else{
  monster.position.copy(monsterTarget);
 }
 heroModel.rotation.y=yawTowards(heroTarget,monsterTarget);
 monster.rotation.y=yawTowards(monsterTarget,heroTarget);
 heroRotationCurrent=heroModel.rotation.y;
 heroPositionCurrent={x:heroModel.position.x,y:heroModel.position.y,z:heroModel.position.z};

 const savedCamera={position:camera.position.clone(),target:controls.target.clone()};

 // Frame against the monster's eventual landed position, not its temporary
 // off-screen drop height. Restore the airborne Y immediately afterwards so
 // the reveal animation can continue independently of the camera framing.
 const monsterAirborneY=monster.position.y;
 if(monsterDropping)monster.position.y=TILE_THICKNESS;
 heroModel.updateMatrixWorld(true);
 monster.updateMatrixWorld(true);
 const encounterBounds=new THREE.Box3()
  .setFromObject(heroModel)
  .union(new THREE.Box3().setFromObject(monster));
 if(monsterDropping){
  monster.position.y=monsterAirborneY;
  monster.updateMatrixWorld(true);
 }
 const encounterSize=encounterBounds.getSize(new THREE.Vector3());
 const encounterTarget=encounterBounds.getCenter(new THREE.Vector3());
 encounterTarget.y=Math.max(.58,encounterTarget.y*.48);

 const mobileCombat=window.innerWidth<=800;

 // Fit the complete encounter into the visible play area. This uses the actual
 // combined hero + monster bounds, so very large monsters such as the Reacher
 // automatically pull the camera farther back instead of clipping off-screen.
 const encounterSphere=encounterBounds.getBoundingSphere(new THREE.Sphere());
 const vFov=THREE.MathUtils.degToRad(camera.fov||50);
 const canvasAspect=Math.max(.45,(canvas.clientWidth||window.innerWidth)/Math.max(1,(canvas.clientHeight||window.innerHeight)));
 // The combat tray occupies the lower part of the screen, effectively reducing
 // the useful vertical framing area. Use a conservative virtual aspect ratio.
 const usableHeightFraction=mobileCombat?.56:.68;
 const effectiveAspect=Math.max(.45,canvasAspect/usableHeightFraction);
 const hFov=2*Math.atan(Math.tan(vFov/2)*effectiveAspect);
 const limitingFov=Math.min(vFov,hFov);
 const sphereFitDistance=encounterSphere.radius/Math.max(.12,Math.sin(limitingFov/2));
 const fitMargin=mobileCombat?1.55:1.42;

 const cameraDistance=Math.max(
  mobileCombat?7.6:6.2,
  encounterSize.x*(mobileCombat?2.9:2.45),
  encounterSize.z*(mobileCombat?2.9:2.45),
  encounterSize.y*(mobileCombat?2.45:2.05),
  sphereFitDistance*fitMargin
 );
 const baseCameraHeight=Math.max(
  mobileCombat?5.5:4.2,
  encounterSize.y*(mobileCombat?1.5:1.25)+(mobileCombat?2.6:2.15),
  encounterSphere.radius*(mobileCombat?1.55:1.35)+2.0
 );
 // Tilt combat 20 degrees farther overhead so the tabletop and dice faces
 // remain readable, while retaining the same camera-to-encounter distance.
 const heightAboveTarget=Math.max(.1,baseCameraHeight-encounterTarget.y);
 const baseElevation=Math.atan2(heightAboveTarget,cameraDistance);
 const combatElevation=Math.min(
  THREE.MathUtils.degToRad(78),
  baseElevation+THREE.MathUtils.degToRad(20)
 );
 const combatViewDistance=Math.hypot(cameraDistance,heightAboveTarget);
 const combatHorizontalDistance=Math.cos(combatElevation)*combatViewDistance;
 const combatVerticalDistance=Math.sin(combatElevation)*combatViewDistance;
 const cinematicPosition=encounterTarget.clone()
  .addScaledVector(forward.clone().negate(),combatHorizontalDistance);
 cinematicPosition.y=encounterTarget.y+combatVerticalDistance;

 heroTurn=null;
 heroMove=null;

 combatScene={
  tileKey,
  hero:heroModel,
  monster,
  heroStart,
  monsterStart,
  heroCombatPosition:heroTarget.clone(),
  monsterCombatPosition:monsterTarget.clone(),
  savedCamera,
  attackPulseStarted:null
 };
 cameraLockedToHero=false;
 lastCameraHeroPosition=null;
 startCameraTween(cinematicPosition,encounterTarget,620);
 return true;
}
function triggerCombatPulse(){
 if(!combatScene||!combatScene.hero||!combatScene.monster)return;
 combatScene.attackPulseStarted=performance.now();
}


function frameRangedAttack(tileKey,type='ranged'){
 if(!tileKey||!heroModel)return false;
 const monster=findMonsterAtTile(tileKey);
 if(!monster)return false;

 if(rangedCameraScene)finishRangedAttack();

 const savedCamera={
  position:camera.position.clone(),
  target:controls.target.clone()
 };

 heroModel.updateMatrixWorld(true);
 monster.updateMatrixWorld(true);

 const bounds=new THREE.Box3()
  .setFromObject(heroModel)
  .union(new THREE.Box3().setFromObject(monster));

 const target=bounds.getCenter(new THREE.Vector3());
 const size=bounds.getSize(new THREE.Vector3());

 // On mobile, place the action in the upper visible area above the combat panel.
 const mobile=window.innerWidth<=800;
 target.y=Math.max(.45,target.y*(mobile?.35:.5));

 const forward=new THREE.Vector3();
 camera.getWorldDirection(forward);
 forward.y=0;
 if(forward.lengthSq()<.0001)forward.set(0,0,-1);
 forward.normalize();

 let distance=Math.max(
  mobile?7.2:5.8,
  size.x*(mobile?2.6:2.15),
  size.z*(mobile?2.6:2.15),
  size.y*(mobile?2.1:1.75)
 );

 const position=target.clone()
  .addScaledVector(forward.clone().negate(),distance);

 position.y=Math.max(
  mobile?5.2:3.8,
  size.y*(mobile?1.35:1.05)+(mobile?2.4:1.7)
 );

 rangedCameraScene={savedCamera,tileKey,type};
 cameraLockedToHero=false;
 lastCameraHeroPosition=null;
 startCameraTween(position,target,480);
 return true;
}

function finishRangedAttack(){
 if(!rangedCameraScene)return;
 const saved=rangedCameraScene.savedCamera;
 rangedCameraScene=null;

 // Do not fight the combat camera if melee has already begun.
 if(combatScene)return;

 cameraLockedToHero=true;
 startCameraTween(saved.position,saved.target,520);
 setTimeout(resetCameraHeroTracking,540);
}

function beginCombatScene(tileKey){
 pendingCombatTileKey=tileKey;

 // Go straight to the one true final combat framing. The monster can still be
 // hidden high above the scene: stageCombatScene() frames its eventual landed
 // bounds while preserving the delayed off-screen drop animation.
 cameraLockedToHero=false;
 lastCameraHeroPosition=null;

 const started=performance.now();
 const tryStage=()=>{
  if(pendingCombatTileKey!==tileKey)return;
  if(stageCombatScene(tileKey))return;
  // The GLB may still be loading into the board. Retry briefly until it exists.
  if(performance.now()-started<3200)setTimeout(tryStage,50);
 };
 tryStage();
}
function endCombatScene(){
 pendingCombatTileKey=null;
 if(!combatScene)return;
 const c=combatScene;
 c.attackPulseStarted=null;
 combatScene=null;

 if(c.hero&&c.hero.parent===boardGroup){
  // Combat temporarily offsets the miniatures. Exploration always resumes
  // from the exact centre of the hero's current logical tile.
  const centredX=latestState.player.x*TILE;
  const centredZ=latestState.player.y*TILE;
  const centredY=TILE_THICKNESS;

  c.hero.position.set(centredX,centredY,centredZ);
  c.hero.rotation.y=c.heroStart.rotationY;
  c.hero.updateMatrixWorld(true);

  c.hero.userData.heroGridX=latestState.player.x;
  c.hero.userData.heroGridY=latestState.player.y;
  c.hero.userData.heroBaseY=centredY;

  heroRotationCurrent=c.heroStart.rotationY;
  heroPositionCurrent={
   x:c.hero.position.x,
   y:c.hero.position.y,
   z:c.hero.position.z
  };
  heroMove=null;
  heroTurn=null;
 }
 if(c.monster&&c.monster.parent===boardGroup){
  c.monster.position.copy(c.monsterStart.position);
  c.monster.rotation.y=c.monsterStart.rotationY;
 }

 cameraLockedToHero=true;
 startCameraTween(c.savedCamera.position,c.savedCamera.target,520);
 setTimeout(resetCameraHeroTracking,540);
}


function disposeEffectObject(object){
 object.traverse?.(child=>{
  child.geometry?.dispose?.();
  if(child.material){
   const materials=Array.isArray(child.material)?child.material:[child.material];
   materials.forEach(material=>material?.dispose?.());
  }
 });
 object.parent?.remove(object);
}

function effectWorldPositions(tileKey=null){
 const from=heroModel
  ?heroModel.position.clone().add(new THREE.Vector3(0,.85,0))
  :new THREE.Vector3(
    latestState.player.x*TILE,
    .9,
    latestState.player.y*TILE
   );

 let to=null;

 if(tileKey){
  const [x,z]=tileKey.split(',').map(Number);
  to=new THREE.Vector3(x*TILE,.8,z*TILE);
  const targetMonster=findMonsterAtTile(tileKey);
  if(targetMonster)to.copy(targetMonster.position).add(new THREE.Vector3(0,.8,0));
 }else if(combatScene?.monster){
  to=combatScene.monster.position.clone().add(new THREE.Vector3(0,.8,0));
 }else if(pendingCombatTileKey){
  const [x,z]=pendingCombatTileKey.split(',').map(Number);
  to=new THREE.Vector3(x*TILE,.8,z*TILE);
 }else{
  to=from.clone().add(new THREE.Vector3(0,0,-1.4));
 }

 return {from,to};
}

function makeGlowSphere(colour,size=.16,opacity=.95){
 const material=new THREE.MeshBasicMaterial({
  color:colour,
  transparent:true,
  opacity,
  blending:THREE.AdditiveBlending,
  depthWrite:false
 });
 const mesh=new THREE.Mesh(
  new THREE.SphereGeometry(size,16,12),
  material
 );
 return mesh;
}

function makeParticle(colour,size=.05,opacity=.75){
 const material=new THREE.MeshBasicMaterial({
  color:colour,
  transparent:true,
  opacity,
  depthWrite:false,
  blending:THREE.AdditiveBlending
 });
 return new THREE.Mesh(
  new THREE.SphereGeometry(size,8,6),
  material
 );
}

function playFireballEffect(from,to){
 const root=new THREE.Group();
 const orb=makeGlowSphere(0xffb126,.18,1);
 const core=makeGlowSphere(0xffff8a,.09,1);
 root.add(orb,core);

 const trail=[];
 for(let i=0;i<9;i++){
  const particle=makeParticle(
   i%2?0xff7a18:0xffd34a,
   .035+Math.random()*.035,
   .72
  );
  root.add(particle);
  trail.push(particle);
 }

 const impact=new THREE.Group();
 impact.visible=false;
 root.add(impact);

 for(let i=0;i<18;i++){
  const spark=makeParticle(
   i%3===0?0xffff9a:0xff6b16,
   .025+Math.random()*.045,
   .9
  );
  impact.add(spark);
  spark.userData.direction=new THREE.Vector3(
   Math.random()-.5,
   Math.random()*.8,
   Math.random()-.5
  ).normalize();
 }

 const smoke=[];
 for(let i=0;i<8;i++){
  const puff=makeGlowSphere(0x6f625a,.08+Math.random()*.08,.35);
  puff.visible=false;
  root.add(puff);
  smoke.push(puff);
 }

 spellEffectGroup.add(root);
 return {
  root,
  duration:2700,
  update(t){
   const travel=Math.min(1,t/.34);
   if(t<.34){
    root.position.lerpVectors(from,to,travel);
    trail.forEach((p,i)=>{
     const lag=Math.max(0,travel-i*.045);
     p.position.copy(from.clone().lerp(to,lag)).sub(root.position);
     p.material.opacity=.75*(1-travel*.35);
    });
   }else{
    orb.visible=false;
    core.visible=false;
    trail.forEach(p=>p.visible=false);
    impact.visible=true;
    impact.position.copy(to).sub(root.position);

    const impactT=Math.min(1,(t-.34)/.24);
    impact.children.forEach((spark,i)=>{
     spark.position.copy(spark.userData.direction).multiplyScalar(impactT*(.45+i*.008));
     spark.material.opacity=1-impactT;
    });

    smoke.forEach((puff,i)=>{
     const smokeT=Math.max(0,Math.min(1,(t-.48-i*.025)/.5));
     puff.visible=smokeT>0;
     puff.position.copy(to).sub(root.position).add(
      new THREE.Vector3(
       (i%3-1)*.12,
       smokeT*(.35+i*.025),
       ((i*7)%3-1)*.1
      )
     );
     puff.scale.setScalar(.7+smokeT*2.1);
     puff.material.opacity=.34*(1-smokeT);
    });
   }
  }
 };
}

function playIceEffect(from,to){
 const root=new THREE.Group();
 const bolt=makeGlowSphere(0xbff6ff,.11,1);
 root.add(bolt);

 const shards=[];
 for(let i=0;i<12;i++){
  const shard=new THREE.Mesh(
   new THREE.ConeGeometry(.035,.22,5),
   new THREE.MeshBasicMaterial({
    color:i%2?0xb8efff:0xffffff,
    transparent:true,
    opacity:.88,
    depthWrite:false,
    blending:THREE.AdditiveBlending
   })
  );
  shard.visible=false;
  root.add(shard);
  shards.push(shard);
 }

 const mist=[];
 for(let i=0;i<10;i++){
  const puff=makeGlowSphere(0xc9f4ff,.07+Math.random()*.07,.28);
  puff.visible=false;
  root.add(puff);
  mist.push(puff);
 }

 spellEffectGroup.add(root);
 return {
  root,
  duration:2500,
  update(t){
   const travel=Math.min(1,t/.28);
   if(t<.28){
    bolt.position.lerpVectors(from,to,travel);
    bolt.scale.set(1+travel*1.3,.65,1+travel*1.3);
   }else{
    bolt.visible=false;
    const freezeT=Math.max(0,Math.min(1,(t-.28)/.3));
    shards.forEach((shard,i)=>{
     shard.visible=true;
     const angle=i/shards.length*Math.PI*2;
     const radius=.18+freezeT*.34;
     shard.position.set(
      to.x+Math.cos(angle)*radius,
      to.y-.45+freezeT*(.25+(i%4)*.13),
      to.z+Math.sin(angle)*radius
     );
     shard.rotation.z=angle;
     shard.scale.setScalar(.35+freezeT*.9);
     shard.material.opacity=.9*(1-Math.max(0,(t-.68)/.45));
    });

    mist.forEach((puff,i)=>{
     const mistT=Math.max(0,Math.min(1,(t-.65-i*.02)/.45));
     puff.visible=mistT>0;
     puff.position.set(
      to.x+(i%3-1)*.16,
      to.y-.25+mistT*.45,
      to.z+((i*5)%3-1)*.13
     );
     puff.scale.setScalar(.8+mistT*2.2);
     puff.material.opacity=.26*(1-mistT);
    });
   }
  }
 };
}

function playVineEffect(from,to){
 const root=new THREE.Group();
 const material=new THREE.MeshBasicMaterial({
  color:0x4fbf43,
  transparent:true,
  opacity:.9
 });

 const segments=[];
 const segmentCount=18;
 for(let i=0;i<segmentCount;i++){
  const segment=new THREE.Mesh(
   new THREE.CylinderGeometry(.025,.035,.22,7),
   material.clone()
  );
  segment.visible=false;
  root.add(segment);
  segments.push(segment);
 }

 const leaves=[];
 for(let i=0;i<12;i++){
  const leaf=new THREE.Mesh(
   new THREE.SphereGeometry(.045,7,5),
   new THREE.MeshBasicMaterial({
    color:i%2?0x75d65c:0x2e8d35,
    transparent:true,
    opacity:.9
   })
  );
  leaf.scale.set(1.7,.55,.8);
  leaf.visible=false;
  root.add(leaf);
  leaves.push(leaf);
 }

 spellEffectGroup.add(root);
 return {
  root,
  duration:2800,
  update(t){
   const grow=Math.min(1,t/.55);
   segments.forEach((segment,i)=>{
    const progress=i/(segmentCount-1);
    segment.visible=progress<=grow;
    if(!segment.visible)return;

    const base=from.clone().lerp(to,progress);
    const curl=Math.sin(progress*Math.PI*5)*(.08+progress*.18);
    segment.position.set(
     base.x+curl,
     base.y-.65+Math.pow(progress,2)*.75,
     base.z+Math.cos(progress*Math.PI*4)*.08
    );
    segment.rotation.z=Math.sin(progress*Math.PI*4)*.5;
    segment.rotation.x=Math.cos(progress*Math.PI*3)*.35;
   });

   leaves.forEach((leaf,i)=>{
    const appear=.3+i*.025;
    const local=Math.max(0,Math.min(1,(t-appear)/.2));
    leaf.visible=local>0;
    const angle=i/leaves.length*Math.PI*2;
    leaf.position.set(
     to.x+Math.cos(angle)*(.22+(i%3)*.05),
     to.y-.4+(i%4)*.18,
     to.z+Math.sin(angle)*(.22+(i%3)*.05)
    );
    leaf.rotation.y=angle;
    leaf.material.opacity=t<.72?.9:Math.max(0,1-(t-.72)/.28);
   });

   if(t>.72){
    const fade=Math.max(0,1-(t-.72)/.28);
    segments.forEach(segment=>segment.material.opacity=.9*fade);
   }
  }
 };
}

function playTornadoEffect(from){
 const root=new THREE.Group();
 const particles=[];

 for(let i=0;i<32;i++){
  const particle=makeParticle(
   i%4===0?0xc9b790:0xd9d4c8,
   .035+Math.random()*.045,
   .55
  );
  root.add(particle);
  particles.push(particle);
 }

 spellEffectGroup.add(root);
 return {
  root,
  duration:2300,
  update(t){
   const fade=t<.7?1:Math.max(0,1-(t-.7)/.3);
   particles.forEach((particle,i)=>{
    const level=i/particles.length;
    const angle=t*Math.PI*10+i*.72;
    const radius=.12+level*.52;
    particle.position.set(
     from.x+Math.cos(angle)*radius,
     from.y-.65+level*1.65+t*.22,
     from.z+Math.sin(angle)*radius
    );
    particle.material.opacity=.55*fade;
    particle.scale.setScalar(.65+level*.85);
   });
  }
 };
}

function playSpellEffect(type,tileKey=null){
 if(!latestState)return;

 const {from,to}=effectWorldPositions(tileKey);
 let effect=null;

 if(type==='fireball')effect=playFireballEffect(from,to);
 if(type==='ice')effect=playIceEffect(from,to);
 if(type==='vine')effect=playVineEffect(from,to);
 if(type==='tornado')effect=playTornadoEffect(from);

 if(!effect)return;

 effect.started=performance.now();
 spellEffects.push(effect);
}

function updateSpellEffects(now){
 for(let i=spellEffects.length-1;i>=0;i--){
  const effect=spellEffects[i];
  const elapsed=now-effect.started;
  const t=Math.min(1,elapsed/effect.duration);

  effect.update(t);

  if(t>=1){
   disposeEffectObject(effect.root);
   spellEffects.splice(i,1);
  }
 }
}

async function renderBoard(state){
 latestState=state;
 const token=++renderToken;
 clearBoard();

 // Finish every tile, dropped item and monster first.
 // The hero is deliberately added last so asynchronous item loading cannot
 // replace, obscure or cancel the character during the same redraw.
 const tileJobs=Object.entries(state.tiles||{}).map(
  ([k,t])=>addTile(k,t,token)
 );
 await Promise.all(tileJobs);

 if(token!==renderToken)return;

 await addHero(state.charDef,state.player,token);

 // Defensive retry: a character should never remain absent after a redraw.
 if(token===renderToken&&!heroModel){
  console.warn('Hero missing after board redraw; retrying hero model.');
  heroPositionCurrent=null;
  heroMove=null;
  heroTurn=null;
  await addHero(state.charDef,state.player,token);
 }

 if(token===renderToken){
  if(!cameraInitialised){
   centreCameraOnHero();
   resetCameraHeroTracking();
   cameraInitialised=true;
  }
  if(lighting.follow){
   heroLight.position.set(
    state.player.x*TILE+.45,
    4.2,
    state.player.y*TILE+.35
   );
  }
 }
  if(pendingCombatTileKey)stageCombatScene(pendingCombatTileKey);
}
function applyLightingSettings(redraw=true){
 const effectsOn=!!lighting.enabled;

 document.body.classList.toggle('lightingOn',effectsOn);
 document.body.classList.toggle('lightingOff',!effectsOn);

 if(effectsOn){
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=lighting.exposure;
  ambientLight.intensity=.03+(lighting.ambient/100)*.4;
  sun.intensity=.15+(lighting.shadow/100)*.9;
  sun.castShadow=lighting.shadow>5;
  sun.shadow.radius=lighting.softness;
  heroLight.visible=true;
  heroLight.intensity=lighting.brightness*5.6;
  heroLight.distance=(lighting.radius+lighting.falloff)*TILE+3;
  heroLight.decay=1.8;
  heroLight.color.set(lighting.colour);
  heroLight.castShadow=lighting.shadow>5;
  renderer.shadowMap.enabled=lighting.shadow>5;
  scene.fog=new THREE.FogExp2(0x010100,.045);
  scene.background.set(0x050403);
 }else{
  renderer.toneMapping=THREE.NoToneMapping;
  renderer.toneMappingExposure=1;
  ambientLight.intensity=2.2;
  sun.intensity=3.6;
  sun.castShadow=false;
  heroLight.visible=false;
  heroLight.intensity=0;
  heroLight.castShadow=false;
  renderer.shadowMap.enabled=false;
  scene.fog=null;
  scene.background.set(0x2f2417);
 }

 saveLighting();
 syncLightingUI();
 const status=document.getElementById('lightingStatus');
 if(status){
  status.textContent=effectsOn
   ? `Lighting on: ${lighting.radius} tile radius · ${lighting.brightness}% brightness`
   : 'Lighting effects are off — bright tabletop testing mode.';
 }
 const button=document.getElementById('lightingBtn');
 if(button)button.textContent=effectsOn?'☀ Lighting: On':'☀ Lighting: Off';
 if(redraw&&latestState)renderBoard(latestState);
}

function syncLightingUI(){
 const fields={
  lightBrightness:['brightness',v=>String(Math.round(v))],
  lightRadius:['radius',v=>Number(v).toFixed(2).replace(/\.00$/,'')+' tiles'],
  lightFalloff:['falloff',v=>Number(v).toFixed(2).replace(/\.00$/,'')+' tiles'],
  lightAmbient:['ambient',v=>Math.round(v)+'%'],
  lightShadow:['shadow',v=>Math.round(v)+'%'],
  lightSoftness:['softness',v=>Number(v).toFixed(1)],
  lightExposure:['exposure',v=>Number(v).toFixed(2)]
 };
 Object.entries(fields).forEach(([id,[key,format]])=>{
  const input=document.getElementById(id);
  const output=document.getElementById(id+'Value');
  if(input)input.value=lighting[key];
  if(output)output.textContent=format(lighting[key]);
 });
 const colour=document.getElementById('lightColour');
 const follow=document.getElementById('lightFollow');
 const enabledSwitch=document.getElementById('lightingEnabled');
 const advanced=document.getElementById('lightingAdvancedControls');

 if(colour)colour.value=lighting.colour;
 if(follow)follow.checked=!!lighting.follow;
 if(enabledSwitch)enabledSwitch.checked=!!lighting.enabled;
 if(advanced)advanced.classList.toggle('disabled',!lighting.enabled);
}
function openLightingPanel(){
 const panel=document.getElementById('lightingPanel');
 panel.classList.add('open');
 panel.setAttribute('aria-hidden','false');
 syncLightingUI();
}
function closeLightingPanel(){
 const panel=document.getElementById('lightingPanel');
 panel.classList.remove('open');
 panel.setAttribute('aria-hidden','true');
}
function wireLightingControls(){
 const enabledSwitch=document.getElementById('lightingEnabled');
 enabledSwitch.addEventListener('change',e=>{
  lighting.enabled=e.target.checked;
  applyLightingSettings(true);
 });

 const bindings={
  lightBrightness:['brightness',Number],
  lightRadius:['radius',Number],
  lightFalloff:['falloff',Number],
  lightAmbient:['ambient',Number],
  lightShadow:['shadow',Number],
  lightSoftness:['softness',Number],
  lightExposure:['exposure',Number]
 };
 Object.entries(bindings).forEach(([id,[key,convert]])=>{
  const el=document.getElementById(id);
  el.addEventListener('input',()=>{
   lighting[key]=convert(el.value);
   applyLightingSettings(true);
  });
 });
 document.getElementById('lightColour').addEventListener('input',e=>{
  lighting.colour=e.target.value;
  applyLightingSettings(false);
 });
 document.getElementById('lightFollow').addEventListener('change',e=>{
  lighting.follow=e.target.checked;
  applyLightingSettings(false);
 });
 document.getElementById('lightSaveDefault').onclick=()=>{
  saveLightingAsDefault();
  toast('Lighting saved for this browser.');
  const status=document.getElementById('lightingStatus');
  if(status)status.textContent='Your lighting has been saved as the browser default.';
 };

 document.getElementById('lightLoadDefault').onclick=()=>{
  const saved=loadLightingDefault();
  if(!saved){
   toast('No saved lighting yet.');
   return;
  }
  lighting=saved;
  applyLightingSettings(true);
  toast('Saved lighting loaded.');
 };

 document.getElementById('lightReset').onclick=()=>{
  lighting={...DEFAULT_LIGHTING};
  applyLightingSettings(true);
 };
 document.querySelectorAll('[data-light-preset]').forEach(btn=>{
  btn.onclick=()=>{
   lighting={...lighting,...LIGHT_PRESETS[btn.dataset.lightPreset]};
   applyLightingSettings(true);
  };
 });
 const legacyLightingButton=document.getElementById('lightingBtn');
 if(legacyLightingButton){
  legacyLightingButton.onclick=()=>{};
 }
 const legacyLightingClose=document.getElementById('lightingClose');
 if(legacyLightingClose){
  legacyLightingClose.onclick=closeLightingPanel;
 }
}
if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',()=>{
  wireLightingControls();
  applyLightingSettings(false);
 });
}else{
 wireLightingControls();
 applyLightingSettings(false);
}

function resize(){
 const rect=canvas.getBoundingClientRect();
 if(!rect.width||!rect.height)return;
 renderer.setSize(rect.width,rect.height,false);
 camera.aspect=rect.width/rect.height;
 camera.updateProjectionMatrix();
}
function resetCamera(){
 if(latestState&&latestState.player){
  const target=new THREE.Vector3(
   latestState.player.x*TILE,
   .45,
   latestState.player.y*TILE
  );
  controls.target.copy(target);
  camera.position.set(target.x+8.5,11,target.z+12);
 }else{
  camera.position.set(8.5,11,12);
  controls.target.set(0,.4,0);
 }
 controls.update();
}
canvas.addEventListener('pointerup',e=>{
 if(!enabled)return;
 const rect=canvas.getBoundingClientRect();
 pointer.x=((e.clientX-rect.left)/rect.width)*2-1;
 pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
 raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects(boardGroup.children,true);
 const hit=hits.find(h=>h.object.userData.actionType);
 if(hit&&window.BOD3DAction){
  window.BOD3DAction(hit.object.userData.actionType,hit.object.userData.tileKey);
 }
});
window.addEventListener('resize',resize);
new ResizeObserver(resize).observe(canvas);
function animate(now){
 requestAnimationFrame(animate);

 updateSpellEffects(now);

 if(monsterDrops.length){
  for(let i=monsterDrops.length-1;i>=0;i--){
   const drop=monsterDrops[i];
   const rawT=(now-drop.started)/drop.duration;
   const startY=drop.restY+(drop.height||MONSTER_DROP_HEIGHT);
   if(rawT<=0){
    drop.pivot.position.y=startY;
    continue;
   }
   if(!drop.revealed){
    drop.pivot.visible=drop.showOnDrop;
    drop.revealed=true;
   }
   const t=Math.min(1,rawT);
   // Ease-in (t*t) so the fall accelerates like gravity rather than
   // moving at a constant speed.
   drop.pivot.position.y=startY+(drop.restY-startY)*(t*t);
   if(t>=1){
    landMonster(drop);
    monsterDrops.splice(i,1);
   }
  }
 }

 const floatTime=now*.001;
 boardGroup.traverse(object=>{
  if(object.userData?.floatObject){
   const base=object.userData.floatBaseY??object.position.y;
   const amplitude=object.userData.floatAmplitude??.03;
   const speed=object.userData.floatSpeed??1;
   const phase=object.userData.floatPhase??0;
   object.position.y=base+Math.sin(floatTime*speed+phase)*amplitude;
  }

  if(object.userData?.ringHalo&&object.material){
   const phase=object.userData.floatPhase??0;
   const pulse=.88+Math.sin(floatTime*1.45+phase)*.12;
   object.scale.setScalar(pulse);
   object.material.opacity=.22+Math.sin(floatTime*1.45+phase)*.07;
  }

  if(object.userData?.ringLight){
   const phase=object.userData.floatPhase??0;
   object.intensity=5.1+Math.sin(floatTime*1.45+phase)*1.25;
  }
 });

 if(combatScene&&combatScene.hero&&combatScene.monster){
  const hero=combatScene.hero;
  const monster=combatScene.monster;

  // Redraws and normal movement code must never turn the hero away mid-fight.
  heroTurn=null;
  heroMove=null;

  const heroBase=combatScene.heroCombatPosition;
  const monsterBase=combatScene.monsterCombatPosition;

  if(hero.parent===boardGroup&&monster.parent===boardGroup){
   let lunge=0;

   if(combatScene.attackPulseStarted!==null){
    const pulseTime=(now-combatScene.attackPulseStarted)/360;
    if(pulseTime>=1){
     combatScene.attackPulseStarted=null;
    }else{
     // Quick advance and retreat, like moving a tabletop miniature to attack.
     lunge=Math.sin(Math.PI*pulseTime)*.18;
    }
   }

   const attackDirection=monsterBase.clone().sub(heroBase);
   attackDirection.y=0;
   if(attackDirection.lengthSq()>.0001)attackDirection.normalize();

   hero.position.copy(heroBase).addScaledVector(attackDirection,lunge);

   // Do not overwrite the reveal-drop Y animation. The combat pose loop used to
   // copy the monster's full saved combat position every frame, which pinned a
   // freshly revealed monster in mid-air. While the drop is active, only hold
   // its horizontal fighting position; the drop animator owns Y until landing.
   if(monsterIsDropping(monster)){
    monster.position.x=monsterBase.x;
    monster.position.z=monsterBase.z;
   }else{
    monster.position.copy(monsterBase);
    monster.position.y=TILE_THICKNESS;
   }

   hero.rotation.y=yawTowards(hero.position,monster.position);
   monster.rotation.y=yawTowards(monster.position,hero.position);
   heroRotationCurrent=hero.rotation.y;
   heroPositionCurrent={
    x:hero.position.x,
    y:hero.position.y,
    z:hero.position.z
   };
  }
 }

 if(cameraTween){
  const t=Math.min(1,(now-cameraTween.started)/cameraTween.duration);
  const eased=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  camera.position.lerpVectors(cameraTween.startPosition,cameraTween.endPosition,eased);
  controls.target.lerpVectors(cameraTween.startTarget,cameraTween.endTarget,eased);
  if(t>=1){
   camera.position.copy(cameraTween.endPosition);
   controls.target.copy(cameraTween.endTarget);
   cameraTween=null;
  }
 }

 if(heroMove&&heroMove.model===heroModel){
  const t=Math.min(1,(now-heroMove.started)/heroMove.duration);
  const eased=t<.5
   ? 2*t*t
   : 1-Math.pow(-2*t+2,2)/2;

  heroMove.model.position.x=
   heroMove.start.x+(heroMove.target.x-heroMove.start.x)*eased;
  heroMove.model.position.y=
   heroMove.start.y+(heroMove.target.y-heroMove.start.y)*eased;
  heroMove.model.position.z=
   heroMove.start.z+(heroMove.target.z-heroMove.start.z)*eased;

  heroPositionCurrent={
   x:heroMove.model.position.x,
   y:heroMove.model.position.y,
   z:heroMove.model.position.z
  };

  if(t>=1){
   heroMove.model.position.set(
    heroMove.target.x,
    heroMove.target.y,
    heroMove.target.z
   );
   heroPositionCurrent={...heroMove.target};
   heroMove=null;
  }
 }

 // Move the camera by exactly the same world-space amount as the hero.
 // This keeps the miniature fixed at the centre while the dungeon glides underneath.
 if(heroPositionCurrent&&!combatScene){
  lockCameraToWorldPosition(heroPositionCurrent);
 }

 if(!combatScene&&heroTurn&&heroTurn.model===heroModel){
  const t=Math.min(1,(now-heroTurn.started)/heroTurn.duration);
  const eased=1-Math.pow(1-t,3);
  heroTurn.model.rotation.y=heroTurn.start+heroTurn.delta*eased;
  heroRotationCurrent=heroTurn.model.rotation.y;
  if(t>=1){
   heroTurn.model.rotation.y=heroTurn.target;
   heroRotationCurrent=heroTurn.target;
   heroTurn=null;
  }
 }

 // Ground-shake for monster landings. Applied last (after every other camera
 // positioning above) and fully subtracted back out straight after the render
 // call, so it can never drift or fight with camera locking/tweening on
 // later frames — each frame's shake is a one-off nudge, not a persisted state.
 let shakeOffset=null;
 if(cameraShakeState){
  const t=(now-cameraShakeState.started)/cameraShakeState.duration;
  if(t>=1){
   cameraShakeState=null;
  }else{
   const decay=1-t;
   const mag=cameraShakeState.magnitude*decay;
   shakeOffset=new THREE.Vector3(
    (Math.random()*2-1)*mag,
    (Math.random()*2-1)*mag*.6,
    (Math.random()*2-1)*mag
   );
   camera.position.add(shakeOffset);
  }
 }

 if(enabled){
  controls.update();
  updateCompass();
  renderer.render(scene,camera);
 }

 if(shakeOffset)camera.position.sub(shakeOffset);
}
animate();
resize();

window.BOD3D={
 render:renderBoard,
 clearDice3D,
 setEnabled(value){enabled=!!value;controls.enabled=enabled;resize();},
 resetCamera,
 centreOnHero:centreCameraOnHero,
 northUp,
 beginCombat:beginCombatScene,
 endCombat:endCombatScene,
 combatPulse:triggerCombatPulse,
 frameRangedAttack,
 finishRangedAttack,
 playEffect:playSpellEffect,
 isLightingOn(){return !!lighting.enabled;},
 toggleLighting(){lighting.enabled=!lighting.enabled;applyLightingSettings(true);return lighting.enabled;},
 openLightingPanel,
 resetHeroFacing(){
  if(heroModel&&heroModel.parent===boardGroup)boardGroup.remove(heroModel);
  heroModel=null;
  heroRotationCurrent=null;
  heroTurn=null;
  heroPositionCurrent=null;
  heroMove=null;
  lastCameraHeroPosition=null;
  cameraInitialised=false;
 },
 snapHeroToPlayer(){
  // Used by Run Away, Tornado and other instant repositioning.
  if(heroModel&&heroModel.parent===boardGroup)boardGroup.remove(heroModel);
  heroModel=null;
  heroTurn=null;
  heroMove=null;
  heroPositionCurrent=null;
  lastCameraHeroPosition=null;
  cameraInitialised=false;
 }
};
const currentState=window.getBODState?window.getBODState():null;
if(currentState)renderBoard(currentState);
