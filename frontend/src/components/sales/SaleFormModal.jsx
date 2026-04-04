import LoadingSpinner from "../LoadingSpinner";
import { formatPakistaniCurrency } from "../../utils/formatCurrency";
import { useTranslation } from "../../utils/translations";

export default function SaleFormModal({ language, form }) {
  const t = useTranslation(language);

  if (!form.isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] shadow-2xl border border-gray-200 flex flex-col">
        <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {form.isEditMode ? t("editSale") : t("newSale")}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="sale-form" onSubmit={form.handleSubmit} className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Add Products
              </h3>

              <div className="space-y-3">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={form.productSearchTerm}
                      onChange={(e) => {
                        form.handleProductSearchChange(e.target.value);
                        form.isProductSelected(false);
                        form.setSelectedProduct(null);
                      }}
                      placeholder={t("searchProducts")}
                      className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    {!form.productSelected && form.productSearchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-primary-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {form.productsLoading ? (
                          <div className="px-4 py-3 flex items-center justify-center">
                            <LoadingSpinner size="w-4 h-4" />
                            <span className="ml-2 text-gray-500 text-sm">Searching...</span>
                          </div>
                        ) : form.filteredProducts?.length > 0 ? (
                          form.filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              onClick={() => {
                                form.setSelectedProduct(product);
                                form.setProductSearchTerm(product.name);
                                form.isProductSelected(true);
                                form.setValidationErrors((prev) => ({ ...prev, product: undefined }));
                              }}
                              className="px-4 py-2 cursor-pointer hover:bg-primary-50 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-600">
                                  {Number(product.quantity) % 1 === 0 ? product.quantity : Number(product.quantity).toFixed(2)}{" "}
                                  {product.unit || "units"} in stock
                                </div>
                              </div>
                              <div className="text-primary-600 font-medium">
                                R:{" "}
                                {product.retailPrice
                                  ? `Rs.${product.retailPrice}`
                                  : product.price
                                    ? `Rs.${product.price}`
                                    : "-"}
                                {product.wholesalePrice && (
                                  <span className="text-green-600 ml-2">W: Rs.{product.wholesalePrice}</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-sm">No products found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {form.validationErrors.product && <p className="text-red-500 text-sm mt-1">{form.validationErrors.product}</p>}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Quantity{" "}
                      {form.selectedProduct && (
                        <span className="text-blue-600 font-semibold">({form.selectedProduct.unit || "units"})</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.quantity}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (v <= 0) form.setValidationErrors((prev) => ({ ...prev, quantity: t("quantityMustBePositive") }));
                          else form.setValidationErrors((prev) => ({ ...prev, quantity: undefined }));
                          form.setQuantity(e.target.value);
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0.00"
                        className="w-full px-3 py-2 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      {form.selectedProduct && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 pointer-events-none">
                          {form.selectedProduct.unit || "units"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price Type</label>
                    <select
                      value={form.priceType}
                      onChange={(e) => form.setPriceType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="retail">🏪 Retail</option>
                      <option value="wholesale">📦 Wholesale</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={form.handleAddItem}
                      className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md transition-all flex items-center gap-2 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t("add")}
                    </button>
                  </div>
                </div>

                {form.validationErrors.quantity && <p className="text-red-500 text-sm mt-1">{form.validationErrors.quantity}</p>}
                {form.validationErrors.items && <p className="text-red-500 text-sm">{form.validationErrors.items}</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200 rounded-t-xl">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {t("saleItems")} <span className="text-sm text-gray-500">({form.saleItems.length})</span>
                </h3>
              </div>

              <div className="p-5">
                {form.saleItems.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-gray-400 font-medium">{t("noItemsAdded")}</p>
                    <p className="text-gray-400 text-sm mt-1">Add products to create a sale</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.saleItems.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">#{index + 1}</span>
                            <span className="font-semibold text-gray-800">{item.productName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => form.handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity</label>
                            <div className="bg-gray-100 px-3 py-2 rounded-lg font-semibold text-gray-800">{item.quantity}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                            <div
                              className={`font-semibold text-xs px-3 py-2 rounded-lg text-center ${
                                item.priceType === "wholesale" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {item.priceType === "wholesale" ? "📦 Wholesale" : "🏪 Retail"}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Unit Price</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={(e) => form.handlePriceChange(index, e.target.value)}
                              onWheel={(e) => e.target.blur()}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Subtotal</label>
                            <div className="bg-primary-50 px-3 py-2 rounded-lg font-bold text-primary-700">
                              {formatPakistaniCurrency(item.subtotal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-5 py-4 border-t-2 border-primary-200 rounded-b-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-semibold">Subtotal:</span>
                    <span className="text-2xl font-bold text-primary-700">{formatPakistaniCurrency(form.calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Additional Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {t("saleDate")} <span className="text-gray-400 text-xs">({t("optional")})</span>
                  </label>
                  <input
                    type="date"
                    value={form.saleDate}
                    onChange={(e) => form.setSaleDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">{t("leaveEmpty")}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Description <span className="text-gray-400 text-xs">({t("optional")})</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => form.setDescription(e.target.value)}
                    placeholder="Enter sale description..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-5 border border-green-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Contact & Transport
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Order Booker <span className="text-gray-400 text-xs">({t("optional")})</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.orderBookerSearchTerm}
                      onChange={(e) => {
                        form.handleOrderBookerSearchChange(e.target.value);
                        if (!e.target.value) form.setSelectedOrderBooker(null);
                      }}
                      placeholder="Search order bookers..."
                      className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {form.orderBookerSearchTerm && !form.selectedOrderBooker && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-primary-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {form.orderBookersLoading ? (
                          <div className="px-4 py-3 flex items-center justify-center">
                            <LoadingSpinner size="w-4 h-4" />
                            <span className="ml-2 text-gray-500 text-sm">Searching...</span>
                          </div>
                        ) : form.orderBookers?.length > 0 ? (
                          form.orderBookers.map((b) => (
                            <div
                              key={b.id}
                              onClick={() => {
                                form.setSelectedOrderBooker(b);
                                form.setOrderBookerSearchTerm(b.name);
                              }}
                              className="px-4 py-2 cursor-pointer hover:bg-primary-50"
                            >
                              <div className="font-medium">{b.name}</div>
                              {b.phoneNumber && <div className="text-sm text-gray-600">{b.phoneNumber}</div>}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-sm">No order bookers found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {t("contact")} <span className="text-gray-400 text-xs">({t("optional")})</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="createNewContactSale"
                        checked={form.createNewContact}
                        onChange={(e) => {
                          form.setCreateNewContact(e.target.checked);
                          if (e.target.checked) {
                            form.setSelectedContact(null);
                            form.setContactSearchTerm("");
                          } else {
                            form.setNewContactData({ name: "", phoneNumber: "", address: "" });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="createNewContactSale" className="text-sm text-gray-600">
                        Add New Contact
                      </label>
                    </div>
                  </div>

                  {form.createNewContact ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={form.newContactData.name}
                        onChange={(e) => form.setNewContactData({ ...form.newContactData, name: e.target.value })}
                        placeholder="Contact name *"
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="text"
                        value={form.newContactData.phoneNumber}
                        onChange={(e) => form.setNewContactData({ ...form.newContactData, phoneNumber: e.target.value })}
                        placeholder="Phone number *"
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="text"
                        value={form.newContactData.address}
                        onChange={(e) => form.setNewContactData({ ...form.newContactData, address: e.target.value })}
                        placeholder="Address (optional)"
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={form.contactSearchTerm}
                        onChange={(e) => {
                          form.handleContactSearchChange(e.target.value);
                          if (!e.target.value) {
                            form.setSelectedContact(null);
                            form.setValidationErrors((prev) => ({ ...prev, contact: undefined }));
                          }
                        }}
                        placeholder={t("searchContacts")}
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {form.contactSearchTerm && !form.selectedContact && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-primary-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {form.contactsLoading ? (
                            <div className="px-4 py-3 flex items-center justify-center">
                              <LoadingSpinner size="w-4 h-4" />
                              <span className="ml-2 text-gray-500 text-sm">Searching...</span>
                            </div>
                          ) : form.contacts?.length > 0 ? (
                            form.contacts.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  form.setSelectedContact(c);
                                  form.setContactSearchTerm(c.name);
                                }}
                                className="px-4 py-2 cursor-pointer hover:bg-primary-50"
                              >
                                <div className="font-medium">{c.name}</div>
                                {c.phoneNumber && <div className="text-sm text-gray-600">{c.phoneNumber}</div>}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-sm">No contacts found</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {form.validationErrors.contact && <p className="text-red-500 text-sm mt-1">{form.validationErrors.contact}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                      />
                    </svg>
                    Car Number <span className="text-gray-400 text-xs">({t("optional")})</span>
                  </label>
                  <input
                    type="text"
                    value={form.transportSearchTerm}
                    onChange={(e) => form.setTransportSearchTerm(e.target.value)}
                    placeholder="Enter car number..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transport Cost <span className="text-gray-400 text-xs">({t("optional")})</span>
                    </label>
                    <input
                      type="number"
                      value={form.transportCost}
                      onChange={(e) => form.setTransportCost(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loading Date <span className="text-gray-400 text-xs">({t("optional")})</span>
                    </label>
                    <input
                      type="date"
                      value={form.loadingDate}
                      onChange={(e) => form.setLoadingDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arrival Date <span className="text-gray-400 text-xs">({t("optional")})</span>
                    </label>
                    <input
                      type="date"
                      value={form.arrivalDate}
                      onChange={(e) => form.setArrivalDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Payment Details
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t("subtotal")}</label>
                    <input
                      type="text"
                      value={`Rs.${form.calculateTotal().toFixed(2)}`}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 font-bold text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      {t("discount")}
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={form.discount}
                        onChange={(e) => form.setDiscount(e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="0"
                      />
                      <select
                        value={form.discountType}
                        onChange={(e) => form.setDiscountType(e.target.value)}
                        className="px-3 py-2.5 border border-gray-300 rounded-r-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="flat">Rs</option>
                        <option value="percentage">%</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      {t("totalAmount")}
                    </label>
                    <input
                      type="text"
                      value={`Rs.${(Number(form.totalAmount) || 0).toFixed(2)}`}
                      disabled
                      className="w-full px-4 py-2.5 border-2 border-amber-300 rounded-lg bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 font-bold text-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      {t("paidAmount")}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={form.paidAmount}
                      onChange={(e) => {
                        form.setPaidAmount(e.target.value);
                        form.setUpdatedAmount("");
                        form.setValidationErrors((prev) => ({ ...prev, paidAmount: undefined }));
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-semibold text-lg"
                    />

                    {form.validationErrors.paidAmount && <p className="text-red-500 text-sm mt-1">{form.validationErrors.paidAmount}</p>}

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Updated Amount ({t("optional")})
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={form.updatedAmount}
                        onChange={(e) => {
                          const newUpdated = parseFloat(e.target.value) || 0;
                          const oldUpdated = parseFloat(form.updatedAmount) || 0;
                          const currentPaid = parseFloat(form.paidAmount) || 0;
                          const newPaid = currentPaid - oldUpdated + newUpdated;
                          form.setPaidAmount(newPaid.toString());
                          form.setUpdatedAmount(e.target.value);
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Enter additional payment amount"
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter additional payment to add to current paid amount</p>
                    </div>
                  </div>
                </div>

                {form.isEditMode && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Update Reason ({t("optional")})
                      </label>
                      <input
                        type="text"
                        value={form.paymentDescription}
                        onChange={(e) => form.setPaymentDescription(e.target.value)}
                        placeholder="e.g., Received cash payment, Bank transfer..."
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Change Date ({t("optional")})
                      </label>
                      <input
                        type="datetime-local"
                        value={form.changeDate}
                        onChange={(e) => form.setChangeDate(e.target.value)}
                        className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to use current date/time</p>
                    </div>
                  </div>
                )}

                {form.validationErrors.total && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-red-700 text-sm font-medium">{form.validationErrors.total}</p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={form.resetForm}
              className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t("cancel")}
            </button>
            <button
              type="submit"
              form="sale-form"
              disabled={form.createSale.isLoading || form.updateSale.isLoading || form.creatingContact}
              className={`px-6 py-2.5 text-white rounded-lg shadow-lg flex items-center gap-2 font-semibold transition-all ${
                form.createSale.isLoading || form.updateSale.isLoading || form.creatingContact
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:shadow-xl"
              }`}
            >
              {form.createSale.isLoading || form.updateSale.isLoading || form.creatingContact ? (
                <LoadingSpinner size="w-5 h-5" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {form.isEditMode ? t("updateSale") : t("createSale")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

