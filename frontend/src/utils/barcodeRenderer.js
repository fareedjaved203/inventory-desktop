import JsBarcode from 'jsbarcode';

// Generate scannable barcode using JsBarcode library
export const generatePrintBarcodeHTML = (text) => {
  if (!text) {
    return `
      <div style="text-align: center; margin: 10px 0;">
        <div style="font-size: 10px; color: #666;">NO BARCODE</div>
      </div>
    `;
  }

  try {
    const canvas = document.createElement('canvas');
    
    // Generate Code 128 barcode
    JsBarcode(canvas, text, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      textAlign: "center",
      textPosition: "bottom",
      textMargin: 2,
      fontOptions: "bold",
      font: "Arial",
      background: "#ffffff",
      lineColor: "#000000",
      margin: 10
    });
    
    const dataURL = canvas.toDataURL();
    
    return `
      <div style="text-align: center; margin: 10px 0;">
        <img src="${dataURL}" style="display: block; margin: 0 auto;" />
      </div>
    `;
  } catch (error) {
    console.error('Barcode generation error:', error);
    return `
      <div style="text-align: center; margin: 10px 0;">
        <div style="font-size: 10px; color: #666;">BARCODE ERROR</div>
        <div style="font-size: 8px; color: #999;">${text}</div>
      </div>
    `;
  }
};

export const generateBarcodeHTML = generatePrintBarcodeHTML;