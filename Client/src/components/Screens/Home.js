import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Button} from 'react-native';

import {
    NavigationParams,
    NavigationScreenProp,
    NavigationState
} from 'react-navigation';

const Home = ({navigation}) =>
    {
        return (
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.circle}>
                        <Text style={styles.icon}>!</Text>
                    </View>
                    <Text style={styles.heading}>ZGŁOŚ WYPADEK</Text>
                </View>
                <Button
                    title="Ustawiernia"
                    onPress={() =>
                        navigation.navigate('Settings')
                    }
                />
            </View>
        );
    };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingBottom: 20,
    },
    content: {
        alignItems: 'center',
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    icon: {
        fontSize: 40,
        color: '#ffffff',
    },
    heading: {
        fontSize: 24,
        color: '#000'
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        backgroundColor: '#333',
        borderTopWidth: 1,
        borderColor: '#cccccc',
        paddingBottom: 20,
    },
    bottomBarItem: {
        paddingVertical: 10,
        color: "#000",
    },
    bottomBarItemText: {
        fontSize: 16,
    },
});

export default Home;