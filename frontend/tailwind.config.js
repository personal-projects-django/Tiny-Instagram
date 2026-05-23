/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        DEFAULT            : 'hsl(var(--card))',
        background         : 'hsl(var(--background))',
        foreground         : 'hsl(var(--foreground))',
        sidebar            : 'hsl(var(--sidebar))',
        border             : 'hsl(var(--border))',
        accent             : { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        muted              : { DEFAULT: 'hsl(var(--muted))',  foreground: 'hsl(var(--muted-foreground))' },
        destructive        : { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        input              : 'hsl(var(--input))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}