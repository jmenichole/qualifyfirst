'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { justTheTipIntegration } from '../lib/justthetip-integration';
import { useNotifications } from './Notifications';

interface PayoutSettings {
  discord_id?: string;
  wallet_address?: string;
  payout_preference: 'justthetip' | 'wallet' | 'both';
  minimum_payout: number;
  justthetip_balance: number;
}

interface PayoutPreferencesProps {
  userId: string;
}

export function PayoutPreferences({ userId }: PayoutPreferencesProps) {
  const [settings, setSettings] = useState<PayoutSettings>({
    payout_preference: 'justthetip',
    minimum_payout: 5.00,
    justthetip_balance: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discordLinking, setDiscordLinking] = useState('');
  const { addNotification } = useNotifications();

  const loadPayoutSettings = useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('discord_id, wallet_address, payout_preference, minimum_payout')
        .eq('user_id', userId)
        .single();

      if (profile) {
        setSettings({
          ...profile,
          payout_preference: profile.payout_preference || 'justthetip',
          minimum_payout: profile.minimum_payout || 5.00,
          justthetip_balance: 0
        });

        // Load JustTheTip balance if Discord linked
        if (profile.discord_id) {
          const balance = await justTheTipIntegration.getUserBalance(profile.discord_id);
          setSettings(prev => ({ ...prev, justthetip_balance: balance }));
        }
      }
    } catch (error) {
      console.error('Error loading payout settings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPayoutSettings();
  }, [loadPayoutSettings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          discord_id: settings.discord_id,
          wallet_address: settings.wallet_address,
          payout_preference: settings.payout_preference,
          minimum_payout: settings.minimum_payout
        })
        .eq('user_id', userId);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your payout preferences have been updated.'
      });

    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save payout settings.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscordLink = async () => {
    if (!discordLinking.trim()) return;

    setLoading(true);
    try {
      const success = await justTheTipIntegration.linkDiscordAccount(userId, discordLinking.trim());
      
      if (success) {
        setSettings(prev => ({ ...prev, discord_id: discordLinking.trim() }));
        setDiscordLinking('');
        
        addNotification({
          type: 'success',
          title: 'Discord Linked',
          message: 'Your Discord account has been successfully linked!'
        });

        // Refresh balance
        const balance = await justTheTipIntegration.getUserBalance(discordLinking.trim());
        setSettings(prev => ({ ...prev, justthetip_balance: balance }));
      } else {
        addNotification({
          type: 'error',
          title: 'Linking Failed',
          message: 'Failed to link Discord account. Please check the Discord ID.'
        });
      }
    } catch (error) {
      console.error('Discord linking error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while linking Discord account.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Payout Preferences</h2>

      {/* JustTheTip Integration */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">JTT</span>
          </div>
          <h3 className="text-lg font-semibold text-purple-900">JustTheTip Integration</h3>
        </div>
        
        {settings.discord_id ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Discord: {settings.discord_id}</span>
              <span className="text-sm font-medium text-purple-900">
                Balance: ${settings.justthetip_balance.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-purple-600">
              ✅ Connected - Earnings will be credited to your JustTheTip balance for Discord tipping
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-purple-700">
              Link your Discord account to receive earnings in your JustTheTip balance for instant tipping!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Your Discord ID (18-digit number)"
                value={discordLinking}
                onChange={(e) => setDiscordLinking(e.target.value)}
                className="flex-1 px-3 py-2 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button
                onClick={handleDiscordLink}
                disabled={!discordLinking.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50 text-sm"
              >
                Link
              </button>
            </div>
            <p className="text-xs text-purple-600">
              💡 Find your Discord ID: Settings → Advanced → Developer Mode → Right-click your name → Copy ID
            </p>
          </div>
        )}
      </div>

      {/* Payout Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Payout Method</label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="payout_preference"
              value="justthetip"
              checked={settings.payout_preference === 'justthetip'}
              onChange={(e) => setSettings({ ...settings, payout_preference: e.target.value as 'justthetip' | 'wallet' })}
              className="mr-3 text-indigo-600"
            />
            <div>
              <div className="font-medium">JustTheTip Balance (Recommended)</div>
              <div className="text-sm text-gray-600">
                Instant Discord tipping • No transaction fees • Immediate availability
              </div>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              name="payout_preference"
              value="wallet"
              checked={settings.payout_preference === 'wallet'}
              onChange={(e) => setSettings({ ...settings, payout_preference: e.target.value as 'justthetip' | 'wallet' })}
              className="mr-3 text-indigo-600"
            />
            <div>
              <div className="font-medium">Direct Wallet</div>
              <div className="text-sm text-gray-600">
                Direct crypto transfer • Network fees apply • 1-3 day processing
              </div>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              name="payout_preference"
              value="both"
              checked={settings.payout_preference === 'both'}
              onChange={(e) => setSettings({ ...settings, payout_preference: e.target.value as 'justthetip' | 'wallet' | 'both' })}
              className="mr-3 text-indigo-600"
            />
            <div>
              <div className="font-medium">Split Payouts</div>
              <div className="text-sm text-gray-600">
                Small amounts to JustTheTip • Large amounts to wallet • Best of both
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Wallet Address (if needed) */}
      {(settings.payout_preference === 'wallet' || settings.payout_preference === 'both') && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crypto Wallet Address
          </label>
          <input
            type="text"
            value={settings.wallet_address || ''}
            onChange={(e) => setSettings({ ...settings, wallet_address: e.target.value })}
            placeholder="Enter your cryptocurrency wallet address"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            We currently support Bitcoin, Ethereum, and Solana addresses
          </p>
        </div>
      )}

      {/* Minimum Payout */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Payout Amount
        </label>
        <select
          value={settings.minimum_payout}
          onChange={(e) => setSettings({ ...settings, minimum_payout: parseFloat(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value={1.00}>$1.00 (Instant to JustTheTip)</option>
          <option value={5.00}>$5.00</option>
          <option value={10.00}>$10.00</option>
          <option value={25.00}>$25.00</option>
          <option value={50.00}>$50.00</option>
        </select>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveSettings}
        disabled={saving}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Payout Preferences'}
      </button>

      {/* Benefits Info */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-900 mb-2">💡 JustTheTip Benefits</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Instant Discord tipping with your survey earnings</li>
          <li>• No transaction fees or gas costs</li>
          <li>• Seamless integration with your existing JustTheTip bot</li>
          <li>• Build your reputation in Discord communities</li>
          <li>• Convert to wallet whenever you want</li>
        </ul>
      </div>
    </div>
  );
}