import { FaBoxOpen, FaTag, FaBarcode, FaDollarSign, FaWarehouse } from 'react-icons/fa';
import ProductImageUpload from '../../components/ProductImageUpload';
import LoadingSpinner from '../../components/LoadingSpinner';
import featuresConfig from '../../config/features.json';

export function ProductFormModal({
  language,
  t,
  isModalOpen,
  setIsModalOpen,
  isEditMode,
  formData,
  setFormData,
  categories,
  validationErrors,
  setValidationErrors,
  isGeneratingBarcode,
  setIsGeneratingBarcode,
  generateUserBarcode,
  handleSubmit,
  createProduct,
  updateProduct
}) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl h-[90vh] shadow-xl border border-gray-200 flex flex-col">
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
            <FaBoxOpen className="text-primary-600" />
            {isEditMode ? (language === 'ur' ? 'پروڈکٹ میں تبدیلی' : 'Edit Product') : (language === 'ur' ? 'نیا پروڈکٹ شامل کریں' : 'Add New Product')}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-1 py-2">
          <form id="product-form" onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Section 1: Product Classification */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                <FaTag /> Product Classification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                  <input
                    type="checkbox"
                    id="isRawMaterial"
                    checked={formData.isRawMaterial}
                    onChange={(e) => setFormData({ ...formData, isRawMaterial: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isRawMaterial" className="text-sm font-medium text-blue-800">
                    {featuresConfig.manufacture ? 'Raw Material' : 'Bundle Item'} <span className="text-xs text-blue-600">({featuresConfig.manufacture ? 'For Manufacturing' : 'For Bundles'})</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="">No Category</option>
                    {categories?.items?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Basic Information */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaBoxOpen /> Basic Information
              </h3>
              <div className="space-y-3">
                <ProductImageUpload
                  value={formData.image}
                  onChange={(filename) => setFormData({ ...formData, image: filename })}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (validationErrors.name) {
                        const newErrors = { ...validationErrors };
                        delete newErrors.name;
                        setValidationErrors(newErrors);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="Enter unique product name"
                  />
                  {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    rows="2"
                    placeholder="Product description (optional)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaBarcode /> Barcode/SKU
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      disabled={isGeneratingBarcode}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder={isGeneratingBarcode ? 'Generating...' : 'Enter or generate'}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setIsGeneratingBarcode(true);
                        try {
                          const barcode = await generateUserBarcode();
                          setFormData({ ...formData, sku: barcode });
                        } catch (error) {
                          console.error('Failed to generate barcode:', error);
                        } finally {
                          setIsGeneratingBarcode(false);
                        }
                      }}
                      disabled={isGeneratingBarcode}
                      className="px-3 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 disabled:opacity-50"
                    >
                      {isGeneratingBarcode ? <LoadingSpinner size="w-4 h-4" /> : <FaBarcode />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Pricing */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                <FaDollarSign /> Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Retail Price (MRP)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                    onWheel={(e) => e.target.blur()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="Individual customer price"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Wholesale Price</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                    onWheel={(e) => e.target.blur()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="Bulk/reseller price"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Cost & Inventory */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                <FaWarehouse /> Cost & Inventory
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.purchasePrice}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        const quantity = parseFloat(formData.quantity);
                        if (value && quantity && quantity > 0) {
                          const perUnitCost = value / quantity;
                          setFormData({ ...formData, purchasePrice: e.target.value, perUnitPurchasePrice: perUnitCost.toFixed(2) });
                        } else {
                          setFormData({ ...formData, purchasePrice: e.target.value });
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="Total cost"
                    />
                  </div>
                  {['kg', 'gram', 'ltr', 'ml', 'ton', 'ohm'].includes(formData.unit) && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Per Unit Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.perUnitPurchasePrice || ''}
                        onChange={(e) => setFormData({ ...formData, perUnitPurchasePrice: e.target.value })}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-gray-50"
                        placeholder="Auto-calculated"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        const purchasePrice = parseFloat(formData.purchasePrice);
                        if (purchasePrice && value && value > 0) {
                          const perUnitCost = purchasePrice / value;
                          setFormData({ ...formData, quantity: e.target.value, perUnitPurchasePrice: perUnitCost.toFixed(2) });
                        } else {
                          setFormData({ ...formData, quantity: e.target.value });
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="Stock quantity"
                    />
                    {validationErrors.quantity && <p className="text-red-500 text-xs mt-1">{validationErrors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="pcs">Pieces</option>
                      <option value="dozen">Dozen</option>
                      <option value="kg">Kilogram</option>
                      <option value="gram">Gram</option>
                      <option value="ltr">Liter</option>
                      <option value="ml">Milliliter</option>
                      <option value="ft">Feet</option>
                      <option value="metre">Meter</option>
                      <option value="sqft">Square Feet</option>
                      <option value="carton">Carton</option>
                      <option value="roll">Roll</option>
                      <option value="sheet">Sheet</option>
                      <option value="drum">Drum</option>
                      <option value="packet">Packet</option>
                      <option value="bottle">Bottle</option>
                      <option value="bag">Bag</option>
                      <option value="pair">Pair</option>
                      <option value="set">Set</option>
                      <option value="ton">Ton</option>
                      <option value="ohm">Ohm</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    onWheel={(e) => e.target.blur()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Alert when stock reaches this level"
                  />
                </div>
              </div>
            </div>
            </div>
          </form>
        </div>
        <div className="flex-shrink-0 mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(false);
              setValidationErrors({});
            }}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={createProduct.isLoading || updateProduct.isLoading}
            className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(createProduct.isLoading || updateProduct.isLoading) && <LoadingSpinner size="w-4 h-4" />}
            {isEditMode ? t('update') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
