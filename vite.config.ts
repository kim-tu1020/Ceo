import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" → 빌드 결과(dist)를 아무 정적 호스팅에 그대로 올려도 동작
export default defineConfig({
  plugins: [react()],
  base: "./",
});
