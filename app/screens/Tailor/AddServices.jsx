import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const serviceOptions = [
  "2 Piece Suits","3 Piece Suits","Sherwani","Shalwar Kameez",
  "Blazers","Dress Pants","Kurta","Waistcoats","Pyjama","Shalwar","Shirts"
];

export default function AddServices({ route }) {
  const { email } = route.params;

  const [services, setServices] = useState([]);//a state varible which will be storing a array itself
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
      setNewService({ ...newService, service_types: types.filter(t => t !== type) });//only letting it select types which are not already selected
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
      setNewService({ service_types: [], gender: 'both', description: '', price_range: '' });//after saving info in database rest feilds
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
    <LinearGradient colors={['#a8edea', '#fed6e3']} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* ---------- Switch Button ---------- */}
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[styles.switchBtn, !showAddForm && styles.switchActive]}//Active styling when button is pressed and  showAddForm becomes false
            onPress={() => setShowAddForm(false)}
          >
            <Image
                     source={require('../../../assets/images/MyService.png')}
                     style={{ height: 130, width: 130 }}
                     resizeMode="contain"
                   />
            <Text style={[styles.switchText, !showAddForm && styles.switchTextActive]}>
              My Services
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchBtn, showAddForm && styles.switchActive]}
            onPress={() => setShowAddForm(true)}
          >
         <Image
                     source={require('../../../assets/images/AddServicE.png')}
                     style={{ height: 130, width: 130 }}
                     resizeMode="contain"
                   />
            <Text style={[styles.switchText, showAddForm && styles.switchTextActive]}>
              Add Service
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------- Ternary: Show Services or Add Form ---------- */}
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
            <View style={styles.optionsContainer}>
              {['men', 'women', 'both'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.optionBtn,
                    newService.gender === g && styles.optionSelected
                  ]}
                  onPress={() => setNewService({ ...newService, gender: g })}
                >
                  <Text style={newService.gender === g ? styles.optionTextSelected : styles.optionText}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Describe this service"
              value={newService.description}
              onChangeText={(text) => setNewService({ ...newService, description: text })}
            />

            <Text style={styles.label}>Price Range</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5000-10000 PKR"
              value={newService.price_range}
              onChangeText={(text) => setNewService({ ...newService, price_range: text })}
            />

            <TouchableOpacity style={styles.addBtn} onPress={addService}>
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
                  <Text style={styles.value}>{s.gender}</Text>
                </View>

                <Text style={styles.label}>Description:</Text>
              <TextInput
  style={styles.input}
  value={s.description}
  onChangeText={(text) => {
    s.description = text;
    setServices([...services]); // refresh state
  }}
/>


                <Text style={styles.label}>Price Range:</Text>
        <TextInput
  style={styles.input}
  value={s.price_range}
  onChangeText={(text) => {
    s.price_range = text;
    setServices([...services]); // refresh UI
  }}
/>
<TouchableOpacity
  style={styles.saveBtn}
  onPress={() => updateService(s)}
>
  <Text style={styles.btnText}>Save</Text>
</TouchableOpacity>


                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteService(s.id)}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )) : (
              <Text style={{ textAlign: 'center', fontSize: 16, marginTop: 20, color: '#444' }}>
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

  // Switch Button Styles
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8ff',
    padding: 8,
    borderRadius: 18,
    marginBottom: 25,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  switchActive: {
    backgroundColor: '#6C63FF',
  },
  switchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C63FF',
  },
  switchTextActive: {
    color: 'white',
  },

  title: {
   textAlign: "center",
    fontSize: 26,
    fontWeight: '800',
    color: '#2C2C54',
    marginBottom: 25,
    marginTop: 10,
  },

  card: {
    backgroundColor: '#dad9f9ff',
    padding: 20,
    borderRadius: 22,
    marginBottom: 38,
    shadowColor: '#6C63FF',
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 7,
    borderWidth: 1,
    borderColor: '#9696e2ff',
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f1f2bff',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#272424ff',
    margin: 10,
  },

  value: {
    fontSize: 15,
    color: '#2C2C54',
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#9c9cbdff',
    padding: 12,
    borderRadius: 15,
    backgroundColor: '#f3f3f3ff',
    marginBottom: 12,
  },

  deleteBtn: {
    backgroundColor: '#FF4D4D',
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },

  addBtn: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    marginTop: 10,
  },

  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  optionsContainer: {
    marginBottom: 12,
  },

  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6C63FF',
    backgroundColor: '#f7f7fcff',
  },

  optionSelected: {
    backgroundColor: '#6C63FF',
  },

  disabledOption: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },

  optionText: {
    color: '#6C63FF',
    fontWeight: '600',
  },

  optionTextSelected: {
    color: '#fffbfbff',
    fontWeight: '700',
  },
  saveBtn: {
  backgroundColor: '#4CAF50',
  padding: 12,
  borderRadius: 15,
  alignItems: 'center',
  marginTop: 10,
},

});
