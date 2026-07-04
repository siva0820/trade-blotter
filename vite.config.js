import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // This Vite version is Rolldown-powered; `codeSplitting.groups` is its
    // current (non-deprecated) equivalent of Rollup's `manualChunks` object form.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-ag-grid', test: /node_modules\/(ag-grid-community|ag-grid-react)\// },
            { name: 'vendor-mui', test: /node_modules\/(@mui\/material|@emotion)\// },
            { name: 'vendor-redux', test: /node_modules\/@reduxjs\/toolkit\// },
          ],
        },
      },
    },
  },
})
