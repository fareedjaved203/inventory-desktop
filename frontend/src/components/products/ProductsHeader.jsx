import { FaSearch, FaPlus, FaPrint, FaExclamationTriangle, FaFilter } from 'react-icons/fa';

export function ProductsHeader({
  language,
  t,
  searchTerm,
  setSearchTerm,
  showLowStock,
  setShowLowStock,
  showDamaged,
  setShowDamaged,
  showRawMaterials,
  setShowRawMaterials,
  categories,
  selectedCategory,
  setSelectedCategory,
  handleAddProduct,
  handlePrint,
  products
}) {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('products')}</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mr-2">
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showLowStock 
                  ? 'bg-orange-100 text-orange-800 border-2 border-orange-200' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FaExclamationTriangle className={showLowStock ? 'text-orange-600' : 'text-gray-400'} />
              {t('lowStock')}
            </button>
            <button
              onClick={() => setShowDamaged(!showDamaged)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showDamaged 
                  ? 'bg-red-100 text-red-800 border-2 border-red-200' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${showDamaged ? 'text-red-600' : 'text-gray-400'}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {t('damaged')}
            </button>
            <button
              onClick={() => setShowRawMaterials(!showRawMaterials)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showRawMaterials 
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-200' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FaFilter className={showRawMaterials ? 'text-blue-600' : 'text-gray-400'} />
              {t('rawMaterials')}
            </button>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('allCategories')}</option>
              {categories?.items?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={t('searchProducts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${language === 'ur' ? 'font-urdu' : ''}`}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={handleAddProduct}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
          >
            <FaPlus /> {t('addBtn')}
          </button>
          
          <button
            onClick={() => handlePrint(products?.items || [])}
            className="p-2 text-gray-600 hover:text-primary-600 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center w-full sm:w-auto min-w-[42px]"
            title="Print Product Report"
          >
            <FaPrint className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
