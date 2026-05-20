import path from "path";

const config = {
  test: { environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
};

export default config;
