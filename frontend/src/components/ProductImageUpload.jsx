import React, { useState, useEffect } from 'react';

const ProductImageUpload = ({ value, onChange, className = '' }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    console.log('ProductImageUpload - window.electronAPI:', window.electronAPI);
    console.log('ProductImageUpload - import.meta.env:', import.meta.env);
    
    const isElectronApp = window.electronAPI !== undefined;
    setIsElectron(isElectronApp);
    
    // Load existing image if value is provided
    if (value && window.electronAPI) {
      window.electronAPI.getProductImagePath(value).then(imagePath => {
        if (imagePath) {
          setImagePreview(`file://${imagePath}`);
        }
      });
    }
  }, [value]);

  const handleImageSelect = async () => {
    if (!window.electronAPI) {
      alert('Image upload is only available in desktop app');
      return;
    }

    try {
      const result = await window.electronAPI.selectProductImage();
      
      if (result.success && !result.canceled) {
        setImagePreview(`file://${result.path}`);
        onChange(result.filename);
      }
    } catch (error) {
      console.error('Failed to select image:', error);
      alert('Failed to select image');
    }
  };

  const handleRemoveImage = async () => {
    if (value && window.electronAPI) {
      try {
        await window.electronAPI.deleteProductImage(value);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
    
    setImagePreview(null);
    onChange(null);
  };

  if (!isElectron) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
            DESKTOP
          </span>
          <span>Image upload available in desktop app only</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Product Image
      </label>
      
      {imagePreview ? (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="Product"
            className="w-32 h-32 object-cover border border-gray-300 rounded-lg"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleImageSelect}
          className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
        >
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm text-gray-500">Add Image</span>
        </button>
      )}
    </div>
  );
};

export default ProductImageUpload;