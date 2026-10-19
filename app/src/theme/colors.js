// Pack&Sun palette, taken from the logo. Single source of truth: tailwind.config.js
// builds its classes from this file and components import it when they need a raw
// value (icon colors, native props). Contrast notes are against white unless stated.
module.exports = {
  sun: '#FDD835', // primary fill; ink on sun = 12.5:1
  'sun-soft': '#FFF3B0', // tinted backgrounds, selected chips
  gold: '#E6A80C', // progress, active states
  ember: '#CC6000', // logo orange: icons, borders, large shapes only (4.0:1)
  'ember-text': '#B35400', // orange for text and links (5.0:1)
  ink: '#1A1A1A',
  cream: '#FFFBEA', // app background; ink on cream = 16.8:1
  surface: '#FFFFFF',
  line: '#EDE4CC', // borders and dividers
  muted: '#6B6355', // secondary text
  danger: '#C62828',
  'danger-soft': '#FDECEA',
  success: '#2E7D32',
  'success-soft': '#E8F5E9',
};
