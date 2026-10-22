import React, { createContext, useContext, useState, useEffect } from 'react';

export type UiMode = 'preview' | 'live';

export interface UiBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  website: string;
  phone: string;
  city: string;
  address: string;
  reviewTone: string;
  experienceChips: string[];
}

interface UiContextType {
  uiMode: UiMode;
  setUiMode: (mode: UiMode) => void;
  business: UiBusiness;
  updateBusinessName: (name: string) => void;
  updateBusiness: (updates: Partial<UiBusiness>) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  connectionCenterOpen: boolean;
  setConnectionCenterOpen: (open: boolean) => void;
}

const DEFAULT_BUSINESS: UiBusiness = {
  id: 'biz_001',
  name: 'Atharv Electricals',
  slug: 'atharv-electricals',
  category: 'Electrical Equipment & Contractor',
  website: 'https://atharvaelectricals.in',
  phone: '+91 98220 14820',
  city: 'Chakan, Pune',
  address: 'Talegaon-Chakan Rd, Opp. MIDC Phase II, Chakan, Pune, Maharashtra 410501',
  reviewTone: 'Professional',
  experienceChips: [
    'Genuine Products',
    'Prompt Site Support',
    'Transparent Pricing',
    'Industrial Grade Cables',
    'Licensed Electricians',
    'Fast Delivery'
  ]
};

const UiContext = createContext<UiContextType>({
  uiMode: 'preview',
  setUiMode: () => {},
  business: DEFAULT_BUSINESS,
  updateBusinessName: () => {},
  updateBusiness: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  connectionCenterOpen: false,
  setConnectionCenterOpen: () => {}
});

export const UiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiMode, setUiModeState] = useState<UiMode>(() => {
    return (localStorage.getItem('localos_ui_mode') as UiMode) || 'preview';
  });

  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem('localos_sidebar_collapsed') === 'true';
  });

  const [connectionCenterOpen, setConnectionCenterOpen] = useState(false);

  const [business, setBusiness] = useState<UiBusiness>(() => {
    const saved = localStorage.getItem('localos_business');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clear any old legacy sample business names if stored (jewel, wafg, apex, etc.)
        if (
          !parsed.name ||
          parsed.name.toLowerCase().includes('jewel') ||
          parsed.name.toLowerCase().includes('wafg') ||
          parsed.name.toLowerCase().includes('apex')
        ) {
          return DEFAULT_BUSINESS;
        }
        return { ...DEFAULT_BUSINESS, ...parsed };
      } catch (e) {
        return DEFAULT_BUSINESS;
      }
    }
    return DEFAULT_BUSINESS;
  });

  const setUiMode = (mode: UiMode) => {
    setUiModeState(mode);
    localStorage.setItem('localos_ui_mode', mode);
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem('localos_sidebar_collapsed', String(collapsed));
  };

  const updateBusinessName = (name: string) => {
    const updated = {
      ...business,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'atharv-electricals'
    };
    setBusiness(updated);
    localStorage.setItem('localos_business', JSON.stringify(updated));
  };

  const updateBusiness = (updates: Partial<UiBusiness>) => {
    const updated = { ...business, ...updates };
    setBusiness(updated);
    localStorage.setItem('localos_business', JSON.stringify(updated));
  };

  useEffect(() => {
    localStorage.setItem('localos_business', JSON.stringify(business));
  }, [business]);

  return (
    <UiContext.Provider
      value={{
        uiMode,
        setUiMode,
        business,
        updateBusinessName,
        updateBusiness,
        sidebarCollapsed,
        setSidebarCollapsed,
        connectionCenterOpen,
        setConnectionCenterOpen
      }}
    >
      {children}
    </UiContext.Provider>
  );
};

export const useUi = () => useContext(UiContext);

