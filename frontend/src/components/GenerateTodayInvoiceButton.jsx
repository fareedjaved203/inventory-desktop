import React, { useState, useEffect } from 'react';
import axios from 'axios';

function GenerateTodayInvoiceButton({ sales }) {
  const [shopSettings, setShopSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopSettings = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL}/api/shop-settings`;
        const response = await axios.get(apiUrl);
        // Handle null response from database
        setShopSettings(response.data || {});
      } catch (error) {
        // Set empty shop settings to allow PDF generation
        setShopSettings({});
      } finally {
        setLoading(false);
      }
    };

    fetchShopSettings();
  }, []);

  // Get today's date in Pakistan timezone
  const now = new Date();
  const pakistanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
  const today = pakistanTime.toISOString().split('T')[0];
  
  // Get all today's sales directly from API instead of relying on paginated data
  const [todaySales, setTodaySales] = useState([]);
  
  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        const [year, month, day] = today.split('-');
        const dateParam = `${day}/${month}/${year}`;
        const apiUrl = `${import.meta.env.VITE_API_URL}/api/sales?limit=1000&date=${encodeURIComponent(dateParam)}`;
        
        const response = await axios.get(apiUrl);
        setTodaySales(response.data.items || []);
      } catch (error) {
        console.error('Failed to fetch today\'s sales:', error);
        setTodaySales([]);
      }
    };
    
    if (!loading) {
      fetchTodaySales();
    }
  }, [today, loading, sales]);

  const handleGeneratePDF = async () => {
    
    if (!todaySales.length) {
      alert('No sales found for today!');
      return;
    }
    
    // Use default shop settings if empty or null
    const finalShopSettings = (!shopSettings || Object.keys(shopSettings).length === 0) ? {
      shopName: 'Daily Sales Report',
      shopDescription: '',
      shopDescription2: ''
    } : shopSettings;
    
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { default: SimpleDateInvoicePDF } = await import('./SimpleDateInvoicePDF');
      
      console.log('Creating PDF document...');
      const pdfDoc = <SimpleDateInvoicePDF date={today} sales={todaySales} shopSettings={finalShopSettings} />;
      const blob = await pdf(pdfDoc).toBlob();
      
      console.log('PDF blob created, size:', blob.size);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-sales-${today}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('PDF download initiated');
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <button
        className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed whitespace-nowrap flex items-center gap-2"
        disabled
      >
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={handleGeneratePDF}
      disabled={todaySales.length === 0}
      className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap flex items-center gap-2 ${
        todaySales.length === 0
          ? 'bg-gray-400 text-white cursor-not-allowed'
          : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-sm'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      {todaySales.length > 0 
        ? `Today's Invoice (${todaySales.length})` 
        : 'No Sales Today'
      }
    </button>
  );
}

export default GenerateTodayInvoiceButton;