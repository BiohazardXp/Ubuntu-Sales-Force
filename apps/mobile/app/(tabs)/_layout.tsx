import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarStyle:     { backgroundColor: Colors.bgDark, borderTopColor: Colors.bgDark2, height: 60 },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 10, marginBottom: 6 },
      }}>
      <Tabs.Screen name="home"   options={{ title: 'Home' }}/>
      <Tabs.Screen name="routes" options={{ title: 'Routes' }}/>
      <Tabs.Screen name="sales"  options={{ title: 'Sales' }}/>
    </Tabs>
  );
}
