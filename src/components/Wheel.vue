<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  steamIds: { type: Array, required: true },
  apiUrl:   { type: String, default: '/api/get_inventory.php' },
  // Nouvel input: libellés personnalisés (même ordre que steamIds)
  labels:   { type: Array, default: () => [] }
})

const canvasRef = ref(null)
let ctx = null

const resultText = ref('—')
const rotation = ref(0)
const spinning = ref(false)

const pattern = ref([])   // noms répétés selon amount
const colors  = ref({})   // nom -> couleur
const currentSteamId = ref(props.steamIds?.[0] ?? '')

const size = 550
let dpr = 1
let rafId = 0

const palette = [
  '#49C9B3', '#FFD700', '#AE81FF', '#00FF88', '#FF934F',
  '#FF4D8E', '#5BC0EB', '#E55934', '#B06AB3', '#00CED1'
]

function generateColors(newNames){
  newNames.forEach((name, i) => {
    if (!colors.value[name]) {
      colors.value[name] = palette[i % palette.length]
    }
  })
}

function setupHiDPI() {
  const canvas = canvasRef.value
  if (!canvas) return
  dpr = window.devicePixelRatio || 1
  canvas.width  = size * dpr
  canvas.height = size * dpr
  canvas.style.width  = size + 'px'
  canvas.style.height = size + 'px'
  ctx = canvas.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)
}

function drawWheel(angle = rotation.value){
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  const N = pattern.value.length
  const ARC = Math.PI * 2 / (N || 1)
  const r = size / 2

  ctx.clearRect(0, 0, size, size)
  if (!N) return

  for (let i = 0; i < N; i++){
    const val = pattern.value[i]
    const a0 = angle + i * ARC
    const a1 = a0 + ARC

    // secteur
    ctx.beginPath()
    ctx.moveTo(r, r)
    ctx.arc(r, r, r - 14, a0, a1)
    ctx.closePath()
    ctx.fillStyle = colors.value[val] || '#555'
    ctx.fill()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.stroke()

    // label
    ctx.save()
    ctx.translate(r, r)
    ctx.rotate(a0 + ARC / 2)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(String(val).slice(0, 18), r - 24, 5)
    ctx.restore()
  }
}

// Fisher-Yates
function shufflePattern(){
  for (let i = pattern.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pattern.value[i], pattern.value[j]] = [pattern.value[j], pattern.value[i]]
  }
  drawWheel()
}

function showResult(){
  const N = pattern.value.length
  if (!N) return
  const ARC = Math.PI * 2 / N
  // pointeur en haut (-π/2)
  const angleUnderPointer =
    (2 * Math.PI - ((rotation.value + Math.PI/2) % (2 * Math.PI))) % (2 * Math.PI)
  const index = Math.floor(angleUnderPointer / ARC) % N
  resultText.value = pattern.value[index]
}

function spin(){
  if (spinning.value || pattern.value.length === 0) return
  spinning.value = true
  resultText.value = '—'

  const extraDeg = Math.random() * 360
  const target = rotation.value
    + (Math.PI * 2 * (5 + Math.random() * 4))
    + (extraDeg * Math.PI / 180)

  const startT = performance.now()
  const DUR = 4500

  const animate = (t) => {
    const p = Math.min((t - startT) / DUR, 1)
    const ease = 1 - Math.pow(1 - p, 3) // cubic ease-out
    rotation.value = target * ease
    drawWheel(rotation.value)
    if (p < 1) {
      rafId = requestAnimationFrame(animate)
    } else {
      rotation.value %= Math.PI * 2
      showResult()
      spinning.value = false
    }
  }
  rafId = requestAnimationFrame(animate)
}

async function fetchInventory(){
  try {
    const url = `${props.apiUrl}?steamid=${encodeURIComponent(currentSteamId.value)}`
    const r = await fetch(url)
    const data = await r.json()
    if (!Array.isArray(data)) throw new Error('format inattendu')

    pattern.value = []
    const newNames = []

    data.forEach(item => {
      if (!colors.value[item.name]) newNames.push(item.name)
      for (let i = 0; i < (item.amount || 0); i++) {
        pattern.value.push(item.name)
      }
    })

    generateColors(newNames)
    shufflePattern()
    drawWheel()
  } catch (e) {
    console.warn('fetchInventory échoué:', e)
    // fallback facultatif si tu utilises /public/mock_inventory.json
    try {
      const r2 = await fetch('/mock_inventory.json')
      const d2 = await r2.json()
      pattern.value = []
      const newNames = []
      d2.forEach(item => {
        if (!colors.value[item.name]) newNames.push(item.name)
        for (let i = 0; i < (item.amount || 0); i++) {
          pattern.value.push(item.name)
        }
      })
      generateColors(newNames)
      shufflePattern()
      drawWheel()
    } catch {/* ignore */}
  }
}

function switchId(id){
  if (spinning.value) return
  currentSteamId.value = id
  rotation.value = 0
}

// ↴ Utilise les labels passés par le parent si présents, sinon "Inventaire n"
function labelFor(id){
  const idx = props.steamIds.indexOf(id)
  if (idx >= 0 && props.labels[idx]) return props.labels[idx]
  return idx >= 0 ? `Inventaire ${idx + 1}` : id
}

function onResize(){
  setupHiDPI()
  drawWheel()
}

onMounted(() => {
  setupHiDPI()
  drawWheel()
  fetchInventory()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)
})

watch(currentSteamId, () => fetchInventory())
</script>

<template>
  <div class="wheel-page">
    <div class="wheel-wrapper">
      <canvas ref="canvasRef" :width="size" :height="size"></canvas>
      <div class="pointer"></div>
    </div>

    <div class="controls">
      <button @click="spin" :disabled="spinning || !pattern.length">Lancer</button>
      <button @click="shufflePattern" :disabled="!pattern.length">Mélanger</button>

      <div class="steam-buttons">
        <button
          v-for="id in steamIds"
          :key="id"
          class="steamBtn"
          :class="{ active: id === currentSteamId }"
          @click="switchId(id)"
        >
          {{ labelFor(id) }}
        </button>
      </div>
    </div>

    <div id="result">Résultat : {{ resultText }}</div>
  </div>
</template>
