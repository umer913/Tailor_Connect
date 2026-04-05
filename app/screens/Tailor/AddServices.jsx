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

const AddServices = ({ route }) => {
  const { email } = route.params;

  const [services, setServices] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

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
  let updatedTypes;

  if (newService.service_types.includes(type)) {
    // remove service
    updatedTypes = newService.service_types.filter(t => t !== type);
  } else {
    // add service
    updatedTypes = [...newService.service_types, type];
  }

  setNewService({
    ...newService,
    service_types: updatedTypes
  });
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
      Alert.alert("Error", "Failed to update service");
    }
  };

  const deleteService = async (id) => {
    try {
      await axios.delete(`http://UF-MacBook-Pro.local:3000/delete-service/${id}`);
      Alert.alert("Success", "Service Deleted!");
      fetchServices();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete service');
    }
  };

  // Edit handlers: only allow editing when a card is in edit mode
  const startEdit = (service) => {
    setEditingId(service.id);
    setEditingData({ ...service });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateService(editingData);
    setEditingId(null);
    setEditingData({});
    fetchServices();
  };

  return (
    <LinearGradient colors={['#2B0F14', '#3A1419', '#4A1C22']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Switch */}
        <View style={styles.switchContainer}>
          <Pressable
            style={[styles.switchBtn, !showAddForm && styles.switchActive]}
            onPress={() => setShowAddForm(false)}
          >
            <Image source={require('../../../assets/images/MyService.png')} style={styles.switchImg} />
            <Text style={[styles.switchText, !showAddForm && styles.switchTextActive]}>
              My Services
            </Text>
          </Pressable>

          <Pressable
            style={[styles.switchBtn, showAddForm && styles.switchActive]}
            onPress={() => setShowAddForm(true)}
          >
            <Image source={require('../../../assets/images/AddServicE.png')} style={styles.switchImg} />
            <Text style={[styles.switchText, showAddForm && styles.switchTextActive]}>
              Add Service
            </Text>
          </Pressable>
        </View>

        {showAddForm ? (
          // Add Service Form View
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
                    <Text style={selected ? styles.optionTextSelected : styles.optionText}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Gender</Text>
            <View style={styles.optionsContainerRow}>
              {['men','women','both'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.optionBtnGender,
                    newService.gender === g && styles.optionSelectedGender
                  ]}
                  onPress={() => setNewService({ ...newService, gender: g })}
                >
                  <Text style={newService.gender === g ? styles.optionTextSelectedGender : styles.optionTextGender}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="#C9A3A3"
              value={newService.description}
              onChangeText={(t) => setNewService({ ...newService, description: t })}
            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              placeholderTextColor="#C9A3A3"
              value={newService.price_range}
              onChangeText={(t) => setNewService({ ...newService, price_range: t })}
            />

            <TouchableOpacity style={styles.addBtn} onPress={addService}>
              <Text style={styles.btnText}>Add Service</Text>
            </TouchableOpacity>
          </>
        ) 
        //My Services View
        : (
          <>
            <Text style={styles.title}>My Services</Text>

            {services.map(s => {
              const isEditing = editingId === s.id;
              return (
                <View key={s.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{s.service_types.join(", ")}</Text>

                  <TextInput
                    style={styles.input}
                    value={isEditing ? (editingData.description || '') : (s.description || '')}
                    editable={isEditing}
                    onChangeText={(t) => {
                      if (!isEditing) return;
                      setEditingData({ ...editingData, description: t });
                    }}
                  />

                  <TextInput
                    style={styles.input}
                    value={isEditing ? (editingData.price_range || '') : (s.price_range || '')}
                    editable={isEditing}
                    onChangeText={(t) => {
                      if (!isEditing) return;
                      setEditingData({ ...editingData, price_range: t });
                    }}
                  />

                  {isEditing ? (
                    <>
                      <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                        <Text style={styles.btnText}>Save</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                        <Text style={styles.btnText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(s)}>
                      <Text style={styles.btnText}>Edit</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteService(s.id)}>
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
export default AddServices;
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20 },

  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#3A1419',
    borderRadius: 20,
    marginBottom: 30,
  },

  switchBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  switchActive: { backgroundColor: '#7A1F2B' },
  switchText: { color: '#C9A3A3', fontWeight: '700' },
  switchTextActive: { color: '#FFF' },
  switchImg: { width: 90, height: 90 },

  title: {
    color: '#F2E6E6',
    fontSize: 28,
    fontWeight: '900',
    alignSelf: 'center',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#E6B0B0',
    padding: 22,
    borderRadius: 22,
    marginBottom: 20,
  },

  cardTitle: { color: '#000000ff', fontSize: 20, fontWeight: '800',marginBottom: 12 },

  label: { color: '#EADDDD', marginBottom: 6 },

  input: {
    backgroundColor: '#2B0F14',
    color: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  addBtn: {
    backgroundColor: '#E6B0B0',
    padding: 16,
    borderRadius: 22,
    alignItems: 'center',
  },

  saveBtn: {
    backgroundColor: '#ffffffff',
    padding: 14,
    borderRadius: 18,
    marginTop: 10,
  },

  editBtn: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 18,
    marginTop: 10,
  },

  cancelBtn: {
    backgroundColor: '#ffffffff',
    padding: 14,
    borderRadius: 18,
    marginTop: 10,
  },

  deleteBtn: {
    backgroundColor: '#ffffffff',
    padding: 14,
    borderRadius: 18,
    marginTop: 10,
  },

  btnText: { color: '#000000ff', fontWeight: '800', textAlign: 'center' },

  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  optionBtn: {
    backgroundColor: '#2B0F14',
    borderColor: '#7A1F2B',
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    margin: 6,
  },
  optionSelected: { backgroundColor: '#E6B0B0' },
  disabledOption: { opacity: 0.4 },

  optionText: { color: '#C9A3A3' },
  optionTextSelected: { color: '#000000ff', fontWeight: '800' },

  optionsContainerRow: { flexDirection: 'row', marginBottom: 20 },
  optionBtnGender: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#2B0F14',
  },
  optionSelectedGender: { backgroundColor: '#E6B0B0' },
  optionTextGender: { color: '#C9A3A3', textAlign: 'center' },
  optionTextSelectedGender: { color: '#000000ff', textAlign: 'center', fontWeight: '800' },
});
