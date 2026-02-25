// Extend Tailwind CSS IntelliSense
declare module 'tailwindcss' {
  interface Theme {
    colors: {
      primary: Record<string, string>;
      secondary: Record<string, string>;
      success: string;
      warning: string;
      error: string;
      info: string;
      neutral: Record<string, string>;
    };
  }
}