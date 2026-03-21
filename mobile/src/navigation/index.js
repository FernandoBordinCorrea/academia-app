import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ExerciseListScreen from '../screens/exercises/ExerciseListScreen';
import ExerciseFormScreen from '../screens/exercises/ExerciseFormScreen';
import WorkoutListScreen from '../screens/workouts/WorkoutListScreen';
import WorkoutFormScreen from '../screens/workouts/WorkoutFormScreen';
import WorkoutDetailScreen from '../screens/workouts/WorkoutDetailScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E1E1E' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ExerciseList" component={ExerciseListScreen} options={{ title: 'Exercícios' }} />
      <Stack.Screen name="ExerciseForm" component={ExerciseFormScreen} options={{ title: '' }} />
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} options={{ title: 'Treinos' }} />
      <Stack.Screen name="WorkoutForm" component={WorkoutFormScreen} options={{ title: '' }} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#E8FF47" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
