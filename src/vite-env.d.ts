/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VOICE_MODEL?: string;
  readonly VITE_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
