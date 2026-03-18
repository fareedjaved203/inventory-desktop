import { FaBuilding, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import LoadingSpinner from '../LoadingSpinner';

export function ContactFormModal({
  t,
  selectedContact,
  handleSubmit,
  onSubmit,
  register,
  errors,
  setShowAddModal,
  setSelectedContact,
  reset,
  isCreatingContact,
  isUpdatingContact
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
          <FaBuilding className="text-primary-600" />
          {selectedContact ? t('editContact') : t('addNewContact')}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FaBuilding className="text-primary-500" /> {t('name')}
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('contactType')}
              </label>
              <select
                {...register('contactType')}
                className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
                <option value="both">Both (Supplier + Customer)</option>
                <option value="order_booker">Order Booker</option>
              </select>
              {errors.contactType && (
                <p className="text-red-500 text-sm mt-1">{errors.contactType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FaMapMarkerAlt className="text-primary-500" /> {t('address')}
              </label>
              <textarea
                {...register('address')}
                className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="3"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FaPhone className="text-primary-500" /> {t('phoneNumber')}
              </label>
              <input
                {...register('phoneNumber', { 
                  required: 'Phone number is required',
                  maxLength: {
                    value: 11,
                    message: 'Phone number must not exceed 11 characters'
                  },
                  pattern: {
                    value: /^[0-9]+$/,
                    message: 'Phone number must contain only numbers'
                  }
                })}
                className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setSelectedContact(null);
                reset();
              }}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isCreatingContact || isUpdatingContact}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(isCreatingContact || isUpdatingContact) && <LoadingSpinner size="w-4 h-4" />}
              {selectedContact ? t('update') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
