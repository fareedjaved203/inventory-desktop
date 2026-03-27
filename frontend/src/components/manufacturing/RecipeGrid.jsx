import { FaEdit, FaTrash, FaUtensils } from 'react-icons/fa';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function RecipeGrid({ data, rawMaterialsData, handleEditRecipe, setSelectedItem, setShowDeleteModal }) {
  if (!data?.data?.items || data.data.items.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
        <FaUtensils className="w-16 h-16 mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No Formulas Found</h3>
        <p className="text-sm text-center">Create your first formula to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {data?.data?.items?.map((recipe) => {
        const totalIngredients = recipe.ingredients?.length || 0;
        const estimatedCost = recipe.ingredients?.reduce((total, ing) => {
          const rawMaterial = rawMaterialsData?.data?.items?.find(rm => rm.id === ing.rawMaterialId);
          const cost = rawMaterial?.perUnitPurchasePrice && ing.quantity 
            ? parseFloat(rawMaterial.perUnitPurchasePrice) * parseFloat(ing.quantity)
            : 0;
          return total + cost;
        }, 0) || 0;
        
        return (
          <div key={recipe.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group hover:scale-105">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-1 truncate">{recipe.name}</h3>
                <p className="text-primary-100 text-sm truncate">{recipe.product?.name}</p>
              </div>

            </div>
            
            {/* Content */}
            <div className="p-4">
              {/* Stats */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{totalIngredients}</div>
                  <div className="text-xs text-gray-500">Ingredients</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {estimatedCost > 0 ? formatPakistaniCurrency(estimatedCost) : '-'}
                  </div>
                  <div className="text-xs text-gray-500">Est. Cost</div>
                </div>
              </div>
              
              {/* Ingredients Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredients:</h4>
                <div className="space-y-1 h-28 overflow-y-auto">
                  {recipe.ingredients?.slice(0, 4).map((ing, idx) => (
                    <div key={idx} className="flex justify-between text-xs bg-gray-50 rounded px-2 py-1">
                      <span className="text-gray-600 truncate flex-1 mr-2">{ing.rawMaterial?.name}</span>
                      <span className="text-primary-600 font-medium whitespace-nowrap">
                        {ing.quantity} {ing.unit}
                      </span>
                    </div>
                  ))}
                  {recipe.ingredients?.length > 4 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{recipe.ingredients.length - 4} more...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Description */}
              {recipe.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="px-4 pb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditRecipe(recipe)}
                  className="flex-1 bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <FaEdit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(recipe);
                    setShowDeleteModal(true);
                  }}
                  className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <FaTrash className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
