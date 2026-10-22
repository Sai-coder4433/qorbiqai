import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context.tsx';
import { freshTestApi, BusinessData, SubscriptionData, CreditsOverview } from './fresh-test-api.ts';

export interface BusinessWithSub extends BusinessData {
  subscription?: SubscriptionData & { business?: any };
}

interface BusinessContextType {
  businesses: BusinessWithSub[];
  activeBusiness: BusinessWithSub | null;
  activeSubscription: (SubscriptionData & { business?: any }) | null;
  activeCredits: CreditsOverview | null;
  activeTopics: Array<{ id: string; title: string; description: string; sortOrder: number }>;
  loading: boolean;
  switching: boolean;
  selectBusiness: (businessId: string) => Promise<void>;
  refreshBusinesses: () => Promise<void>;
  refreshActiveBusiness: () => Promise<void>;
  clearBusinessState: () => void;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessWithSub[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<BusinessWithSub | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<(SubscriptionData & { business?: any }) | null>(null);
  const [activeCredits, setActiveCredits] = useState<CreditsOverview | null>(null);
  const [activeTopics, setActiveTopics] = useState<Array<{ id: string; title: string; description: string; sortOrder: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const clearBusinessState = useCallback(() => {
    setActiveBusiness(null);
    setActiveSubscription(null);
    setActiveCredits(null);
    setActiveTopics([]);
  }, []);

  const loadBusinessSpecificData = useCallback(async (businessId: string, subsList: Array<SubscriptionData & { business?: any }>) => {
    try {
      const [bizData, topicsData, creditsData] = await Promise.all([
        freshTestApi.getBusiness(businessId).catch(() => null),
        freshTestApi.getBusinessTopics(businessId).catch(() => ({ topics: [] })),
        freshTestApi.getCreditsOverview().catch(() => null)
      ]);

      if (bizData) {
        const sub = subsList.find(s => s.businessId === bizData.id || s.business?.id === bizData.id);
        const enriched: BusinessWithSub = { ...bizData, subscription: sub };
        setActiveBusiness(enriched);
        setActiveSubscription(sub || null);
      } else {
        setActiveBusiness(null);
        setActiveSubscription(null);
      }

      setActiveTopics(topicsData.topics || []);
      setActiveCredits(creditsData);
    } catch (err) {
      console.warn('[BusinessContext] Error loading business data:', err);
    }
  }, []);

  const refreshBusinesses = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      clearBusinessState();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [bizRes, subRes] = await Promise.all([
        freshTestApi.getBusinesses().catch(() => ({ businesses: [], activeBusinessId: '' })),
        freshTestApi.getSubscriptions().catch(() => ({ subscriptions: [] }))
      ]);

      const subs = subRes.subscriptions || [];
      const bizList = bizRes.businesses || [];

      // Link each business to its isolated subscription
      const merged: BusinessWithSub[] = bizList.map(b => {
        const sub = subs.find(s => s.businessId === b.id || s.business?.id === b.id);
        return { ...b, subscription: sub };
      });

      setBusinesses(merged);

      // Determine active business ID: UI preference in localStorage or first business
      let preferredId = '';
      try {
        preferredId = localStorage.getItem(`pref_biz_${user.uid}`) || '';
      } catch {}

      const activeCandidate = merged.find(b => b.id === preferredId) ||
        merged.find(b => b.id === bizRes.activeBusinessId) ||
        merged[0] ||
        null;

      if (activeCandidate) {
        await loadBusinessSpecificData(activeCandidate.id, subs);
      } else {
        clearBusinessState();
      }
    } catch (err) {
      console.error('[BusinessContext] Failed to load businesses:', err);
      setBusinesses([]);
      clearBusinessState();
    } finally {
      setLoading(false);
    }
  }, [user, clearBusinessState, loadBusinessSpecificData]);

  const selectBusiness = useCallback(async (businessId: string) => {
    if (switching) return;
    try {
      setSwitching(true);
      // STRICT REQUIREMENT: Clear old business-specific React state immediately
      clearBusinessState();

      // Remember UI selection convenience only (never provides authorization)
      if (user) {
        try {
          localStorage.setItem(`pref_biz_${user.uid}`, businessId);
        } catch {}
      }

      await freshTestApi.setActiveBusiness(businessId);
      await loadBusinessSpecificData(businessId, businesses.map(b => b.subscription).filter(Boolean) as any);
    } catch (err) {
      console.error('[BusinessContext] Switch failed:', err);
    } finally {
      setSwitching(false);
    }
  }, [switching, user, businesses, clearBusinessState, loadBusinessSpecificData]);

  const refreshActiveBusiness = useCallback(async () => {
    if (activeBusiness) {
      const subs = businesses.map(b => b.subscription).filter(Boolean) as any;
      await loadBusinessSpecificData(activeBusiness.id, subs);
    }
  }, [activeBusiness, businesses, loadBusinessSpecificData]);

  useEffect(() => {
    refreshBusinesses();
  }, [refreshBusinesses]);

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        activeSubscription,
        activeCredits,
        activeTopics,
        loading,
        switching,
        selectBusiness,
        refreshBusinesses,
        refreshActiveBusiness,
        clearBusinessState
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = (): BusinessContextType => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
