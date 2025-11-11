
import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Modal } from './Modal';

interface SettingsProps {
  onClose: () => void;
  onDeleteAll: () => void;
}

type SettingsTab = 'general' | 'account' | 'storage' | 'language' | 'about';

export const Settings: React.FC<SettingsProps> = ({ onClose, onDeleteAll }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const { t } = useLocalization();

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };
  
  const confirmDeleteAll = () => {
      onDeleteAll();
      setDeleteModalOpen(false);
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-8">
            <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-white">{t('generalTitle')}</h3>
                <p className="text-sm text-gray-400 mt-1">{t('generalDescription')}</p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">{t('generalFullName')}</label>
                        <input type="text" className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">{t('generalNickname')}</label>
                        <input type="text" className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                </div>
                 <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300">{t('generalPreferences')}</label>
                    <textarea rows={4} placeholder={t('generalPreferencesPlaceholder')} className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"></textarea>
                </div>
            </div>
          </div>
        );
      case 'account':
        return (
             <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-white">{t('accountTitle')}</h3>
                <p className="text-sm text-gray-400 mt-1">{t('accountDescription')}</p>
            </div>
        );
       case 'storage':
        return (
             <div className="p-6 bg-gray-800 border border-red-500/30 rounded-lg">
                <h3 className="text-lg font-semibold text-red-300">{t('storageTitle')}</h3>
                <p className="text-sm text-gray-400 mt-1">{t('storageDescription')}</p>
                <div className="mt-4">
                     <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
                    >
                      {t('deleteAllConversations')}
                    </button>
                </div>
            </div>
        );
        case 'language':
        return (
             <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-white">{t('languageTitle')}</h3>
                <p className="text-sm text-gray-400 mt-1">{t('languageDescription')}</p>
                 <div className="mt-4 max-w-xs">
                    <LanguageSwitcher />
                </div>
            </div>
        );
      case 'about':
        return (
             <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-white">{t('aboutTitle', { appName: t('appName') })}</h3>
                <p className="text-sm text-gray-400 mt-4">{t('aboutDescription')}</p>
                 <p className="text-xs text-gray-500 mt-4">{t('aboutVersion')}: 2.3.2</p>
                <div className="mt-6 pt-6 border-t border-gray-700/50">
                    <h4 className="text-sm font-medium text-gray-300">{t('createdBy')}</h4>
                    <p className="mt-1 text-white">Muhammad Arya Ramadhan</p>
                    
                    <h4 className="text-sm font-medium text-gray-300 mt-4">{t('contactTitle')}</h4>
                    <div className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-20 text-gray-400">{t('instagram')}</span>
                            <a href="https://www.instagram.com/yaseo.n" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                @yaseo.n
                            </a>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-20 text-gray-400">{t('emailSupport')}</span>
                            <a href="mailto:aisyrfbolt.support@gmail.com" className="text-blue-400 hover:underline">
                                aisyrfbolt.support@gmail.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
      default:
        return null;
    }
  };
  
  const NavItem: React.FC<{tab: SettingsTab; label: string}> = ({ tab, label }) => (
     <button 
        onClick={() => setActiveTab(tab)}
        className={`
            flex-shrink-0 text-sm font-medium transition-colors whitespace-nowrap
            px-4 py-3 border-b-2
            md:w-full md:text-left md:px-3 md:py-2 md:rounded-md md:border-b-0
            ${activeTab === tab
                ? 'border-blue-500 text-white md:bg-gray-700'
                : 'border-transparent text-gray-400 hover:text-white md:text-gray-300 md:hover:bg-gray-800'
            }
        `}
    >
        {label}
    </button>
  );

  return (
    <>
        <div className="flex-1 flex flex-col bg-gray-900">
          <header className="p-4 border-b border-gray-700/50 flex items-center justify-between flex-shrink-0">
             <h1 className="text-xl font-semibold text-white">{t('settingsTitle')}</h1>
             <button onClick={onClose} className="text-sm text-blue-400 hover:underline">
                {t('backToChat')}
             </button>
          </header>
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <aside className="flex-shrink-0 bg-gray-900 md:p-4 border-b md:border-r md:border-b-0 border-gray-700/50 md:w-56">
                <nav className="flex flex-row md:flex-col md:space-y-1 overflow-x-auto md:overflow-x-visible px-4 md:px-0 -mx-4 md:mx-0">
                    <NavItem tab="general" label={t('settingsGeneral')} />
                    <NavItem tab="account" label={t('settingsAccount')} />
                    <NavItem tab="storage" label={t('settingsStorage')} />
                    <NavItem tab="language" label={t('settingsLanguage')} />
                    <NavItem tab="about" label={t('settingsAbout')} />
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
                {renderContent()}
            </main>
          </div>
        </div>
        <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={confirmDeleteAll}
            title={t('deleteAllConversationsConfirm')}
            confirmText={t('deleteAllConversations')}
            isDestructive
        >
            <p>{t('storageDescription')}</p>
        </Modal>
    </>
  );
};
