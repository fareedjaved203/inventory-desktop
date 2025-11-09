export default function TransferModal({ booking, availableTables, onTransfer, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Transfer Table</h2>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-600 mb-1">Players:</div>
            <div className="font-medium text-gray-900">{booking.player1Name}{booking.player2Name && ` vs ${booking.player2Name}`}</div>
          </div>
          <p className="text-gray-600 mb-4">Select a table to transfer to:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableTables.map((table) => (
              <button
                key={table.id}
                onClick={() => onTransfer(table.id)}
                className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
              >
                <div className="font-semibold text-gray-800">{table.name}</div>
                <div className="text-sm text-gray-500 capitalize">{table.tableType}</div>
              </button>
            ))}
          </div>
          {availableTables.length === 0 && (
            <p className="text-center text-gray-500 py-4">No available tables</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
