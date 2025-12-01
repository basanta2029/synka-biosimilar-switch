import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../../store';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'compact' }) => {
  const { i18n } = useTranslation();
  const { setLanguage, isLoading } = useLanguageStore();
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (language: 'en' | 'es') => {
    if (currentLanguage !== language && !isLoading) {
      await setLanguage(language);
    }
  };

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={[
            styles.compactButton,
            currentLanguage === 'en' && styles.compactButtonActive,
          ]}
          onPress={() => handleLanguageChange('en')}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.compactText,
              currentLanguage === 'en' && styles.compactTextActive,
            ]}
          >
            EN
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.compactButton,
            currentLanguage === 'es' && styles.compactButtonActive,
          ]}
          onPress={() => handleLanguageChange('es')}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.compactText,
              currentLanguage === 'es' && styles.compactTextActive,
            ]}
          >
            ES
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Full variant - similar to patient form language buttons
  return (
    <View style={styles.fullContainer}>
      <TouchableOpacity
        style={[
          styles.fullButton,
          currentLanguage === 'en' && styles.fullButtonActive,
        ]}
        onPress={() => handleLanguageChange('en')}
        disabled={isLoading}
      >
        <Text
          style={[
            styles.fullButtonText,
            currentLanguage === 'en' && styles.fullButtonTextActive,
          ]}
        >
          🇺🇸 English
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.fullButton,
          currentLanguage === 'es' && styles.fullButtonActive,
        ]}
        onPress={() => handleLanguageChange('es')}
        disabled={isLoading}
      >
        <Text
          style={[
            styles.fullButtonText,
            currentLanguage === 'es' && styles.fullButtonTextActive,
          ]}
        >
          🇲🇽 Español
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Compact variant styles (for header/navigation)
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 36,
    alignItems: 'center',
  },
  compactButtonActive: {
    backgroundColor: COLORS.primary,
  },
  compactText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  compactTextActive: {
    color: COLORS.surface,
  },

  // Full variant styles (for settings/profile)
  fullContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  fullButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  fullButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  fullButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
  },
  fullButtonTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
});

export default LanguageSwitcher;
