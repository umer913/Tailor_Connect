import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  StyleSheet,
  Text,
} from 'react-native';

const Start = ({ navigation }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) translateY.setValue(g.dy / 2);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -100) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -600, // smaller move (faster)
              duration: 400, // shorter animation
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 350,
              useNativeDriver: true,
            }),
          ]).start(() => navigation.navigate('Login'));
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <LinearGradient
      colors={['#000000ff', '#31a9d0']}
      style={styles.container}
      {...panResponder.panHandlers}
    >
      <Animated.View style={[styles.content, { transform: [{ translateY }], opacity }]}>
        <Image source={require('../../assets/images/Tailor.png')} style={styles.image} />
        <Text style={styles.text}>Swipe up to start</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: {
    width: 300,
    height: 400,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  text: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowRadius: 8,
    marginTop: 250,
  },
});

export default Start;
