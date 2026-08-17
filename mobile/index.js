import { registerRootComponent } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import App from './App';

// No Expo Go o módulo nativo do notifee nunca existe — nem tenta carregar o
// pacote nesse caso (evita o overlay de erro do Metro na primeira carga).
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  // Mantém o foreground service (cronômetro na barra de status) vivo até
  // que notifee.stopForegroundService() seja chamado explicitamente.
  const notifee = require('@notifee/react-native').default;
  notifee.registerForegroundService(() => new Promise(() => {}));
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
