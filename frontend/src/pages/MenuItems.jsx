import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import DeleteModal from '../components/DeleteModal';
import { FaPlus, FaEdit, FaTrash, FaUtensils, FaLeaf, FaFire } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatCurrency';

function MenuItems() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null });
  const [formData, setFormData] = useState({
    productId: '',
    categoryId: '',
    preparationTime: '',
    isAvailable: true,
    ingredients: '',
    allergens: '',
    spiceLevel: '',
    isVegetarian: false,
    calories: ''
  });

  const queryClient = useQueryClient();

  const { data: menuItems = [], isLoading } = useQuery(['menu-items'], async () => {
    const response = await api.get('/api/menu-items');
    return Array.isArray(response.data) ? response.data : [];
  });

  const { data: products = [] } = useQuery(['products'], async () => {
    const response = await api.get('/api/products');
    const data = Array.isArray(response.data?.items) ? response.data.items : (Array.isArray(response.data) ? response.data : []);
    return data.filter(product => product.isMenuItem);
  });

  const { data: categories = [] } = useQuery(['menu-categories'], async () => {
    const response = await api.get('/api/menu-categories');
    const data = Array.isArray(response.data) ? response.data : [];
    return data.filter(cat => cat.isActive);
  });

  const createMutation = useMutation(
    (data) => api.post('/api/menu-items', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['menu-items']);
        resetForm();
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/api/menu-items/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['menu-items']);
        resetForm();
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/api/menu-items/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['menu-items']);
        setDeleteModal({ show: false, item: null });
      }
    }
  );

  const resetForm = () => {
    setFormData({
      productId: '',
      categoryId: '',
      preparationTime: '',
      isAvailable: true,
      ingredients: '',
      allergens: '',
      spiceLevel: '',
      isVegetarian: false,
      calories: ''
    });
    setShowForm(false);
    setEditingItem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null,
      calories: formData.calories ? parseInt(formData.calories) : null
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      productId: item.productId,
      categoryId: item.categoryId,
      preparationTime: item.preparationTime?.toString() || '',
      isAvailable: item.isAvailable,
      ingredients: item.ingredients || '',
      allergens: item.allergens || '',
      spiceLevel: item.spiceLevel || '',
      isVegetarian: item.isVegetarian,
      calories: item.calories?.toString() || ''
    });
    setShowForm(true);
  };

  const getSpiceLevelIcon = (level) => {
    const count = level === 'MILD' ? 1 : level === 'MEDIUM' ? 2 : level === 'HOT' ? 3 : level === 'EXTRA_HOT' ? 4 : 0;
    return Array(count).fill(0).map((_, i) => <FaFire key={i} className="text-red-500" />);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Menu Items</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <FaPlus /> Add Menu Item
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product *
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.retailPrice || product.price)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preparation Time (minutes)
              </label>
              <input
                type="number"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spice Level
              </label>
              <select
                value={formData.spiceLevel}
                onChange={(e) => setFormData({ ...formData, spiceLevel: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">No Spice</option>
                <option value="MILD">Mild</option>
                <option value="MEDIUM">Medium</option>
                <option value="HOT">Hot</option>
                <option value="EXTRA_HOT">Extra Hot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calories
              </label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isVegetarian}
                  onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Vegetarian</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Available</span>
              </label>
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredients
              </label>
              <textarea
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows="2"
                placeholder="List main ingredients..."
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergens
              </label>
              <input
                type="text"
                value={formData.allergens}
                onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Nuts, Dairy, Gluten"
              />
            </div>
            <div className="lg:col-span-3 flex gap-2">
              <button
                type="submit"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {editingItem ? 'Update' : 'Create'} Menu Item
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FaUtensils className="text-primary-600" />
                  <h3 className="font-semibold text-lg">{item.product?.name}</h3>
                  {item.isVegetarian && <FaLeaf className="text-green-600" />}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ show: true, item })}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{item.category?.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-primary-600">
                    {formatCurrency(item.product?.retailPrice || item.product?.price)}
                  </span>
                </div>
                
                {item.preparationTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prep Time:</span>
                    <span className="font-medium">{item.preparationTime} min</span>
                  </div>
                )}
                
                {item.spiceLevel && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Spice Level:</span>
                    <div className="flex gap-1">
                      {getSpiceLevelIcon(item.spiceLevel)}
                    </div>
                  </div>
                )}
                
                {item.calories && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calories:</span>
                    <span className="font-medium">{item.calories}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                
                {item.ingredients && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600 text-xs">Ingredients:</span>
                    <p className="text-xs text-gray-800 mt-1">{item.ingredients}</p>
                  </div>
                )}
                
                {item.allergens && (
                  <div className="pt-1">
                    <span className="text-gray-600 text-xs">Allergens:</span>
                    <p className="text-xs text-red-600 mt-1">{item.allergens}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <FaUtensils className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">No menu items found</h3>
          <p className="text-gray-400 mb-4">Start by adding your first menu item</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Add Menu Item
          </button>
        </div>
      )}

      <DeleteModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, item: null })}
        onConfirm={() => deleteMutation.mutate(deleteModal.item?.id)}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deleteModal.item?.product?.name}" from the menu? This action cannot be undone.`}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}

export default MenuItems;