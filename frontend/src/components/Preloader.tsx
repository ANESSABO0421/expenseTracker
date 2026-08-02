import React, { useEffect, useRef } from 'react';
import { Text, Animated, View, Easing } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface PreloaderProps {
  onFinish: () => void;
}

export default function Preloader({ onFinish }: PreloaderProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const strokeAnim = useRef(new Animated.Value(283)).current; // 2 * PI * r (r=45) = 282.74
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Stroke drawing animation (drawing the outer ring)
    Animated.timing(strokeAnim, {
      toValue: 70, // Leaves 70 of the stroke length drawn, animating from 283 (fully empty)
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // 3. Logo path scale & fade in
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // 4. Text fade in
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 1000,
      delay: 800,
      useNativeDriver: true,
    }).start();

    // 5. Egress fade out and proceed to app
    const timeout = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3500);

    return () => clearTimeout(timeout);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={{ opacity: containerOpacity, flex: 1 }}
      className="bg-[#0F0F13] items-center justify-center"
    >
      <View className="relative w-40 h-40 items-center justify-center">
        {/* Rotating Outer Progress Circle */}
        <AnimatedSvg 
          width="120" 
          height="120" 
          viewBox="0 0 100 100"
          style={{ transform: [{ rotate: spin }] }}
          className="absolute"
        >
          <Defs>
            <LinearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#6366F1" stopOpacity="1" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
            </LinearGradient>
          </Defs>
          {/* Background track */}
          <Circle 
            cx="50" 
            cy="50" 
            r="45" 
            stroke="#1A1A24" 
            strokeWidth="3" 
            fill="none" 
          />
          {/* Animated drawing circle */}
          <AnimatedCircle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#circleGrad)"
            strokeWidth="4"
            fill="none"
            strokeDasharray="283"
            strokeDashoffset={strokeAnim}
            strokeLinecap="round"
          />
        </AnimatedSvg>

        {/* Center Glowing Logo Icon */}
        <Animated.View 
          style={{ 
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }}
          className="w-20 h-20 items-center justify-center rounded-full bg-[#1A1A24] border border-[#6366F1]/20 shadow-2xl shadow-indigo-500/30"
        >
          <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <Defs>
              <LinearGradient id="dollarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#6366F1" />
                <Stop offset="100%" stopColor="#10B981" />
              </LinearGradient>
            </Defs>
            <Path 
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2.01 12 2ZM13.54 16.4C13.54 17.39 12.78 18.06 11.66 18.16V19.5H10.15V18.14C8.94 18.01 7.96 17.17 7.82 15.93H9.49C9.62 16.51 10.09 16.94 10.87 16.94C11.69 16.94 12.13 16.53 12.13 15.97C12.13 15.34 11.66 14.97 10.74 14.65C9.28 14.13 7.91 13.43 7.91 11.78C7.91 10.3 8.94 9.49 10.15 9.32V8H11.66V9.32C12.76 9.47 13.56 10.22 13.68 11.4H12.01C11.9 10.87 11.49 10.54 10.81 10.54C10.09 10.54 9.68 10.9 9.68 11.41C9.68 11.99 10.15 12.3 11.16 12.65C12.64 13.15 13.54 13.99 13.54 15.48V16.4Z" 
              fill="url(#dollarGrad)"
            />
          </Svg>
        </Animated.View>
      </View>

      {/* Premium Typography */}
      <Animated.View style={{ opacity: textOpacity }} className="mt-8 items-center">
        <Text className="text-white text-2xl font-bold tracking-[8px]">EXPENSE</Text>
        <Text className="text-[#10B981] text-sm font-semibold tracking-[6px] mt-2">TRACKER</Text>
      </Animated.View>
    </Animated.View>
  );
}
