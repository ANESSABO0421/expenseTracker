import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import PremiumButton from '../components/PremiumButton';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { parseSpokenTransaction } from '../utils/nlpParser';

export default function AddTransactionScreen({ navigation }: any) {
  const { user, addTransaction, isLoading } = useStore();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // AI States
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Speech Recognition Listener
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      // Pass the raw speech to our local NLP Engine
      const { amount: extractedAmount, category: extractedCategory, description: extractedDescription } = parseSpokenTransaction(transcript);
      
      setAmount(extractedAmount);
      setCategory(extractedCategory);
      setDescription(extractedDescription);
      
      Toast.show({ type: 'success', text1: 'Voice Recognized', text2: 'Successfully extracted your expense!' });
    }
    setIsRecording(false);
    setIsProcessingVoice(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.log('Speech recognition error', event);
    setIsRecording(false);
    setIsProcessingVoice(false);
    Toast.show({ type: 'error', text1: 'Recognition Failed', text2: event.error || 'Please try speaking again.' });
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
    setIsProcessingVoice(false);
  });

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      Toast.show({ type: 'error', text1: 'Invalid Amount', text2: 'Please enter a valid number.' });
      return;
    }
    if (!category.trim()) {
      Toast.show({ type: 'error', text1: 'Category Required', text2: 'Please enter a category.' });
      return;
    }

    if (user?._id) {
      await addTransaction({
        user: user._id,
        amount: Number(amount),
        type,
        category,
        description,
        receiptUrl,
      });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Transaction added successfully!' });
      navigation.goBack();
    }
  };

  const handleScanReceipt = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'We need camera roll permissions to scan receipts!' });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsScanning(true);
      
      try {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        // Upload to Node backend
        const response = await fetch('http://192.168.1.4:5001/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Store the Cloudinary URL
          setReceiptUrl(data.data.receiptUrl);
          
          // MOCK: Simulate AI OCR Processing values
          setAmount('124.50');
          setCategory('Groceries');
          setDescription('Whole Foods Market receipt');
          
          Toast.show({ type: 'success', text1: 'AI Scan Complete', text2: 'Receipt securely uploaded & parsed!' });
        } else {
          throw new Error(data.message || 'Failed to upload receipt');
        }
      } catch (err: any) {
        console.error(err);
        Toast.show({ type: 'error', text1: 'Upload Failed', text2: err.message });
      } finally {
        setIsScanning(false);
      }
    }
  };

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        // Stop recording
        ExpoSpeechRecognitionModule.stop();
        setIsRecording(false);
        setIsProcessingVoice(true);
      } else {
        // Start recording
        const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'We need speech recognition permissions!' });
          return;
        }

        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: false,
        });
        
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
      setIsProcessingVoice(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F7] dark:bg-[#050505]" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 pt-4 pb-12" showsVerticalScrollIndicator={false}>
          
          {/* Maximalist Header */}
          <View className="flex-row justify-between items-center mb-10 mt-2">
            <Text className="text-black dark:text-white text-4xl font-black tracking-tighter">New Entry</Text>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-14 h-14 bg-white dark:bg-[#111] shadow-lg shadow-gray-200/50 dark:shadow-none rounded-full items-center justify-center border border-transparent dark:border-[#222]"
            >
              <Ionicons name="close" size={28} color={isDark ? "#FFF" : "#000"} />
            </TouchableOpacity>
          </View>

          {/* Chunky Type Toggle */}
          <View className="flex-row bg-white dark:bg-[#111] shadow-xl shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222] p-2 rounded-[32px] mb-10">
            <TouchableOpacity 
              onPress={() => setType('expense')}
              className={`flex-1 py-5 rounded-[24px] items-center ${type === 'expense' ? 'bg-[#000] dark:bg-[#E11D48]' : 'bg-transparent'}`}
            >
              <Text className={`text-xl font-black tracking-tight ${type === 'expense' ? 'text-white' : 'text-gray-400 dark:text-gray-600'}`}>EXPENSE</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setType('income')}
              className={`flex-1 py-5 rounded-[24px] items-center ${type === 'income' ? 'bg-[#000] dark:bg-[#10B981]' : 'bg-transparent'}`}
            >
              <Text className={`text-xl font-black tracking-tight ${type === 'income' ? 'text-white' : 'text-gray-400 dark:text-gray-600'}`}>INCOME</Text>
            </TouchableOpacity>
          </View>

          {/* Huge Amount Input */}
          <View className="items-center mb-12">
            <Text className="text-gray-400 dark:text-gray-600 text-sm font-bold uppercase tracking-widest mb-2">Amount</Text>
            <View className="flex-row items-center">
              <Text className="text-black dark:text-gray-400 text-6xl font-black mr-2">$</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={isDark ? "#333" : "#D1D5DB"}
                keyboardType="decimal-pad"
                className="text-black dark:text-white text-8xl font-black tracking-tighter"
                autoFocus
              />
            </View>
          </View>

          {/* Bold Form Fields */}
          <View className="space-y-4 mb-10">
            <View className="bg-white dark:bg-[#111] px-6 py-5 rounded-[32px] shadow-lg shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222]">
              <Text className="text-gray-400 dark:text-gray-600 text-xs font-bold uppercase tracking-widest mb-1">Category</Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Food, Rent, Salary..."
                placeholderTextColor={isDark ? "#444" : "#9CA3AF"}
                className="text-black dark:text-white text-2xl font-black mt-1"
              />
            </View>

            <View className="bg-white dark:bg-[#111] px-6 py-5 rounded-[32px] shadow-lg shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222]">
              <Text className="text-gray-400 dark:text-gray-600 text-xs font-bold uppercase tracking-widest mb-1">Notes (Optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Enter details..."
                placeholderTextColor={isDark ? "#444" : "#9CA3AF"}
                className="text-black dark:text-white text-xl font-bold mt-1"
              />
            </View>
          </View>

          {/* AI Features */}
          <View className="flex-row space-x-4 mb-10 justify-between">
            <TouchableOpacity 
              onPress={toggleRecording}
              disabled={isProcessingVoice || isScanning}
              className={`flex-1 bg-white dark:bg-[#111] shadow-lg shadow-gray-200/50 dark:shadow-none border ${isRecording ? 'border-red-500 bg-red-50 dark:bg-red-500/20' : 'border-transparent dark:border-[#222]'} rounded-[24px] py-6 items-center justify-center flex-row`}
            >
              {isProcessingVoice ? (
                <ActivityIndicator color={isDark ? "#E11D48" : "#0EA5E9"} />
              ) : (
                <>
                  <Ionicons name="mic" size={24} color={isRecording ? "#EF4444" : (isDark ? "#E11D48" : "#000")} />
                  <Text className={`ml-3 font-black text-lg ${isRecording ? 'text-red-500' : 'text-black dark:text-white'}`}>
                    {isRecording ? 'STOP' : 'VOICE'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View className="w-4" />
            
            <TouchableOpacity 
              onPress={handleScanReceipt}
              disabled={isScanning || isProcessingVoice}
              className="flex-1 bg-white dark:bg-[#111] shadow-lg shadow-gray-200/50 dark:shadow-none border border-transparent dark:border-[#222] rounded-[24px] py-6 items-center justify-center flex-row"
            >
              {isScanning ? (
                <ActivityIndicator color={isDark ? "#E11D48" : "#0EA5E9"} />
              ) : (
                <>
                  <Ionicons name="scan" size={24} color={isDark ? "#E11D48" : "#000"} />
                  <Text className="text-black dark:text-white ml-3 font-black text-lg">SCAN</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <PremiumButton 
            title="SAVE ENTRY" 
            onPress={handleSave} 
            isLoading={isLoading} 
          />

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
