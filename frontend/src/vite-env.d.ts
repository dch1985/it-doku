/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_AZURE_OPENAI_ENDPOINT: string
  readonly VITE_AZURE_OPENAI_KEY: string
  readonly VITE_AZURE_OPENAI_DEPLOYMENT: string
  readonly VITE_AZURE_CLIENT_ID: string
  readonly VITE_AZURE_TENANT_ID: string
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
