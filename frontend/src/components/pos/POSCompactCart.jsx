import { FaShoppingCart, FaMinus, FaPlus, FaTimes } from 'react-icons/fa';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function POSCompactCart({
  cart,
  updateCartQuantity,
  removeFromCart
}) {
  return (
    <div className="flex-1 bg-white overflow-y-auto">
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <FaShoppingCart className="text-6xl mb-4" />
          <p className="text-xl">No items in cart</p>
          <p className="text-sm">Search or scan products to add</p>
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="border-b">
              <th className="text-center p-3 font-semibold text-gray-700 w-12">#</th>
              <th className="text-left p-3 font-semibold text-gray-700">Product</th>
              <th className="text-center p-3 font-semibold text-gray-700 w-32">Qty</th>
              <th className="text-right p-3 font-semibold text-gray-700 w-32">Price</th>
              <th className="text-right p-3 font-semibold text-gray-700 w-32">Total</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, index) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-center text-gray-600 font-medium">{index + 1}</td>
                <td className="p-3">
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div className="text-xs text-gray-500">{formatPakistaniCurrency(item.price)} per {item.unit || 'unit'}</div>
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="w-12 text-center font-semibold">{Number(item.quantity) % 1 === 0 ? item.quantity : Number(item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                    <div className="flex gap-1 justify-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        key={`qty-${item.id}-${item.quantity}`}
                        defaultValue={item.quantity}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > 0) updateCartQuantity(item.id, val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat(e.target.value);
                            if (val > 0) {
                              updateCartQuantity(item.id, val);
                              e.target.blur();
                            }
                          }
                        }}
                        onWheel={(e) => e.target.blur()}
                        className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                        placeholder="Qty"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        key={`amt-${item.id}-${item.quantity}`}
                        defaultValue={(item.price * item.quantity).toFixed(2)}
                        onBlur={(e) => {
                          const amount = parseFloat(e.target.value);
                          if (amount > 0) {
                            const newQty = amount / item.price;
                            updateCartQuantity(item.id, newQty);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const amount = parseFloat(e.target.value);
                            if (amount > 0) {
                              const newQty = amount / item.price;
                              updateCartQuantity(item.id, newQty);
                              e.target.blur();
                            }
                          }
                        }}
                        onWheel={(e) => e.target.blur()}
                        className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                        placeholder="Amt"
                      />
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right font-medium">{formatPakistaniCurrency(item.price)}</td>
                <td className="p-3 text-right font-bold text-lg">{formatPakistaniCurrency(item.price * item.quantity)}</td>
                <td className="p-3">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded bg-white text-center inline-block"
                  >
                    <FaTimes size={14} className="mx-auto" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
