import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Star,
  Zap,
  CreditCard,
  Shield,
  Clock,
  Filter,
  Trash2
} from 'lucide-react';
import { fetchApi } from '../lib/api.ts';

interface NotificationItem {
  id: string;
  category: 'GOOGLE' | 'REVIEWS' | 'AUTOMATION' | 'BILLING' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  link?: string;
}

export const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'REVIEWS' | 'GOOGLE' | 'AUTOMATION' | 'BILLING'>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_1',
      category: 'GOOGLE',
      title: 'Google GBP API Integration Status',
      message: 'OAuth configuration verified. Live synchronization is awaiting Google verification approval.',
      read: false,
      timestamp: '10 minutes ago'
    },
    {
      id: 'notif_2',
      category: 'REVIEWS',
      title: 'New Customer Review via QR Flow',
      message: 'A 5-star customer review was generated and copied for Google submission.',
      read: false,
      timestamp: '1 hour ago'
    },
    {
      id: 'notif_3',
      category: 'AUTOMATION',
      title: 'Auto-Reply Safety Policy Triggered',
      message: 'Sensitive sentiment keyword detected; manual operator approval requested.',
      read: true,
      timestamp: 'Yesterday'
    },
    {
      id: 'notif_4',
      category: 'BILLING',
      title: 'Subscription Active',
      message: 'Your Growth tier plan is active. Quota renewed for the current cycle.',
      read: true,
      timestamp: '3 days ago'
    }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.read;
    if (activeTab === 'ALL') return true;
    return n.category === activeTab;
  });

  const getCategoryIcon = (cat: NotificationItem['category']) => {
    switch (cat) {
      case 'REVIEWS':
        return <Star className="w-4 h-4 text-amber-500" />;
      case 'AUTOMATION':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'BILLING':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'GOOGLE':
        return <Shield className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Notification Center</h1>
          </div>
          <p className="text-sm text-slate-500">
            Realtime alerts, review activity, automation events, and account notices.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <CheckCheck className="w-4 h-4 text-slate-500" /> Mark All as Read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-4">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'UNREAD', label: 'Unread' },
          { id: 'REVIEWS', label: 'Reviews' },
          { id: 'GOOGLE', label: 'Google GBP' },
          { id: 'AUTOMATION', label: 'Automations' },
          { id: 'BILLING', label: 'Billing' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 font-semibold text-xs border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No notifications found.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 flex items-start justify-between gap-4 transition ${
                item.read ? 'bg-white' : 'bg-blue-50/30'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-slate-100 rounded-lg shrink-0 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`text-sm font-semibold ${
                        item.read ? 'text-slate-800' : 'text-slate-900 font-bold'
                      }`}
                    >
                      {item.title}
                    </h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {item.message}
                  </p>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> {item.timestamp}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleRead(item.id)}
                  title={item.read ? 'Mark as unread' : 'Mark as read'}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteNotification(item.id)}
                  title="Delete notification"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
