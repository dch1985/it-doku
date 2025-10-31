import { Configuration, PopupRequest } from '@azure/msal-browser';

/**
 * Azure AD B2C Configuration
 * Replace these values with your Azure AD B2C tenant details
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || ''}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
};

/**
 * Add scopes here for ID token to be used at Microsoft identity platform endpoints.
 */
export const loginRequest: PopupRequest = {
  scopes: ['User.Read'],
};

/**
 * Add the endpoints here for Microsoft Graph API services you'd like to use.
 */
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};

