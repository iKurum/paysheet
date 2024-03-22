import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",
      devOptions: {
        enabled: false, // 开发模式下是否启用
      },
      manifest: {
        name: "考勤记录 PWA",
        theme_color: "#ffffff",
        icons: [
          {
            src: "logo.png",
            type: "image/png",
            sizes: "144x144",
          },
        ],
      },
    }),
  ],
});
