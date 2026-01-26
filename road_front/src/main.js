import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// Pinia pour la gestion d'état
app.use(createPinia())

// Vue Router pour la navigation
app.use(router)

app.mount('#app')
