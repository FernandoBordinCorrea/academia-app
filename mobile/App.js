import { AuthProvider } from './src/context/AuthContext';
import { ModalProvider } from './src/context/ModalContext';
import Navigation from './src/navigation';

export default function App() {
  return (
    <ModalProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </ModalProvider>
  );
}
