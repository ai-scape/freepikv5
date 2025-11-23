/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FAL_KEY?: string;
  readonly VITE_KIE_KEY?: string;
  readonly VITE_FILE_API_BASE?: string;
  readonly VITE_FILE_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
