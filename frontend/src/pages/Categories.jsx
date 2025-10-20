import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import API from '../utils/api';
import DataStorageManager from '../utils/DataStorageManager';
import { STORES } from '../utils/indexedDBSchema';
import { z } from 'zod';
import DeleteModal from '../components/DeleteModal';
import TableSkeleton from '../components/TableSkeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import { debounce } from 'lodash';
import { FaSearch, FaTag, FaPalette, FaPlus } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional()
});

const CATEGORY_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const CATEGORY_ICONS = [
  '📦', '🍔', '👕', '📱', '🏠', '🚗', '💊', '📚', '🎮', '⚽'
];

function Categories() {
  const queryClient = useQueryClient();
  const searchInputRef = useRef(null);
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [validationErrors, setValidationErrors] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📦'
  });

  const debouncedSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const { data: categories, isLoading, isFetching } = useQuery(
    ['categories', debouncedSearchTerm, currentPage],
    async () => {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm
      };
      
      return await DataStorageManager.read(STORES.categories, params);
    }
  );

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [categories]);

  const createCategory = useMutation(
    async (newCategory) => {
      return await DataStorageManager.create(STORES.categories, newCategory);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['categories']);
        setIsModalOpen(false);
        setFormData({ name: '', description: '', color: '#3B82F6', icon: '📦' });
        setValidationErrors({});
        toast.success('Category created successfully!');
      },
      onError: (error) => {
        setValidationErrors({
          name: error.response?.data?.error || 'Failed to create category'
        });
      }
    }
  );

  const updateCategory = useMutation(
    async (updatedCategory) => {
      return await DataStorageManager.update(STORES.categories, updatedCategory.id, updatedCategory);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['categories']);
        setIsModalOpen(false);
        setFormData({ name: '', description: '', color: '#3B82F6', icon: '📦' });
        setIsEditMode(false);
        setValidationErrors({});
        toast.success('Category updated successfully!');
      },
      onError: (error) => {
        setValidationErrors({
          name: error.response?.data?.error || 'Failed to update category'
        });
      }
    }
  );

  const deleteCategory = useMutation(
    async (categoryId) => {
      return await DataStorageManager.delete(STORES.categories, categoryId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['categories']);
        setDeleteModalOpen(false);
        setCategoryToDelete(null);
        toast.success('Category deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete category');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const validatedData = categorySchema.parse(formData);
      setValidationErrors({});

      if (isEditMode) {
        updateCategory.mutate({ ...validatedData, id: formData.id });
      } else {
        createCategory.mutate(validatedData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleEdit = (category) => {
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
      icon: category.icon || '📦'
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory.mutate(categoryToDelete.id);
    }
  };

  if (isLoading && !debouncedSearchTerm) return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="h-10 bg-gray-300 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
      </div>
      <TableSkeleton rows={10} columns={4} />
    </div>
  );

  return (
    <div className={`p-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800">Categories</h1>
          <div className="bg-blue-50 px-3 py-1 rounded-full">
            <p className="text-xs text-blue-700">
              📋 <strong>Purpose:</strong> Organize products for better POS navigation and inventory management
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:w-64 pl-10 pr-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <FaSearch />
            </div>
          </div>
          <button
            onClick={() => {
              setIsEditMode(false);
              setFormData({ name: '', description: '', color: '#3B82F6', icon: '📦' });
              setValidationErrors({});
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap w-full sm:w-auto flex items-center gap-2"
          >
            <FaPlus />
            Add Category
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider hidden md:table-cell">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Products</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isFetching && debouncedSearchTerm ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <LoadingSpinner size="w-6 h-6" />
                    <span className="ml-2 text-gray-500">Searching...</span>
                  </div>
                </td>
              </tr>
            ) : (
              categories?.items?.map((category) => (
                <tr key={category.id} className="hover:bg-primary-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <div className="font-medium text-primary-700">{category.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell text-gray-600">
                    {category.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {category._count?.products || 0} products
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m6.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-800">
            Page {currentPage} of {Math.ceil((categories?.total || 0) / itemsPerPage)}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage >= Math.ceil((categories?.total || 0) / itemsPerPage)}
            className="px-4 py-2 border border-primary-200 rounded-lg disabled:opacity-50 text-primary-700 hover:bg-primary-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2 flex items-center gap-2">
              <FaTag className="text-primary-600" />
              {isEditMode ? 'Edit Category' : 'Add New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
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
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter category name"
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Category description (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-8 h-8 rounded border text-lg ${
                          formData.icon === icon ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setValidationErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategory.isLoading || updateCategory.isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(createCategory.isLoading || updateCategory.isLoading) && <LoadingSpinner size="w-4 h-4" />}
                  {isEditMode ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={categoryToDelete ? `category "${categoryToDelete.name}"` : ''}
      />
    </div>
  );
}

export default Categories;