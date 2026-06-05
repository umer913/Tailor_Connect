import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    SafeAreaView,
    StyleSheet,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const Start = ({ navigation }) => {
  const scrollY = useRef(new Animated.Value(0)).current;

  // Image animation (appears first)
  const imageFade = useRef(new Animated.Value(0)).current;
  const imageSlide = useRef(new Animated.Value(-30)).current;

  // Text animations (staggered after image)
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(40)).current;

  const subtitleFade = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(40)).current;

  const descFade = useRef(new Animated.Value(0)).current;
  const descSlide = useRef(new Animated.Value(40)).current;

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(40)).current;

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Step 1: Image fades in
    Animated.parallel([
      Animated.timing(imageFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(imageSlide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: Title slides in after image
      Animated.parallel([
        Animated.timing(titleFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Step 3: Subtitle with short delay
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(subtitleFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(subtitleSlide, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Step 4: Description with more delay
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(descFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(descSlide, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Step 5: Hero image last
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(heroFade, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(heroSlide, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Floating loop for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getSectionAnimStyle = (index) => {
    const sectionHeight = height * 0.7;
    const inputRange = [
      (index - 1) * sectionHeight,
      index * sectionHeight,
      (index + 1) * sectionHeight
    ];

    const translateY = scrollY.interpolate({
      inputRange,
      outputRange: [100, 0, -50],
      extrapolate: 'clamp',
    });

    const opacity = scrollY.interpolate({
      inputRange: [
        (index - 1) * sectionHeight,
        index * sectionHeight - 200,
        index * sectionHeight
      ],
      outputRange: [0, 1, 1],
      extrapolate: 'clamp',
    });

    return { transform: [{ translateY }], opacity };
  };
  // Auto-navigate to Login after 3 seconds
  const timer = setTimeout(() => {
    navigation.navigate('Login');
  }, 3000);

  return (
    <LinearGradient
      colors={['#0f0f13', '#1a0610', '#2a0a18']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: HERO & APP INTRO */}
          <View style={[styles.section, { paddingTop: 60 }]}>

            {/* Logo — appears first */}
            <Animated.View
              style={[
                styles.imageContainer,
                {
                  opacity: imageFade,
                  transform: [{ translateY: imageSlide }, { translateY: floatAnim }],
                },
              ]}
            >
              <Image
                source={require('../../assets/images/MyLogo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Title — animates in after logo */}
            <Animated.Text
              style={[
                styles.title,
                { opacity: titleFade, transform: [{ translateY: titleSlide }] },
              ]}
            >
              TailorX
            </Animated.Text>

            <View style={styles.separator} />

            {/* Subtitle */}
            <Animated.Text
              style={[
                styles.subtitle,
                { opacity: subtitleFade, transform: [{ translateY: subtitleSlide }] },
              ]}
            >
              The Art of Bespoke Tailoring
            </Animated.Text>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  section: {
    minHeight: height * 0.85,
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'center',
    marginBottom: 40,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(230, 176, 176, 0.2)',
  },
  logo: {
    width: '65%',
    height: '65%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#E6B0B0', // Rose gold
    letterSpacing: 2,
    textShadowColor: 'rgba(230, 176, 176, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  separator: {
    width: 60,
    height: 3,
    backgroundColor: '#9D2A4B',
    marginVertical: 16,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
  },
  heroImageContainer: {
    width: width - 48,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 15,
    shadowColor: '#E6B0B0',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(230, 176, 176, 0.3)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: '50%',
  },
  sectionHeader: {
    fontSize: 34,
    fontWeight: '800',
    color: '#E6B0B0',
    marginBottom: 10,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(230, 176, 176, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(230, 176, 176, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 10,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
  },
  ctaContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
    paddingVertical: 40,
    position: 'relative',
  },
  ctaBackgroundGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    transform: [{ scale: 1.5 }],
  },
  ctaText: {
    fontSize: 22,
    color: '#E6B0B0',
    fontWeight: '700',
    marginBottom: 25,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    shadowColor: '#D6406A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  buttonIcon: {
    marginLeft: 12,
  },
});

export default Start;
