import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ProductsHeader,
  ProductsTable,
  ProductFormModal,
  ProductModals,
  useProducts
} from '../components/products';
import { useTranslation } from '../utils/translations';

function Products() {
  const { language } = useLanguage();
  const t = useTranslation(language);

  const {
    currentPage, setCurrentPage,
    searchTerm, setSearchTerm,
    isModalOpen, setIsModalOpen,
    isEditMode, setIsEditMode,
    selectedProduct, setSelectedProduct,
    deleteModalOpen, setDeleteModalOpen,
    productToDelete, setProductToDelete,
    formData, setFormData,
    validationErrors, setValidationErrors,
    isGeneratingBarcode, setIsGeneratingBarcode,
    showLowStock, setShowLowStock,
    selectedCategory, setSelectedCategory,
    deleteError, setDeleteError,
    damagedModalOpen, setDamagedModalOpen,
    selectedProductForDamage, setSelectedProductForDamage,
    damagedQuantity, setDamagedQuantity,
    showDamaged, setShowDamaged,
    maxRestoreQuantity, setMaxRestoreQuantity,
    showRawMaterials, setShowRawMaterials,
    categories,
    products,
    isLoading,
    generateUserBarcode,
    handleAddProduct,
    handlePrint,
    handlePrintLabel,
    handleDamaged,
    handleEditProduct,
    handleDeleteClick,
    confirmDelete,
    handleSubmit,
    createProduct,
    updateProduct,
    markAsDamaged,
    restoreDamaged,
    itemsPerPage
  } = useProducts();

  const location = useLocation();
  useEffect(() => {
    if (location.state?.showLowStock) {
      setShowLowStock(true);
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className={`p-4 sm:p-6 lg:p-8 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <ProductsHeader
        language={language}
        t={t}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showLowStock={showLowStock}
        setShowLowStock={setShowLowStock}
        showDamaged={showDamaged}
        setShowDamaged={setShowDamaged}
        showRawMaterials={showRawMaterials}
        setShowRawMaterials={setShowRawMaterials}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        handleAddProduct={handleAddProduct}
        handlePrint={handlePrint}
        products={products}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <LoadingSpinner />
            </div>
          ) : products?.items?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-lg font-medium">{t('noProducts')}</p>
              <button
                onClick={handleAddProduct}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('addFirstProduct')}
              </button>
            </div>
          ) : (
            <ProductsTable
              language={language}
              t={t}
              products={products}
              showDamaged={showDamaged}
              searchTerm={searchTerm}
              handleEditProduct={handleEditProduct}
              handlePrintLabel={handlePrintLabel}
              handleDamaged={handleDamaged}
              handleDeleteClick={handleDeleteClick}
            />
          )}
        </div>

        {/* Pagination Details */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            Showing <span className="font-medium text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, products?.total || 0)}</span> of <span className="font-medium text-gray-900">{products?.total || 0}</span> results
            {showLowStock && <span className="ml-2 text-orange-600 font-medium">(Filtered: Low Stock Only)</span>}
            {showDamaged && <span className="ml-2 text-red-600 font-medium">(Filtered: Damaged Only)</span>}
            {showRawMaterials && <span className="ml-2 text-blue-600 font-medium">(Filtered: {t('rawMaterials')} Only)</span>}
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-800">
              Page {currentPage} of {Math.ceil((products?.total || 0) / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage >= Math.ceil((products?.total || 0) / itemsPerPage)}
              className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ProductFormModal
        language={language}
        t={t}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isEditMode={isEditMode}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        isGeneratingBarcode={isGeneratingBarcode}
        setIsGeneratingBarcode={setIsGeneratingBarcode}
        generateUserBarcode={generateUserBarcode}
        handleSubmit={handleSubmit}
        createProduct={createProduct}
        updateProduct={updateProduct}
        selectedProduct={selectedProduct}
      />

      <ProductModals
        showDamaged={showDamaged}
        damagedModalOpen={damagedModalOpen}
        setDamagedModalOpen={setDamagedModalOpen}
        selectedProductForDamage={selectedProductForDamage}
        setSelectedProductForDamage={setSelectedProductForDamage}
        damagedQuantity={damagedQuantity}
        setDamagedQuantity={setDamagedQuantity}
        maxRestoreQuantity={maxRestoreQuantity}
        setMaxRestoreQuantity={setMaxRestoreQuantity}
        restoreDamaged={restoreDamaged}
        markAsDamaged={markAsDamaged}
        deleteModalOpen={deleteModalOpen}
        setDeleteModalOpen={setDeleteModalOpen}
        productToDelete={productToDelete}
        setProductToDelete={setProductToDelete}
        deleteError={deleteError}
        setDeleteError={setDeleteError}
        confirmDelete={confirmDelete}
      />
    </div>
  );
}

export default Products;