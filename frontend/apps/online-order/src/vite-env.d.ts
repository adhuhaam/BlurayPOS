/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORDER_URL: string;
  readonly VITE_MENU_URL: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
