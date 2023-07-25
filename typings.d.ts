// Define nii and niivue type declaration
declare module '@niivue/niivue';
declare module '*.nii' {
  const url: string;
  export default url;
}
