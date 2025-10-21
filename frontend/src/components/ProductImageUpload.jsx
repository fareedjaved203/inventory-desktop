import React, { useState, useEffect } from 'react';

const ProductImageUpload = ({ value, onChange, className = '' }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const isElectronApp = window.electronAPI !== undefined;
    setIsElectron(isElectronApp);
    
    // Load existing image if value is provided
    if (value) {
      if (window.electronAPI) {
        // For Electron, get local file path
        window.electronAPI.getProductImagePath(value).then(imagePath => {
          if (imagePath) {
            setImagePreview(`file://${imagePath}`);
          }
        }).catch(error => {
          console.error('Failed to get image path:', error);
        });
      } else {
        // For web version, use API endpoint
        setImagePreview(`/api/images/${value}`);
      }
    } else {
      setImagePreview(null);
    }
  }, [value]);

  const handleImageSelect = async () => {
    if (window.electronAPI) {
      // Electron version - use native file dialog
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
    } else {
      // Web version - use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreview(e.target.result);
            onChange(`web_${Date.now()}_${file.name}`);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
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

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
        Product Image
        {isElectron ? (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            DESKTOP
          </span>
        ) : (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
            WEB
          </span>
        )}
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