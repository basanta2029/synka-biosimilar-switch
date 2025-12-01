import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store';
import { Button, Input, LanguageSwitcher } from '../../components/common';
import { registerSchema } from '../../utils/validation';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      clearError();
      console.log('Attempting registration with:', {
        name: values.name,
        email: values.email,
        role: 'STAFF'
      });

      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'STAFF', // Default role
      });

      console.log('Registration successful!');
      // Navigation handled automatically by RootNavigator
    } catch (err: any) {
      // Get detailed error message
      console.log('Registration failed - Full error object:', JSON.stringify(err, null, 2));
      console.log('Error response:', err?.response);
      console.log('Error response data:', err?.response?.data);
      console.log('Error message:', err?.message);

      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        error ||
        t('auth.registerError');

      console.log('Final error message to show:', errorMessage);

      Alert.alert(
        t('auth.registerError'),
        errorMessage,
        [{ text: t('common.ok') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.languageSwitcherContainer}>
          <LanguageSwitcher variant="compact" />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.register')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.welcomeSubtitle')}
          </Text>
        </View>

        <Formik
          initialValues={{
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={registerSchema}
          onSubmit={handleRegister}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <Input
                label={t('auth.name')}
                placeholder={t('auth.namePlaceholder')}
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && errors.name ? errors.name : undefined}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isLoading}
              />

              <Input
                label={t('auth.email')}
                placeholder={t('auth.emailPlaceholder')}
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && errors.email ? errors.email : undefined}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />

              <Input
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={
                  touched.password && errors.password ? errors.password : undefined
                }
                secureTextEntry={true}
                showPasswordToggle={true}
                autoCapitalize="none"
                editable={!isLoading}
              />

              <Input
                label={t('auth.confirmPassword')}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={
                  touched.confirmPassword && errors.confirmPassword
                    ? errors.confirmPassword
                    : undefined
                }
                secureTextEntry={true}
                showPasswordToggle={true}
                autoCapitalize="none"
                editable={!isLoading}
              />

              <Button
                title={t('auth.registerButton')}
                onPress={handleSubmit as any}
                loading={isLoading}
                disabled={isLoading}
                style={styles.registerButton}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>{t('auth.haveAccount')} </Text>
                <Button
                  title={t('auth.loginButton')}
                  onPress={() => navigation.navigate('Login')}
                  variant="outline"
                  disabled={isLoading}
                />
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  languageSwitcherContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  registerButton: {
    marginTop: SPACING.md,
  },
  loginContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  loginText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
});

export default RegisterScreen;
