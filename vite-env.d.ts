/// <reference types="vite/client" />

/** vite-imagetools：按查询串结尾匹配（避免 TS 单段 * 无法匹配子路径） */
declare module "*png?format=webp&quality=80" {
  const src: string;
  export default src;
}
declare module "*png?format=webp&quality=82" {
  const src: string;
  export default src;
}
declare module "*png?format=webp&quality=85" {
  const src: string;
  export default src;
}
