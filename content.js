
const fontUrl = chrome.runtime.getURL("fonts/KouzanBrushFont.ttf");

const fontFace = `
@font-face {
  font-family: '衡山毛筆フォント';
  src: url('${fontUrl}') format('truetype');
}
`;

const styleContent = `
${fontFace}
body, body * {
  font-family: '衡山毛筆フォント' !important;
  text-shadow:
    0.2px 0 0 black,
    -0.2px 0 0 black,
    0 0.2px 0 black,
    0 -0.2px 0 black;
}
}
`;

const styleElement = document.createElement('style');
styleElement.textContent = styleContent;
document.head.appendChild(styleElement);
