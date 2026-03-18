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
  creatingContact
}) {
  return (
    <div className={`
      ${isMobile 
        ? `fixed right-0 top-0 h-full w-full max-w-sm transform transition-transform duration-300 z-50 ${
            showCart ? 'translate-x-0' : 'translate-x-full'
          }` 
        : `fixed right-0 top-0 w-96 h-full transform transition-transform duration-300 z-40 ${
            showCart ? 'translate-x-0' : 'translate-x-full'
          }`
      } 
      bg-white shadow-xl flex flex-col border-l
    `}>
      {/* Cart Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowCart(false)}
            className="p-2 hover:bg-gray-100 rounded-lg mr-2"
          >
            <FaTimes className="w-5 h-5" />
          </button>
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
      <div className="overflow-auto p-2" style={{ height: '60vh' }}>
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
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:bg-gray-400"
                    >
                      <FaMinus size={8} />
                    </button>
                    <span className="w-6 text-center font-medium text-xs">{Number(item.quantity) % 1 === 0 ? item.quantity : Number(item.quantity).toFixed(1)}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:bg-gray-400"
                    >
                      <FaPlus size={8} />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">{formatPakistaniCurrency(item.price)} each</div>
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
        <div className="border-t border-gray-200 p-3 lg:p-4">
          {/* Totals */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPakistaniCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount ({discount}%):</span>
                <span>-{formatPakistaniCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{formatPakistaniCurrency(total)}</span>
            </div>
          </div>

          {/* Discount */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                Discount (%):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 h-8"
              />
            </div>
          </div>

          {/* Payment */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to deduct
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
            />
          </div>

          {/* Cash Received and Balance */}
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <div className="text-xs text-blue-700 font-medium mb-2">For Thermal Print Only</div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cash Received</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Balance to Return</label>
              <input
                type="number"
                value={balance}
                readOnly
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-gray-100 font-bold"
              />
            </div>
          </div>

          {/* Process Sale and Preview Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={processSale}
              disabled={createSaleLoading || creatingContact}
              className="col-span-2 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs"
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
              className="bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              title="Preview Receipt"
            >
              <FaEye size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
