import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';
import featuresConfig from '../../config/features.json';

export function ManufacturingModals({
  t,
  showRecipeModal,
  setShowRecipeModal,
  showProductionModal,
  setShowProductionModal,
  selectedItem,
  setSelectedItem,
  reset,
  handleSubmit,
  onSubmitRecipe,
  onSubmitProduction,
  register,
  errors,
  ingredients,
  setIngredients,
  addIngredient,
  removeIngredient,
  updateIngredient,
  productsData,
  rawMaterialsData,
  recipesData,
  selectedRecipe,
  setSelectedRecipe,
  calculateProductionMetrics,
  maxProduction,
  setMaxProduction,
  productionCost,
  setProductionCost,
  watch,
  createRecipe,
  updateRecipe,
  createManufacturing,
  convertToBaseUnit,
  getBaseUnit
}) {
  return (
    <>
      {/* Recipe Modal */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl h-[90vh] shadow-xl border border-gray-200 flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2">
                {selectedItem ? t('editRecipe') : t('addNewRecipe')}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-2">
              <form id="recipe-form" onSubmit={handleSubmit(onSubmitRecipe)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('recipeName')}
                </label>
                <input
                  {...register('name', { required: 'Formula name is required' })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('finalProduct')}
                </label>
                <select
                  {...register('productId', { required: 'Product is required' })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('selectProduct')}</option>
                  {productsData?.items?.filter(p => !p.isRawMaterial).map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {errors.productId && (
                  <p className="text-red-500 text-sm mt-1">{errors.productId.message}</p>
                )}
              </div>

              <div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('ingredients')} (per 1 unit of final product)
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {featuresConfig.manufacture
                    ? 'Specify how much of each raw material is needed to make 1 unit of the final product. Set per unit costs in Products section for cost estimation.'
                    : 'Specify the quantity of each item included in 1 bundle. Set per unit costs in Products section for cost estimation.'}
                </p>
                {ingredients.map((ingredient, index) => {
                  const selectedMaterial = rawMaterialsData?.data?.items?.find(m => m.id === ingredient.rawMaterialId);
                  const ingredientCost = selectedMaterial?.perUnitPurchasePrice && ingredient.quantity 
                    ? parseFloat(selectedMaterial.perUnitPurchasePrice) * parseFloat(ingredient.quantity)
                    : 0;
                  
                  return (
                    <div key={index} className="mb-3">
                      <div className="flex gap-2 mb-1">
                        <select
                          value={ingredient.rawMaterialId}
                          onChange={(e) => updateIngredient(index, 'rawMaterialId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-40 overflow-y-auto"
                          style={{ maxHeight: '10rem' }}
                        >
                          <option value="">{t('selectRawMaterial') || 'Select Raw Material'}</option>
                          {rawMaterialsData?.data?.items?.map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.perUnitPurchasePrice ? `(${formatPakistaniCurrency(material.perUnitPurchasePrice)}/${material.unit})` : '(No cost set)'}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={t('amountPerUnit')}
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                          className="w-32 px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          title="Amount needed per 1 unit of final product"
                        />
                        <input
                          type="text"
                          value={ingredient.unit}
                          readOnly
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                          title="Unit is auto-detected from selected raw material"
                        />
                        {ingredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="text-red-600 hover:text-red-800 px-2"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {selectedMaterial && ingredient.quantity && (
                        <div className="text-xs text-blue-600 ml-2">
                          {selectedMaterial.perUnitPurchasePrice > 0 
                            ? `Cost per unit: ${formatPakistaniCurrency(ingredientCost)}`
                            : 'Set per unit cost in Products section for cost calculation'
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Add Ingredient Button */}
                <button
                  type="button"
                  onClick={addIngredient}
                  className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {t('addIngredient')}
                </button>
                
                {/* Recipe Cost Summary */}
                {ingredients.some(ing => ing.rawMaterialId && ing.quantity) && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">{t('estimatedCost')} per Unit Produced:</h5>
                    <div className="space-y-1">
                      {ingredients
                        .filter(ing => ing.rawMaterialId && ing.quantity)
                        .map((ingredient, idx) => {
                          const material = rawMaterialsData?.data?.items?.find(m => m.id === ingredient.rawMaterialId);
                          const cost = material?.perUnitPurchasePrice && ingredient.quantity 
                            ? parseFloat(material.perUnitPurchasePrice) * parseFloat(ingredient.quantity)
                            : 0;
                          return (
                            <div key={idx} className="flex justify-between text-sm text-green-700">
                              <span>{material?.name}: {ingredient.quantity} {ingredient.unit}</span>
                              <span>{cost > 0 ? formatPakistaniCurrency(cost) : 'No cost set'}</span>
                            </div>
                          );
                        })}
                      <div className="border-t border-green-300 pt-1 mt-2">
                        <div className="flex justify-between font-medium text-green-800">
                          <span>Total Cost per Unit:</span>
                          <span>
                            {formatPakistaniCurrency(
                              ingredients
                                .filter(ing => ing.rawMaterialId && ing.quantity)
                                .reduce((total, ingredient) => {
                                  const material = rawMaterialsData?.data?.items?.find(m => m.id === ingredient.rawMaterialId);
                                  const cost = material?.perUnitPurchasePrice && ingredient.quantity 
                                    ? parseFloat(material.perUnitPurchasePrice) * parseFloat(ingredient.quantity)
                                    : 0;
                                  return total + cost;
                                }, 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('notes')}
                </label>
                <textarea
                  {...register('description')}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                />
              </div>

              </form>
            </div>
            <div className="flex-shrink-0 mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowRecipeModal(false);
                  setSelectedItem(null);
                  reset();
                  setIngredients([{ rawMaterialId: '', quantity: '', unit: 'pcs' }]);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                form="recipe-form"
                disabled={createRecipe.isLoading || updateRecipe.isLoading}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(createRecipe.isLoading || updateRecipe.isLoading) && <LoadingSpinner size="w-4 h-4" />}
                {selectedItem ? t('update') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Modal */}
      {showProductionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md h-[90vh] shadow-xl border border-gray-200 flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2">
                {t('startProduction')}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-2">
              <form id="production-form" onSubmit={handleSubmit(onSubmitProduction)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('recipe')}
                </label>
                <select
                  {...register('recipeId', { required: 'Formula is required' })}
                  onChange={(e) => {
                    const recipeId = e.target.value;
                    setSelectedRecipe(recipeId);
                    if (recipeId) {
                      calculateProductionMetrics(recipeId, parseFloat(watch('quantityProduced')) || 1);
                    } else {
                      setSelectedRecipe(null);
                      setMaxProduction(0);
                      setProductionCost(0);
                    }
                  }}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('selectRecipe')}</option>
                  {recipesData?.data?.items?.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name} ({recipe.product?.name})
                    </option>
                  ))}
                </select>
                {errors.recipeId && (
                  <p className="text-red-500 text-sm mt-1">{errors.recipeId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('quantityToMake')}
                  {maxProduction > 0 && (
                    <span className="text-green-600 text-sm ml-2">
                       ({t('maxProduction')}: {maxProduction} units)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={maxProduction}
                  {...register('quantityProduced', { 
                    required: 'Quantity is required',
                    min: { value: 0.01, message: 'Quantity must be positive' },
                    max: { value: maxProduction, message: `Cannot exceed ${maxProduction} units` }
                  })}
                  onChange={(e) => {
                    if (selectedRecipe) {
                      calculateProductionMetrics(selectedRecipe, parseFloat(e.target.value) || 1);
                    }
                  }}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.quantityProduced && (
                  <p className="text-red-500 text-sm mt-1">{errors.quantityProduced.message}</p>
                )}
              </div>

              {/* Ingredient Stock Levels and Cost Breakdown */}
              {selectedRecipe && (
                <div className={`border rounded-lg p-4 ${
                  maxProduction === 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    maxProduction === 0 ? 'text-red-800' : 'text-blue-800'
                  }`}>Ingredient Stock Status & Cost Breakdown</h4>
                  {maxProduction === 0 && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm font-medium">
                      ⚠️ {featuresConfig.manufacture ? 'Production cannot be completed - insufficient raw materials' : 'Bundle cannot be created - insufficient items'}
                    </div>
                  )}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {recipesData?.data?.items?.find(r => r.id === selectedRecipe)?.ingredients?.map((ingredient, idx) => {
                      const rawMaterial = rawMaterialsData?.data?.items?.find(rm => rm.id === ingredient.rawMaterialId);
                      const quantityToProduce = parseFloat(watch('quantityProduced')) || 1;
                      const needed = parseFloat(ingredient.quantity) * quantityToProduce;
                      const available = rawMaterial?.quantity || 0;
                      const perUnitCost = rawMaterial?.perUnitPurchasePrice || 0;
                      const ingredientCost = needed * perUnitCost;
                      
                      // Convert to base units for comparison
                      const neededInBaseUnit = convertToBaseUnit(needed, ingredient.unit);
                      const availableInBaseUnit = convertToBaseUnit(available, rawMaterial?.unit || 'pcs');
                      
                      // Check if units are compatible
                      const availableBaseUnit = getBaseUnit(rawMaterial?.unit || 'pcs');
                      const neededBaseUnit = getBaseUnit(ingredient.unit);
                      const unitsCompatible = availableBaseUnit === neededBaseUnit;
                      
                      const sufficient = unitsCompatible && availableInBaseUnit >= neededInBaseUnit;
                      
                      return (
                        <div key={idx} className={`p-2 rounded border ${
                          sufficient ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className={`font-medium ${
                                sufficient ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {rawMaterial?.name}
                                {!sufficient && <span className="ml-1 text-red-600">⚠️</span>}
                                {!unitsCompatible && <span className="ml-1 text-orange-600">(Unit mismatch)</span>}
                              </div>
                              <div className="text-xs text-gray-600">
                                Need: {parseFloat(ingredient.quantity)} {ingredient.unit} per unit × {quantityToProduce} = {needed} {ingredient.unit} | Available: {available} {rawMaterial?.unit || 'pcs'}
                              </div>
                              {perUnitCost > 0 && (
                                <div className="text-xs text-blue-600">
                                  Cost: {formatPakistaniCurrency(perUnitCost)}/unit × {needed} = {formatPakistaniCurrency(ingredientCost)}
                                </div>
                              )}
                              {perUnitCost === 0 && (
                                <div className="text-xs text-orange-600">
                                  No unit cost set - update product's per unit cost for accurate calculation
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {productionCost > 0 && (
                    <div className="mt-3 pt-2 border-t border-blue-200">
                      <div className="flex justify-between items-center font-medium text-blue-800">
                        <span>{t('totalEstimatedCost')}:</span>
                        <span>{formatPakistaniCurrency(productionCost)}</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {t('costPerUnit')}: {formatPakistaniCurrency(productionCost / (parseFloat(watch('quantityProduced')) || 1))}
                      </div>
                    </div>
                  )}
                  {productionCost === 0 && (
                    <div className="mt-3 pt-2 border-t border-orange-200 bg-orange-50 rounded p-2">
                      <div className="text-orange-700 text-sm">
                        💡 {featuresConfig.manufacture ? 'To see production costs, set "Per Unit Cost" for raw materials in the Products section' : 'To see bundle costs, set "Per Unit Cost" for items in the Products section'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('productionDate')}
                </label>
                <input
                  type="date"
                  {...register('productionDate')}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('manufacturingCost')} (Optional)
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder={productionCost > 0 ? `Estimated: ${Math.round(productionCost)}` : 'Enter cost'}
                  {...register('manufacturingCost')}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use estimated cost: {productionCost > 0 ? formatPakistaniCurrency(productionCost) : (featuresConfig.manufacture ? 'Set per unit costs for raw materials' : 'Set per unit costs for items')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('notes')}
                </label>
                <textarea
                  {...register('notes')}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                />
              </div>

              </form>
            </div>
            <div className="flex-shrink-0 mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowProductionModal(false);
                  setSelectedRecipe(null);
                  setMaxProduction(0);
                  setProductionCost(0);
                  reset();
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                form="production-form"
                disabled={createManufacturing.isLoading || maxProduction === 0}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createManufacturing.isLoading && <LoadingSpinner size="w-4 h-4" />}
                {t('startProduction')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
