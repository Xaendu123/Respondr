/**
 * BRAND PROVIDER
 * 
 * Provides brand configuration to the entire application.
 * Allows white-labeling by changing brand config without touching components.
 */

import React, { createContext, useContext } from 'react';
import { BrandConfig, BrandConfigValue, defaultBrandConfig } from '../config/brand';

interface BrandContextValue {
  brand: BrandConfigValue;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

export function BrandProvider({ 
  children,
  brandConfig = defaultBrandConfig 
}: { 
  children: React.ReactNode;
  brandConfig?: BrandConfig;
}) {
  const value: BrandContextValue = {
    brand: brandConfig,
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}

/**
 * Hook to access brand configuration
 * Must be used within BrandProvider
 */
export function useBrand(): BrandConfigValue {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within BrandProvider');
  }
  return context.brand;
}

