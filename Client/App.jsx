import React, { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
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
    const requestPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const grants = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);

                console.log('write external stroage', grants);

                if (
                    grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                    grants['android.permission.READ_EXTERNAL_STORAGE'] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                    grants['android.permission.RECORD_AUDIO'] ===
                    PermissionsAndroid.RESULTS.GRANTED
                ) {
                    console.log('Permissions granted');
                } else {
                    console.log('All required permissions not granted');
                    return;
                }
            } catch (err) {
                console.warn(err);
                return;
            }
        }
    }

    requestPermission();
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