import basicSsl from "@vitejs/plugin-basic-ssl";

export default {
  base: "./",
  root: "three-dev",
  publicDir: "../3d-assets",
  build: {
    outDir: "../dist",
  },
  plugins: [basicSsl()],
};
