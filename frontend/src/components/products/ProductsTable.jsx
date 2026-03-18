import { FaEdit, FaTrash, FaTag, FaBoxOpen, FaExclamationTriangle } from 'react-icons/fa';
import ProductImage from '../../components/ProductImage';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function ProductsTable({
  language,
  t,
  products,
  showDamaged,
  handleEditProduct,
  handlePrintLabel,
  handleDamaged,
  handleDeleteClick
}) {
  return (
    <table className="min-w-full">
      <thead className="bg-primary-50">
        <tr className="text-primary-800">
          <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('product')}</th>
          <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('allCategories')}</th>
          <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('available')}</th>
          <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('damaged')}</th>
          <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('unitPriceAndPurchase')}</th>
          <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('sellingPrice')}</th>
          <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('status')}</th>
          <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">{t('actions')}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {products?.items?.map((product) => {
          const isLowStock = product.quantity <= product.lowStockThreshold;
          return (
            <tr key={product.id} className={`hover:bg-primary-50/50 transition-colors ${isLowStock ? 'bg-red-50/30' : ''}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <ProductImage 
                    src={product.image} 
                    alt={product.name}
                    className="w-12 h-12 rounded object-cover border border-gray-200 shadow-sm"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 font-mono">
                      <FaTag className="text-gray-400 w-3 h-3" />
                      {product.sku}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{product.category?.icon}</span>
                  <span className="text-sm text-gray-700">{product.category?.name || 'Uncategorized'}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                    {product.quantity}
                  </div>
                  {product.unit && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                      {product.unit}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm font-medium ${product.damagedQuantity > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {product.damagedQuantity || 0}
                </span>
                {product.unit && product.damagedQuantity > 0 && (
                  <span className="text-xs text-red-400 ml-1">
                    {product.unit}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {product.isRawMaterial ? (
                  <div className="text-sm text-blue-600 font-medium">
                    {product.perUnitPurchasePrice ? formatPakistaniCurrency(product.perUnitPurchasePrice) : '-'}
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {product.isRawMaterial ? (
                  <span className="text-gray-400 text-sm">-</span>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-green-600">
                      R: {formatPakistaniCurrency(product.retailPrice)}
                    </span>
                    <span className="text-xs text-emerald-600">
                      W: {formatPakistaniCurrency(product.wholesalePrice)}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  {isLowStock && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <FaExclamationTriangle className="w-3 h-3" />
                      {t('lowStock')}
                    </span>
                  )}
                  {product.isRawMaterial && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <FaBoxOpen className="w-3 h-3" />
                      {t('rawMaterials')}
                    </span>
                  )}
                  {!isLowStock && !product.isRawMaterial && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('inStock')}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t('edit')}
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePrintLabel(product)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-primary-200"
                    title={t('printLabel')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDamaged(product)}
                    className={`p-2 rounded-lg transition-colors border ${
                      showDamaged 
                        ? 'text-blue-600 hover:bg-blue-50 border-blue-200' 
                        : 'text-orange-600 hover:bg-orange-50 border-orange-200'
                    }`}
                    title={showDamaged ? t('restoreItems') : t('markAsDamaged')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      {showDamaged ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('delete')}
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
