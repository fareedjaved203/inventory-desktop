// Canvas-based barcode renderer
export const generatePrintBarcodeHTML = (text) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const barWidth = 2;
  const barHeight = 50;
  const width = text.length * 24;
  canvas.width = width;
  canvas.height = barHeight;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, barHeight);
  
  ctx.fillStyle = 'black';
  let x = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    // Create multiple bars per character
    for (let j = 0; j < 4; j++) {
      if ((code + j) % 2 === 0) {
        ctx.fillRect(x, 0, 2, barHeight);
      }
      x += 3;
      
      if ((code + j) % 3 === 0) {
        ctx.fillRect(x, 0, 1, barHeight);
      }
      x += 2;
      
      if ((code + j) % 5 === 0) {
        ctx.fillRect(x, 0, 1, barHeight);
      }
      x += 1;
    }
  }
  
  const dataURL = canvas.toDataURL();
  
  return `
    <div style="text-align: center; margin: 10px 0;">
      <img src="${dataURL}" style="display: block; margin: 0 auto;" />
      <div style="font-size: 10px; margin-top: 3px; font-weight: bold;">${text}</div>
    </div>
  `;
};

export const generateBarcodeHTML = generatePrintBarcodeHTML;