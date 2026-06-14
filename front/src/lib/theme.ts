import { createTheme, type MantineColorsTuple } from "@mantine/core";

const epitechAccent: MantineColorsTuple = [
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
    epitech: epitechAccent,
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
      defaultProps: { bg: "dark.6" },
    },
  },
});
