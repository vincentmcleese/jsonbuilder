declare module "prismjs/components/prism-core" {
  const languages: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlight: (text: string, grammar: any, language: string) => string;
  export { languages, highlight };
}
