import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { useForm } from 'react-hook-form';
import { debounce } from 'lodash';

export function useManufacturing() {
  const queryClient = useQueryClient();
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
        toast.success('Manufacturing created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create manufacturing');
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
        toast.success('Manufacturing updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update manufacturing');
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
        toast.success('Manufacturing deleted successfully!');
      },
      onError: (error) => {
        setDeleteError(error.response?.data?.error || 'Failed to delete manufacturing');
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
        toast.success('Manufacturing completed successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to complete manufacturing');
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
        toast.success('Manufacturing record deleted successfully!');
      },
      onError: (error) => {
        setDeleteError(error.response?.data?.error || 'Failed to delete manufacturing record');
      }
    }
  );

  const onSubmitRecipe = (data) => {
    const recipeData = {
      ...data,
      ingredients: ingredients
        .filter(ing => ing.rawMaterialId && ing.quantity)
        .map(ing => {
          let qty = parseFloat(ing.quantity);
          // Convert pieces to primary units if using piece mode
          if (ing.useInPieces) {
            const material = rawMaterialsData?.data?.items?.find(m => m.id === ing.rawMaterialId);
            if (material?.piecesPerUnit) {
              qty = qty / material.piecesPerUnit;
            }
          }
          return {
            rawMaterialId: ing.rawMaterialId,
            quantity: qty,
            unit: ing.unit
          };
        })
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
    setIngredients([...ingredients, { rawMaterialId: '', quantity: '', unit: 'pcs' }]);
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

  return {
    activeTab,
    setActiveTab,
    showRecipeModal,
    setShowRecipeModal,
    showProductionModal,
    setShowProductionModal,
    showDeleteModal,
    setShowDeleteModal,
    selectedItem,
    setSelectedItem,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    deleteError,
    setDeleteError,
    ingredients,
    setIngredients,
    selectedRecipe,
    setSelectedRecipe,
    maxProduction,
    setMaxProduction,
    productionCost,
    setProductionCost,
    viewMode,
    setViewMode,
    register,
    handleSubmit,
    reset,
    errors,
    watch,
    handleSearchChange,
    recipesData,
    manufacturingData,
    productsData,
    rawMaterialsData,
    convertToBaseUnit,
    getBaseUnit,
    calculateProductionMetrics,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    createManufacturing,
    deleteManufacturing,
    onSubmitRecipe,
    onSubmitProduction,
    handleEditRecipe,
    handleDelete,
    addIngredient,
    removeIngredient,
    updateIngredient,
    isLoading,
    data,
    queryClient
  };
}
