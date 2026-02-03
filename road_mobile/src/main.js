/**
 * Point d'entrée de l'application mobile Road Signalement
 * Initialise Vue, Ionic, Pinia et le routeur
 */
import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { createPinia } from 'pinia';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

import App from './App.vue';
import router from './router';

// Styles Ionic Core
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

// Styles Ionic optionnels
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

// Palettes de couleurs Ionic
import '@ionic/vue/css/palettes/dark.system.css';

// Thème personnalisé
import './theme/variables.css';
import './theme/global.css';

// Ajouter les icônes Ionicons
import { addIcons } from 'ionicons';
import { 
  chevronDown,
  chevronForward,
  alertCircle,
  checkmarkCircle,
  construct,
  closeCircle
} from 'ionicons/icons';

addIcons({
  'chevron-down': chevronDown,
  'chevron-forward': chevronForward,
  'alert-circle': alertCircle,
  'checkmark-circle': checkmarkCircle,
  'construct': construct,
  'close-circle': closeCircle
});

// Créer l'application Vue
const app = createApp(App);

// Configurer Ionic Vue
app.use(IonicVue, {
  mode: 'md', // Mode Material Design pour uniformité
  rippleEffect: true,
  animated: true,
});

// Configurer Pinia pour la gestion d'état
const pinia = createPinia();
app.use(pinia);

// Configurer le routeur
app.use(router);

// Attendre que le routeur soit prêt avant de monter
router.isReady().then(() => {
  app.mount('#app');
});
