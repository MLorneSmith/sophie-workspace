declare module 'tailwindcss' {
  export interface Config {
    content: string[]
    darkMode?: string | string[]
    theme?: Record<string, any>
    plugins?: any[]
    important?: boolean
  }

  const tailwindcss: any
  export = tailwindcss
}

declare module 'tailwindcss-animate' {
  const tailwindcssAnimate: any
  export = tailwindcssAnimate
}
