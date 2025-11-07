export default function RenewModal({ member, duration, setDuration, onRenew, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Renew Membership</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Member: <span className="font-medium text-gray-900">{member.name}</span></p>
            <p className="text-sm text-gray-600 mb-4">Type: <span className="font-medium text-gray-900 capitalize">{member.membershipType}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration ({member.membershipType === 'monthly' ? 'months' : member.membershipType === 'quarterly' ? 'quarters' : 'years'}) *
            </label>
            <input type="number" min="1" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} onWheel={(e) => e.target.blur()} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <p className="text-xs text-gray-500 mt-1">
              {member.membershipType === 'monthly' && `${duration} month(s)`}
              {member.membershipType === 'quarterly' && `${duration} quarter(s) = ${duration * 3} months`}
              {member.membershipType === 'yearly' && `${duration} year(s)`}
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={onRenew} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Renew</button>
          </div>
        </div>
      </div>
    </div>
  );
}
