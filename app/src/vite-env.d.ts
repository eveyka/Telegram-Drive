/// <reference types="vite/client" />

declare module "./components/mobile/MobileDashboard" {
  const MobileDashboard: any;
  export default MobileDashboard;
}

declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export type PDFDocumentProxy = any;
  export type PDFPageProxy = any;
  export type PDFDocumentLoadingTask = any;
  const content: any;
  export default content;
  export const GlobalWorkerOptions: any;
  export const getDocument: any;
}
