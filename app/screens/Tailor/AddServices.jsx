import { Ionicons } from '@expo/vector-icons';
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
  "2 Piece Suits", "3 Piece Suits", "Sherwani", "Shalwar Kameez",
  "Blazers", "Dress Pants", "Kurta", "Waistcoats", "Pyjama", "Shalwar", "Shirts",
  "Pico", "Overlock", "Button Hole"
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
      updatedTypes = newService.service_types.filter(t => t !== type);
    } else {
      updatedTypes = [...newService.service_types, type];
    }
    setNewService({ ...newService, service_types: updatedTypes });
  };

  const addService = async () => {
    if (newService.service_types.length === 0) {
      Alert.alert('Error', 'Please select at least one service type');
      return;
    }
    try {
      await axios.post('https://tailorconnect-production.up.railway.app/services/add-services', {
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
      const res = await axios.get('https://tailorconnect-production.up.railway.app/services/get-services', {
        params: { email }
      });
      setServices(res.data.services || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch services');
    }
  };

  const updateService = async (service) => {
    try {
      await axios.put("https://tailorconnect-production.up.railway.app/services/update-service", {
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
      await axios.delete(`https://tailorconnect-production.up.railway.app/services/delete-service/${id}`);
      Alert.alert("Success", "Service Deleted!");
      fetchServices();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete service');
    }
  };

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
    <LinearGradient colors={['#050811', '#0b1220', '#141c30']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Services</Text>
          <Text style={styles.pageSubtitle}>Manage your offerings</Text>
        </View>

        {/* Tab Switch */}
        <View style={styles.switchContainer}>
          <Pressable
            style={[styles.switchBtn, !showAddForm && styles.switchActive]}
            onPress={() => setShowAddForm(false)}
          >
            {!showAddForm && <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.switchActiveGradient} />}
            <Image source={require('../../../assets/images/MyService.png')} style={styles.switchImg} />
            <Text style={[styles.switchText, !showAddForm && styles.switchTextActive]}>My Services</Text>
          </Pressable>

          <Pressable
            style={[styles.switchBtn, showAddForm && styles.switchActive]}
            onPress={() => setShowAddForm(true)}
          >
            {showAddForm && <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.switchActiveGradient} />}
            <Image source={require('../../../assets/images/AddServicE.png')} style={styles.switchImg} />
            <Text style={[styles.switchText, showAddForm && styles.switchTextActive]}>Add Service</Text>
          </Pressable>
        </View>

        {showAddForm ? (
          // Add Service Form View
          <>
            <Text style={styles.title}>Add New Service</Text>

            <Text style={styles.label}>
              <Ionicons name="grid-outline" size={13} color="#F59E0B" />  Service Types
            </Text>
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
                    activeOpacity={0.8}
                  >
                    {selected && <Ionicons name="checkmark-circle" size={13} color="#fff" style={{ marginRight: 4 }} />}
                    <Text style={selected ? styles.optionTextSelected : styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>
              <Ionicons name="people-outline" size={13} color="#F59E0B" />  Gender
            </Text>
            <View style={styles.optionsContainerRow}>
              {['men', 'women', 'both'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.optionBtnGender, newService.gender === g && styles.optionSelectedGender]}
                  onPress={() => setNewService({ ...newService, gender: g })}
                  activeOpacity={0.85}
                >
                  {newService.gender === g && (
                    <LinearGradient colors={['#3B82F6', '#2563EB']} style={StyleSheet.absoluteFill} borderRadius={20} />
                  )}
                  <Text style={newService.gender === g ? styles.optionTextSelectedGender : styles.optionTextGender}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="rgba(148, 163, 184, 0.5)"
              value={newService.description}
              onChangeText={(t) => setNewService({ ...newService, description: t })}
            />

            <TextInput
              style={styles.input}
              placeholder="Price (e.g. Rs. 2500)"
              placeholderTextColor="rgba(148, 163, 184, 0.5)"
              value={newService.price_range}
              onChangeText={(t) => setNewService({ ...newService, price_range: t })}
            />

            <TouchableOpacity style={styles.addBtn} onPress={addService} activeOpacity={0.85}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.addBtnGradient}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>Add Service</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          // My Services List View
          <>
            <Text style={styles.title}>My Services</Text>
            {services.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={50} color="rgba(148, 163, 184, 0.4)" />
                <Text style={styles.emptyText}>No services added yet</Text>
                <Text style={styles.emptySubText}>Tap "Add Service" to get started</Text>
              </View>
            )}

            {services.map(s => {
              const isEditing = editingId === s.id;
              return (
                <View key={s.id} style={styles.card}>
                  <LinearGradient colors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']} style={styles.cardHeaderGrad}>
                    <Ionicons name="shirt-outline" size={18} color="#F59E0B" />
                    <Text style={styles.cardTitle}>{s.service_types.join(", ")}</Text>
                  </LinearGradient>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardFieldLabel}>Description</Text>
                    <TextInput
                      style={styles.input}
                      value={isEditing ? (editingData.description || '') : (s.description || '')}
                      editable={isEditing}
                      onChangeText={(t) => { if (!isEditing) return; setEditingData({ ...editingData, description: t }); }}
                      placeholderTextColor="rgba(148, 163, 184, 0.5)"
                    />

                    <Text style={styles.cardFieldLabel}>Price</Text>
                    <TextInput
                      style={styles.input}
                      value={isEditing ? (editingData.price_range || '') : (s.price_range || '')}
                      editable={isEditing}
                      onChangeText={(t) => { if (!isEditing) return; setEditingData({ ...editingData, price_range: t }); }}
                      placeholderTextColor="rgba(148, 163, 184, 0.5)"
                    />

                    {isEditing ? (
                      <View style={styles.cardActions}>
                        <TouchableOpacity style={[styles.cardActionBtn, styles.saveCardBtn]} onPress={saveEdit} activeOpacity={0.85}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                          <Text style={styles.btnText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.cardActionBtn, styles.cancelCardBtn]} onPress={cancelEdit} activeOpacity={0.85}>
                          <Ionicons name="close" size={16} color="#fff" />
                          <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.cardActions}>
                        <TouchableOpacity style={[styles.cardActionBtn, styles.editCardBtn]} onPress={() => startEdit(s)} activeOpacity={0.85}>
                          <Ionicons name="create-outline" size={16} color="#3B82F6" />
                          <Text style={styles.btnTextEdit}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.cardActionBtn, styles.deleteCardBtn]} onPress={() => deleteService(s.id)} activeOpacity={0.85}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          <Text style={styles.btnTextDelete}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default AddServices;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },

  pageHeader: { marginTop: 56, marginBottom: 22 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#F2E6E6', letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500', marginTop: 3 },

  switchContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    overflow: 'hidden',
  },

  switchBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  switchActive: {},
  switchActiveGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  switchText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 4,
  },
  switchTextActive: { color: '#fff' },
  switchImg: { width: 70, height: 70 },

  title: {
    color: '#F2E6E6',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 18,
    letterSpacing: -0.2,
  },

  label: {
    color: '#94a3b8',
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  input: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    color: '#F2E6E6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    fontSize: 14,
  },

  addBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 6,
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    overflow: 'hidden',
    width: '100%',
  },

  cardHeaderGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },

  cardTitle: {
    color: '#F2E6E6',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },

  cardBody: {
    padding: 16,
    paddingTop: 8,
  },

  cardFieldLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },

  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },

  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },

  editCardBtn: { backgroundColor: '#ffffff' },
  deleteCardBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  saveCardBtn: { backgroundColor: '#10B981' },
  cancelCardBtn: { backgroundColor: '#475569', borderWidth: 1, borderColor: 'rgba(150,150,150,0.2)' },

  btnText: { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  btnTextEdit: { color: '#3B82F6', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  btnTextDelete: { color: '#EF4444', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.18)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  optionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  disabledOption: { opacity: 0.3 },

  optionText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  optionTextSelected: { color: '#fff', fontWeight: '800', fontSize: 12 },

  optionsContainerRow: { flexDirection: 'row', marginBottom: 18, gap: 8 },
  optionBtnGender: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.18)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  optionSelectedGender: { borderColor: '#2563EB' },
  optionTextGender: { color: '#94a3b8', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  optionTextSelectedGender: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 13 },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptySubText: { color: '#94a3b8', fontSize: 12, marginTop: 6 },
});
