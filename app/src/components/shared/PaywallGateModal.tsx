import React, { useState, useEffect } from 'react';
import { X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { licenseManager, type LicenseInfo, type StoreConfig } from '../../services/licenseManager';
import { TelegramPremiumView } from './TelegramPremiumView';

export type PaywallTriggerFeature = 'folders' | 'autobackup' | 'speed' | 'ads' | 'encryption' | 'general';

export interface TelegramAccountCheckoutInfo {
  userId?: string | number | null;
  phoneNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}

interface PaywallGateModalProps {
  isOpen: boolean;
  onActivated: (license: LicenseInfo) => void;
  onClose?: () => void;
  onLogout?: () => void;
  isCompulsory?: boolean;
  telegramAccount?: TelegramAccountCheckoutInfo | null;
  expiredReason?: string | null;
  triggerFeature?: PaywallTriggerFeature;
}

export const PaywallGateModal: React.FC<PaywallGateModalProps> = ({
  isOpen,
  onActivated,
  onClose,
  onLogout,
  isCompulsory = false,
  telegramAccount,
}) => {
  const [currentLicense, setCurrentLicense] = useState<LicenseInfo | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    void licenseManager.loadLicense().then(setCurrentLicense);
    void licenseManager.getStoreConfig().then(setStoreConfig);
  }, [isOpen]);

  const handleLicenseActivated = (lic: LicenseInfo | null) => {
    if (lic && lic.isLicensed) {
      setCurrentLicense(lic);
      onActivated(lic);
      onClose?.();
    }
  };

  const handleSyncLicense = async () => {
    setSyncing(true);
    try {
      if (telegramAccount?.userId) {
        const res = await licenseManager.checkTelegramAccount(telegramAccount.userId, telegramAccount.phoneNumber);
        if (res.isLicensed && res.license) {
          handleLicenseActivated(res.license);
          return;
        }
      }
      const verified = await licenseManager.verifyLicense();
      const updated = await licenseManager.loadLicense();
      if (verified && updated.isLicensed) {
        handleLicenseActivated(updated);
      }
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden"
        onClick={!isCompulsory ? onClose : undefined}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative w-full max-w-xl max-h-[94vh] flex flex-col rounded-3xl border border-purple-500/30 bg-[#0B0C10] shadow-[0_0_60px_rgba(168,85,247,0.25)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Close Button */}
          {!isCompulsory && onClose && (
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Scrollable Telegram Premium View Body */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 pt-3 pb-6 custom-scrollbar">
            <TelegramPremiumView
              onBack={onClose}
              mobileLicense={currentLicense}
              setMobileLicense={handleLicenseActivated}
              liveStoreConfig={storeConfig}
              userProfile={telegramAccount ? {
                id: telegramAccount.userId ?? undefined,
                firstName: telegramAccount.firstName ?? undefined,
                lastName: telegramAccount.lastName ?? undefined,
                phone: telegramAccount.phoneNumber ?? undefined,
                username: telegramAccount.username ?? undefined,
              } : undefined}
              onSyncLicense={handleSyncLicense}
              isLicenseSyncing={syncing}
            />

            {onLogout && (
              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs text-gray-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Switch Account / Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
