import { FaEye, FaPrint } from 'react-icons/fa';
import LoadingSpinner from '../LoadingSpinner';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function POSPaymentPanel({
  setShowPaymentDetails,
  customerSearchTerm,
  handleCustomerSearchChange,
  setShowCustomerDropdown,
  showCustomerDropdown,
  debouncedCustomerSearchTerm,
  createNewContact,
  customers,
  setSelectedContact,
  setCustomerSearchTerm,
  selectedContact,
  setCreateNewContact,
  newContactData,
  setNewContactData,
  subtotal,
  discountType,
  setDiscountType,
  discount,
  setDiscount,
  discountAmount,
  paidAmount,
  setPaidAmount,
  total,
  cashReceived,
  setCashReceived,
  balance,
  change,
  cart,
  previewReceipt,
  processSale,
  createSaleLoading,
  creatingContact
}) {
  return (
    <div className="fixed top-1 right-0 w-96 bg-gray-50 border-l flex flex-col shadow-xl z-50 h-screen transition-transform transform translate-x-0">
      <button
        onClick={() => setShowPaymentDetails(false)}
        className="absolute top-2 -left-4 z-10 bg-primary-600 text-white p-2 rounded-lg shadow-lg hover:bg-primary-700"
        title="Hide Payment Panel"
      >
        →
      </button>
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <div className="relative">
            <input
              type="text"
              value={customerSearchTerm}
              onChange={(e) => {
                handleCustomerSearchChange(e.target.value);
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
              placeholder="Search customer..."
              disabled={createNewContact}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:bg-gray-100"
            />
            {showCustomerDropdown && debouncedCustomerSearchTerm && !createNewContact && customers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      setSelectedContact(customer);
                      setCustomerSearchTerm(customer.name);
                      setShowCustomerDropdown(false);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedContact && !createNewContact && (
            <div className="mt-1 text-xs text-green-600">✓ {selectedContact.name} selected</div>
          )}
          
          <div className="mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={createNewContact}
                onChange={(e) => {
                  setCreateNewContact(e.target.checked);
                  if (e.target.checked) {
                    setSelectedContact(null);
                    setCustomerSearchTerm('');
                  } else {
                    setNewContactData({ name: '', phoneNumber: '', address: '' });
                  }
                }}
                className="rounded border-gray-300"
              />
              Create new customer
            </label>
          </div>
          
          {createNewContact && (
            <div className="mt-2 space-y-2 p-2 bg-blue-50 rounded border border-blue-200">
              <input
                type="text"
                placeholder="Name *"
                value={newContactData.name}
                onChange={(e) => setNewContactData({ ...newContactData, name: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                placeholder="Phone *"
                value={newContactData.phoneNumber}
                onChange={(e) => setNewContactData({ ...newContactData, phoneNumber: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <input
                type="text"
                placeholder="Address"
                value={newContactData.address}
                onChange={(e) => setNewContactData({ ...newContactData, address: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
          <div className="text-xl font-bold text-gray-800">{formatPakistaniCurrency(subtotal)}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
          <div className="flex gap-2">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
            >
              <option value="percentage">%</option>
              <option value="fixed">Rs</option>
            </select>
            <input
              type="number"
              min="0"
              max={discountType === 'percentage' ? 100 : subtotal}
              value={discount}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                if (discountType === 'percentage') {
                  setDiscount(Math.max(0, Math.min(100, val)));
                } else {
                  setDiscount(Math.max(0, Math.min(subtotal, val)));
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {discount > 0 && (
            <div className="text-sm text-red-600 mt-1">-{formatPakistaniCurrency(discountAmount)}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount to deduct</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={paidAmount}
            onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="border-t pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
          <div className="text-2xl font-bold text-primary-600">{formatPakistaniCurrency(total)}</div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
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

        {change > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <div className="text-xs text-green-700">Change</div>
            <div className="text-xl font-bold text-green-600">{formatPakistaniCurrency(change)}</div>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2 border-t bg-white flex-shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPaidAmount(total)}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
          >
            Exact
          </button>
          <button
            onClick={previewReceipt}
            disabled={cart.length === 0}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <FaEye /> Preview
          </button>
        </div>
        <button
          onClick={processSale}
          disabled={createSaleLoading || creatingContact || cart.length === 0}
          className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {(createSaleLoading || creatingContact) ? (
            <LoadingSpinner size="w-5 h-5" />
          ) : (
            <>
              <FaPrint /> Complete Sale
            </>
          )}
        </button>
      </div>
    </div>
  );
}
