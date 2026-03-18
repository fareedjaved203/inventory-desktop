import React, { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';
import LoadingSpinner from '../components/LoadingSpinner';
import DeleteModal from '../components/DeleteModal';
import {
  ManufacturingHeader,
  RecipeGrid,
  ManufacturingTable,
  ManufacturingModals,
  useManufacturing
} from '../components/manufacturing';

function Manufacturing() {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const searchInputRef = useRef(null);

  const {
    activeTab,
    setActiveTab,
    showRecipeModal,
    setShowRecipeModal,
    showProductionModal,
    setShowProductionModal,
    showDeleteModal,
    setShowDeleteModal,
    selectedItem,
    setSelectedItem,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    deleteError,
    setDeleteError,
    ingredients,
    setIngredients,
    selectedRecipe,
    setSelectedRecipe,
    maxProduction,
    setMaxProduction,
    productionCost,
    setProductionCost,
    viewMode,
    setViewMode,
    register,
    handleSubmit,
    reset,
    errors,
    watch,
    handleSearchChange,
    recipesData,
    manufacturingData,
    productsData,
    rawMaterialsData,
    convertToBaseUnit,
    getBaseUnit,
    calculateProductionMetrics,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    createManufacturing,
    deleteManufacturing,
    onSubmitRecipe,
    onSubmitProduction,
    handleEditRecipe,
    handleDelete,
    addIngredient,
    removeIngredient,
    updateIngredient,
    isLoading,
    data,
    queryClient
  } = useManufacturing();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`p-4 sm:p-6 lg:p-8 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <ManufacturingHeader
        language={language}
        t={t}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        searchInputRef={searchInputRef}
        setShowRecipeModal={setShowRecipeModal}
        setSelectedItem={setSelectedItem}
        reset={reset}
        setIngredients={setIngredients}
        queryClient={queryClient}
        setShowProductionModal={setShowProductionModal}
      />

      {/* Main Content Area */}
      {activeTab === 'recipes' && viewMode === 'tiles' ? (
        <RecipeGrid
          data={data}
          rawMaterialsData={rawMaterialsData}
          handleEditRecipe={handleEditRecipe}
          setSelectedItem={setSelectedItem}
          setShowDeleteModal={setShowDeleteModal}
        />
      ) : (
        <ManufacturingTable
          t={t}
          activeTab={activeTab}
          data={data}
          handleEditRecipe={handleEditRecipe}
          setSelectedItem={setSelectedItem}
          setShowDeleteModal={setShowDeleteModal}
        />
      )}

      {/* Modals */}
      <ManufacturingModals
        t={t}
        showRecipeModal={showRecipeModal}
        setShowRecipeModal={setShowRecipeModal}
        showProductionModal={showProductionModal}
        setShowProductionModal={setShowProductionModal}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        reset={reset}
        handleSubmit={handleSubmit}
        onSubmitRecipe={onSubmitRecipe}
        onSubmitProduction={onSubmitProduction}
        register={register}
        errors={errors}
        ingredients={ingredients}
        setIngredients={setIngredients}
        addIngredient={addIngredient}
        removeIngredient={removeIngredient}
        updateIngredient={updateIngredient}
        productsData={productsData}
        rawMaterialsData={rawMaterialsData}
        recipesData={recipesData}
        selectedRecipe={selectedRecipe}
        setSelectedRecipe={setSelectedRecipe}
        calculateProductionMetrics={calculateProductionMetrics}
        maxProduction={maxProduction}
        setMaxProduction={setMaxProduction}
        productionCost={productionCost}
        setProductionCost={setProductionCost}
        watch={watch}
        createRecipe={createRecipe}
        updateRecipe={updateRecipe}
        createManufacturing={createManufacturing}
        convertToBaseUnit={convertToBaseUnit}
        getBaseUnit={getBaseUnit}
      />

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <DeleteModal
          isOpen={showDeleteModal}
          itemName={selectedItem.name || `${selectedItem.recipe?.name} production`}
          onConfirm={handleDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedItem(null);
            setDeleteError(null);
          }}
          error={deleteError}
        />
      )}

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 disabled:opacity-50 border border-gray-200 transition-colors shadow-sm"
        >
          Previous
        </button>
        <span className="px-4 py-2 bg-primary-50 text-primary-700 font-medium rounded-lg">
          Page {page} of {data?.data?.totalPages || 1}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(data?.data?.totalPages || 1, p + 1))}
          disabled={page === (data?.data?.totalPages || 1)}
          className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 disabled:opacity-50 border border-gray-200 transition-colors shadow-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Manufacturing;