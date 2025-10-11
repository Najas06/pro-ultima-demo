// PWA Configuration and Service Worker Registration

interface BeforeInstallPromptEvent extends Event {
  preventDefault(): void;
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update notification
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }
}

// Install prompt for PWA
export function setupInstallPrompt() {
  // let deferredPrompt: BeforeInstallPromptEvent | undefined = undefined;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    const promptEvent = e as BeforeInstallPromptEvent;
    // deferredPrompt = promptEvent;
    
    // Show install button or banner
    showInstallPrompt(promptEvent);
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Reset prompt after installation
  });
}

function showInstallPrompt(deferredPrompt: BeforeInstallPromptEvent) {
  // You can customize this to show a custom install button
  // For now, we'll just log that the prompt is available
  console.log('PWA install prompt available');
  
  // Example: Show a custom install button
  const installButton = document.createElement('button');
  installButton.textContent = 'Install App';
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
  `;
  
  installButton.addEventListener('click', async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    installButton.remove();
  });
  
  document.body.appendChild(installButton);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (installButton.parentNode) {
      installButton.remove();
    }
  }, 10000);
}

// Network status detection
export function setupNetworkDetection() {
  const updateOnlineStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    document.body.setAttribute('data-network', status);
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('network-change', {
      detail: { isOnline: navigator.onLine }
    }));
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial status
  updateOnlineStatus();
}

// Initialize PWA features
export function initializePWA() {
  registerServiceWorker();
  setupInstallPrompt();
  setupNetworkDetection();
}

// PWA manifest configuration
export const pwaConfig = {
  name: 'ProUltima Task Manager',
  short_name: 'ProUltima',
  description: 'Professional task management and team collaboration platform',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#667eea',
  orientation: 'portrait-primary',
  icons: [
    {
      src: '/icons/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png'
    },
    {
      src: '/icons/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png'
    },
    {
      src: '/icons/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png'
    },
    {
      src: '/icons/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png'
    },
    {
      src: '/icons/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png'
    },
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/icons/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png'
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ],
  categories: ['productivity', 'business'],
  screenshots: [
    {
      src: '/screenshots/desktop.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide'
    },
    {
      src: '/screenshots/mobile.png',
      sizes: '375x812',
      type: 'image/png',
      form_factor: 'narrow'
    }
  ]
};
