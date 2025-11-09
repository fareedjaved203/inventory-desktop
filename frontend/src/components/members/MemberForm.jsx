const MEMBERSHIP_TIERS = {
  'Rs. 12000': { price: 12000, games: 100, perFrame: 0 },
  'Rs. 6000': { price: 6000, games: 50, perFrame: 0 },
  'Rs. 2000': { price: 2000, games: 0, perFrame: 120 }
};

export default function MemberForm({ formData, setFormData, onSubmit, onCancel, isEditing }) {
  const handleTierChange = (tier) => {
    const config = MEMBERSHIP_TIERS[tier];
    setFormData({ 
      ...formData, 
      membershipType: tier,
      membershipPrice: config.price,
      totalGames: config.games,
      perFrameCharge: config.perFrame
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Member' : 'Add New Member'}</h2>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNIC</label>
            <input type="text" value={formData.cnic} onChange={(e) => setFormData({ ...formData, cnic: e.target.value })} placeholder="12345-1234567-1" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Membership Tier *</label>
            <select required value={formData.membershipType} onChange={(e) => handleTierChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Select Tier</option>
              <option value="Rs. 12000">Rs. 12000 - 100 Free Games/Month</option>
              <option value="Rs. 6000">Rs. 6000 - 50 Free Games/Month</option>
              <option value="Rs. 2000">Rs. 2000 - Rs. 120/Frame</option>
            </select>
          </div>
          {formData.membershipType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">Membership Details:</p>
              <p className="text-sm text-blue-700 mt-1">
                Price: Rs. {formData.membershipPrice}/month<br/>
                {formData.totalGames > 0 ? `Free Games: ${formData.totalGames}/month` : `Charge: Rs. ${formData.perFrameCharge}/frame`}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{isEditing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
