import { create } from 'zustand';
import i18n from '../config/i18n';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';

type Language = 'en' | 'es';

interface LanguageState {
  currentLanguage: Language;
  isLoading: boolean;

  // Actions
  setLanguage: (language: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLanguage: 'en',
  isLoading: false,

  setLanguage: async (language: Language) => {
    try {
      set({ isLoading: true });

      // Change i18n language
      await i18n.changeLanguage(language);

      // Persist to storage
      await storage.setItem(STORAGE_KEYS.LANGUAGE, language);

      set({ currentLanguage: language, isLoading: false });
    } catch (error) {
      console.error('Error setting language:', error);
      set({ isLoading: false });
    }
  },

  loadLanguage: async () => {
    try {
      set({ isLoading: true });

      // Load from storage
      const savedLanguage = await storage.getItem<Language>(STORAGE_KEYS.LANGUAGE);

      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
        await i18n.changeLanguage(savedLanguage);
        set({ currentLanguage: savedLanguage });
      } else {
        // Default to English
        await i18n.changeLanguage('en');
        set({ currentLanguage: 'en' });
      }

      set({ isLoading: false });
    } catch (error) {
      console.error('Error loading language:', error);
      set({ currentLanguage: 'en', isLoading: false });
    }
  },
}));
