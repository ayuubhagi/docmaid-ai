/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin (e.g. https://docmaid-backend.onrender.com). Empty = same origin. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
