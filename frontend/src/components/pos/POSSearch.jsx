import { FaBarcode, FaSearch } from 'react-icons/fa';
import LoadingSpinner from '../LoadingSpinner';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function POSSearch({
  handleBarcodeSubmit,
  barcodeInputRef,
  barcodeInput,
  setBarcodeInput,
  barcodeLoading,
  searchInputRef,
  searchTerm,
  handleSearchChange,
  handleSearchKeyDown,
  setShowProductDropdown,
  showProductDropdown,
  debouncedSearchTerm,
  productsLoading,
  products,
  handleProductSelect,
  selectedProductIndex,
  viewMode
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 lg:p-4 mb-3 lg:mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        {/* Barcode Scanner */}
        <form onSubmit={handleBarcodeSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaBarcode className="inline mr-2" />
            Scan/Enter Barcode
          </label>
          <div className="flex">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan or type barcode..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm lg:text-base min-h-[44px]"
            />
            <button
              type="submit"
              disabled={barcodeLoading}
              className="px-3 lg:px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 disabled:opacity-50 min-h-[44px]"
            >
              {barcodeLoading ? <LoadingSpinner size="w-4 h-4" /> : <FaSearch />}
            </button>
          </div>
        </form>

        {/* Product Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaSearch className="inline mr-2" />
            Search Products
          </label>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={(e) => handleSearchKeyDown(e, products)}
            onFocus={() => setShowProductDropdown(true)}
            onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
            placeholder="Search by name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm lg:text-base min-h-[44px]"
          />
          {/* Product Dropdown for Compact View */}
          {viewMode === 'compact' && showProductDropdown && debouncedSearchTerm && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {productsLoading ? (
                <div className="p-4 text-center">
                  <LoadingSpinner size="w-6 h-6" />
                </div>
              ) : products.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No products found</div>
              ) : (
                products.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={`p-3 cursor-pointer border-b last:border-b-0 flex justify-between items-center ${
                      index === selectedProductIndex ? 'bg-primary-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{product.name}</div>
                      {!product.isManufactured && product.quantity !== null && (
                        <div className="text-sm text-gray-500">Stock: {Number(product.quantity) % 1 === 0 ? product.quantity : Number(product.quantity).toFixed(2)} {product.unit}</div>
                      )}
                      {product.isManufactured && (
                        <div className="text-sm text-blue-600">Made to Order</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-600">{formatPakistaniCurrency(product.retailPrice || product.price)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
