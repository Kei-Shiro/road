import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { createPinia } from 'pinia';

// Importer et configurer Leaflet avant les styles CSS
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fixe le problème des marqueurs Leaflet avec le bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

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
  closeCircle,
  addOutline,
  locateOutline,
  filterOutline,
  closeOutline,
  informationCircleOutline,
  addCircleOutline,
  mapOutline,
  listOutline,
  statsChartOutline,
  personOutline,
  logOutOutline,
  settingsOutline,
  notificationsOutline,
  cameraOutline,
  pencilOutline,
  trashOutline,
  checkmarkOutline,
  imageOutline,
  videocamOutline,
  searchOutline,
  refreshOutline,
  exitOutline,
  arrowBack,
} from 'ionicons/icons';

const iconMap = {
  'chevron-down': chevronDown,
  'chevron-forward': chevronForward,
  'alert-circle': alertCircle,
  'checkmark-circle': checkmarkCircle,
  'construct': construct,
  'close-circle': closeCircle,
  'add-outline': addOutline,
  'locate-outline': locateOutline,
  'filter-outline': filterOutline,
  'close-outline': closeOutline,
  'information-circle-outline': informationCircleOutline,
  'add-circle-outline': addCircleOutline,
  'map-outline': mapOutline,
  'list-outline': listOutline,
  'stats-chart-outline': statsChartOutline,
  'person-outline': personOutline,
  'log-out-outline': logOutOutline,
  'settings-outline': settingsOutline,
  'notifications-outline': notificationsOutline,
  'camera-outline': cameraOutline,
  'pencil-outline': pencilOutline,
  'trash-outline': trashOutline,
  'checkmark-outline': checkmarkOutline,
  'image-outline': imageOutline,
  'videocam-outline': videocamOutline,
  'search-outline': searchOutline,
  'refresh-outline': refreshOutline,
  'exit-outline': exitOutline,
  'arrow-back': arrowBack,
};

addIcons(iconMap);

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
