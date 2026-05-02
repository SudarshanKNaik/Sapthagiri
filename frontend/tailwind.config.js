/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ai-primary': '#cc785c',
        'ai-secondary': '#5645d4',
        'ai-suggestion': '#f54e00',
        'ai-canvas': '#faf9f5',
        'ai-surface': '#efe9de',
        'ai-conf-high': '#5db872',
        'ai-conf-med': '#d4a017',
        'ai-conf-low': '#c64545',
        'ai-stage-thinking': '#dfa88f',
        'ai-stage-reading': '#9fbbe0',
        'ai-stage-editing': '#c0a8dd',
        'ai-stage-generating': '#c08532',
        'ai-stage-completed': '#1f8a65',
      }
    },
  },
  plugins: [],
}

