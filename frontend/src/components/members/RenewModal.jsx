export default function RenewModal({ member, duration, setDuration, onRenew, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Renew Membership</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-600">Member: <span className="font-medium text-gray-900">{member.name}</span></p>
            <p className="text-sm text-gray-600">Tier: <span className="font-medium text-gray-900">{member.membershipType}</span></p>
            <p className="text-sm text-gray-600">Price: <span className="font-medium text-gray-900">Rs. {member.membershipPrice}/month</span></p>
            {member.totalGames > 0 ? (
              <p className="text-sm text-gray-600">Games: <span className="font-medium text-green-600">{member.remainingGames}/{member.totalGames}</span></p>
            ) : (
              <p className="text-sm text-gray-600">Charge: <span className="font-medium text-gray-900">Rs. {member.perFrameCharge}/frame</span></p>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900">Renewal will:</p>
            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
              <li>Extend membership by 1 month</li>
              {member.totalGames > 0 && <li>Reset games to {member.totalGames}</li>}
            </ul>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={onRenew} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Renew for Rs. {member.membershipPrice}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
