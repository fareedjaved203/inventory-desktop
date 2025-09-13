import { useState } from 'react';
import { generatePrintBarcodeHTML } from '../utils/barcodeRenderer';

function BarcodeTest() {
  const [testText, setTestText] = useState('H00001');
  const [barcodeHTML, setBarcodeHTML] = useState('');

  const generateTestBarcode = () => {
    const html = generatePrintBarcodeHTML(testText);
    setBarcodeHTML(html);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Barcode Test</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Text (SKU):
          </label>
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter SKU to test"
          />
        </div>
        
        <button
          onClick={generateTestBarcode}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Generate Test Barcode
        </button>
        
        {barcodeHTML && (
          <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Barcode:</h4>
            <div dangerouslySetInnerHTML={{ __html: barcodeHTML }} />
            <p className="text-xs text-gray-500 mt-2">
              This barcode should be scannable with any Code 128 compatible scanner.
              When scanned, it should return: <strong>{testText}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BarcodeTest;