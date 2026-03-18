import { FaSearch, FaPlus, FaCog, FaUtensils, FaTh, FaList } from 'react-icons/fa';

export function ManufacturingHeader({
  language,
  t,
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  searchTerm,
  handleSearchChange,
  searchInputRef,
  setShowRecipeModal,
  setSelectedItem,
  reset,
  setIngredients,
  queryClient,
  setShowProductionModal,
}) {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800 flex items-center gap-2">
          <FaUtensils />
          {t('manufacturing')}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:w-48 md:w-64 pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <FaSearch />
            </div>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'recipes') {
                setShowRecipeModal(true);
                setSelectedItem(null);
                reset();
                setIngredients([{ rawMaterialId: '', quantity: '', unit: 'pcs' }]);
              } else {
                // Refresh raw materials data before opening production modal
                queryClient.invalidateQueries(['raw-materials']);
                setShowProductionModal(true);
                reset();
              }
            }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap flex items-center gap-2 w-full sm:w-auto"
          >
            <FaPlus />
            {activeTab === 'recipes' ? t('addRecipe') : t('startProduction')}
          </button>
        </div>
      </div>

      {/* Tabs and View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'recipes'
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaCog className="inline mr-2" />
            {t('recipes')}
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'production'
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaUtensils className="inline mr-2" />
            {t('productionHistory')}
          </button>
        </div>
        
        {/* View Mode Toggle - Only show for recipes tab */}
        {activeTab === 'recipes' && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaList className="inline mr-1" />
              {t('table')}
            </button>
            <button
              onClick={() => setViewMode('tiles')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'tiles'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaTh className="inline mr-1" />
              {t('tiles')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
