import { FaSearch, FaShoppingCart, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../LoadingSpinner';
import ProductImage from '../ProductImage';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function POSProductGrid({
  productsLoading,
  categoriesLoading,
  categoryProductsLoading,
  debouncedSearchTerm,
  products,
  addToCart,
  selectedCategory,
  setSelectedCategory,
  categoryProducts,
  categories
}) {
  return (
    <div className="flex-1 flex flex-col p-2 lg:p-4 h-full overflow-hidden w-full">
      <div className="bg-white rounded-lg shadow-sm p-2 mb-2 flex-1 overflow-auto w-full">
        {(productsLoading || categoriesLoading || categoryProductsLoading) ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="w-8 h-8" />
          </div>
        ) : debouncedSearchTerm ? (
          // Show search results
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-800">Search Results</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {products.length} products
              </span>
            </div>
            {products.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <FaSearch className="mx-auto text-4xl mb-4 opacity-30" />
                <p className="text-lg">No products found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="group bg-white border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-primary-400 hover:shadow-md transition-all"
                  >
                    <div className="relative">
                      {product.image ? (
                        <ProductImage
                          filename={product.image}
                          alt={product.name}
                          className="w-full h-16 object-cover rounded mb-1"
                        />
                      ) : (
                        <div className="w-full h-16 bg-gray-100 rounded mb-1 flex items-center justify-center">
                          <FaShoppingCart className="text-gray-400 text-lg" />
                        </div>
                      )}
                      {!product.isManufactured && product.quantity !== null && Number(product.quantity) <= 5 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full">
                          Low
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-[10px] mb-1 text-gray-800 line-clamp-2 leading-tight">{product.name}</h4>
                    <p className="text-primary-600 font-bold text-xs">{formatPakistaniCurrency(product.retailPrice || product.price)}</p>
                    {!product.isManufactured && product.quantity !== null && (
                      <p className="text-[9px] text-gray-500">Stock: {Number(product.quantity) % 1 === 0 ? product.quantity : Number(product.quantity).toFixed(1)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : selectedCategory ? (
          // Show selected category products
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <FaTimes className="text-gray-500 text-xs" />
                </button>
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: selectedCategory.color }}
                >
                  {selectedCategory.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-800">{selectedCategory.name}</h3>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {categoryProducts.length}
              </span>
            </div>
            {categoryProductsLoading ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner size="w-8 h-8" />
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <FaShoppingCart className="mx-auto text-4xl mb-4 opacity-30" />
                <p className="text-lg">No products in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {categoryProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="group bg-white border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-primary-400 hover:shadow-md transition-all"
                  >
                    <div className="relative">
                      {product.image ? (
                        <ProductImage
                          filename={product.image}
                          alt={product.name}
                          className="w-full h-16 object-cover rounded mb-1"
                        />
                      ) : (
                        <div className="w-full h-16 bg-gray-100 rounded mb-1 flex items-center justify-center">
                          <FaShoppingCart className="text-gray-400 text-lg" />
                        </div>
                      )}
                      {!product.isManufactured && product.quantity !== null && Number(product.quantity) <= 5 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full">
                          Low
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-[10px] mb-1 text-gray-800 line-clamp-2 leading-tight">{product.name}</h4>
                    <p className="text-primary-600 font-bold text-xs">{formatPakistaniCurrency(product.retailPrice || product.price)}</p>
                    {!product.isManufactured && product.quantity !== null && (
                      <p className="text-[9px] text-gray-500">Stock: {Number(product.quantity) % 1 === 0 ? product.quantity : Number(product.quantity).toFixed(1)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Show welcome message when no category selected
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaShoppingCart className="text-6xl mb-4 opacity-30" />
            <h3 className="text-2xl font-semibold mb-2">Welcome to POS</h3>
            <p className="text-lg mb-4">Select a category below to browse products</p>
            <p className="text-sm">Or use the search bar to find specific items</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-2">
        {!Array.isArray(categories) || categories.length === 0 ? (
          <div className="text-center text-gray-500 py-2 text-xs">
            <p>No categories</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-1.5 w-full">
              {categories.slice(0, 10).map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={`cursor-pointer rounded p-1.5 transition-all border flex-shrink-0 ${
                    selectedCategory?.id === category.id
                      ? 'bg-primary-500 text-white shadow-md border-primary-600'
                      : 'bg-gray-50 hover:bg-primary-50 border-gray-200 hover:border-primary-300'
                  }`}
                  style={{ width: 'calc(10% - 6px)', minWidth: '70px' }}
                >
                  <div className="text-center">
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mx-auto mb-0.5 ${
                        selectedCategory?.id === category.id ? 'bg-white bg-opacity-20' : ''
                      }`}
                      style={{ backgroundColor: selectedCategory?.id === category.id ? 'rgba(255,255,255,0.2)' : category.color }}
                    >
                      {category.icon}
                    </div>
                    <h4 className={`font-medium text-[11px] line-clamp-2 leading-tight ${
                      selectedCategory?.id === category.id ? 'text-white' : 'text-gray-800'
                    }`}>
                      {category.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
