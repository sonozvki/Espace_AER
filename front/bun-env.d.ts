declare module "*.css" {}
declare module "*.svg" {
  const path: string;
  export = path;
}
declare module "*.png" {
  const path: string;
  export = path;
}
