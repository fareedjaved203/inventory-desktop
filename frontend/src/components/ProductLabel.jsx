import { formatPakistaniCurrency } from '../utils/formatCurrency';
import { generateBarcodeHTML } from '../utils/barcodeRenderer';

function ProductLabel({ product, onPrint }) {
  const generateLabelHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Product Label - ${product.name}</title>
        <style>
          @media print {
            @page { 
              size: 2.25in 1.25in; 
              margin: 0.1in; 
            }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 8px;
            line-height: 1.2;
            margin: 0;
            padding: 2px;
            width: 2.05in;
            height: 1.05in;
            border: 1px solid #000;
            box-sizing: border-box;
          }
          .label-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: space-between;
          }
          .product-name {
            font-size: 9px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .price {
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            margin: 2px 0;
          }
          .barcode-section {
            text-align: center;
            margin-top: auto;
          }
          .no-barcode {
            font-size: 8px;
            color: #666;
            margin: 2px 0;
          }
          .shop-name {
            font-size: 6px;
            text-align: center;
            color: #666;
            margin-top: 1px;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="product-name">${product.name}</div>
          <div class="price">${formatPakistaniCurrency(product.price)}</div>
          <div class="barcode-section">
            ${product.sku ? generateBarcodeHTML(product.sku) : '<div class="no-barcode">NO BARCODE</div>'}
          </div>
          <div class="shop-name">HISAB GHAR</div>
        </div>
      </body>
      </html>
    `;
  };

  const printLabel = () => {
    const printWindow = window.open('', '_blank');
    const labelHtml = generateLabelHtml();
    
    printWindow.document.write(labelHtml);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="border border-gray-300 rounded-lg p-3 bg-white shadow-sm" style={{ width: '2.25in', height: '1.25in' }}>
      <div className="flex flex-col h-full justify-between text-center">
        <div className="text-xs font-bold truncate">{product.name}</div>
        <div className="text-lg font-bold">{formatPakistaniCurrency(product.price)}</div>
        <div>
          {product.sku ? (
            <div dangerouslySetInnerHTML={{ __html: generateBarcodeHTML(product.sku) }} />
          ) : (
            <div className="text-xs text-gray-500">NO BARCODE</div>
          )}
        </div>
        <div className="text-xs text-gray-500">HISAB GHAR</div>
      </div>
      <button
        onClick={printLabel}
        className="mt-2 w-full bg-primary-600 text-white py-1 px-2 rounded text-xs hover:bg-primary-700"
      >
        Print Label
      </button>
    </div>
  );
}

export default ProductLabel;