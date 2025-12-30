import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import Tool from '@/pages/Tool.vue'
import Stats from '@/pages/Stats.vue'
import Settings from '@/pages/Settings.vue'

const routes = [
  { path: '/',         name: 'home',     component: Home,     meta: { title: "Accueil" } },
  { path: '/outil',    name: 'tool',     component: Tool,     meta: { title: "Outil" } },
  { path: '/stats',    name: 'stats',    component: Stats,    meta: { title: "Stats" } },
  { path: '/settings', name: 'settings', component: Settings, meta: { title: "Paramètres" } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

export default router
