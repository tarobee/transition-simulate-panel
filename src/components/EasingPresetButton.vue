<template>
<div class="btn" @click="clickEvent">
  <div class="btn__container">
    <canvas ref="canvas" width="58" height="58"></canvas>
  </div>
</div>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";

const props = defineProps({
  presetData: Array
});

const emit = defineEmits<{(e: 'emitPresetBtn', value?:[], index?:number, linear?:boolean): void}>()

const clickEvent = (): void => emit('emitPresetBtn', props.presetData, 0, linearMode)

const canvas = ref<HTMLCanvasElement | null>(null);
const canvas_offset:number = 0;
let ctx:CanvasRenderingContext2D, canvas_rect:DOMRect, linearMode:boolean;
onMounted(() => {
  canvas_rect = canvas.value?.getBoundingClientRect();
  ctx = canvas.value?.getContext("2d");
  if (props?.presetData?.[0].name.indexOf('linear') > -1){
    linearMode = true;
    drawLinear();
  }else{
    linearMode = false;
    draw();
  }
})
const clearCanvas = (() => {
  ctx.fillStyle = "#333";
  ctx.fillRect(0,0, canvas_rect.width, canvas_rect.height)
  ctx.fillStyle = "#222";
  ctx.fillRect(0,canvas_offset, canvas_rect.width, canvas_rect.width)
})
const draw = (() => {
  clearCanvas();
  const start = { x: 0, y: canvas_rect.width + canvas_offset };
  const end = { x: canvas_rect.width, y: canvas_offset };
  ctx.lineWidth = 1;
  ctx.strokeStyle = "orange";
  let points = returnPoints(props?.presetData?.[0].easing)
  const cp1 = { x: points.p1.x * canvas_rect.width, y: canvas_rect.width - points.p1.y * canvas_rect.width };
  const cp2 = { x: points.p2.x * canvas_rect.width, y: canvas_rect.width - points.p2.y * canvas_rect.width };
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
  ctx.stroke();
})
const drawLinear = () => {
  clearCanvas();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "orange";
  let points = returnLinearPoints(props?.presetData?.[0].easing);
  ctx.beginPath();
  ctx.moveTo(0, canvas_rect.width + canvas_offset);
  for (let i = 0; i < points.length; i++) {
    ctx.lineTo(points[i].x * canvas_rect.width, canvas_rect.width - points[i].y * canvas_rect.width)
  }
  ctx.stroke();
}
const returnPoints = (bezier) => {
  let split_data:String[] = bezier.split(',');
  return ({
    'p1': {'x':parseFloat(split_data[0].replace("cubic-bezier(", "")), 'y': parseFloat(split_data[1])},
    'p2': {'x':parseFloat(split_data[2]), 'y': parseFloat(split_data[3].replace(")", ""))}
  })
}
const returnLinearPoints = (linear) => {
  let split_dataset:String[] = linear.split(',');
  let points = [];
  for (let i = 0; i < split_dataset.length; i++) {
    let data = split_dataset[i].trim().split(" ");
    points.push({x: parseFloat(data[1].replace(")", "").replace('%', '')) * 0.01, y: parseFloat(data[0].replace("linear(", ""))})
  }

  return points
}
</script>

<style scoped lang="scss">
.btn {
  width: 80px;
  height: 80px;
  display: block;
  padding: 10px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .3);
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
  &__container {
    width: 100%;
    height: 100%;
  }
  &:hover {
    opacity: .7;
  }
}
</style>