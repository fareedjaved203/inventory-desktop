import React, { useState, useEffect } from 'react';

const ProductImage = ({ filename, alt, className, onError }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isElectron] = useState(window.electronAPI !== undefined);

  useEffect(() => {
    const loadImage = async () => {
      if (!filename) {
        setImageSrc(null);
        return;
      }

      if (isElectron) {
        try {
          const imagePath = await window.electronAPI.getProductImagePath(filename);
          if (imagePath) {
            // Convert Windows path to file URL
            const fileUrl = `file:///${imagePath.replace(/\\/g, '/')}`;
            setImageSrc(fileUrl);
            console.log('Electron image loaded:', filename, fileUrl);
          } else {
            console.warn('Image not found in Electron:', filename);
            setImageSrc(null);
          }
        } catch (error) {
          console.error('Failed to get image path:', error);
          setImageSrc(null);
        }
      } else {
        const webImageSrc = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/images/${filename}`;
        setImageSrc(webImageSrc);
        console.log('Web image loaded:', filename, webImageSrc);
      }
    };

    loadImage();
  }, [filename, isElectron]);

  if (!imageSrc) {
    return null;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error('Image failed to load:', imageSrc);
        e.target.style.display = 'none';
        if (onError) onError(e);
      }}
      onLoad={() => {
        console.log('Image loaded successfully:', imageSrc);
      }}
    />
  );
};

export default ProductImage;