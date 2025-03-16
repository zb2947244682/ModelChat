import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

// Initialize Capacitor plugins
const initCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Hide the splash screen
      await SplashScreen.hide()
      
      // Set status bar defaults
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#ffffff' })
      await StatusBar.setOverlaysWebView({ overlay: false })
    } catch (err) {
      console.error('Error initializing Capacitor plugins:', err)
    }
  }
}

// Run when the device is ready
document.addEventListener('deviceready', initCapacitor, false)
// Also run on load in case 'deviceready' has already fired
if (Capacitor.isNativePlatform()) {
  initCapacitor()
}

const app = createApp(App)
app.use(router)
app.mount('#app')
