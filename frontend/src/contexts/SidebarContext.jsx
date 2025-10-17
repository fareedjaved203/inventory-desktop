import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [hiddenItems, setHiddenItems] = useState(() => {
    const saved = localStorage.getItem('hiddenSidebarItems');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('hiddenSidebarItems', JSON.stringify(hiddenItems));
  }, [hiddenItems]);

  const toggleItemVisibility = (permission) => {
    setHiddenItems(prev => 
      prev.includes(permission) 
        ? prev.filter(item => item !== permission)
        : [...prev, permission]
    );
  };

  const isItemHidden = (permission) => {
    return hiddenItems.includes(permission);
  };

  return (
    <SidebarContext.Provider value={{
      hiddenItems,
      toggleItemVisibility,
      isItemHidden
    }}>
      {children}
    </SidebarContext.Provider>
  );
};