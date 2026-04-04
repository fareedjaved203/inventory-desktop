import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaTag, FaBoxOpen, FaExclamationTriangle, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import ProductImage from '../../components/ProductImage';
import { formatPakistaniCurrency } from '../../utils/formatCurrency';

export function ProductsTable({
  language,
  t,
  products,
  showDamaged,
  searchTerm,
  handleEditProduct,
  handlePrintLabel,
  handleDamaged,
  handleDeleteClick
}) {
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  // Auto-expand parents whose children match the search term
  useEffect(() => {
    if (!searchTerm || !searchTerm.trim()) {
      setExpandedProducts(new Set());
      return;
    }
    const term = searchTerm.toLowerCase();
    const autoExpand = new Set();
    products?.items?.forEach((product) => {
      if (product.variantCount > 0 && product.variants?.length > 0) {
        const hasMatchingChild = product.variants.some(
          (v) =>
            (v.name && v.name.toLowerCase().includes(term)) ||
            (v.variantLabel && v.variantLabel.toLowerCase().includes(term)) ||
            (v.sku && v.sku.toLowerCase().includes(term))
        );
        if (hasMatchingChild) {
          autoExpand.add(product.id);
        }
      }
    });
    setExpandedProducts(autoExpand);
  }, [searchTerm, products]);

  const toggleExpand = (productId) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const isParentProduct = (product) => product.variantCount > 0;

  const allColumns = [
    { key: 'product', label: t('product'), default: true },
    { key: 'category', label: t('allCategories'), default: true },
    { key: 'available', label: t('available'), default: true },
    { key: 'damaged', label: t('damaged'), default: false },
    { key: 'purchasePrice', label: t('unitPriceAndPurchase'), default: true },
    { key: 'sellingPrice', label: t('sellingPrice'), default: true },
    { key: 'status', label: t('status'), default: true },
    { key: 'actions', label: t('actions'), default: true },
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('productsVisibleColumns');
    if (saved) return JSON.parse(saved);
    return allColumns.filter(c => c.default).map(c => c.key);
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const toggleColumn = (key) => {
    const updated = visibleColumns.includes(key)
      ? visibleColumns.filter(k => k !== key)
      : [...visibleColumns, key];
    setVisibleColumns(updated);
    localStorage.setItem('productsVisibleColumns', JSON.stringify(updated));
  };

  const isVisible = (key) => visibleColumns.includes(key);

  return (
    <>
    <div className="flex justify-end mb-2 relative">
      <button
        onClick={() => setShowColumnPicker(!showColumnPicker)}
        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        Columns
      </button>
      {showColumnPicker && (
        <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[160px]">
          {allColumns.map(col => (
            <label key={col.key} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs text-gray-700">{col.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
    <table className="min-w-full">
      <thead className="bg-primary-50">
        <tr className="text-primary-800">
          {isVisible('product') && <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('product')}</th>}
          {isVisible('category') && <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('allCategories')}</th>}
          {isVisible('available') && <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('available')}</th>}
          {isVisible('damaged') && <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('damaged')}</th>}
          {isVisible('purchasePrice') && <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('unitPriceAndPurchase')}</th>}
          {isVisible('sellingPrice') && <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('sellingPrice')}</th>}
          {isVisible('status') && <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">{t('status')}</th>}
          {isVisible('actions') && <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">{t('actions')}</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {products?.items?.map((product) => {
          const isParent = isParentProduct(product);
          const isExpanded = expandedProducts.has(product.id);
          const displayQuantity = isParent ? product.totalVariantQuantity : product.quantity;
          const isLowStock = isParent ? false : !product.isService && product.quantity <= product.lowStockThreshold;

          return (
            <ParentAndVariantRows key={product.id}>
              {/* Parent / Standalone row */}
              <tr className={`hover:bg-primary-50/50 transition-colors ${isLowStock ? 'bg-red-50/30' : ''}`}>
                {isVisible('product') && <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {isParent ? (
                      <button
                        onClick={() => toggleExpand(product.id)}
                        className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                        aria-label={isExpanded ? 'Collapse variants' : 'Expand variants'}
                      >
                        {isExpanded ? (
                          <FaChevronDown className="w-3 h-3" />
                        ) : (
                          <FaChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    ) : (
                      <div className="w-5" />
                    )}
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded object-cover border border-gray-200 shadow-sm"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2 whitespace-nowrap">
                        {product.name}
                        {isParent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                            {product.variantCount} {product.variantCount === 1 ? 'variant' : 'variants'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 font-mono">
                        <FaTag className="text-gray-400 w-3 h-3" />
                        {product.sku}
                      </div>
                    </div>
                  </div>
                </td>}
                {isVisible('category') && <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{product.category?.icon}</span>
                    <span className="text-sm text-gray-700">{product.category?.name || 'Uncategorized'}</span>
                  </div>
                </td>}
                {isVisible('available') && <td className="px-6 py-4 whitespace-nowrap">
                  {product.isService ? (
                    <span className="text-gray-400 text-sm">—</span>
                  ) : (
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                      {displayQuantity}
                    </div>
                    {product.unit && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                        {product.unit}
                      </span>
                    )}
                  </div>
                  )}
                </td>}
                {isVisible('damaged') && <td className="px-6 py-4 whitespace-nowrap">
                  {product.isService ? (
                    <span className="text-gray-400 text-sm">—</span>
                  ) : (
                  <>
                  <span className={`text-sm font-medium ${product.damagedQuantity > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {product.damagedQuantity || 0}
                  </span>
                  {product.unit && product.damagedQuantity > 0 && (
                    <span className="text-xs text-red-400 ml-1">
                      {product.unit}
                    </span>
                  )}
                  </>
                  )}
                </td>}
                {isVisible('purchasePrice') && <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const isBulkUnit = ['kg', 'gram', 'ltr', 'ml', 'ton', 'ohm', 'metre', 'ft', 'sqft'].includes(product.unit);
                    if (isBulkUnit) {
                      const perUnit = product.perUnitPurchasePrice || (product.purchasePrice && product.quantity ? product.purchasePrice / product.quantity : 0);
                      return (
                        <div className="text-sm text-blue-600 font-medium">
                          {perUnit ? <>{formatPakistaniCurrency(perUnit)}<span className="text-[10px] text-blue-400">/{product.unit}</span></> : '-'}
                        </div>
                      );
                    }
                    return (
                      <div className="text-sm text-gray-700 font-medium">
                        {product.purchasePrice ? formatPakistaniCurrency(product.purchasePrice) : '-'}
                      </div>
                    );
                  })()}
                </td>}
                {isVisible('sellingPrice') && <td className="px-6 py-4 whitespace-nowrap">
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
                </td>}
                {isVisible('status') && <td className="px-6 py-4 whitespace-nowrap">
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
                    {product.isService && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Service
                      </span>
                    )}
                    {!isLowStock && !product.isRawMaterial && !product.isService && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('inStock')}
                      </span>
                    )}
                  </div>
                </td>}
                {isVisible('actions') && <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                </td>}
              </tr>

              {/* Child variant rows (shown when parent is expanded) */}
              {isParent && isExpanded && product.variants?.map((variant) => {
                const variantLowStock = variant.quantity <= variant.lowStockThreshold;
                return (
                  <tr key={variant.id} className={`bg-gray-50/70 hover:bg-gray-100/70 transition-colors ${variantLowStock ? 'bg-red-50/30' : ''}`}>
                    {isVisible('product') && <td className="px-6 py-3">
                      <div className="flex items-center gap-3" style={{ paddingLeft: '2.25rem' }}>
                        <div className="w-1 h-8 bg-purple-200 rounded-full" />
                        <div>
                          <div className="font-medium text-gray-700 text-sm">{variant.variantLabel}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                            <FaTag className="text-gray-300 w-2.5 h-2.5" />
                            {variant.sku}
                          </div>
                        </div>
                      </div>
                    </td>}
                    {isVisible('category') && <td className="px-6 py-3">
                      <span className="text-xs text-gray-400">—</span>
                    </td>}
                    {isVisible('available') && <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-medium ${variantLowStock ? 'text-red-600' : 'text-gray-700'}`}>
                          {variant.quantity}
                        </div>
                        {product.unit && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                            {product.unit}
                          </span>
                        )}
                      </div>
                    </td>}
                    {isVisible('damaged') && <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`text-sm font-medium ${variant.damagedQuantity > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {variant.damagedQuantity || 0}
                      </span>
                    </td>}
                    {isVisible('purchasePrice') && <td className="px-6 py-3 whitespace-nowrap">
                      {(() => {
                        const isBulkUnit = ['kg', 'gram', 'ltr', 'ml', 'ton', 'ohm', 'metre', 'ft', 'sqft'].includes(product.unit);
                        if (isBulkUnit) {
                          const perUnit = variant.perUnitPurchasePrice || (variant.purchasePrice && variant.quantity ? variant.purchasePrice / variant.quantity : 0);
                          return (
                            <div className="text-sm text-blue-600 font-medium">
                              {perUnit ? <>{formatPakistaniCurrency(perUnit)}<span className="text-[10px] text-blue-400">/{product.unit}</span></> : '-'}
                            </div>
                          );
                        }
                        return (
                          <div className="text-sm text-gray-700 font-medium">
                            {variant.purchasePrice ? formatPakistaniCurrency(variant.purchasePrice) : '-'}
                          </div>
                        );
                      })()}
                    </td>}
                    {isVisible('sellingPrice') && <td className="px-6 py-3 whitespace-nowrap">
                      {variant.isRawMaterial ? (
                        <span className="text-gray-400 text-sm">-</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-green-600">
                            R: {formatPakistaniCurrency(variant.retailPrice)}
                          </span>
                          <span className="text-xs text-emerald-600">
                            W: {formatPakistaniCurrency(variant.wholesalePrice)}
                          </span>
                        </div>
                      )}
                    </td>}
                    {isVisible('status') && <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {variantLowStock && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <FaExclamationTriangle className="w-3 h-3" />
                            {t('lowStock')}
                          </span>
                        )}
                        {!variantLowStock && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t('inStock')}
                          </span>
                        )}
                      </div>
                    </td>}
                    {isVisible('actions') && <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditProduct(variant)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('edit')}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(variant)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('delete')}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>}
                  </tr>
                );
              })}
            </ParentAndVariantRows>
          );
        })}
      </tbody>
    </table>
    </>
  );
}

function ParentAndVariantRows({ children }) {
  return <>{children}</>;
}
