<template>
  <div class="panel" ref="el">
  <div class="contents">
    <div class="preview" @click="preview">
      <div class="preview__contents">
        <div class="preview__balls">
          <i v-for="n in 15" class="ball" :ref="setBallRef"></i>
        </div>
        <i class="preview__ball ball" ref="ball"></i>
      </div>
    </div>
    <div class="container">
      <div class="preset">
        <easing-preset-button :preset-data="preset_1" @emit-preset-btn="emitPresetBtn"></easing-preset-button>
        <easing-preset-button :preset-data="preset_2" @emit-preset-btn="emitPresetBtn"></easing-preset-button>
        <easing-preset-button :preset-data="preset_3" @emit-preset-btn="emitPresetBtn"></easing-preset-button>
        <easing-preset-button :preset-data="preset_4" @emit-preset-btn="emitPresetBtn"></easing-preset-button>
      </div>
      <div class="canvas">
        <canvas ref="canvas" width="300" height="600" @mousedown="canvasMouseDown" @mousemove="canvasMouseMove"></canvas>
        <button ref="p1" :class="linearMode?{'cp cp-1':true}:{'cp cp-1 active':true}" @mousedown="buttonMouseDown"></button>
        <button ref="p2" :class="linearMode?{'cp cp-2':true}:{'cp cp-2 active':true}" @mousedown="buttonMouseDown"></button>
        <easing-control-point class="points" :points="linearPoints" :rect="canvas_rect" :offset="canvas_offset" @emit-control-point="emitControlPoint" @emit-control-point-fix="emitControlPointFix"></easing-control-point>
      </div>
    </div>
    <div class="menu">
      <p class="menu__easing" v-if="!preset_mode" ref="bezier">{{ easing }}</p>
      <div v-if="preset_mode" class="menu__preset">
        <button class="menu__icon menu__icon-prev" @click="prevPreset">&lt;</button>
        <p class="menu__preset__name">{{ preset_name }}</p>
        <button class="menu__icon menu__icon-next" @click="nextPreset">&gt;</button>
      </div>
    </div>
  </div>
  <div class="copy__container">
    <button class="copy" @click="clickCopyBtn">copy</button>
    <p class="message" ref="message">copied to clipboard</p>
  </div>
</div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import EasingPresetButton from "@/components/EasingPresetButton.vue";
import EasingControlPoint from "@/components/EasingControlPoint.vue";
import {ReturnPoints, ReturnLinearPoints} from "@/functions/ReturnPoints";

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

let preset_mode:boolean = false, preset_name:string = "", preset_easing:string = "", preset_data:preset[], preset_index:number = 0;

let linearMode:boolean = false;

interface preset {
  name: string
  easing: string
}

interface linearPoint {
  x: number
  y: number
}

const easing = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const canvas = ref<HTMLCanvasElement | null>(null);
const p1 = ref<HTMLButtonElement | null>(null);
const p2 = ref<HTMLButtonElement | null>(null);
const canvas_offset:number = 150;
let ctx:any, canvas_rect:any;
onMounted(() => {
  if (window.navigator.userAgent.indexOf('Chrome') <= -1) {
    preset_1.splice(1, preset_1.length - 1);
  }

  canvas_rect = canvas.value?.getBoundingClientRect();
  ctx = canvas.value?.getContext("2d");

  const easing_points = ReturnPoints(easing.value);
  setPoint(p1, easing_points.p1.x, easing_points.p1.y, canvas_rect.width, canvas_offset);
  setPoint(p2, easing_points.p2.x, easing_points.p2.y, canvas_rect.width, canvas_offset);
  draw();

  window.addEventListener('resize', resizeHandler);
})

const resizeHandler = () => {
  canvas_rect = canvas.value?.getBoundingClientRect();
}

const clearCanvas = () => {
  ctx.fillStyle = "#333";
  ctx.fillRect(0,0, canvas_rect.width, canvas_rect.height)
  ctx.fillStyle = "#222";
  ctx.fillRect(0,canvas_offset, canvas_rect.width, canvas_rect.width)
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,165,0,.1)";
  ctx.beginPath();
}

const draw = () => {
  clearCanvas();
  const start = { x: 0, y: canvas_rect.width + canvas_offset };
  const cp1_rect:any = p1.value?.getBoundingClientRect();
  const cp2_rect:any = p2.value?.getBoundingClientRect();
  const cp1 = { x: cp1_rect.x - canvas_rect.x, y: cp1_rect.y - canvas_rect.y };
  const cp2 = { x: cp2_rect.x - canvas_rect.x, y: cp2_rect.y - canvas_rect.y };
  const end = { x: canvas_rect.width, y: canvas_offset };
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,.1)";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "orange";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,.5)";

  ctx.beginPath();
  ctx.moveTo(0,canvas_rect.width + canvas_offset);
  ctx.lineTo(cp1.x, cp1.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(canvas_rect.width,canvas_offset);
  ctx.lineTo(cp2.x, cp2.y);
  ctx.stroke();

  easing.value = 'cubic-bezier(' + Math.floor((cp1.x / canvas_rect.width) * 100) / 100
    + ', ' + Math.floor(((canvas_rect.width + canvas_offset) - cp1.y) / canvas_rect.width * 100) / 100
    + ', ' + Math.floor((cp2.x / canvas_rect.width) * 100) / 100
    + ', ' + Math.floor((((canvas_rect.width + canvas_offset) - cp2.y) / canvas_rect.width) * 100) / 100 + ')';
}

const drawLinear = (points:any) => {
  clearCanvas();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "orange";
  ctx.beginPath();
  ctx.moveTo(0, canvas_rect.width + canvas_offset)
  let _linear = 'linear(';
  for (let i = 0; i < points.length; i++) {
    ctx.lineTo(points[i].x * canvas_rect.width, (canvas_rect.width - points[i].y * canvas_rect.width) + canvas_offset)
    ctx.stroke();
    _linear += Math.floor(points[i].y * 100) / 100 + ' ' + Math.floor(points[i].x * 10000) / 100 + '%';
    if(i < points.length - 1){
      _linear += ',';
    }else{
      _linear += ')';
    }
  }
  easing.value = _linear;
}

const moveAt = ((pageX:number, pageY:number, target:any) => {
  let _left = pageX - canvas_rect.x - target.offsetWidth / 2;
  let _top = pageY - canvas_rect.y - target.offsetHeight / 2;
  if(_left < 0){
    _left = 0;
  } else if(_left > canvas_rect.width){
    _left = canvas_rect.width;
  }
  target.style.left = _left + 'px';
  target.style.top = _top + 'px';
})

const buttonMouseDown = ((event:any) => {
  if(preset_mode) preset_mode = false;
  const target = event.target;
  moveAt(event.pageX, event.pageY, target);
  draw();
  mouseMoveEventSet(target);
})

const mouseMoveEventSet = (_target:any) => {
  const onMouseMove = ((event:any) => {
    moveAt(event.pageX, event.pageY, _target);
    draw();
  })
  document.addEventListener('mousemove', onMouseMove);
  document.onmouseup = (() => {
    document.removeEventListener('mousemove', onMouseMove);
    document.onmouseup = null;
    preview();
  })
}

const canvasMouseDown = (event:any)=>{
  if (!linearMode) {
    if(preset_mode) preset_mode = false;
    const cp1_rect:any = p1?.value?.getBoundingClientRect();
    const cp2_rect:any = p2?.value?.getBoundingClientRect();
    const cp1 = { x: cp1_rect.x, y: cp1_rect.y };
    const cp2 = { x: cp2_rect.x, y: cp2_rect.y };
    let dist1 = Math.sqrt(Math.pow(event.pageX - cp1.x, 2) + Math.pow(event.pageY - cp1.y, 2));
    let dist2 = Math.sqrt(Math.pow(event.pageX - cp2.x, 2) + Math.pow(event.pageY - cp2.y, 2));
    let _target;
    if(dist1 <= dist2){
      _target = p1.value;
    }else{
      _target = p2.value;
    }

    moveAt(event.pageX, event.pageY, _target);
    draw();

    mouseMoveEventSet(_target);
  }else{
    if(window.navigator.userAgent.indexOf('Chrome') > -1){
      const imagedata = ctx.getImageData(event.pageX - canvas_rect.x, event.pageY - canvas_rect.y, 1, 1);
      if (!(imagedata.data[0] === 34 && imagedata.data[1] === 34 && imagedata.data[2] === 34 || imagedata.data[0] === 51 && imagedata.data[1] === 51 && imagedata.data[2] === 51)) {

        let _linearPoints = linearPoints.concat();

        _linearPoints.push({x:Math.floor((event.pageX - canvas_rect.x) / canvas_rect.width * 100) / 100, y:Math.floor((canvas_rect.width - (event.pageY - canvas_rect.y - canvas_offset)) / canvas_rect.width * 100 ) / 100});
        _linearPoints.sort((a,b) => a.x - b.x)
        linearPoints = _linearPoints;
        drawLinear(linearPoints);
      }
    }
  }
}

const canvasMouseMove = (event:any) => {
  if (linearMode) {
    const imagedata = ctx.getImageData(event.pageX - canvas_rect.x, event.pageY - Math.floor(canvas_rect.y), 1, 1);
    if ((imagedata.data[0] === 34 && imagedata.data[1] === 34 && imagedata.data[2] === 34) || (imagedata.data[0] === 51 && imagedata.data[1] === 51 && imagedata.data[2] === 51)) {
      if(canvas.value) canvas.value.style.cursor = 'auto';
    }else{
      if(canvas.value) canvas.value.style.cursor = 'pointer';
    }
  }
}

let preset_1: preset[] = [
  {'name': 'linear', 'easing': 'linear(0 0%, 1 100%)'},
  {'name': 'elastic', 'easing': 'linear(0 0%, 0.22 2.1%, 0.86 6.5%, 1.11 8.6%, 1.3 10.7%, 1.35 11.8%, 1.37 12.9%, 1.37 13.7%, 1.36 14.5%, 1.32 16.2%, 1.03 21.8%, 0.94 24%, 0.89 25.9%, 0.88 26.85%, 0.87 27.8%, 0.87 29.25%, 0.88 30.7%, 0.91 32.4%, 0.98 36.4%, 1.01 38.3%, 1.04 40.5%, 1.05 42.7%, 1.05 44.1%, 1.04 45.7%, 1 53.3%, 0.99 55.4%, 0.98 57.5%, 0.99 60.7%, 1 68.1%, 1.01 72.2%, 1 86.7%, 1 100%)'},
  {'name': 'bounce', 'easing': 'linear(0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%, 0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%, 0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%, 0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%, 0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%)'},
  {'name': 'emphasized', 'easing': 'linear(0 0%, 0 1.8%, 0.01 3.6%, 0.03 6.35%, 0.07 9.1%, 0.13 11.4%, 0.19 13.4%, 0.27 15%, 0.34 16.1%, 0.54 18.35%, 0.66 20.6%, 0.72 22.4%, 0.77 24.6%, 0.81 27.3%, 0.85 30.4%, 0.88 35.1%, 0.92 40.6%, 0.94 47.2%, 0.96 55%, 0.98 64%, 0.99 74.4%, 1 86.4%, 1 100%)'}
]
const preset_2: preset[] = [
  {'name': 'ease-in-out', 'easing': 'cubic-bezier(0.42, 0, 0.58, 1)'},
  {'name': 'In Out · Sine', 'easing': 'cubic-bezier(0.45, 0.05, 0.55, 0.95)'},
  {'name': 'In Out · Quadratic', 'easing': 'cubic-bezier(0.46, 0.03, 0.52, 0.96)'},
  {'name': 'In Out · Cubic', 'easing': 'cubic-bezier(0.65, 0.05, 0.36, 1)'},
  {'name': 'Fast Out, Slow In', 'easing': 'cubic-bezier(0.4, 0, 0.2, 1)'},
  {'name': 'In Out・Back', 'easing': 'cubic-bezier(0.68, -0.55, 0.27, 1.55)'}
]
const preset_3: preset[] = [
  {'name': 'Fast Out, Linear In', 'easing': 'cubic-bezier(0.4, 0, 1, 1)'},
  {'name': 'ease-in', 'easing': 'cubic-bezier(0.42, 0, 1, 1)'},
  {'name': 'In · Sine', 'easing': 'cubic-bezier(0.47, 0, 0.75, 0.72)'},
  {'name': 'In · Quadratic', 'easing': 'cubic-bezier(0.55, 0.09, 0.68, 0.53)'},
  {'name': 'In · Cubic', 'easing': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)'},
  {'name': 'In · Back', 'easing': 'cubic-bezier(0.6, -0.28, 0.74, 0.05)'},
]
const preset_4: preset[] = [
  {'name': 'ease-out', 'easing': 'cubic-bezier(0, 0, 0.58, 1)'},
  {'name': 'Out · Sine', 'easing': 'cubic-bezier(0.39, 0.58, 0.57, 1)'},
  {'name': 'Out · Quadratic', 'easing': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'},
  {'name': 'Out · Cubic', 'easing': 'cubic-bezier(0.22, 0.61, 0.36, 1)'},
  {'name': 'Linear Out, Slow In', 'easing': 'cubic-bezier(0, 0, 0.2, 1)'},
  {'name': 'Out · Back', 'easing': 'cubic-bezier(0.18, 0.89, 0.32, 1.28)'},
]

let linearPoints:linearPoint[] = [];
const emitPresetBtn = (data:preset[], index:number, linear:boolean) => {
  if (!preset_mode) preset_mode = true;
  if(linearMode != linear) linearMode = linear;

  preset_data = data;
  preset_name = data[index].name;
  preset_index = index;

  if(linearMode){
    linearPoints = ReturnLinearPoints(data[preset_index].easing);
    drawLinear(linearPoints);
  }else{
    linearPoints = [];
    const easing_points = ReturnPoints(data[preset_index].easing);
    setPoint(p1, easing_points.p1.x, easing_points.p1.y, canvas_rect.width, canvas_offset);
    setPoint(p2, easing_points.p2.x, easing_points.p2.y, canvas_rect.width, canvas_offset);
    draw();
  }

  preview();
}

const emitControlPoint = (index:number, point:linearPoint) => {
  linearPoints[index] = point;
  drawLinear(linearPoints);
}

const emitControlPointFix = () => {
  preview();
}

const prevPreset = ()=>{
  let index = preset_index - 1;
  if(index < 0){
    index = preset_data.length - 1;
  }
  emitPresetBtn(preset_data, index, linearMode)
}
const nextPreset = ()=>{
  let index = preset_index + 1;
  if(index >= preset_data.length){
    index = 0;
  }
  emitPresetBtn(preset_data, index, linearMode)
}

const setPoint = (p:any, x:number, y:number, w:number, offset:number) => {
  p.value.style.left = x * w + "px";
  p.value.style.top = (w + offset) - (y * w) + "px";
}

const balls = ref<HTMLElement[]>([])
const setBallRef = (el:any) => {
  if (el) balls.value.push(el)
}
const ball = ref<HTMLElement | null>(null);

const preview = ()=>{
  for (let i = 0; i < balls.value.length; i++) {
    balls.value[i].style.animationDuration = '0s';
    balls.value[i].style.animationPlayState = "running";
    balls.value[i].classList.remove('start');
    balls.value[i].style.animationDuration = '1s';
  }

  setTimeout(()=>{
    ball.value?.addEventListener("animationend", () => {
      ball.value?.classList.remove('start');
    });
    let easingValue = easing.value;
    switch (easingValue){
      case 'linear(0 0%,1 100%)':
        easingValue = 'linear';
        break;
      case 'cubic-bezier(0.42, 0, 0.58, 1)':
        easingValue = 'ease-in-out';
        break;
      case 'cubic-bezier(0.42, 0, 1, 1)':
        easingValue = 'ease-in';
        break;
      case 'cubic-bezier(0, 0, 0.58, 1)':
        easingValue = 'ease-out';
        break;
      case 'cubic-bezier(0.25, 0.1, 0.25, 1)':
        easingValue = 'ease';
        break;
      default:
        break;
    }
    if (ball.value && "style" in ball.value) {
      ball.value.style.animationTimingFunction = easingValue;
    }
    ball.value?.classList.toggle('start');

    for (let i = 0; i < balls.value.length; i++) {
      balls.value[i].style.animationTimingFunction = easingValue;
      balls.value[i].classList.add('start');
      let _time = 1000 / (balls.value.length - 1);
      if(i !== balls.value.length - 1){
        setTimeout(()=>{
          balls.value[i].style.animationPlayState = "paused";
        }, _time * i);
      }
    }
  }, 100)

}

const message = ref<HTMLParagraphElement | null>(null);
const clickCopyBtn = ()=>{
  copyToClipboard(easing.value);
  message.value?.classList.add('active');
  setTimeout(()=>{message.value?.classList.remove('active');}, 1000)
}

const copyToClipboard = (value:any) => {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(value);
  }
}

</script>

<style scoped lang="scss">
.panel {
  width: 400px;
  height: 600px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.contents {
  display: flex;
  padding: 0;
  width: 100%;
  position: relative;
  z-index: 1000;
}
.ball {
  width: 20px;
  height: 20px;
  border-radius: 20px;
  background-color: orange;
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  &.start {
    opacity: 1;
    animation-name: ballAnimation;
    animation-duration: 1s;
    animation-fill-mode: forwards;
  }
}
.preview {
  position: absolute;
  left: 0;
  top: 50px;
  width: 100%;
  z-index: 100;
  text-align: center;
  height: 50px;
  cursor: pointer;
  //overflow: hidden;
  background-color: transparent;
  padding: 15px 0;
  &__contents {
    width: 100%;
    margin: 0 auto;
    height: 20px;
    background-color: rgba(255, 255, 255, .1);
    border-radius: 20px;
    position: relative;
  }
  &__balls {
    .ball {
      &.start {
        opacity: .3;
      }
    }
  }
}
@keyframes ballAnimation {
  0% {
    left: 0;
  }
  100% {
    left: calc(100% - 20px);
  }
}
.container {
  width: 100%;
  display: flex;
}
.preset {
  position: relative;
  width: calc(100% - 300px);
  padding: 125px 20px 0 0;
}
.canvas {
  width: auto;
  position: relative;
  height: 600px;
  > canvas {
    width: 300px;
    height: 600px;
  }
}
.menu {
  width: 100%;
  text-align: left;
  height: auto;
  background-color: transparent;
  color: #fff;
  padding: 0;
  position: absolute;
  left: 0;
  bottom: 50px;
  z-index: 200;
  &__easing {
    height: 50px;
    font-size: 20px;
    font-weight: 400;
    padding: 0 0 0 3em;
    line-height: 50px;
    text-align: left;
  }
  &__preset {
    text-align: center;
    height: 50px;
    &__name {
      width: 100%;
      font-size: 20px;
      font-weight: 400;
      line-height: 1;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
  &__icon {
    appearance: none;
    background: none;
    border: none;
    color: #fff;
    position: absolute;
    top: 50%;
    transform: translate(0, -50%);
    font-size: 20px;
    cursor: pointer;
    opacity: .5;
    transition: opacity .5s cubic-bezier(0, 0, 0, 1.14);
    &:hover {
      opacity: 1;
    }
    &-prev {
      left: 0;
      z-index: 301;
    }
    &-next {
      right: 0;
      z-index: 302;
    }
  }
}
.cp {
  display: block;
  border: none;
  padding: 0;
  appearance: none;
  position: absolute;
  left: 0;
  top: 0;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  &:before {
    content: '';
    width: 30px;
    height: 30px;
    border-radius: 30px;
    background-color: rgba(255,255,255,0.1);
    position: absolute;
    left: -15px;
    top: -15px;
    display: block;
    z-index: 201;
  }
  &:after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 10px;
    background-color: rgba(255,255,255,.7);
    border: 1px solid orange;
    position: absolute;
    left: -5px;
    top: -5px;
    display: block;
    transition: border-radius .3s ease-out;
    z-index: 202;
  }
  &.active {
    opacity: 1;
    pointer-events: auto;
  }
  &:hover {
    &:after {
      border-radius: 0;
    }
  }
  &-1 {
    left: 0;
    top: 350px;
  }
  &-2 {
    left: 300px;
    top: 50px;
  }
}
.copy {
  display: block;
  appearance: none;
  background-color: transparent;
  color: #fff;
  border: 1px solid #fff;
  border-radius: 5px;
  width: 50px;
  text-align: center;
  height: 20px;
  margin: 10px 0 0 auto;
  cursor: pointer;
  opacity: .3;
  &:hover {
    opacity: 1;
  }
}
.message {
  text-align: center;
  transition: opacity .5s cubic-bezier(0.22, 0.61, 0.36, 1);
  opacity: 0;
  &.active {
    opacity: 1;
  }
}
</style>