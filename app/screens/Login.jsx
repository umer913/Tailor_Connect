import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email.includes('@')) return setErrorMsg('Please enter a valid email.');
    if (!password.trim()) return setErrorMsg('Password cannot be empty.');

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      setErrorMsg('User not found.');
      setLoading(false);
      return;
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError) {
      setErrorMsg(profileError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    Alert.alert('Login Successful', `Welcome ${userProfile.full_name}!`);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
        Login
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 10 }}
      />

      {errorMsg ? (
        <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>{errorMsg}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleLogin}
        style={{
          backgroundColor: '#007bff',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={{ marginTop: 15 }}>
        <Text style={{ textAlign: 'center', color: '#007bff' }}>
          Don’t have an account? <Text style={{ fontWeight: 'bold' }}>Signup</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;
