import DeleteModal from '../../components/DeleteModal';

export function ProductModals({
  showDamaged,
  damagedModalOpen,
  setDamagedModalOpen,
  selectedProductForDamage,
  setSelectedProductForDamage,
  damagedQuantity,
  setDamagedQuantity,
  maxRestoreQuantity,
  setMaxRestoreQuantity,
  restoreDamaged,
  markAsDamaged,
  deleteModalOpen,
  setDeleteModalOpen,
  productToDelete,
  setProductToDelete,
  deleteError,
  setDeleteError,
  confirmDelete
}) {
  return (
    <>
      {/* Damaged Items Modal */}
      {damagedModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-200">
            <h2 className={`text-2xl font-bold mb-6 border-b pb-2 flex items-center gap-2 ${
              showDamaged ? 'text-blue-800 border-blue-100' : 'text-red-800 border-red-100'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${
                showDamaged ? 'text-blue-600' : 'text-red-600'
              }`}>
                <path strokeLinecap="round" strokeLinejoin="round" d={showDamaged ? "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" : "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"} />
              </svg>
              {showDamaged ? 'Restore Items' : 'Mark as Damaged'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <input
                  type="text"
                  value={selectedProductForDamage?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {showDamaged ? 'Damaged Quantity' : 'Available Quantity'}
                </label>
                <input
                  type="text"
                  value={selectedProductForDamage?.quantity || 0}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {showDamaged ? 'Quantity to Restore' : 'Quantity to Damage'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxRestoreQuantity}
                  value={damagedQuantity}
                  onChange={(e) => setDamagedQuantity(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    showDamaged 
                      ? 'border-blue-200 focus:ring-blue-500' 
                      : 'border-red-200 focus:ring-red-500'
                  }`}
                  placeholder={showDamaged ? 'Enter quantity to restore' : 'Enter quantity to mark as damaged'}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDamagedModalOpen(false);
                  setSelectedProductForDamage(null);
                  setDamagedQuantity('');
                  setMaxRestoreQuantity(0);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (damagedQuantity && selectedProductForDamage) {
                    if (showDamaged) {
                      restoreDamaged.mutate({
                        productId: selectedProductForDamage.id,
                        quantity: parseInt(damagedQuantity)
                      });
                    } else {
                      markAsDamaged.mutate({
                        productId: selectedProductForDamage.id,
                        quantity: parseInt(damagedQuantity)
                      });
                    }
                  }
                }}
                disabled={!damagedQuantity || parseInt(damagedQuantity) <= 0 || parseInt(damagedQuantity) > maxRestoreQuantity}
                className={`px-4 py-2 bg-gradient-to-r text-white rounded shadow-sm disabled:bg-gray-400 ${
                  showDamaged 
                    ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    : 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                }`}
              >
                {showDamaged ? 'Restore Items' : 'Mark as Damaged'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
        itemName={productToDelete ? `product "${productToDelete.name}"` : ''}
        error={deleteError}
      />
    </>
  );
}
