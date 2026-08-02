import React from 'react';
import { View, Text, Button } from 'react-native';

export default function AddTransactionScreen({ navigation }: any) {
  return (
    <View className="flex-1 bg-[#1A1A24] items-center justify-center">
      <Text className="text-white text-xl font-bold mb-4">Add Transaction Modal</Text>
      <Button title="Close" onPress={() => navigation.goBack()} />
    </View>
  );
}
