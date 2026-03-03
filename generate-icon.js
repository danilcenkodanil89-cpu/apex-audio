const sharp = require('sharp');
const path = require('path');

// Размер иконки
const size = 256;

// Создаём SVG как строку (простой дизайн: фиолетовый круг с белой нотой)
const svgIcon = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c5cff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#9775fa;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="128" cy="128" r="120" fill="url(#grad)" stroke="#ffffff" stroke-width="4"/>
  <path d="M160 96 L160 160 Q160 176 144 176 L112 176 Q96 176 96 160 Q96 144 112 144 L144 144 L144 96 L112 104 L112 144" fill="white" stroke="white" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="112" cy="160" r="16" fill="white" stroke="white" stroke-width="2"/>
  <circle cx="144" cy="176" r="16" fill="white" stroke="white" stroke-width="2"/>
</svg>
`;

async function generateIcon() {
  try {
    // Конвертируем SVG в PNG
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, 'icon.png'));
    console.log('✅ Иконка успешно создана: icon.png');
  } catch (err) {
    console.error('❌ Ошибка при создании иконки:', err);
  }
}

generateIcon();