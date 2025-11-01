import { Ionicons } from '@expo/vector-icons'; //for importing logos,icons from react Expo icon library
import React, { useEffect, useState } from 'react'; //Runs function (effects) after render screen(useEffect).useref is to set values of animations which remains throughout rendering
import {
  Animated, //react native library for animations
  Easing, //control the motion of animation
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [Error, setError] = useState('');

  //assigning values to animation objects(initial stage)
  const [logoScale] = useState(new Animated.Value(100));
  const [logoSlideAnim] = useState(new Animated.Value(200));
  const [buttonAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([//animation will run 1 by 1
      Animated.parallel([//whatever is in the box will run together
        Animated.timing(logoScale, {
          toValue: 1,//size of image will go from 100-orignal image of size(1)
          duration: 900,//will run 0.9 seconds
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(logoSlideAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
      //after running parrel block button-aniamtion will run
      Animated.timing(buttonAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);//will run atleast 1 time after screen render

   const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('All fields are required');
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (!data.user?.role) {
        setError("Role not found.");
        return;
      }

      if (data.user.role === "customer") {
        navigation.navigate("CustomerDashboard");
      } else if (data.user.role === "tailor") {
        navigation.navigate("TailorDashboard");
      } else if (data.user.role === "admin") {
        navigation.navigate("AdminDashboard");
      } else {
        setError("Unknown role.");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    }
  };




  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#cbe1f6ff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View
            style={[
              styles.card,
            ]}
          >

            <Animated.Image
              source={require('../../assets/images/tailor.jpeg')}
              style={[styles.logo, { transform: [{ scale: logoScale }, { translateY: logoSlideAnim }] }]}
            />

            <Text style={styles.title}>Welcome Back 👋</Text>
            <Text style={styles.subtitle}>Log in to continue to TailorX</Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={[styles.passwordInput]}
                placeholderTextColor="#888"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
              
            </View>

            <Animated.View style={{ width: '100%', opacity: buttonAnim, transform: [{ scale: buttonAnim }] }}>
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
 {Error ? (
        <Text style={{ color: "red", marginBottom: 10 }}>{Error}</Text>
      ) : null}
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.link}>
                Don’t have an account?</Text>
            </TouchableOpacity>
                 <TouchableOpacity onPress={() => navigation.navigate('Forgot')}>
              <Text style={styles.link}>
                Forgot your password? Reset..</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export default Login;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.7,
    shadowRadius: 30,
    alignItems: 'center',
    marginBottom:130,
  },
  logo: {
    width: 180,
    height: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 25,
  },
  input: {
    width: '100%',
    backgroundColor: '#F7F7F7',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#c7c7c7ff',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#c7c7c7ff',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  link: {
    marginTop: 18,
    fontWeight:'bold',
    fontSize: 15,
    color: '#555',
  },
});