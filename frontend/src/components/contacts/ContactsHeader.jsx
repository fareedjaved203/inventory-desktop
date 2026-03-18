import { FaSearch, FaUserPlus } from 'react-icons/fa';

export function ContactsHeader({
  t,
  searchTerm,
  handleSearchChange,
  searchInputRef,
  contactTypeFilter,
  setContactTypeFilter,
  setShowAddModal,
  setSelectedContact,
  reset
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800">{t('contacts')}</h1>
      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('searchContacts')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:w-48 md:w-64 pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
            <FaSearch />
          </div>
        </div>
        <select
          value={contactTypeFilter}
          onChange={(e) => setContactTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Contacts</option>
          <option value="customer">Customers</option>
          <option value="supplier">Suppliers</option>
          <option value="both">Both</option>
          <option value="order_booker">Order Bookers</option>
        </select>
        <button
          onClick={() => {
            setShowAddModal(true);
            setSelectedContact(null);
            reset();
          }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap flex items-center gap-2 w-full sm:w-auto"
        >
          <FaUserPlus />
          Add Contact
        </button>
      </div>
    </div>
  );
}
