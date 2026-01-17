import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    // Return default values if used outside provider
    return { 
      favorites: [], 
      addFavorite: () => {}, 
      removeFavorite: () => {}, 
      isFavorite: () => false, 
      toggleFavorite: () => {} 
    };
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (item) => {
    if (!isFavorite(item.id)) {
      setFavorites(prev => [...prev, item]);
      return true;
    }
    return false;
  };

  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id));
  };

  const isFavorite = (id) => {
    return favorites.some(fav => fav.id === id);
  };

  const toggleFavorite = (item) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
      return false;
    } else {
      addFavorite(item);
      return true;
    }
  };

  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      addFavorite, 
      removeFavorite, 
      isFavorite, 
      toggleFavorite 
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

