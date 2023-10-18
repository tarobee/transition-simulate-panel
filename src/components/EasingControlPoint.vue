<template>
  <div class="points">
    <button :class="(i == 0 || i == points?.length - 1)?{'cp':true,'inactive':true}:{'cp':true}" v-for="(point, i) in points" :style="{left: point.x * rect.width + 'px', top:(rect.width - (point.y * rect.width)) + 'px'}" :id="'point_' + i" @mousedown="buttonMouseDown"></button>
  </div>
</template>

<script setup lang="ts">

const props = defineProps({
  points: Array as () => Array<object>,
  rect: Object,
  offset: Number
});

const emit = defineEmits<{
  (e: 'emitControlPoint', index?:number, point?:object): void,
  (e: 'emitControlPointFix'): void,
}>()

const buttonMouseDown = ((event) => {
  const target = event.target;
  // moveAt(event.pageX, event.pageY, target);
  mouseMoveEventSet(target);
})

const moveAt = ((pageX, pageY, target) => {
  let _left = pageX - props.rect.x - target.offsetWidth / 2;
  let _top = pageY - props.rect.y - target.offsetHeight / 2 - props.offset;
  if(_left < 0){
    _left = 0;
  } else if(_left > props.rect.width){
    _left = props.rect.width;
  }
  target.style.left = _left + 'px';
  target.style.top = _top + 'px';

  emit('emitControlPoint', parseInt(target.getAttribute('id')?.replace('point_', '')), {x:Math.floor(_left / props.rect.width * 100)/100, y:Math.floor((1 - _top / props.rect.width) * 100)/100});
})

const mouseMoveEventSet = (_target) => {
  const onMouseMove = ((event) => {
    moveAt(event.pageX, event.pageY, _target);
  })
  document.addEventListener('mousemove', onMouseMove);
  document.onmouseup = (() => {
    document.removeEventListener('mousemove', onMouseMove);
    document.onmouseup = null;
    emit('emitControlPointFix');
  })
}

</script>

<style scoped lang="scss">
.points {
  position: absolute;
  top: 150px;
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
  &.inactive {
    pointer-events: none;
  }
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
  &:hover {
    &:after {
      border-radius: 0;
    }
  }
}
</style>