import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Check if dev mode is enabled
const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';

console.log('[Main] VITE_DEV_AUTH_ENABLED:', import.meta.env.VITE_DEV_AUTH_ENABLED);
console.log('[Main] isDevMode:', isDevMode);

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('[Main] Root element not found!');
  throw new Error('Root element not found');
}

// Initialize MSAL only if not in dev mode
if (!isDevMode) {
  // Dynamic import of MSAL only when needed
  Promise.all([
    import('@azure/msal-browser'),
    import('@azure/msal-react'),
    import('./lib/authConfig')
  ]).then(([{ PublicClientApplication }, { MsalProvider }, { msalConfig }]) => {
    const msalInstance = new PublicClientApplication(msalConfig);
    
    return msalInstance.initialize().then(() => {
      createRoot(rootElement).render(
        <StrictMode>
          <MsalProvider instance={msalInstance}>
            <App />
          </MsalProvider>
        </StrictMode>,
      );
    });
  }).catch((error) => {
    console.error('[MSAL] Initialization failed:', error);
    console.log('[Main] Falling back to direct render (Dev Mode)');
    // Fallback: Render without MSAL
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
} else {
  // Dev mode: Render directly without MSAL
  console.log('[Main] Dev mode enabled - rendering without MSAL');
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
