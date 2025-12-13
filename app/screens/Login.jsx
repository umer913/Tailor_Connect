import { Ionicons } from '@expo/vector-icons'; //for importing logos,icons from react Expo icon library
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react'; //Runs function (effects) after render screen(useEffect).
import {
  Animated,
  Easing,
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
      Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 400, 
          useNativeDriver: true }),
    ]).start();
  }, []);//will run atleast 1 time after screen render

  const handleLogin = async () => {
  setError("");
  console.log("Login pressed ✅");

  if (!email || !password) {
    setError("All fields are required");
    return;
  }
  if (!email.includes("@")) {
    setError("Please enter a valid email address");
    return;
  }


  try {
    // sending a request to this server running on my Mac at port 3000
    const response = await axios.post("http://UF-MacBook-Pro.local:3000/Login", {
      email,
      password,
    });

    const data = response.data;
    console.log("Response:", data);

    // Role-based navigation
    if (data.user.role === "customer") {
      console.log("Navigating with email:", data.user.email);
  navigation.navigate("CustomerDrawer", { email: data.user.email });
} else if (data.user.role === "tailor") {
  navigation.navigate("TailorDrawer", { email: data.user.email });
    console.log("Navigating with email:", data.user.email);
} else if (data.user.role === "admin") {
  navigation.navigate("AdminDashboard", { email: data.user.email });
} else {
  setError("Unknown role.");
}

  } catch (err) {
   

    setError(err.response?.data?.error || "Network error: " + err.message);
  }
};

  return (
     <LinearGradient colors={['#a8edea', '#fed6e3']} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1 }}>
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

            <Text style={styles.title}>Welcome Back </Text>
            <Text style={styles.subtitle}>Log in to continue to TailorX</Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholderTextColor={'gray'}
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
                placeholderTextColor={'gray'}
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
    </LinearGradient>
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
    shadowRadius: 50,
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