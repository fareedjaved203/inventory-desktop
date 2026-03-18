import { FaEdit, FaTrash } from 'react-icons/fa';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function ManufacturingTable({ t, activeTab, data, handleEditRecipe, setSelectedItem, setShowDeleteModal }) {
  if (activeTab === 'recipes') {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-100">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                {t('recipeName')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                {t('product')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                {t('ingredients')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.data?.items?.map((recipe) => (
              <tr key={recipe.id} className="hover:bg-primary-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-700">
                  {recipe.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {recipe.product?.name}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  <div className="text-sm">
                    {recipe.ingredients?.map((ing, idx) => (
                      <div key={idx}>
                        {ing.quantity} {ing.unit} {ing.rawMaterial?.name}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditRecipe(recipe)}
                      className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                    >
                      <FaEdit className="w-4 h-4" />
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(recipe);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                    >
                      <FaTrash className="w-4 h-4" />
                      {t('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-100">
      <table className="min-w-full">
        <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('date')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('recipe')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('product')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('quantityMade')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('productionCost')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('notes')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data?.data?.items?.map((manufacturing) => (
            <tr key={manufacturing.id} className="hover:bg-primary-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                {new Date(manufacturing.productionDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-700">
                {manufacturing.recipe?.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                {manufacturing.recipe?.product?.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                {manufacturing.quantityProduced}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                {formatPakistaniCurrency(manufacturing.manufacturingCost || 0)}
              </td>
              <td className="px-6 py-4 text-gray-700">
                {manufacturing.notes || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => {
                    setSelectedItem(manufacturing);
                    setShowDeleteModal(true);
                  }}
                  className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                >
                  <FaTrash className="w-4 h-4" />
                  {t('delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
