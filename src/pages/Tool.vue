<script setup>
import Wheel from '@/components/Wheel.vue'

// Tes SteamIDs (ordre important ↔ labels)
const steamIds = [
  '76561199055485964',
  '76561199652580615',
  '76561199065020540'
]

// Libellés souhaités, dans le même ordre que steamIds
const labels = ['Dublatic', 'Livies', 'Henebus']

// API via proxy Vite vers ton PHP Docker/XAMPP
const apiUrl = '/api/get_inventory.php'
</script>

<template>
  <div class="box">
    <h2>Bienvenue sur l'outil Roue</h2>
    <p style="margin-bottom:16px">Ici se trouve la roue et ses paramètres.</p>

    <!-- On passe les labels au composant -->
    <Wheel :steam-ids="steamIds" :api-url="apiUrl" :labels="labels" />
  </div>
</template>
