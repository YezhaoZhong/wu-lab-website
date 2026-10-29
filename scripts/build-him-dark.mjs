import fs from 'node:fs';
const dir = new URL('../assets/branding/', import.meta.url);
const png = fs.readFileSync(new URL('HIMCASlogo2.png', dir));
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
// Map the source's exact blue (#073A78) to white and white back to blue.
// Using one scalar from red preserves the two-color ramp at antialiased edges.
const blue = [7, 58, 120].map(value => value / 255);
const slope = blue.map(value => (value - 1) / (1 - blue[0]));
const intercept = slope.map(value => 1 - value * blue[0]);
const matrix = slope.map((value, i) => `${value} 0 0 0 ${intercept[i]}`).join(' ') + ' 0 0 0 1 0';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<title>Hangzhou Institute of Medicine: blue-white reversed</title>
<defs><filter id="swap" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${matrix}"/></filter></defs>
<image width="${width}" height="${height}" filter="url(#swap)" xlink:href="data:image/png;base64,${png.toString('base64')}"/>
</svg>\n`;
fs.writeFileSync(new URL('HIMCASlogo2-dark-v2.svg', dir), svg);
