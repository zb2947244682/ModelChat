import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Settings from '../views/Settings.vue'
import ModelList from '../views/ModelList.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/model-list',
    name: 'ModelList',
    component: ModelList
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
