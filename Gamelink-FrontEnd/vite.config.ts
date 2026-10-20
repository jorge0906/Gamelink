import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'DYNAMIC_IMPORT_EXPRESSIONS') {
          return;
        }
        warn(warning);
      },
    },
  },
});
