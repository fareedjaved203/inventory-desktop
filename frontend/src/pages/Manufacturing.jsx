import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { useForm } from 'react-hook-form';
import DeleteModal from '../components/DeleteModal';
import TableSkeleton from '../components/TableSkeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import { debounce } from 'lodash';
import { FaSearch, FaPlus, FaCog, FaUtensils, FaTrash, FaEdit, FaTh, FaList } from 'react-icons/fa';
import { formatPakistaniCurrency } from '../utils/formatCurrency';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../utils/translations';

function Manufacturing() {
  const queryClient = useQueryClient();
  const searchInputRef = useRef(null);
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [activeTab, setActiveTab] = useState('recipes');
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [ingredients, setIngredients] = useState([{ rawMaterialId: '', quantity: '', unit: 'pcs' }]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [maxProduction, setMaxProduction] = useState(0);
  const [productionCost, setProductionCost] = useState(0);
  const [viewMode, setViewMode] = useState('tiles'); // 'table' or 'tiles'

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

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

  // Fetch recipes
  const { data: recipesData, isLoading: recipesLoading } = useQuery(
    ['recipes', page, debouncedSearchTerm],
    async () => {
      return await API.get('/recipes', {
        params: {
          page: page.toString(),
          search: debouncedSearchTerm,
        }
      });
    },
    { enabled: activeTab === 'recipes' }
  );

  // Fetch manufacturing records
  const { data: manufacturingData, isLoading: manufacturingLoading } = useQuery(
    ['manufacturing', page, debouncedSearchTerm],
    async () => {
      return await API.get('/manufacturing', {
        params: {
          page: page.toString(),
          search: debouncedSearchTerm,
        }
      });
    },
    { enabled: activeTab === 'production' }
  );

  // Fetch products (for recipe creation)
  const { data: productsData } = useQuery(
    ['products'],
    async () => {
      return await API.getProducts({ limit: 1000 });
    }
  );

  // Fetch raw materials
  const { data: rawMaterialsData } = useQuery(
    ['raw-materials'],
    async () => {
      return await API.get('/products/raw-materials', {
        params: { limit: 1000 }
      });
    }
  );

  // Convert units to base unit for comparison
  const convertToBaseUnit = (value, unit) => {
    switch (unit) {
      case 'kg': return value * 1000; // Convert kg to grams
      case 'gram': return value;
      case 'ltr': return value * 1000; // Convert liters to ml
      case 'ml': return value;
      default: return value; // pcs, dozen, etc. remain as is
    }
  };

  // Get compatible base unit
  const getBaseUnit = (unit) => {
    if (unit === 'kg' || unit === 'gram') return 'gram';
    if (unit === 'ltr' || unit === 'ml') return 'ml';
    return unit;
  };

  // Calculate production metrics when recipe changes
  const calculateProductionMetrics = (recipeId, quantity = 1) => {
    const recipe = recipesData?.data?.items?.find(r => r.id === recipeId);
    if (!recipe || !rawMaterialsData?.data?.items) {
      setMaxProduction(0);
      setProductionCost(0);
      return;
    }

    let minPossible = Infinity;
    let totalCost = 0;

    recipe.ingredients.forEach(ingredient => {
      const rawMaterial = rawMaterialsData.data.items.find(rm => rm.id === ingredient.rawMaterialId);
      if (rawMaterial) {
        // Convert both available stock and needed amount to base units
        const availableInBaseUnit = convertToBaseUnit(rawMaterial.quantity, rawMaterial.unit);
        const neededPerUnitInBaseUnit = convertToBaseUnit(parseFloat(ingredient.quantity), ingredient.unit);
        
        // Check if units are compatible
        const availableBaseUnit = getBaseUnit(rawMaterial.unit);
        const neededBaseUnit = getBaseUnit(ingredient.unit);
        
        if (availableBaseUnit === neededBaseUnit) {
          const possibleFromThis = Math.floor(availableInBaseUnit / neededPerUnitInBaseUnit);
          minPossible = Math.min(minPossible, possibleFromThis);
        } else {
          // Incompatible units, can't produce
          minPossible = 0;
        }
        
        // Calculate cost using per-unit purchase price
        const ingredientNeeded = parseFloat(ingredient.quantity) * quantity;
        const perUnitCost = rawMaterial.perUnitPurchasePrice || 0;
        const costForThisIngredient = ingredientNeeded * perUnitCost;
        
        totalCost += costForThisIngredient;
      }
    });

    setMaxProduction(minPossible === Infinity ? 0 : minPossible);
    setProductionCost(totalCost);
  };

  // Create recipe mutation
  const createRecipe = useMutation(
    async (data) => {
      return await API.post('/recipes', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['recipes']);
        setShowRecipeModal(false);
        setSelectedItem(null);
        reset();
        setIngredients([{ rawMaterialId: '', quantity: '', unit: 'pcs' }]);
        toast.success('Recipe created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create recipe');
      }
    }
  );

  // Update recipe mutation
  const updateRecipe = useMutation(
    async ({ id, data }) => {
      return await API.put(`/recipes/${id}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['recipes']);
        setShowRecipeModal(false);
        setSelectedItem(null);
        reset();
        setIngredients([{ rawMaterialId: '', quantity: '', unit: 'pcs' }]);
        toast.success('Recipe updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update recipe');
      }
    }
  );

  // Delete recipe mutation
  const deleteRecipe = useMutation(
    async (id) => {
      return await API.delete(`/recipes/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['recipes']);
        setShowDeleteModal(false);
        setSelectedItem(null);
        setDeleteError(null);
        toast.success('Recipe deleted successfully!');
      },
      onError: (error) => {
        setDeleteError(error.response?.data?.error || 'Failed to delete recipe');
      }
    }
  );

  // Create manufacturing record mutation
  const createManufacturing = useMutation(
    async (data) => {
      return await API.post('/manufacturing', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['manufacturing']);
        queryClient.invalidateQueries(['products']);
        setShowProductionModal(false);
        reset();
        toast.success('Recipe completed successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to complete recipe');
      }
    }
  );

  // Delete manufacturing record mutation
  const deleteManufacturing = useMutation(
    async (id) => {
      return await API.delete(`/manufacturing/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['manufacturing']);
        queryClient.invalidateQueries(['products']);
        setShowDeleteModal(false);
        setSelectedItem(null);
        setDeleteError(null);
        toast.success('Recipe record deleted successfully!');
      },
      onError: (error) => {
        setDeleteError(error.response?.data?.error || 'Failed to delete recipe record');
      }
    }
  );

  const onSubmitRecipe = (data) => {
    const recipeData = {
      ...data,
      ingredients: ingredients
        .filter(ing => ing.rawMaterialId && ing.quantity)
        .map(ing => ({
          ...ing,
          quantity: parseFloat(ing.quantity)
        }))
    };

    if (selectedItem) {
      updateRecipe.mutate({ id: selectedItem.id, data: recipeData });
    } else {
      createRecipe.mutate(recipeData);
    }
  };

  const onSubmitProduction = (data) => {
    createManufacturing.mutate({
      ...data,
      quantityProduced: parseFloat(data.quantityProduced),
      manufacturingCost: data.manufacturingCost ? parseFloat(data.manufacturingCost) : Math.round(productionCost)
    });
  };

  const handleEditRecipe = (recipe) => {
    setSelectedItem(recipe);
    setValue('name', recipe.name);
    setValue('description', recipe.description);
    setValue('productId', recipe.productId);
    setIngredients(recipe.ingredients.map(ing => ({
      rawMaterialId: ing.rawMaterialId,
      quantity: ing.quantity.toString(),
      unit: ing.unit
    })));
    setShowRecipeModal(true);
  };

  const handleDelete = () => {
    if (selectedItem) {
      if (activeTab === 'recipes') {
        deleteRecipe.mutate(selectedItem.id);
      } else {
        deleteManufacturing.mutate(selectedItem.id);
      }
    }
  };

  const addIngredient = () => {
    setIngredients([{ rawMaterialId: '', quantity: '', unit: 'pcs' }, ...ingredients]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    
    // Auto-detect unit when raw material is selected
    if (field === 'rawMaterialId' && value) {
      const selectedMaterial = rawMaterialsData?.data?.items?.find(m => m.id === value);
      if (selectedMaterial) {
        updated[index]['unit'] = selectedMaterial.unit;
      }
    }
    
    setIngredients(updated);
  };

  const isLoading = activeTab === 'recipes' ? recipesLoading : manufacturingLoading;
  const data = activeTab === 'recipes' ? recipesData : manufacturingData;

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
    <div className={`p-6 ${language === 'ur' ? 'font-urdu' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-800 flex items-center gap-2">
          <FaUtensils />
          Recipe
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:w-48 md:w-64 pl-10 pr-3 py-2 text-sm border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-400">
              <FaSearch />
            </div>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'recipes') {
                setShowRecipeModal(true);
                setSelectedItem(null);
                reset();
                setIngredients([{ rawMaterialId: '', quantity: '', unit: 'pcs' }]);
              } else {
                // Refresh raw materials data before opening production modal
                queryClient.invalidateQueries(['raw-materials']);
                setShowProductionModal(true);
                reset();
              }
            }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-sm whitespace-nowrap flex items-center gap-2 w-full sm:w-auto"
          >
            <FaPlus />
            {activeTab === 'recipes' ? 'Add Recipe' : 'Start Recipe'}
          </button>
        </div>
      </div>

      {/* Tabs and View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'recipes'
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaCog className="inline mr-2" />
            Recipes
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'production'
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaUtensils className="inline mr-2" />
            Recipe History
          </button>
        </div>
        
        {/* View Mode Toggle - Only show for recipes tab */}
        {activeTab === 'recipes' && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaList className="inline mr-1" />
              Table
            </button>
            <button
              onClick={() => setViewMode('tiles')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'tiles'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaTh className="inline mr-1" />
              Tiles
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'recipes' ? (
        viewMode === 'tiles' ? (
          /* Tiles View */
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
            
            {/* Empty State for Tiles */}
            {(!data?.data?.items || data.data.items.length === 0) && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                <FaUtensils className="w-16 h-16 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No Recipes Found</h3>
                <p className="text-sm text-center">Create your first recipe to get started.</p>
              </div>
            )}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-100">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Recipe Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Ingredients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Actions
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
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(recipe);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                        >
                          <FaTrash className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Production History Table */
        <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-100">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Recipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Quantity Made
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Recipe Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Actions
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
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recipe Modal */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl h-[90vh] shadow-xl border border-gray-200 flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold mb-6 text-primary-800 border-b border-primary-100 pb-2">
                {selectedItem ? 'Edit Recipe' : 'Add New Recipe'}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-2">
              <form id="recipe-form" onSubmit={handleSubmit(onSubmitRecipe)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe Name
                </label>
                <input
                  {...register('name', { required: 'Recipe name is required' })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Product
                </label>
                <select
                  {...register('productId', { required: 'Product is required' })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Product</option>
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
                    Ingredients (per 1 unit of final product)
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Specify how much of each raw material is needed to make 1 unit of the final product. Set per unit costs in Products section for cost estimation.
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
                          <option value="">Select Raw Material</option>
                          {rawMaterialsData?.data?.items?.map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.perUnitPurchasePrice ? `(${formatPakistaniCurrency(material.perUnitPurchasePrice)}/${material.unit})` : '(No cost set)'}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount per unit"
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
                  className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <FaPlus className="w-4 h-4" />
                  Add New Ingredient
                </button>
                
                {/* Recipe Cost Summary */}
                {ingredients.some(ing => ing.rawMaterialId && ing.quantity) && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">Estimated Cost per Unit Produced:</h5>
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
                  Description
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
                Cancel
              </button>
              <button
                type="submit"
                form="recipe-form"
                disabled={createRecipe.isLoading || updateRecipe.isLoading}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(createRecipe.isLoading || updateRecipe.isLoading) && <LoadingSpinner size="w-4 h-4" />}
                {selectedItem ? 'Update' : 'Save'}
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
                Start Recipe
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-1 py-2">
              <form id="production-form" onSubmit={handleSubmit(onSubmitProduction)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe
                </label>
                <select
                  {...register('recipeId', { required: 'Recipe is required' })}
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
                  <option value="">Select Recipe</option>
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
                  Quantity to Make
                  {maxProduction > 0 && (
                    <span className="text-green-600 text-sm ml-2">
                      (Max: {maxProduction} units)
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
                      ⚠️ Production cannot be completed - insufficient raw materials
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
                        <span>Total Estimated Production Cost:</span>
                        <span>{formatPakistaniCurrency(productionCost)}</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Cost per unit produced: {formatPakistaniCurrency(productionCost / (parseFloat(watch('quantityProduced')) || 1))}
                      </div>
                    </div>
                  )}
                  {productionCost === 0 && (
                    <div className="mt-3 pt-2 border-t border-orange-200 bg-orange-50 rounded p-2">
                      <div className="text-orange-700 text-sm">
                        💡 To see production costs, set "Per Unit Cost" for raw materials in the Products section
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Production Date
                </label>
                <input
                  type="date"
                  {...register('productionDate')}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturing Cost (Optional)
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
                  Leave empty to use estimated cost: {productionCost > 0 ? formatPakistaniCurrency(productionCost) : 'Set per unit costs for raw materials'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
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
                Cancel
              </button>
              <button
                type="submit"
                form="production-form"
                disabled={createManufacturing.isLoading || maxProduction === 0}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded hover:from-primary-700 hover:to-primary-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createManufacturing.isLoading && <LoadingSpinner size="w-4 h-4" />}
                Start Production
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <DeleteModal
          isOpen={showDeleteModal}
          itemName={selectedItem.name || `${selectedItem.recipe?.name} production`}
          onConfirm={handleDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedItem(null);
            setDeleteError(null);
          }}
          error={deleteError}
        />
      )}

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-primary-100 text-primary-700 px-4 py-2 rounded hover:bg-primary-200 disabled:opacity-50 border border-primary-200"
        >
          Previous
        </button>
        <span className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-800">
          Page {page} of {data?.data?.totalPages || 1}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(data?.data?.totalPages || 1, p + 1))}
          disabled={page === (data?.data?.totalPages || 1)}
          className="bg-primary-100 text-primary-700 px-4 py-2 rounded hover:bg-primary-200 disabled:opacity-50 border border-primary-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Manufacturing;