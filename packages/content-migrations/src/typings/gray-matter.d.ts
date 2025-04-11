declare module 'gray-matter' {
  interface GrayMatterFile<T = any> {
    data: T;
    content: string;
    excerpt?: string;
    orig: Buffer | string;
    language: string;
    matter: string;
    stringify(options?: object): string;
  }

  interface Options {
    excerpt?: boolean | ((file: GrayMatterFile, options: Options) => string);
    excerpt_separator?: string;
    engines?: object;
    language?: string;
    delimiters?: string | [string, string];
  }

  function matter<T = any>(
    content: Buffer | string,
    options?: Options,
  ): GrayMatterFile<T>;

  namespace matter {
    function read<T = any>(
      filepath: string,
      options?: Options,
    ): GrayMatterFile<T>;
    function test(content: Buffer | string, options?: Options): boolean;
  }

  export = matter;
}
