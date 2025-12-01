import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import { MainTabParamList } from '../types';
import PatientsNavigator from './PatientsNavigator';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import { COLORS, TYPOGRAPHY } from '../constants';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.borderLight,
          backgroundColor: COLORS.surface,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.fontSize.xs,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bar-chart-2" size={22} color={color} />
          ),
          headerShown: true,
          headerTitle: 'Synka',
          headerStyle: {
            backgroundColor: COLORS.primary,
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTintColor: COLORS.surface,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: TYPOGRAPHY.fontSize.lg,
          },
        }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsNavigator}
        options={{
          tabBarLabel: 'Patients',
          tabBarIcon: ({ color, size }) => (
            <Icon name="users" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarLabel: 'Follow-ups',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" size={22} color={color} />
          ),
          headerShown: true,
          headerTitle: 'Follow-up Appointments',
          headerStyle: {
            backgroundColor: COLORS.primary,
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTintColor: COLORS.surface,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: TYPOGRAPHY.fontSize.lg,
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" size={22} color={color} />
          ),
          headerShown: true,
          headerTitle: 'Settings',
          headerStyle: {
            backgroundColor: COLORS.primary,
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTintColor: COLORS.surface,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: TYPOGRAPHY.fontSize.lg,
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
