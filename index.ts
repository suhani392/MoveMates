import { registerRootComponent } from 'expo';
import { ErrorUtils } from 'react-native';

import App from './App';

// Global error handler for unhandled promise rejections
if (typeof global !== 'undefined' && ErrorUtils) {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    if (__DEV__) {
      console.error('Global error handler:', error, isFatal);
    }
    // Call original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
