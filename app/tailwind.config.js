const colors = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // The app is light-only for now (app.json); 'class' lets NativeWind set the scheme itself.
  darkMode: 'class',
  theme: {
    extend: {
      colors,
      // React Native needs one family per weight, so each weight is its own class.
      fontFamily: {
        display: ['Baloo2_700Bold'],
        'display-xbold': ['Baloo2_800ExtraBold'],
        body: ['Nunito_400Regular'],
        'body-semibold': ['Nunito_600SemiBold'],
        'body-bold': ['Nunito_700Bold'],
      },
      borderRadius: {
        card: '20px',
      },
    },
  },
  plugins: [],
};
