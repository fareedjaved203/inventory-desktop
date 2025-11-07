import { FaEdit, FaTrash, FaSync } from 'react-icons/fa';

export default function MemberTable({ members, onEdit, onRenew, onDelete }) {
  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNIC</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.phone}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.email || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.cnic || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">{member.membershipType}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(member.expiryDate).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${isExpired(member.expiryDate) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {isExpired(member.expiryDate) ? 'Expired' : 'Active'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(member)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit"><FaEdit /></button>
                  <button onClick={() => onRenew(member)} className="text-green-600 hover:text-green-800 p-1" title="Renew"><FaSync /></button>
                  <button onClick={() => onDelete(member.id)} className="text-red-600 hover:text-red-800 p-1" title="Delete"><FaTrash /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
