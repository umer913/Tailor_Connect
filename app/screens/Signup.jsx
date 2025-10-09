import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../supabaseClient';

const Signup = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!email.includes('@')) return 'Invalid email';
    if (name.trim() === '') return 'Name cannot be empty';
    if (password.length < 7) return 'Password must be at least 7 characters';
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return 'Password must contain 1 uppercase letter and 1 number';
    return null;
  };

  const handleSignup = async () => {
    const validationError = validateInputs();
    if (validationError) return setErrorMsg(validationError);

    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      setErrorMsg('No user returned from Supabase.');
      setLoading(false);
      return;
    }

    const verified = role === 'customer' ? true : false;

    const { error: insertError } = await supabase.from('users').insert([
      { auth_id: user.id, full_name: name, email, role, verified },
    ]);

    if (insertError) {
      setErrorMsg(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    Alert.alert('Signup Successful', 'You can now log in.');
    navigation.navigate('Login');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Signup
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 }}
      />

      <Picker
        selectedValue={role}
        onValueChange={setRole}
        style={{ borderWidth: 1, borderRadius: 8, marginBottom: 10 }}
      >
        <Picker.Item label="Customer" value="customer" />
        <Picker.Item label="Tailor" value="tailor" />
        {/* admin not shown in picker */}
      </Picker>

      {errorMsg ? (
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{errorMsg}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSignup}
        activeOpacity={0.8}
        style={{
          backgroundColor: loading ? '#999' : '#007BFF',
          padding: 14,
          borderRadius: 8,
          alignItems: 'center',
        }}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Signup</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 15 }}>
        <Text style={{ textAlign: 'center', color: '#007bff' }}>
          Already have an account? <Text style={{ fontWeight: 'bold' }}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Signup;
