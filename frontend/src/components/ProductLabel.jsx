import { useState, useEffect, useRef, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import { formatPakistaniCurrency } from '../utils/formatCurrency';

const LABEL_SIZES = {
  'extra-small': {
    name: 'Extra Small (1" × 0.5")',
    width: '1in',
    height: '0.5in',
    barcodeWidth: 1,
    barcodeHeight: 20,
    fontSize: '6px',
    nameSize: '7px',
    priceSize: '8px'
  },
  'small': {
    name: 'Small (1.5" × 1")',
    width: '1.5in',
    height: '1in',
    barcodeWidth: 1.5,
    barcodeHeight: 30,
    fontSize: '8px',
    nameSize: '9px',
    priceSize: '10px'
  },
  'medium': {
    name: 'Medium (2.25" × 1.25")',
    width: '2.25in',
    height: '1.25in',
    barcodeWidth: 2,
    barcodeHeight: 40,
    fontSize: '10px',
    nameSize: '11px',
    priceSize: '12px'
  },
  'large': {
    name: 'Large (3" × 2")',
    width: '3in',
    height: '2in',
    barcodeWidth: 2.5,
    barcodeHeight: 50,
    fontSize: '12px',
    nameSize: '14px',
    priceSize: '16px'
  },
  'extra-large': {
    name: 'Extra Large (4" × 3")',
    width: '4in',
    height: '3in',
    barcodeWidth: 3,
    barcodeHeight: 60,
    fontSize: '14px',
    nameSize: '16px',
    priceSize: '18px'
  }
};

function ProductLabel({ product, products, onClose }) {
  // Create a ref to store the onClose function
  const onCloseRef = useRef(onClose);
  
  // Update ref when onClose changes
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  
  // Safety check for onClose
  const handleClose = useCallback(() => {
    console.log('handleClose called, onClose type:', typeof onCloseRef.current);
    if (typeof onCloseRef.current === 'function') {
      onCloseRef.current();
    } else {
      console.error('onClose is not a function, trying to close modal manually');
      // Try to find and remove the modal from DOM
      const modal = document.querySelector('[data-modal="product-label"]');
      if (modal) {
        modal.remove();
      }
    }
  }, []);
  const [selectedSize, setSelectedSize] = useState('medium');
  const [quantity, setQuantity] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  const isMultiProduct = Array.isArray(products) && products.length > 0;
  const displayProducts = isMultiProduct ? products : (product ? [product] : []);
  
  // Debug logging
  useEffect(() => {
    console.log('ProductLabel rendered with:', {
      product: product?.name,
      productsCount: products?.length,
      isMultiProduct,
      onCloseType: typeof onClose
    });
  }, [product, products, isMultiProduct, onClose]);
  
  // Add escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        console.log('Escape key pressed');
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);
  


  const generateBarcode = (text, size) => {
    const canvas = document.createElement('canvas');
    const sizeConfig = LABEL_SIZES[size];
    
    try {
      JsBarcode(canvas, text, {
        format: "CODE128",
        width: sizeConfig.barcodeWidth,
        height: sizeConfig.barcodeHeight,
        displayValue: false,
        background: "#ffffff",
        lineColor: "#000000",
        margin: 2
      });
      return canvas.toDataURL();
    } catch (error) {
      console.error('Barcode generation error:', error);
      return null;
    }
  };

  const saveToPDF = () => {
    const sizeConfig = LABEL_SIZES[selectedSize];
    const productsToProcess = isMultiProduct ? products : [product];
    
    const labelsHTML = productsToProcess.flatMap(prod => 
      Array.from({ length: quantity }, () => {
        const barcodeDataURL = generateBarcode(prod.sku, selectedSize);
        return `
          <div class="label" style="
            width: ${sizeConfig.width};
            height: ${sizeConfig.height};
            border: 1px solid #000;
            display: block;
            margin: 0 0 5mm 0;
            padding: 2px;
            text-align: center;
            font-family: Arial, sans-serif;
            box-sizing: border-box;
            position: relative;
          ">
            <div style="
              font-size: ${sizeConfig.nameSize};
              font-weight: bold;
              margin-bottom: 1px;
              line-height: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            ">${prod.name}</div>
            
            <div style="
              font-size: ${sizeConfig.priceSize};
              font-weight: bold;
              margin: 1px 0;
              color: #000;
            ">${formatPakistaniCurrency(prod.price)}</div>
            
            ${barcodeDataURL ? `
              <div style="margin: 1px 0;">
                <img src="${barcodeDataURL}" style="max-width: 90%; height: auto;" />
              </div>
              <div style="
                font-size: ${sizeConfig.fontSize};
                font-weight: bold;
                margin-top: 1px;
              ">${prod.sku}</div>
            ` : `
              <div style="
                font-size: ${sizeConfig.fontSize};
                color: #666;
                margin: 2px 0;
              ">NO BARCODE</div>
            `}
            
            <div style="
              font-size: ${sizeConfig.fontSize};
              color: #666;
              position: absolute;
              bottom: 1px;
              left: 50%;
              transform: translateX(-50%);
            ">HISAB GHAR</div>
          </div>
        `;
      })
    ).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Product Labels PDF</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .labels-container {
            display: flex;
            flex-wrap: wrap;
            gap: 5mm;
            justify-content: flex-start;
          }
        </style>
      </head>
      <body>
        <div class="labels-container">
          ${labelsHTML}
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-labels-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printLabels = () => {
    const sizeConfig = LABEL_SIZES[selectedSize];
    const productsToProcess = isMultiProduct ? products : [product];
    
    const labelsHTML = productsToProcess.flatMap(prod => 
      Array.from({ length: quantity }, () => {
        const barcodeDataURL = generateBarcode(prod.sku, selectedSize);
        return `
          <div class="label" style="
            width: ${sizeConfig.width};
            height: ${sizeConfig.height};
            border: 1px solid #000;
            display: block;
            margin: 0;
            padding: 2px;
            text-align: center;
            font-family: Arial, sans-serif;
            box-sizing: border-box;
            position: relative;
          ">
            <div style="
              font-size: ${sizeConfig.nameSize};
              font-weight: bold;
              margin-bottom: 1px;
              line-height: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            ">${prod.name}</div>
            
            <div style="
              font-size: ${sizeConfig.priceSize};
              font-weight: bold;
              margin: 1px 0;
              color: #000;
            ">${formatPakistaniCurrency(prod.price)}</div>
            
            ${barcodeDataURL ? `
              <div style="margin: 1px 0;">
                <img src="${barcodeDataURL}" style="max-width: 90%; height: auto;" />
              </div>
              <div style="
                font-size: ${sizeConfig.fontSize};
                font-weight: bold;
                margin-top: 1px;
              ">${prod.sku}</div>
            ` : `
              <div style="
                font-size: ${sizeConfig.fontSize};
                color: #666;
                margin: 2px 0;
              ">NO BARCODE</div>
            `}
            
            <div style="
              font-size: ${sizeConfig.fontSize};
              color: #666;
              position: absolute;
              bottom: 1px;
              left: 50%;
              transform: translateX(-50%);
            ">HISAB GHAR</div>
          </div>
        `;
      })
    ).join('');

    // Use EXACT same method as POS system - no about:blank, no blob URLs
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Product Labels</title>
          <style>
            /* Label Printer Settings */
            @page {
              size: ${sizeConfig.width} ${sizeConfig.height};
              margin: 0;
            }
            
            /* A4 Paper Settings (fallback) */
            @media print and (min-width: 8in) {
              @page {
                size: A4;
                margin: 0.5in;
              }
              .labels-container {
                display: flex;
                flex-wrap: wrap;
                gap: 2mm;
              }
            }
            
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
              .label { 
                page-break-after: always;
                margin: 0 !important;
                display: block;
                width: 100%;
                height: 100%;
              }
              .label:last-child {
                page-break-after: avoid;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            
            .labels-container {
              display: block;
            }
            .print-info {
              margin-bottom: 10px;
              padding: 10px;
              background: #f0f0f0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="print-info no-print">
            <h3>Print Settings</h3>
            <p><strong>Products:</strong> ${productsToProcess.length}</p>
            <p><strong>Size:</strong> ${sizeConfig.name}</p>
<p><strong>Total Labels:</strong> ${productsToProcess.length * quantity}</p>
            <p><strong>For Label Printers:</strong> Set paper size to ${sizeConfig.width} × ${sizeConfig.height}</p>
            <p><strong>Instructions:</strong> Print at 100% scale, no margins adjustment</p>
          </div>
          
          <div class="labels-container">
            ${labelsHTML}
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div 
      data-modal="product-label"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          console.log('Backdrop clicked, closing modal');
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Print {isMultiProduct ? 'Multiple Product' : 'Product'} Labels
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isMultiProduct ? (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Products to Print</h3>
              <div className="max-h-32 overflow-y-auto">
                {products.map((prod) => (
                  <div key={prod.id} className="text-sm py-1">
                    {prod.name} - {prod.sku || 'No SKU'}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {products.length} products will be printed
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-1">Product</h3>
              <p className="text-sm"><strong>Name:</strong> {product?.name}</p>
              <p className="text-sm"><strong>Price:</strong> {product ? formatPakistaniCurrency(product.price) : ''}</p>
              <p className="text-sm"><strong>SKU:</strong> {product?.sku || 'No SKU'}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(LABEL_SIZES).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isMultiProduct ? 'Copies per Product' : 'Quantity'}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                onWheel={(e) => e.target.blur()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {isMultiProduct 
                  ? `Print ${quantity} copies of each selected product's label`
                  : `Print ${quantity} copies of this product's label`
                }
              </p>
            </div>
          </div>



          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-1">Print Instructions</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Print at 100% scale (no fit to page)</li>
              <li>• Use high quality (300+ DPI) for best barcode scanning</li>
              <li>• For barcode printers: Use exact size settings</li>
              <li>• For A4 paper: Multiple labels will fit automatically</li>
              <li>• To save as PDF: Use "Save as PDF" button below</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              saveToPDF();
            }}
            disabled={isMultiProduct ? products?.length === 0 : !product?.sku}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save as PDF
          </button>
          <button
            type="button"
            onClick={() => {
              printLabels();
            }}
            disabled={isMultiProduct ? products?.length === 0 : !product?.sku}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Print {isMultiProduct ? `${products?.length || 0} Products (${quantity} each)` : `${quantity} Label${quantity > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductLabel;