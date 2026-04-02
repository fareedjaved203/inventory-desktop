import { FaShoppingCart, FaTimes, FaTrash, FaMinus, FaPlus, FaPrint, FaEye } from 'react-icons/fa';
import LoadingSpinner from '../LoadingSpinner';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function POSCartSidebar({
  isMobile,
  showCart,
  setShowCart,
  cart,
  clearCart,
  removeFromCart,
  updateCartQuantity,
  subtotal,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  discountAmount,
  total,
  paidAmount,
  setPaidAmount,
  cashReceived,
  setCashReceived,
  balance,
  processSale,
  previewReceipt,
  createSaleLoading,
  creatingContact,
  // Customer selection props
  customerSearchTerm,
  handleCustomerSearchChange,
  setShowCustomerDropdown,
  showCustomerDropdown,
  debouncedCustomerSearchTerm,
  customers,
  selectedContact,
  setSelectedContact,
  setCustomerSearchTerm,
  createNewContact,
  setCreateNewContact,
  newContactData,
  setNewContactData
}) {
  const containerClass = isMobile
    ? `fixed right-0 top-0 h-full w-full max-w-sm transform transition-transform duration-300 z-50 bg-white shadow-xl flex flex-col border-l ${showCart ? 'translate-x-0' : 'translate-x-full'}`
    : 'w-96 h-full flex-shrink-0 bg-white shadow-xl flex flex-col border-l';

  return (
    <div className={containerClass}>
      {/* Cart Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {isMobile && (
            <button
              onClick={() => setShowCart(false)}
              className="p-2 hover:bg-gray-100 rounded-lg mr-2"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-base font-bold text-gray-800 flex items-center flex-1">
            <FaShoppingCart className="mr-2" />
            Cart ({cart.length})
          </h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
              title="Clear Cart"
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="overflow-auto flex-1 p-2">
        {cart.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <FaShoppingCart className="mx-auto text-4xl mb-4 opacity-50" />
            <p>Cart is empty</p>
            <p className="text-sm">Scan or search products to add</p>
          </div>
        ) : (
          <div className="space-y-1">
            {cart.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-2">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium text-xs flex-1 mr-2 leading-tight truncate">{item.name}</h4>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded w-6 h-6 flex items-center justify-center flex-shrink-0"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => updateCartQuantity(item.id, Math.max(0, item.quantity - (item.unit && ['kg', 'gram', 'ltr', 'ml', 'ton'].includes(item.unit) ? 0.5 : 1)))}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:bg-gray-400"
                    >
                      <FaMinus size={8} />
                    </button>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) updateCartQuantity(item.id, val);
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="w-12 text-center font-medium text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + (item.unit && ['kg', 'gram', 'ltr', 'ml', 'ton'].includes(item.unit) ? 0.5 : 1))}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:bg-gray-400"
                    >
                      <FaPlus size={8} />
                    </button>
                    {item.unit && <span className="text-[10px] text-gray-400 ml-0.5">{item.unit}</span>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">{formatPakistaniCurrency(item.price)}/{item.unit || 'pc'}</div>
                    <div className="font-semibold text-xs">{formatPakistaniCurrency(item.price * item.quantity)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Section */}
      {cart.length > 0 && (
        <div className="border-t border-gray-200 flex flex-col" style={{ maxHeight: '55%' }}>
          <div className="p-3 overflow-y-auto flex-1">
          {/* Customer Selection */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
            {selectedContact ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-2 py-1.5">
                <span className="text-xs font-medium text-blue-800">{selectedContact.name}</span>
                <button
                  onClick={() => { setSelectedContact(null); setCustomerSearchTerm(''); }}
                  className="text-blue-500 hover:text-blue-700 p-0.5"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={customerSearchTerm || ''}
                  onChange={handleCustomerSearchChange}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {showCustomerDropdown && debouncedCustomerSearchTerm && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto">
                    {customers?.items?.length > 0 ? (
                      customers.items.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedContact(c);
                            setCustomerSearchTerm(c.name);
                            setShowCustomerDropdown(false);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium">{c.name}</div>
                          {c.phoneNumber && <div className="text-gray-400">{c.phoneNumber}</div>}
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-2 text-xs text-gray-500">No customers found</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPakistaniCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount:</span>
                <span>-{formatPakistaniCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-1.5">
              <span>Total:</span>
              <span>{formatPakistaniCurrency(total)}</span>
            </div>
          </div>

          {/* Discount — supports both % and flat */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Discount</label>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l-md text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="0"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-r-md text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="percentage">%</option>
                <option value="flat">Rs</option>
              </select>
            </div>
          </div>

          {/* Paid Amount */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Paid Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Cash Received and Balance */}
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2 space-y-1.5">
            <div className="text-[10px] text-blue-700 font-medium">For Thermal Print</div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">Cash Received</label>
                <input
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">Balance</label>
                <input
                  type="number"
                  value={balance}
                  readOnly
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-100 font-bold"
                />
              </div>
            </div>
          </div>

          </div>
          {/* Process Sale and Preview Buttons — always visible at bottom */}
          <div className="p-3 border-t border-gray-200 flex-shrink-0">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={processSale}
                disabled={createSaleLoading || creatingContact}
                className="col-span-2 bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs"
              >
                {createSaleLoading || creatingContact ? (
                  <LoadingSpinner size="w-4 h-4" />
                ) : (
                  <>
                    <FaPrint className="mr-1.5" size={12} />
                    <span>Complete Sale</span>
                  </>
                )}
              </button>
              <button
                onClick={previewReceipt}
                disabled={cart.length === 0}
                className="bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                title="Preview Receipt"
              >
                <FaEye size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
