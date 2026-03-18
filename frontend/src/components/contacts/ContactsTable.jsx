import { FaFileAlt } from 'react-icons/fa';
import LoadingSpinner from '../LoadingSpinner';

export function ContactsTable({
  t,
  isFetching,
  debouncedSearchTerm,
  contactsData,
  handleEdit,
  setSelectedContact,
  setShowLoanModal,
  setShowStatementModal,
  setStatementStartDate,
  setStatementEndDate,
  setStatementData,
  setStatementPdfPreferences,
  setShowDeleteModal
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-100">
      <table className="min-w-full">
        <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('name')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('type')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('address')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('phoneNumber')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isFetching && debouncedSearchTerm ? (
            <tr>
              <td colSpan="5" className="px-6 py-8 text-center">
                <div className="flex justify-center items-center">
                  <LoadingSpinner size="w-6 h-6" />
                  <span className="ml-2 text-gray-500">Searching...</span>
                </div>
              </td>
            </tr>
          ) : (
            contactsData?.items?.map((contact) => (
              <tr key={contact.id} className="hover:bg-primary-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-700">{contact.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    (contact.contactType || 'customer') === 'customer' 
                      ? 'bg-blue-100 text-blue-800' 
                      : contact.contactType === 'supplier' 
                      ? 'bg-green-100 text-green-800' 
                      : contact.contactType === 'order_booker'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {(contact.contactType || 'customer') === 'customer' 
                      ? 'Customer' 
                      : contact.contactType === 'supplier' 
                      ? 'Supplier' 
                      : contact.contactType === 'order_booker' 
                      ? 'Order Booker' 
                      : 'Both'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{contact.address || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{contact.phoneNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowLoanModal(true);
                      }}
                      className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('loans')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowStatementModal(true);
                        setStatementStartDate('');
                        setStatementEndDate('');
                        setStatementData(null);
                        const saved = localStorage.getItem('statementPdfPreferences');
                        if (saved) {
                          setStatementPdfPreferences(JSON.parse(saved));
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <FaFileAlt className="w-4 h-4" />
                      {t('statement')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      {t('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
