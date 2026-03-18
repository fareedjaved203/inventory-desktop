import React from 'react';
import LoadingSpinner from '../LoadingSpinner';

export function BulkPurchasingFormModal({
  language,
  t,
  // State from hook
  isEditMode,
  purchaseDate, setPurchaseDate,
  description, setDescription,
  createNewContact, setCreateNewContact,
  selectedContact, setSelectedContact,
  contactSearchTerm, setContactSearchTerm,
  isContactSelected, isContactSetSelected,
  newContactData, setNewContactData,
  contactsLoading, contacts,
  validationErrors, setValidationErrors,
  handleContactSearchChange,
  
  createNewProduct, setCreateNewProduct,
  selectedProduct, setSelectedProduct,
  productSearchTerm, setProductSearchTerm,
  isProductSelected, isProductSetSelected,
  newProductData, setNewProductData,
  productsLoading, products,
  handleProductSearchChange,
  lastBulkPurchase,
  
  priceInputMode, setPriceInputMode,
  quantity, setQuantity,
  purchasePrice, setPurchasePrice,
  totalCost, setTotalCost,
  
  handleAddItem, creatingProduct,
  purchaseItems, handleRemoveItem,
  
  transportSearchTerm, setTransportSearchTerm,
  transportCost, setTransportCost,
  loadingDate, setLoadingDate,
  arrivalDate, setArrivalDate,
  
  calculateSubtotal,
  discount, setDiscount,
  totalAmount, setTotalAmount,
  paidAmount, setPaidAmount,
  updatedAmount, setUpdatedAmount,
  
  paymentDescription, setPaymentDescription,
  changeDate, setChangeDate,
  
  handleSubmit,
  setIsModalOpen, resetForm,
  createPurchaseLoading, updatePurchaseLoading
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] shadow-2xl border border-gray-200 flex flex-col">
        <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {isEditMode ? t('editPurchase') : t('newPurchase')}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="purchase-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
          
          {/* Purchase Details Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Purchase Details
            </h3>
            <div className="space-y-4">
              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes or description..."
                  rows="2"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-5 border border-green-200 shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Supplier Contact
            </h3>
            {/* Contact Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('contact')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createNewContactPurchase"
                    checked={createNewContact}
                    onChange={(e) => {
                      setCreateNewContact(e.target.checked);
                      if (e.target.checked) {
                        setSelectedContact(null);
                        setContactSearchTerm('');
                        isContactSetSelected(false);
                      } else {
                        setNewContactData({ name: '', phoneNumber: '', address: '' });
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="createNewContactPurchase" className="text-sm text-gray-600">
                    Add New Contact
                  </label>
                </div>
              </div>
              {createNewContact ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newContactData.name}
                    onChange={(e) => setNewContactData({ ...newContactData, name: e.target.value })}
                    placeholder="Contact name *"
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={newContactData.phoneNumber}
                    onChange={(e) => setNewContactData({ ...newContactData, phoneNumber: e.target.value })}
                    placeholder="Phone number *"
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={newContactData.address}
                    onChange={(e) => setNewContactData({ ...newContactData, address: e.target.value })}
                    placeholder="Address (optional)"
                    className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={contactSearchTerm}
                    onChange={(e) => {
                      handleContactSearchChange(e.target.value);
                      isContactSetSelected(false);
                      setSelectedContact(null);
                    }}
                    placeholder={t('searchContacts')}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {!isContactSelected && contactSearchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {contactsLoading ? (
                        <div className="px-4 py-3 flex items-center justify-center">
                          <LoadingSpinner size="w-4 h-4" />
                          <span className="ml-2 text-gray-500 text-sm">Searching...</span>
                        </div>
                      ) : contacts?.length > 0 ? (
                        contacts.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => {
                              setSelectedContact(contact);
                              setContactSearchTerm(contact.name);
                              isContactSetSelected(true);
                              setValidationErrors({
                                ...validationErrors,
                                contact: undefined
                              });
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                          >
                            <div className="font-medium">{contact.name}</div>
                            {contact.address && <div className="text-sm text-gray-600">{contact.address}</div>}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          No contacts found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {validationErrors.contact && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.contact}</p>
              )}
            </div>
          </div>

          {/* Product Selection Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Add Products
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">{t('addProducts')}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="createNewProductPurchase"
                        checked={createNewProduct}
                        onChange={(e) => {
                          setCreateNewProduct(e.target.checked);
                          if (e.target.checked) {
                            setSelectedProduct(null);
                            setProductSearchTerm('');
                            isProductSetSelected(false);
                          } else {
                            setNewProductData({ name: '', isRawMaterial: false });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="createNewProductPurchase" className="text-sm text-gray-600">
                        Add New Product
                      </label>
                    </div>
                  </div>
                  {createNewProduct ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newProductData.name}
                        onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                        placeholder="Product name *"
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isRawMaterial"
                          checked={newProductData.isRawMaterial || false}
                          onChange={(e) => setNewProductData({ ...newProductData, isRawMaterial: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="isRawMaterial" className="text-sm text-gray-600">
                          Raw Material
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={productSearchTerm}
                        onChange={(e) => {
                          handleProductSearchChange(e.target.value);
                          isProductSetSelected(false);
                          setSelectedProduct(null);
                        }}
                        placeholder={t('searchProducts')}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {!isProductSelected && productSearchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          {productsLoading ? (
                            <div className="px-4 py-3 flex items-center justify-center">
                              <LoadingSpinner size="w-4 h-4" />
                              <span className="ml-2 text-gray-500 text-sm">Searching...</span>
                            </div>
                          ) : products?.length > 0 ? (
                            products.map((product) => (
                              <div
                                key={product.id}
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setProductSearchTerm(product.name);
                                  isProductSetSelected(true);
                                  // Auto-switch to total cost mode for weight-based units
                                  const weightUnits = ['g', 'kg', 'ltr', 'ml', 'ton', 'gram', 'liter', 'litre'];
                                  if (weightUnits.includes(product.unit?.toLowerCase())) {
                                    setPriceInputMode('totalCost');
                                  }
                                  setValidationErrors({
                                    ...validationErrors,
                                    product: undefined
                                  });
                                }}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                              >
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-gray-600">
                                    Stock: {Number(product.quantity) % 1 === 0 ? product.quantity : Number(product.quantity).toFixed(2)} {product.unit || ''}
                                  </div>
                                </div>
                                <div className="text-blue-600 font-medium">Rs.{product.price}</div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-sm">
                              No products found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {validationErrors.product && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.product}</p>
                  )}
                  {selectedProduct && lastBulkPurchase && lastBulkPurchase.items?.find(item => item.productId === selectedProduct.id) && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs font-medium text-blue-700 mb-1">Last Bulk Purchase:</div>
                      <div className="text-xs text-blue-600">
                        {(() => {
                          const purchaseItem = lastBulkPurchase.items.find(item => item.productId === selectedProduct.id);
                          const quantity = Number(purchaseItem.quantity);
                          const purchasePrice = Number(purchaseItem.purchasePrice);
                          const unit = selectedProduct.unit || 'unit';
                          
                          if (purchaseItem.isTotalCostItem) {
                            const perUnitCost = purchasePrice / quantity;
                            return `Rs.${perUnitCost.toFixed(2)} per ${unit} (${quantity} ${unit} for Rs.${purchasePrice.toFixed(2)})`;
                          } else {
                            const totalCost = purchasePrice * quantity;
                            return `Rs.${purchasePrice.toFixed(2)} per ${unit} (${quantity} ${unit} for Rs.${totalCost.toFixed(2)})`;
                          }
                        })()
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        From: {lastBulkPurchase.contact?.name} on {new Date(lastBulkPurchase.purchaseDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {priceInputMode === 'totalCost' ? 'Weight' : t('quantity')} {selectedProduct && <span className="text-blue-600 font-semibold">({selectedProduct.unit || 'units'})</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value <= 0) {
                            setValidationErrors({...validationErrors, quantity: t('quantityMustBePositive')});
                          } else {
                            setValidationErrors({...validationErrors, quantity: undefined});
                          }
                          setQuantity(e.target.value);
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0.00"
                        className="w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {selectedProduct && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 pointer-events-none">
                          {selectedProduct.unit || 'units'}
                        </div>
                      )}
                    </div>
                    {validationErrors.quantity && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.quantity}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {priceInputMode === 'perUnit' ? (language === 'ur' ? 'فی یونٹ قیمت *' : 'Per Unit Price *') : (language === 'ur' ? 'کل لاگت *' : 'Total Cost *')}
                      </label>
                      <div className="relative group">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {priceInputMode === 'perUnit' 
                            ? 'Mode A: Enter price per unit (e.g., 0.1 per gram)' 
                            : 'Mode B: Enter total amount paid (e.g., 500 for 5000 grams)'}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceInputMode === 'perUnit' ? purchasePrice : totalCost}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value <= 0) {
                              setValidationErrors({...validationErrors, purchasePrice: t('priceMustBePositive')});
                            } else {
                              setValidationErrors({...validationErrors, purchasePrice: undefined});
                            }
                            if (priceInputMode === 'perUnit') {
                              setPurchasePrice(e.target.value);
                            } else {
                              setTotalCost(e.target.value);
                              // Auto-calculate per unit price
                              if (quantity && e.target.value) {
                                const perUnit = parseFloat(e.target.value) / parseFloat(quantity);
                                setPurchasePrice(perUnit.toFixed(4));
                              }
                            }
                          }}
                          onWheel={(e) => e.target.blur()}
                          placeholder={priceInputMode === 'perUnit' ? t('price') : 'Total cost'}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPriceInputMode(priceInputMode === 'perUnit' ? 'totalCost' : 'perUnit');
                          setPurchasePrice('');
                          setTotalCost('');
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-xs whitespace-nowrap"
                        title={priceInputMode === 'perUnit' ? 'Switch to total cost mode' : 'Switch to per-unit mode'}
                      >
                        {priceInputMode === 'perUnit' ? '⇄ Total' : '⇄ Unit'}
                      </button>
                    </div>
                    {priceInputMode === 'totalCost' && quantity && totalCost && (
                      <p className="text-xs text-gray-500 mt-1">
                        Per unit: Rs.{(parseFloat(totalCost) / parseFloat(quantity)).toFixed(4)}
                      </p>
                    )}
                    {validationErrors.purchasePrice && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.purchasePrice}</p>
                    )}
                  </div>
                  <div className="self-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={creatingProduct}
                      className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {creatingProduct && <LoadingSpinner size="w-4 h-4" />}
                      {t('add')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Items List */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm mt-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200 rounded-t-xl">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('purchaseItems')} <span className="text-sm text-gray-500">({purchaseItems.length})</span>
              </h3>
            </div>
            <div className="p-5">
            {purchaseItems.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-400 font-medium">{t('noItemsAdded')}</p>
                <p className="text-gray-400 text-sm mt-1">Add products to create a purchase</p>
              </div>
            ) : (
              <div className="space-y-3">
              {purchaseItems.map((item, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="font-semibold text-gray-800">{item.productName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const quantity = item.quantity;
                        const purchasePrice = Number(item.purchasePrice || 0);
                        
                        if (item.isTotalCostItem) {
                          const perUnit = purchasePrice / quantity;
                          return `${quantity} x Rs.${perUnit.toFixed(2)} = `;
                        }
                        
                        return `${quantity} x Rs.${purchasePrice.toFixed(2)} = `;
                      })()}
                      <span className="text-primary-800 font-medium">Rs.{(() => {
                        return item.isTotalCostItem ? Number(item.purchasePrice || 0).toFixed(2) : Number(item.subtotal || 0).toFixed(2);
                      })()}</span>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
            {validationErrors.items && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.items}</p>
            )}
            </div>
          </div>

          {/* Transport Section */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Transport Details
            </h3>
            <div className="space-y-4">
              {/* Car Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Car Number <span className="text-gray-400 text-xs">({t('optional')})</span>
                </label>
                <input
                  type="text"
                  value={transportSearchTerm}
                  onChange={(e) => setTransportSearchTerm(e.target.value)}
                  placeholder="Enter car number..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Transport Details */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transport Cost <span className="text-gray-400 text-xs">({t('optional')})</span>
                  </label>
                  <input
                    type="number"
                    value={transportCost}
                    onChange={(e) => setTransportCost(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loading Date <span className="text-gray-400 text-xs">({t('optional')})</span>
                  </label>
                  <input
                    type="date"
                    value={loadingDate}
                    onChange={(e) => setLoadingDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Date <span className="text-gray-400 text-xs">({t('optional')})</span>
                  </label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Payment Details
            </h3>
            <div className="space-y-4">
              {/* Subtotal and Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('subtotal')}
                  </label>
                  <input
                    type="text"
                    value={`Rs.${calculateSubtotal().toFixed(2)}`}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('discount')} (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => {
                      const percentage = parseFloat(e.target.value) || 0;
                      if (percentage <= 100) {
                        setDiscount(e.target.value);
                        const discountAmount = (calculateSubtotal() * percentage) / 100;
                        setTotalAmount(calculateSubtotal() - discountAmount);
                      }
                    }}
                    onWheel={(e) => e.target.blur()}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Total and Paid Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('totalAmount')}
                  </label>
                  <input
                    type="text"
                    value={`Rs.${Number(totalAmount).toFixed(2)}`}
                    disabled
                    className="w-full px-4 py-2.5 border-2 border-green-300 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 text-green-900 font-bold text-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('paidAmount')}</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setPaidAmount(e.target.value);
                      setUpdatedAmount('');

                      if (value <= totalAmount && validationErrors.paidAmount) {
                        setValidationErrors({
                          ...validationErrors,
                          paidAmount: undefined,
                        });
                      }
                    }}
                    onWheel={(e) => e.target.blur()}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-lg"
                  />
                  {validationErrors.paidAmount && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.paidAmount}</p>
                  )}
                  
                  {/* Updated Amount Input */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Updated Amount ({t('optional')})
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={updatedAmount}
                      onChange={(e) => {
                        const newUpdatedAmount = parseFloat(e.target.value) || 0;
                        const oldUpdatedAmount = parseFloat(updatedAmount) || 0;
                        const currentPaid = parseFloat(paidAmount) || 0;
                        
                        const newPaidAmount = currentPaid - oldUpdatedAmount + newUpdatedAmount;
                        setPaidAmount(newPaidAmount.toString());
                        setUpdatedAmount(e.target.value);
                      }}
                      onWheel={(e) => e.target.blur()}
                      placeholder="Enter additional payment amount"
                      className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter additional payment to add to current paid amount
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Description and Change Date */}
          {isEditMode && (
            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Update Reason ({t('optional')})
                </label>
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="e.g., Bank transfer to supplier, Cash payment..."
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Date ({t('optional')})
                </label>
                <input
                  type="datetime-local"
                  value={changeDate}
                  onChange={(e) => setChangeDate(e.target.value)}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use current date/time
                </p>
              </div>
            </div>
          )}

          </div>
          </form>
        </div>
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:shadow-sm transition-all bg-gray-50"
            >
              {t('cancel')}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              disabled={createPurchaseLoading || updatePurchaseLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(createPurchaseLoading || updatePurchaseLoading) && <LoadingSpinner size="w-4 h-4" />}
              {isEditMode ? t('update') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
