import { createTheme, virtualColor, type MantineColorsTuple } from "@mantine/core";

// Dark mode : pervenche doux, lisible sur fond sombre
const epitechAccentDark: MantineColorsTuple = [
  "#eef0ff",
  "#dde1ff",
  "#bbc3ff",
  "#99a3fe",
  "#809dfd",
  "#6b8afc",
  "#5477fb",
  "#4264e0",
  "#3255c5",
  "#2246aa",
];

// Light mode : bleu Epitech #013afb (shade 4 = primaryShade)
const epitechAccentLight: MantineColorsTuple = [
  "#e6ecff",
  "#c0cfff",
  "#94adff",
  "#4a72ff",
  "#013afb",
  "#0134e2",
  "#012ec9",
  "#0227ab",
  "#02218e",
  "#011a70",
];

const epitechDark: MantineColorsTuple = [
  "#ffffff",
  "#e0e0e0",
  "#777777",
  "#aaaaaa",
  "#3a3a3a",
  "#2a2a2a",
  "#242424",
  "#1f1f1f",
  "#191919",
  "#111111",
];

export const theme = createTheme({
  primaryColor: "epitech",
  primaryShade: { dark: 4, light: 4 },

  colors: {
    epitechDim: epitechAccentDark,
    epitechVivid: epitechAccentLight,
    epitech: virtualColor({ name: "epitech", dark: "epitechDim", light: "epitechVivid" }),
    dark: epitechDark,
  },

  fontFamily: '"IBM Plex Sans", sans-serif',
  headings: { fontFamily: '"Anton", sans-serif' },

  defaultRadius: "md",

  components: {
    NavLink: {
      styles: {
        root: { borderRadius: 6 },
      },
    },
    Paper: {
      defaultProps: { bg: "var(--epi-panel)" },
    },
  },
});
