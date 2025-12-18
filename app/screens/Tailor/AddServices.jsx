import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const serviceOptions = [
  "2 Piece Suits","3 Piece Suits","Sherwani","Shalwar Kameez",
  "Blazers","Dress Pants","Kurta","Waistcoats","Pyjama","Shalwar","Shirts",
  "Pico","Overlock","Button Hole"
];


export default function AddServices({ route }) {
  const { email } = route.params;

  const [services, setServices] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newService, setNewService] = useState({
    service_types: [],
    gender: 'both',
    description: '',
    price_range: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const toggleServiceType = (type) => {
    const types = [...newService.service_types];
    if (types.includes(type)) {
      setNewService({ ...newService, service_types: types.filter(t => t !== type) });
    } else {
      setNewService({ ...newService, service_types: [...types, type] });
    }
  };

  const addService = async () => {
    if (newService.service_types.length === 0) {
      Alert.alert('Error', 'Please select at least one service type');
      return;
    }

    try {
      await axios.post('http://UF-MacBook-Pro.local:3000/add-services', {
        email,
        services: [newService]
      });

      Alert.alert('Success', 'Service added!');
      setNewService({ service_types: [], gender: 'both', description: '', price_range: '' });
      fetchServices();
      setShowAddForm(false);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to add service');
    }
  };

  const fetchServices = async () => {
    try {
      const res = await axios.get('http://UF-MacBook-Pro.local:3000/get-services', {
        params: { email }
      });
      setServices(res.data.services || []);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to fetch services');
    }
  };

  const updateService = async (service) => {
    try {
      await axios.put("http://UF-MacBook-Pro.local:3000/update-service", {
        email,
        id: service.id,
        service_types: service.service_types,
        gender: service.gender,
        description: service.description,
        price_range: service.price_range
      });
      Alert.alert("Success", "Service updated!");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to update service");
    }
  };

  const deleteService = async (id) => {
    try {
      await axios.delete(`http://UF-MacBook-Pro.local:3000/delete-service/${id}`);
      Alert.alert("Success", "Service Deleted!");
      fetchServices();
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to delete service');
    }
  };

  return (
    <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---------- Switch Button ---------- */}
        <View style={styles.switchContainer}>
          <Pressable
            android_ripple={{ color: '#7b52ff44' }}
            style={({ pressed }) => [
              styles.switchBtn,
              !showAddForm && styles.switchActive,
              pressed && styles.pressedBtn,
            ]}
            onPress={() => setShowAddForm(false)}
          >
            <Image
              source={require('../../../assets/images/MyService.png')}
              style={styles.switchImg}
              resizeMode="contain"
            />
            <Text style={[styles.switchText, !showAddForm && styles.switchTextActive]}>
              My Services
            </Text>
          </Pressable>

          <Pressable
            android_ripple={{ color: '#7b52ff44' }}
            style={({ pressed }) => [
              styles.switchBtn,
              showAddForm && styles.switchActive,
              pressed && styles.pressedBtn,
            ]}
            onPress={() => setShowAddForm(true)}
          >
            <Image
              source={require('../../../assets/images/AddServicE.png')}
              style={styles.switchImg}
              resizeMode="contain"
            />
            <Text style={[styles.switchText, showAddForm && styles.switchTextActive]}>
              Add Service
            </Text>
          </Pressable>
        </View>

        {/* ---------- Content ---------- */}
        {showAddForm ? (
          <>
            <Text style={styles.title}>Add New Service</Text>

            <Text style={styles.label}>Service Types</Text>
            <View style={styles.optionsContainer}>
              {serviceOptions.map(opt => {
                const selected = newService.service_types.includes(opt);
                const alreadyAdded = services.some(s => s.service_types.includes(opt));
                return (
                  <TouchableOpacity
                    key={opt}
                    activeOpacity={0.8}
                    style={[
                      styles.optionBtn,
                      selected && styles.optionSelected,
                      alreadyAdded && styles.disabledOption
                    ]}
                    onPress={() => !alreadyAdded && toggleServiceType(opt)}
                  >
                    <Text style={[
                      selected ? styles.optionTextSelected : styles.optionText,
                      alreadyAdded && { color: '#999' }
                    ]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Gender</Text>
            <View style={styles.optionsContainerRow}>
              {['men', 'women', 'both'].map(g => (
                <TouchableOpacity
                  key={g}
                  activeOpacity={0.8}
                  style={[
                    styles.optionBtnGender,
                    newService.gender === g && styles.optionSelectedGender
                  ]}
                  onPress={() => setNewService({ ...newService, gender: g })}
                >
                  <Text style={newService.gender === g ? styles.optionTextSelectedGender : styles.optionTextGender}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Describe this service"
              placeholderTextColor="#ccc"
              multiline
              numberOfLines={3}
              value={newService.description}
              onChangeText={(text) => setNewService({ ...newService, description: text })}
            />

            <Text style={styles.label}>Price Range</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5000-10000 PKR"
              placeholderTextColor="#ccc"
              value={newService.price_range}
              onChangeText={(text) => setNewService({ ...newService, price_range: text })}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.addBtn} activeOpacity={0.9} onPress={addService}>
              <Text style={styles.btnText}>Add Service</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>My Services</Text>

            {services.length > 0 ? services.map(s => (
              <View key={s.id} style={styles.card}>
                <Text style={styles.cardTitle}>{s.service_types.join(", ")}</Text>

                <View style={styles.row}>
                  <Text style={styles.label}>Gender:</Text>
                  <Text style={styles.value}>{s.gender.charAt(0).toUpperCase() + s.gender.slice(1)}</Text>
                </View>

                <Text style={styles.label}>Description:</Text>
                <TextInput
                  style={styles.input}
                  multiline
                  value={s.description}
                  onChangeText={(text) => {
                    s.description = text;
                    setServices([...services]);
                  }}
                />

                <Text style={styles.label}>Price Range:</Text>
                <TextInput
                  style={styles.input}
                  value={s.price_range}
                  onChangeText={(text) => {
                    s.price_range = text;
                    setServices([...services]);
                  }}
                  keyboardType="numeric"
                />

                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.9} onPress={() => updateService(s)}>
                  <Text style={styles.btnText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.9} onPress={() => deleteService(s.id)}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )) : (
              <Text style={styles.noServiceText}>
                No services added yet.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  // Switch Button Styles
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#192f6a',
    borderRadius: 20,
    marginBottom: 30,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#36006f',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  switchActive: {
    backgroundColor: '#8e24aa',
  },
  switchText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#b293d3',
    marginTop: 8,
  },
  switchTextActive: {
    color: '#fff',
  },
  switchImg: {
    width: 110,
    height: 110,
  },
  pressedBtn: {
    opacity: 0.75,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#e0d7f7',
    marginBottom: 20,
    alignSelf: 'center',
    textShadowColor: '#4a148c88',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },

  card: {
    backgroundColor: '#192f6a',
    padding: 22,
    borderRadius: 25,
    marginBottom: 28,
    shadowColor: '#311b92',
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#e1dfe4ff',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#efefefff',
    marginBottom: 8,
  },

  value: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
    marginBottom:8,
    fontWeight: '500',
  },

  input: {
    borderWidth: 0,
    backgroundColor: '#4c669f',
    paddingVertical:16,
    paddingHorizontal: 18,
    borderRadius: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
    textAlignVertical: 'top',
    shadowColor: '#4c669f',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },

  deleteBtn: {
    backgroundColor: '#e53935',
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: '#b71c1c',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 7,
  },

  addBtn: {
    backgroundColor: 'linear-gradient(45deg, #8e24aa, #5e35b1)', // fallback, replaced below
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#311b92',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 9,
    marginTop: 12,
  },

  btnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 18,
  },

  optionsContainer: {
    marginBottom: 20,
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 12,
  },

  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    margin: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#b39ddb',
    backgroundColor: '#4a148c',
    shadowColor: '#311b92',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 110,
    alignItems: 'center',
  },

  optionSelected: {
    backgroundColor: '#8e24aa',
    borderColor: '#d1c4e9',
  },

  disabledOption: {
    backgroundColor: '#7a519b66',
    borderColor: '#593f7c',
  },

  optionText: {
    color: '#d1c4e9',
    fontWeight: '700',
    fontSize: 14,
  },

  optionTextSelected: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },

  optionsContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  optionBtnGender: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#b39ddb',
    backgroundColor: '#4a148c',
    alignItems: 'center',
  },

  optionSelectedGender: {
    backgroundColor: '#8e24aa',
    borderColor: '#d1c4e9',
  },

  optionTextGender: {
    color: '#d1c4e9',
    fontWeight: '700',
    fontSize: 16,
  },

  optionTextSelectedGender: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 17,
  },

  saveBtn: {
    backgroundColor: '#43a047',
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },

  noServiceText: {
    color: '#b39ddb',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 40,
    alignSelf: 'center',
  },
});
