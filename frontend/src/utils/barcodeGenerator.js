// User-specific barcode generator utility
export const generateUserBarcode = async () => {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');
    
    // Get the next barcode number from the backend
    const response = await fetch('/api/products/next-barcode', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.barcode;
  } catch (error) {
    console.error('Error generating barcode:', error);
    // Fallback to random number if API fails
    const randomNum = Math.floor(Math.random() * 99999) + 1;
    return `H${randomNum.toString().padStart(5, '0')}`;
  }
};

export const validateBarcode = (barcode) => {
  // Validate H + 5 digits format
  return /^H\d{5}$/.test(barcode);
};