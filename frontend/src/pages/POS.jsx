import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import {
  POSHeader,
  POSSearch,
  POSCompactCart,
  POSPaymentPanel,
  POSProductGrid,
  POSCartSidebar,
  usePOS
} from '../components/pos';

function POS() {
  const {
    cart,
    searchTerm,
    debouncedSearchTerm,
    showProductDropdown,
    barcodeInput,
    discount,
    discountType,
    paidAmount,
    cashReceived,
    balance,
    customerSearchTerm,
    debouncedCustomerSearchTerm,
    selectedContact,
    createNewContact,
    newContactData,
    creatingContact,
    showCustomerDropdown,
    showCart,
    isMobile,
    viewMode,
    barcodeLoading,
    selectedCategory,
    showPaymentDetails,
    selectedProductIndex,
    showSearchInputs,
    barcodeInputRef,
    searchInputRef,
    products,
    productsLoading,
    categories,
    categoriesLoading,
    categoryProducts,
    categoryProductsLoading,
    customers,
    subtotal,
    discountAmount,
    total,
    change,
    setSearchTerm,
    setShowProductDropdown,
    setBarcodeInput,
    setDiscount,
    setDiscountType,
    setPaidAmount,
    setPaidAmountManuallySet,
    setCashReceived,
    setCustomerSearchTerm,
    setSelectedContact,
    setCreateNewContact,
    setNewContactData,
    setShowCustomerDropdown,
    setShowCart,
    setViewMode,
    setSelectedCategory,
    setShowPaymentDetails,
    setShowSearchInputs,
    handleSearchChange,
    handleSearchKeyDown,
    handleProductSelect,
    handleCustomerSearchChange,
    handleBarcodeSubmit,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    toggleSellingByPiece,
    clearCart,
    processSale,
    previewReceipt,
    createSale
  } = usePOS();

  return (
    <div className="flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ height: '100vh' }}>
      <POSHeader
        showSearchInputs={showSearchInputs}
        setShowSearchInputs={setShowSearchInputs}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <div className={`flex-1 flex ${viewMode === 'default' ? 'flex-col lg:flex-row' : 'flex-col'} relative overflow-hidden min-h-0`}>
        {/* Cart Toggle Button - Only show on mobile in default view */}
        {viewMode === 'default' && (
          <div className="fixed bottom-4 right-4 z-30 lg:hidden">
            <button
              onClick={() => setShowCart(!showCart)}
              className="bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
            >
              <FaShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Mobile Cart Overlay - Only show in default view on mobile */}
        {isMobile && showCart && viewMode === 'default' && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowCart(false)}
          />
        )}

        {/* Main Content */}
        <div className={`flex-1 flex flex-col p-2 lg:p-4`} style={{ marginRight: viewMode === 'compact' && showPaymentDetails ? '384px' : '0' }}>
          {/* Search & Barcode Input */}
          {showSearchInputs && (
            <POSSearch
              handleBarcodeSubmit={handleBarcodeSubmit}
              barcodeInputRef={barcodeInputRef}
              barcodeInput={barcodeInput}
              setBarcodeInput={setBarcodeInput}
              barcodeLoading={barcodeLoading}
              searchInputRef={searchInputRef}
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              handleSearchKeyDown={handleSearchKeyDown}
              setShowProductDropdown={setShowProductDropdown}
              showProductDropdown={showProductDropdown}
              debouncedSearchTerm={debouncedSearchTerm}
              productsLoading={productsLoading}
              products={products}
              handleProductSelect={handleProductSelect}
              selectedProductIndex={selectedProductIndex}
              viewMode={viewMode}
            />
          )}

          {/* Compact View - Retail POS Layout */}
          {viewMode === 'compact' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Bar with Total */}
              <div className="bg-white shadow-sm p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                    title="Clear Cart"
                    disabled={cart.length === 0}
                  >
                    <FaShoppingCart className="w-5 h-5" />
                  </button>
                  <span className="text-gray-600">Items: {cart.length}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-3xl font-bold text-primary-600">Rs {total.toFixed(2)}</div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Toggle Sidebar Button - Only show when sidebar is hidden */}
                {!showPaymentDetails && (
                  <button
                    onClick={() => setShowPaymentDetails(true)}
                    className="absolute top-4 right-4 z-10 bg-primary-600 text-white p-2 rounded-lg shadow-lg hover:bg-primary-700"
                    title="Show Payment Panel"
                  >
                    ←
                  </button>
                )}

                <POSCompactCart
                  cart={cart}
                  updateCartQuantity={updateCartQuantity}
                  removeFromCart={removeFromCart}
                />

                {/* Right Sidebar - Payment Section */}
                {showPaymentDetails && (
                  <POSPaymentPanel
                    setShowPaymentDetails={setShowPaymentDetails}
                    customerSearchTerm={customerSearchTerm}
                    handleCustomerSearchChange={handleCustomerSearchChange}
                    setShowCustomerDropdown={setShowCustomerDropdown}
                    showCustomerDropdown={showCustomerDropdown}
                    debouncedCustomerSearchTerm={debouncedCustomerSearchTerm}
                    createNewContact={createNewContact}
                    customers={customers}
                    setSelectedContact={setSelectedContact}
                    setCustomerSearchTerm={setCustomerSearchTerm}
                    selectedContact={selectedContact}
                    setCreateNewContact={setCreateNewContact}
                    newContactData={newContactData}
                    setNewContactData={setNewContactData}
                    subtotal={subtotal}
                    discountType={discountType}
                    setDiscountType={setDiscountType}
                    discount={discount}
                    setDiscount={setDiscount}
                    discountAmount={discountAmount}
                    paidAmount={paidAmount}
                    setPaidAmount={setPaidAmount}
                    total={total}
                    cashReceived={cashReceived}
                    setCashReceived={setCashReceived}
                    balance={balance}
                    change={change}
                    cart={cart}
                    previewReceipt={previewReceipt}
                    processSale={processSale}
                    createSaleLoading={createSale.isLoading}
                    creatingContact={creatingContact}
                  />
                )}
              </div>
            </div>
          )}

          {/* Default View Areas */}
          {viewMode === 'default' && (
            <POSProductGrid
              productsLoading={productsLoading}
              categoriesLoading={categoriesLoading}
              categoryProductsLoading={categoryProductsLoading}
              debouncedSearchTerm={debouncedSearchTerm}
              products={products}
              addToCart={addToCart}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categoryProducts={categoryProducts}
              categories={categories}
            />
          )}
        </div>

        {viewMode === 'default' && (
          <POSCartSidebar
            isMobile={isMobile}
            showCart={showCart}
            setShowCart={setShowCart}
            cart={cart}
            clearCart={clearCart}
            removeFromCart={removeFromCart}
            toggleSellingByPiece={toggleSellingByPiece}
            updateCartQuantity={updateCartQuantity}
            subtotal={subtotal}
            discount={discount}
            setDiscount={setDiscount}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountAmount={discountAmount}
            total={total}
            paidAmount={paidAmount}
            setPaidAmount={setPaidAmount}
            setPaidAmountManuallySet={setPaidAmountManuallySet}
            cashReceived={cashReceived}
            setCashReceived={setCashReceived}
            balance={balance}
            processSale={processSale}
            previewReceipt={previewReceipt}
            createSaleLoading={createSale.isLoading}
            creatingContact={creatingContact}
            customerSearchTerm={customerSearchTerm}
            handleCustomerSearchChange={handleCustomerSearchChange}
            setShowCustomerDropdown={setShowCustomerDropdown}
            showCustomerDropdown={showCustomerDropdown}
            debouncedCustomerSearchTerm={debouncedCustomerSearchTerm}
            customers={customers}
            selectedContact={selectedContact}
            setSelectedContact={setSelectedContact}
            setCustomerSearchTerm={setCustomerSearchTerm}
            createNewContact={createNewContact}
            setCreateNewContact={setCreateNewContact}
            newContactData={newContactData}
            setNewContactData={setNewContactData}
          />
        )}
      </div>
    </div>
  );
}

export default POS;