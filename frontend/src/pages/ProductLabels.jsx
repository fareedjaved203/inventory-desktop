import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductLabel from '../components/ProductLabel';
import { debounce } from 'lodash';
import { FaSearch, FaPrint, FaTag } from 'react-icons/fa';
import { formatPakistaniCurrency } from '../utils/formatCurrency';

function ProductLabels() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const searchInputRef = useRef(null);

  const debouncedSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const { data: products = [], isLoading } = useQuery(
    ['products-labels', debouncedSearchTerm],
    async () => {
      const result = await API.getProducts({
        limit: 100,
        search: debouncedSearchTerm
      });
      return result.items || [];
    }
  );

  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };



  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800 flex items-center gap-2">
          <FaTag className="text-primary-600" />
          Product Labels
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:w-64 pl-10 pr-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <FaSearch />
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            disabled={selectedProducts.length === 0}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FaPrint />
            Print Selected ({selectedProducts.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="w-8 h-8" />
        </div>
      ) : (
        <>
          {/* Product Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Select Products for Labels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => toggleProductSelection(product)}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedProducts.find(p => p.id === product.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!selectedProducts.find(p => p.id === product.id)}
                      onChange={() => {}}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 pointer-events-none"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <p className="text-primary-600 font-semibold">{formatPakistaniCurrency(product.retailPrice || product.price)}</p>
                      <p className="text-xs text-gray-500">
                        {product.sku ? `Barcode: ${product.sku}` : 'No barcode'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>


        </>
      )}
      
      {/* Product Label Modal */}
      {modalOpen && (
        <ProductLabel
          products={selectedProducts}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

export default ProductLabels;