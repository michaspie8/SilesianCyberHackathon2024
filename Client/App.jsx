import React, { useEffect, useState } from 'react';
import Home from './src/components/Screens/Home.js';
import SettingsScreen from './src/components/Screens/Settings.js/';

import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import { View, Text} from 'react-native';

import axios from 'axios';

const hostname = '192.168.56.1'
const port = '5000';

const Stack = createNativeStackNavigator();

const App = () => {

  const [data, setData] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`http://${hostname}:${port}/api/data`);
      setData(response.data.message);
    } catch (error) {

      console.log(error);

    }
  };

  return (

    <NavigationContainer>
        <Stack.Navigator>

        <Stack.Screen
          name="Home"
          component={Home}
        />
        
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>

  );

};

export default App;