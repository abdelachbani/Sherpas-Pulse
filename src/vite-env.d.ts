/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_PROXY_URL?: string;
  readonly VITE_TEAM_KEY?: string;
  readonly VITE_VOICE_MODEL?: string;
  readonly VITE_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
