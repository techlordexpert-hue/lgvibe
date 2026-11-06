import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { fontFamily: { hand: ["var(--font-hand)", "cursive"] } } },
  plugins: [],
};
export default config;
