// Color palettes for live sync. Saturated, stage-style colors read much better on Hue
// bulbs than fully random ones, which often land on washed-out whites and greens.
// maxBri (0-1) optionally caps brightness for calmer palettes.
const PALETTES = {
    concert: {
        name: 'Concert',
        colors: ['#FF0055', '#7A00FF', '#0033FF', '#00C8FF', '#FF2200', '#FF7A00'],
    },
    neon: {
        name: 'Neon',
        colors: ['#FF00CC', '#00FFEE', '#8800FF', '#39FF14', '#FF0066'],
    },
    sunset: {
        name: 'Sunset',
        colors: ['#FF4500', '#FF1F5A', '#B5179E', '#FF8C00', '#7209B7'],
    },
    ocean: {
        name: 'Ocean',
        colors: ['#0077B6', '#00B4D8', '#48CAE4', '#3A0CA3', '#4361EE'],
    },
    warmNight: {
        name: 'Warm Night',
        colors: ['#FF6A00', '#FF3D00', '#FF9E2C', '#E63900', '#FFB347'],
        maxBri: 0.55,
    },
    random: {
        name: 'Random',
        colors: [],
    },
};

export default PALETTES;
