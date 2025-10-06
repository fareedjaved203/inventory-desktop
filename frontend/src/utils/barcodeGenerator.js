import DataStorageManager from './DataStorageManager';

// User-specific barcode generator utility
export const generateUserBarcode = async () => {
  try {
    const data = await DataStorageManager.getNextBarcode();
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