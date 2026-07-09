/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORDER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
