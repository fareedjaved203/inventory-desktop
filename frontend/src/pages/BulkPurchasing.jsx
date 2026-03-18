import React from 'react';
import DeleteModal from '../components/DeleteModal';
import PurchaseDetailsModal from '../components/PurchaseDetailsModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

import {
  useBulkPurchasing,
  BulkPurchasingHeader,
  BulkPurchasingTable,
  BulkPurchasingFormModal
} from '../components/bulkPurchasing';

function BulkPurchasing() {
  const { language } = useLanguage();
  const t = useTranslation(language);

  const {
    state,
    queries,
    mutations,
    handlers
  } = useBulkPurchasing(language);

  // Unpack for rendering
  const {
    isModalOpen, setIsModalOpen,
    searchTerm,
    purchaseItems,
    selectedProduct, setSelectedProduct,
    quantity, setQuantity,
    purchasePrice, setPurchasePrice,
    isEditMode,
    deleteModalOpen, setDeleteModalOpen,
    purchaseToDelete,
    contactSelected, isContactSelected,
    debouncedSearchTerm,
    selectedContact, setSelectedContact,
    contactSearchTerm, setContactSearchTerm,
    debouncedContactSearchTerm,
    createNewContact, setCreateNewContact,
    newContactData, setNewContactData,
    creatingContact,
    productSearchTerm, setProductSearchTerm,
    debouncedProductSearchTerm,
    createNewProduct, setCreateNewProduct,
    newProductData, setNewProductData,
    creatingProduct,
    totalAmount, setTotalAmount,
    discount, setDiscount,
    paidAmount, setPaidAmount,
    showPendingPayments, setShowPendingPayments,
    priceInputMode, setPriceInputMode,
    totalCost, setTotalCost,
    transportSearchTerm, setTransportSearchTerm,
    transportCost, setTransportCost,
    loadingDate, setLoadingDate,
    arrivalDate, setArrivalDate,
    paymentDescription, setPaymentDescription,
    changeDate, setChangeDate,
    updatedAmount, setUpdatedAmount,
    purchaseDate, setPurchaseDate,
    description, setDescription,
    deleteError,
    detailsModalOpen, setDetailsModalOpen,
    selectedPurchase, setSelectedPurchase,
    validationErrors, setValidationErrors
  } = state;

  const {
    purchases, isLoading, isFetching,
    auditTrails,
    contacts, contactsLoading,
    products, productsLoading,
    lastBulkPurchase
  } = queries;

  const {
    handleSearchChange,
    handleContactSearchChange,
    handleProductSearchChange,
    handleAddItem,
    handleRemoveItem,
    handleSubmit,
    handleEdit,
    handleDelete,
    confirmDelete,
    calculateSubtotal,
    resetForm
  } = handlers;

  const searchInputRef = React.useRef(null);

  if (isLoading && !debouncedSearchTerm && !showPendingPayments) return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="h-10 bg-gray-300 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <BulkPurchasingHeader
        language={language}
        t={t}
        showPendingPayments={showPendingPayments}
        setShowPendingPayments={setShowPendingPayments}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        searchInputRef={searchInputRef}
        setIsModalOpen={setIsModalOpen}
      />

      <BulkPurchasingTable
        t={t}
        isFetching={isFetching}
        debouncedSearchTerm={debouncedSearchTerm}
        showPendingPayments={showPendingPayments}
        purchases={purchases}
        auditTrails={auditTrails}
        handleEdit={handleEdit}
        setSelectedPurchase={setSelectedPurchase}
        setDetailsModalOpen={setDetailsModalOpen}
        handleDelete={handleDelete}
      />

      {isModalOpen && (
        <BulkPurchasingFormModal
          language={language}
          t={t}
          isEditMode={isEditMode}
          purchaseDate={purchaseDate} setPurchaseDate={setPurchaseDate}
          description={description} setDescription={setDescription}
          createNewContact={createNewContact} setCreateNewContact={setCreateNewContact}
          selectedContact={selectedContact} setSelectedContact={setSelectedContact}
          contactSearchTerm={contactSearchTerm} setContactSearchTerm={setContactSearchTerm}
          isContactSelected={contactSelected} isContactSetSelected={isContactSelected}
          newContactData={newContactData} setNewContactData={setNewContactData}
          contactsLoading={contactsLoading} contacts={contacts}
          validationErrors={validationErrors} setValidationErrors={setValidationErrors}
          handleContactSearchChange={handleContactSearchChange}
          
          createNewProduct={createNewProduct} setCreateNewProduct={setCreateNewProduct}
          selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
          productSearchTerm={productSearchTerm} setProductSearchTerm={setProductSearchTerm}
          isProductSelected={selectedProduct !== null} isProductSetSelected={(v) => {}}
          newProductData={newProductData} setNewProductData={setNewProductData}
          productsLoading={productsLoading} products={products}
          handleProductSearchChange={handleProductSearchChange}
          lastBulkPurchase={lastBulkPurchase}
          
          priceInputMode={priceInputMode} setPriceInputMode={setPriceInputMode}
          quantity={quantity} setQuantity={setQuantity}
          purchasePrice={purchasePrice} setPurchasePrice={setPurchasePrice}
          totalCost={totalCost} setTotalCost={setTotalCost}
          
          handleAddItem={handleAddItem} creatingProduct={creatingProduct}
          purchaseItems={purchaseItems} handleRemoveItem={handleRemoveItem}
          
          transportSearchTerm={transportSearchTerm} setTransportSearchTerm={setTransportSearchTerm}
          transportCost={transportCost} setTransportCost={setTransportCost}
          loadingDate={loadingDate} setLoadingDate={setLoadingDate}
          arrivalDate={arrivalDate} setArrivalDate={setArrivalDate}
          
          calculateSubtotal={calculateSubtotal}
          discount={discount} setDiscount={setDiscount}
          totalAmount={totalAmount} setTotalAmount={setTotalAmount}
          paidAmount={paidAmount} setPaidAmount={setPaidAmount}
          updatedAmount={updatedAmount} setUpdatedAmount={setUpdatedAmount}
          
          paymentDescription={paymentDescription} setPaymentDescription={setPaymentDescription}
          changeDate={changeDate} setChangeDate={setChangeDate}
          
          handleSubmit={handleSubmit}
          setIsModalOpen={setIsModalOpen} resetForm={resetForm}
          createPurchaseLoading={mutations.createPurchase.isLoading} 
          updatePurchaseLoading={mutations.updatePurchase.isLoading}
        />
      )}

      {detailsModalOpen && selectedPurchase && (
        <PurchaseDetailsModal
          purchase={selectedPurchase}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedPurchase(null);
          }}
          language={language}
          t={t}
          auditTrails={auditTrails}
        />
      )}

      {deleteModalOpen && purchaseToDelete && (
        <DeleteModal
          isOpen={deleteModalOpen}
          itemName={purchaseToDelete.invoiceNumber || `Purchase #${purchaseToDelete.id.slice(-6)}`}
          onConfirm={confirmDelete}
          onClose={() => {
            setDeleteModalOpen(false);
            setPurchaseToDelete(null);
          }}
          error={deleteError}
        />
      )}
    </div>
  );
}

export default BulkPurchasing;