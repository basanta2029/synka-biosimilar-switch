import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PatientStackParamList } from '../types';
import PatientListScreen from '../screens/patients/PatientListScreen';
import PatientFormScreen from '../screens/patients/PatientFormScreen';
import PatientDetailScreen from '../screens/patients/PatientDetailScreen';
import { SwitchWorkflowScreen } from '../screens/switches';
import { COLORS } from '../constants';

const Stack = createStackNavigator<PatientStackParamList>();

const PatientsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.surface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="PatientList"
        component={PatientListScreen}
        options={{ title: 'Patients' }}
      />
      <Stack.Screen
        name="PatientForm"
        component={PatientFormScreen}
        options={({ route }) =>
          ({
            title: route.params?.patientId ? 'Edit Patient' : 'New Patient',
          } as any)
        }
      />
      <Stack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: 'Patient Details' }}
      />
      <Stack.Screen
        name="SwitchWorkflow"
        component={SwitchWorkflowScreen}
        options={{ title: 'Biosimilar Switch' }}
      />
    </Stack.Navigator>
  );
};

export default PatientsNavigator;
