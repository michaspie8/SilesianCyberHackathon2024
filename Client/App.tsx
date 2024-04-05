import React, { useEffect, useState } from 'react';

import { View, Text } from 'react-native';

import axios from 'axios';

const hostname = '192.168.56.1'
const port = '5000';
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

    <View>

      <Text>TOP DATA</Text>
      <Text>{data}</Text>
      <Text>BOTTOM DATA</Text>

    </View>

  );

};

export default App;