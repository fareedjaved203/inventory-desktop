export default function CheckinForm({ table, formData, setFormData, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Check In - {table?.name}</h2>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 Name *</label>
              <input type="text" required value={formData.player1Name} onChange={(e) => setFormData({ ...formData, player1Name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 Phone</label>
              <input type="tel" value={formData.player1Phone} onChange={(e) => setFormData({ ...formData, player1Phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 Name</label>
              <input type="text" value={formData.player2Name} onChange={(e) => setFormData({ ...formData, player2Name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 Phone</label>
              <input type="tel" value={formData.player2Phone} onChange={(e) => setFormData({ ...formData, player2Phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Charge Type *</label>
              <select required value={formData.chargeType} onChange={(e) => setFormData({ ...formData, chargeType: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="per_min">Per Minute</option>
                <option value="per_hour">Per Hour</option>
                <option value="per_game">Per Game</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Charges (Rs.) *</label>
              <input type="number" required min="0" step="0.01" value={formData.charges} onChange={(e) => setFormData({ ...formData, charges: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Duration/Games</label>
              <input type="text" placeholder="e.g., 2 hours, 5 games, 30 mins" value={formData.expectedDuration} onChange={(e) => setFormData({ ...formData, expectedDuration: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Check In</button>
          </div>
        </form>
      </div>
    </div>
  );
}
