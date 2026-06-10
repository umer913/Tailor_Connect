import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL } from '../../api.js';

const SCREEN_W = Dimensions.get('window').width;
const IS_TABLET = SCREEN_W >= 768;
const PAGE_GUTTER = IS_TABLET ? 28 : 18;
const CONTENT_MAX = IS_TABLET ? 760 : SCREEN_W;

// ─── Service catalogue with local images ─────────────────────────────────────
const SERVICE_CATALOGUE = [
  { type: '2 Piece Suits', image: require('../../../assets/images/2Peice.png'), femaleImage: require('../../../assets/images/F2Peice.png'), color: ['#1e3a5f', '#0f2040'], accent: '#60A5FA' },
  { type: '3 Piece Suits', image: require('../../../assets/images/3Peice.png'), femaleImage: require('../../../assets/images/F3Peice.png'), color: ['#2d1b4e', '#1a0f2e'], accent: '#A78BFA' },
  { type: 'Sherwani', image: require('../../../assets/images/sherwani.png'), femaleImage: require('../../../assets/images/Fsherwani.png'), color: ['#1a3a2a', '#0d2018'], accent: '#34D399' },
  { type: 'Shalwar Kameez', image: require('../../../assets/images/shalwar.png'), femaleImage: require('../../../assets/images/Fshalwar.png'), color: ['#3b2a1a', '#221808'], accent: '#FBBF24' },
  { type: 'Blazers', image: require('../../../assets/images/blazer.png'), femaleImage: require('../../../assets/images/Fblazers.png'), color: ['#1e2a3b', '#111827'], accent: '#38BDF8' },
  { type: 'Dress Pants', image: require('../../../assets/images/pant.png'), femaleImage: require('../../../assets/images/Fpant.png'), color: ['#1e1e3b', '#111127'], accent: '#818CF8' },
  { type: 'Kurta', image: require('../../../assets/images/Kurta.png'), femaleImage: require('../../../assets/images/FKurta.png'), color: ['#2a1a1a', '#1a0f0f'], accent: '#F87171' },
  { type: 'Waistcoats', image: require('../../../assets/images/coat.png'), femaleImage: require('../../../assets/images/Fcoat.png'), color: ['#1a2a1a', '#0f1a0f'], accent: '#4ADE80' },
  { type: 'Pyjama', image: require('../../../assets/images/pyj.png'), femaleImage: require('../../../assets/images/Fpyj.png'), color: ['#2a1a2a', '#1a0f1a'], accent: '#E879F9' },
  { type: 'Shalwar', image: require('../../../assets/images/shalwer.png'), femaleImage: require('../../../assets/images/Fshalwer.png'), color: ['#2a2a1a', '#1a1a0f'], accent: '#FCD34D' },
  { type: 'Shirts', image: require('../../../assets/images/shirt.png'), femaleImage: require('../../../assets/images/Fshirt.png'), color: ['#1a2a3a', '#0f1a28'], accent: '#7DD3FC' },
  { type: 'Pico', image: require('../../../assets/images/pico.png'), femaleImage: require('../../../assets/images/pico.png'), color: ['#3a1a2a', '#280f1a'], accent: '#FB7185' },
  { type: 'Overlock', image: require('../../../assets/images/overlock.png'), femaleImage: require('../../../assets/images/overlock.png'), color: ['#1a3a3a', '#0f2828'], accent: '#2DD4BF' },
  { type: 'Button Hole', image: require('../../../assets/images/buttonhole.png'), femaleImage: require('../../../assets/images/buttonhole.png'), color: ['#3a2a1a', '#28180f'], accent: '#FB923C' },
];

// Common measurement fields a tailor might need
const MEASUREMENT_OPTIONS = [
  'Chest', 'Waist', 'Hips', 'Shoulder', 'Sleeve Length',
  'Neck', 'Back Length', 'Inseam', 'Thigh', 'Ankle',
  'Wrist', 'Arm Length', 'Height', 'Weight',
];

// ─── Component ────────────────────────────────────────────────────────────────
const AddServices = ({ route, navigation }) => {
  const { email } = route.params;

  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState('my');   // 'my' | 'add' | 'custom'
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

  const [newService, setNewService] = useState({
    service_types: [],
    gender: 'both',
    description: '',
    price_range: '',
  });

  // Custom service state
  const [customService, setCustomService] = useState({
    custom_name: '',
    gender: 'both',
    description: '',
    price_range: '',
    measurements_required: [],
  });
  const [customImages, setCustomImages] = useState([]);   // local URIs for preview
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0); // index of primary image
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submittingCustom, setSubmittingCustom] = useState(false);

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/services/get-services`, { params: { email } });
      setServices(res.data.services || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch services');
    }
  };

  // ─── Catalogue service ─────────────────────────────────────────────────────
  const toggleServiceType = (type) => {
    const current = newService.service_types;
    setNewService({
      ...newService,
      service_types: current.includes(type) ? current.filter(t => t !== type) : [...current, type],
    });
  };

  const addService = async () => {
    if (!newService.service_types.length) {
      Alert.alert('Error', 'Please select at least one service type');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/services/add-services`, { email, services: [newService] });
      Alert.alert('Success', 'Service added!');
      setNewService({ service_types: [], gender: 'both', description: '', price_range: '' });
      fetchServices();
      setActiveTab('my');
    } catch {
      Alert.alert('Error', 'Failed to add service');
    }
  };

  // ─── Custom service ────────────────────────────────────────────────────────
  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      const picked = result.assets.map(a => a.uri);
      setCustomImages(prev => [...prev, ...picked].slice(0, 5));
    }
  };

  const removeCustomImage = (idx) => {
    setCustomImages(prev => {
      const next = prev.filter((_, i) => i !== idx);
      // adjust primary index
      if (primaryImageIndex >= idx && primaryImageIndex > 0) {
        setPrimaryImageIndex(prev2 => Math.max(0, prev2 - 1));
      } else if (primaryImageIndex === idx) {
        setPrimaryImageIndex(0);
      }
      return next;
    });
  };

  const toggleMeasurement = (m) => {
    const current = customService.measurements_required;
    setCustomService({
      ...customService,
      measurements_required: current.includes(m)
        ? current.filter(x => x !== m)
        : [...current, m],
    });
  };

  const submitCustomService = async () => {
    if (!customService.custom_name.trim()) {
      Alert.alert('Required', 'Please enter a service name.');
      return;
    }
    if (!customService.price_range.trim()) {
      Alert.alert('Required', 'Please enter a price range.');
      return;
    }
    if (!customService.description.trim()) {
      Alert.alert('Required', 'Please add a description.');
      return;
    }
    if (customImages.length === 0) {
      Alert.alert('Required', 'Please add at least one image.');
      return;
    }

    try {
      setSubmittingCustom(true);

      // Upload images first
      setUploadingImages(true);
      const formData = new FormData();
      customImages.forEach((uri, idx) => {
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('images', {
          uri,
          type: `image/${ext}`,
          name: `custom_service_${idx}.${ext}`,
        });
      });

      let uploadedUrls = [];
      try {
        const uploadRes = await axios.post(
          `${API_BASE_URL}/services/upload-custom-images`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        uploadedUrls = uploadRes.data.urls || [];
      } catch (uploadErr) {
        console.warn('Image upload failed, proceeding without images:', uploadErr);
      }
      setUploadingImages(false);

      // Reorder so primary image is at index 0
      const orderedUrls = uploadedUrls.length > 0
        ? [
            uploadedUrls[primaryImageIndex] || uploadedUrls[0],
            ...uploadedUrls.filter((_, i) => i !== primaryImageIndex),
          ]
        : [];

      await axios.post(`${API_BASE_URL}/services/add-services`, {
        email,
        services: [{
          service_types: [customService.custom_name.trim()],
          gender: customService.gender,
          description: customService.description.trim(),
          price_range: customService.price_range.trim(),
          is_custom: true,
          custom_name: customService.custom_name.trim(),
          custom_images: orderedUrls,
          measurements_required: customService.measurements_required,
        }],
      });

      Alert.alert('Success', 'Custom service added!');
      setCustomService({ custom_name: '', gender: 'both', description: '', price_range: '', measurements_required: [] });
      setCustomImages([]);
      setPrimaryImageIndex(0);
      fetchServices();
      setActiveTab('my');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add custom service');
    } finally {
      setSubmittingCustom(false);
      setUploadingImages(false);
    }
  };

  // ─── Edit / Delete ─────────────────────────────────────────────────────────
  const deleteService = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/services/delete-service/${id}`);
      fetchServices();
    } catch {
      Alert.alert('Error', 'Failed to delete service');
    }
  };

  const saveEdit = async () => {
    try {
      await axios.put(`${API_BASE_URL}/services/update-service`, {
        email,
        id: editingId,
        service_types: editingData.service_types,
        gender: editingData.gender,
        description: editingData.description,
        price_range: editingData.price_range,
        custom_name: editingData.custom_name,
        measurements_required: editingData.measurements_required,
      });
      Alert.alert('Success', 'Service updated!');
      setEditingId(null);
      setEditingData({});
      fetchServices();
    } catch {
      Alert.alert('Error', 'Failed to update service');
    }
  };

  // ── helpers ──
  const getCatalogue = (type) => SERVICE_CATALOGUE.find(c => c.type === type) || SERVICE_CATALOGUE[0];
  const getServiceImage = (cat, gender) => gender === 'women' ? cat.femaleImage : cat.image;
  const addedTypes = new Set(services.flatMap(s => s.service_types));

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#050811', '#0b1220', '#141c30']} style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginLeft: navigation ? 14 : 0 }}>
          <Text style={styles.headerSub}>Tailor Profile</Text>
          <Text style={styles.headerTitle}>My Services</Text>
        </View>
        {services.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{services.length}</Text>
          </View>
        )}
      </View>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        {[
          { key: 'my', icon: 'list-outline', label: 'My Services' },
          { key: 'add', icon: 'add-circle-outline', label: 'Add Services' },
          { key: 'custom', icon: 'sparkles-outline', label: 'Custom' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.85}
          >
            {activeTab === tab.key && (
              <LinearGradient
                colors={tab.key === 'custom' ? ['#7C3AED', '#5B21B6'] : ['#3B82F6', '#2563EB']}
                style={StyleSheet.absoluteFill}
                borderRadius={12}
              />
            )}
            <Ionicons
              name={tab.icon}
              size={15}
              color={activeTab === tab.key ? '#fff' : '#64748b'}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ═══════════ MY SERVICES ═══════════ */}
        {activeTab === 'my' && (
          <>
            {services.length === 0 ? (
              <View style={styles.emptyWrap}>
                <LinearGradient colors={['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.04)']} style={styles.emptyIconBox}>
                  <Ionicons name="cut-outline" size={44} color="rgba(148,163,184,0.5)" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No services yet</Text>
                <Text style={styles.emptyDesc}>Add from the catalogue or create a custom service</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setActiveTab('add')} activeOpacity={0.85}>
                    <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.emptyAddBtnGrad}>
                      <Ionicons name="add" size={16} color="#fff" />
                      <Text style={styles.emptyAddBtnText}>Catalogue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setActiveTab('custom')} activeOpacity={0.85}>
                    <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.emptyAddBtnGrad}>
                      <Ionicons name="sparkles" size={16} color="#fff" />
                      <Text style={styles.emptyAddBtnText}>Custom</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              services.map(s => {
                const isEditing = editingId === s.id;
                const isCustom = s.is_custom;
                const cat = getCatalogue(s.service_types?.[0]);
                const customThumb = s.custom_images?.[0]
                  ? { uri: s.custom_images[0].startsWith('http') ? s.custom_images[0] : `${API_BASE_URL}${s.custom_images[0]}` }
                  : null;

                return (
                  <View key={s.id} style={[styles.serviceCard, isCustom && styles.serviceCardCustom]}>
                    {/* Card hero */}
                    {isCustom ? (
                      <View style={[styles.cardHero, { backgroundColor: '#1a0a2e' }]}>
                        {customThumb ? (
                          <Image source={customThumb} style={styles.cardHeroImageFull} resizeMode="cover" />
                        ) : (
                          <LinearGradient colors={['#2d1b4e', '#1a0a2e']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="sparkles" size={48} color="#A78BFA" />
                          </LinearGradient>
                        )}
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.cardHeroOverlay} />
                        <View style={styles.customBadgeRow}>
                          <View style={styles.customBadge}>
                            <Ionicons name="sparkles" size={12} color="#A78BFA" />
                            <Text style={styles.customBadgeText}>Custom</Text>
                          </View>
                        </View>
                        <View style={styles.cardHeroBadge}>
                          <View style={[styles.accentDot, { backgroundColor: '#A78BFA' }]} />
                          <Text style={styles.cardHeroType} numberOfLines={1}>{s.custom_name || s.service_types?.[0]}</Text>
                        </View>
                        <View style={[styles.genderPill, { borderColor: '#A78BFA66' }]}>
                          <Text style={[styles.genderPillText, { color: '#A78BFA' }]}>
                            {(s.gender || 'both').charAt(0).toUpperCase() + (s.gender || 'both').slice(1)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <LinearGradient colors={cat.color} style={styles.cardHero}>
                        <Image source={getServiceImage(cat, s.gender)} style={styles.cardHeroImage} resizeMode="contain" />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.cardHeroOverlay} />
                        <View style={styles.cardHeroBadge}>
                          <View style={[styles.accentDot, { backgroundColor: cat.accent }]} />
                          <Text style={styles.cardHeroType} numberOfLines={1}>{s.service_types.join(' · ')}</Text>
                        </View>
                        <View style={[styles.genderPill, { borderColor: cat.accent + '66' }]}>
                          <Text style={[styles.genderPillText, { color: cat.accent }]}>
                            {(s.gender || 'both').charAt(0).toUpperCase() + (s.gender || 'both').slice(1)}
                          </Text>
                        </View>
                      </LinearGradient>
                    )}

                    {/* Measurements pill strip */}
                    {isCustom && s.measurements_required?.length > 0 && (
                      <View style={styles.measurementPillRow}>
                        <Ionicons name="resize-outline" size={13} color="#A78BFA" style={{ marginRight: 4 }} />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            {s.measurements_required.map(m => (
                              <View key={m} style={styles.measurementPill}>
                                <Text style={styles.measurementPillText}>{m}</Text>
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    )}

                    {/* Card body */}
                    <View style={styles.cardBody}>
                      {isEditing ? (
                        <>
                          <Text style={styles.fieldLabel}>Description</Text>
                          <TextInput
                            style={styles.input}
                            value={editingData.description || ''}
                            onChangeText={t => setEditingData({ ...editingData, description: t })}
                            placeholderTextColor="#475569"
                            placeholder="Describe your service…"
                            multiline
                          />
                          <Text style={styles.fieldLabel}>Price Range</Text>
                          <TextInput
                            style={styles.input}
                            value={editingData.price_range || ''}
                            onChangeText={t => setEditingData({ ...editingData, price_range: t })}
                            placeholderTextColor="#475569"
                            placeholder="e.g. Rs. 2500 – 4000"
                          />
                          <View style={styles.cardActions}>
                            <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={saveEdit} activeOpacity={0.85}>
                              <Ionicons name="checkmark" size={15} color="#fff" />
                              <Text style={styles.actionBtnText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => { setEditingId(null); setEditingData({}); }} activeOpacity={0.85}>
                              <Ionicons name="close" size={15} color="#fff" />
                              <Text style={styles.actionBtnText}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : (
                        <>
                          {s.description ? <Text style={styles.cardDesc} numberOfLines={7}>{s.description}</Text> : null}
                          <View style={styles.priceRow}>
                            <Text style={styles.priceText}>{s.price_range} Rs</Text>
                          </View>
                          <View style={styles.cardActions}>
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.editBtn]}
                              onPress={() => { setEditingId(s.id); setEditingData({ ...s }); }}
                              activeOpacity={0.85}
                            >
                              <Ionicons name="create-outline" size={15} color="#3B82F6" />
                              <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.deleteBtn]}
                              onPress={() => Alert.alert('Delete Service', 'Are you sure?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => deleteService(s.id) },
                              ])}
                              activeOpacity={0.85}
                            >
                              <Ionicons name="trash-outline" size={15} color="#EF4444" />
                              <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ═══════════ ADD SERVICE (CATALOGUE) ═══════════ */}
        {activeTab === 'add' && (
          <>
            <View style={styles.sectionRow}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Choose Service Types</Text>
            </View>

            <View style={styles.catalogueGrid}>
              {SERVICE_CATALOGUE.map(cat => {
                const selected = newService.service_types.includes(cat.type);
                const disabled = addedTypes.has(cat.type);
                return (
                  <TouchableOpacity
                    key={cat.type}
                    style={[styles.catalogCard, selected && styles.catalogCardSelected, disabled && styles.catalogCardDisabled]}
                    onPress={() => !disabled && toggleServiceType(cat.type)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={cat.color} style={styles.catalogCardBg}>
                      <Image source={getServiceImage(cat, newService.gender)} style={styles.catalogImg} resizeMode="contain" />
                      {selected && (
                        <View style={styles.selectedOverlay}>
                          <LinearGradient colors={['rgba(59,130,246,0.7)', 'rgba(37,99,235,0.7)']} style={StyleSheet.absoluteFill} borderRadius={16} />
                          <Ionicons name="checkmark-circle" size={28} color="#fff" />
                        </View>
                      )}
                      {disabled && (
                        <View style={styles.disabledOverlay}>
                          <Ionicons name="checkmark-done-circle" size={20} color="#10B981" />
                          <Text style={styles.disabledText}>Added</Text>
                        </View>
                      )}
                    </LinearGradient>
                    <View style={styles.catalogLabel}>
                      <View style={[styles.catalogAccentDot, { backgroundColor: cat.accent }]} />
                      <Text style={[styles.catalogLabelText, selected && { color: '#fff' }]} numberOfLines={2}>{cat.type}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.sectionRow, { marginTop: 8 }]}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Gender</Text>
            </View>
            <View style={styles.genderRow}>
              {['men', 'women', 'both'].map(g => (
                <TouchableOpacity key={g} style={[styles.genderBtn, newService.gender === g && styles.genderBtnActive]} onPress={() => setNewService({ ...newService, gender: g })} activeOpacity={0.85}>
                  {newService.gender === g && <LinearGradient colors={['#3B82F6', '#2563EB']} style={StyleSheet.absoluteFill} borderRadius={14} />}
                  <Ionicons name={g === 'men' ? 'man-outline' : g === 'women' ? 'woman-outline' : 'people-outline'} size={16} color={newService.gender === g ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />
                  <Text style={[styles.genderBtnText, newService.gender === g && styles.genderBtnTextActive]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.sectionRow, { marginTop: 4 }]}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Describe your service, turnaround time, specialties…"
              placeholderTextColor="#334155"
              value={newService.description}
              onChangeText={t => setNewService({ ...newService, description: t })}
              multiline
            />

            <View style={[styles.sectionRow, { marginTop: 4 }]}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Price Range</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rs. 2500 – 5000"
              placeholderTextColor="#334155"
              value={newService.price_range}
              onChangeText={t => setNewService({ ...newService, price_range: t })}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={addService} activeOpacity={0.85}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.submitBtnGrad}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Add Service</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* ═══════════ CUSTOM SERVICE ═══════════ */}
        {activeTab === 'custom' && (
          <>
            {/* Hero banner */}
            <LinearGradient colors={['rgba(124,58,237,0.25)', 'rgba(91,33,182,0.1)']} style={styles.customHeroBanner}>
              <View style={styles.customHeroIconWrap}>
                <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.customHeroIconGrad}>
                  <Ionicons name="sparkles" size={26} color="#fff" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customHeroTitle}>Create Your Own Service</Text>
                <Text style={styles.customHeroSub}>Showcase a unique offering that's entirely yours</Text>
              </View>
            </LinearGradient>

            {/* Service Name */}
            <View style={styles.sectionRow}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Service Name <Text style={styles.requiredStar}>*</Text></Text>
            </View>
            <TextInput
              style={styles.input}
             
              placeholderTextColor="#334155"
              value={customService.custom_name}
              onChangeText={t => setCustomService({ ...customService, custom_name: t })}
            />

            {/* Gender */}
            <View style={[styles.sectionRow, { marginTop: 4 }]}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Gender <Text style={styles.requiredStar}>*</Text></Text>
            </View>
            <View style={styles.genderRow}>
              {['men', 'women', 'both'].map(g => (
                <TouchableOpacity key={g} style={[styles.genderBtn, customService.gender === g && styles.genderBtnCustomActive]} onPress={() => setCustomService({ ...customService, gender: g })} activeOpacity={0.85}>
                  {customService.gender === g && <LinearGradient colors={['#7C3AED', '#5B21B6']} style={StyleSheet.absoluteFill} borderRadius={14} />}
                  <Ionicons name={g === 'men' ? 'man-outline' : g === 'women' ? 'woman-outline' : 'people-outline'} size={16} color={customService.gender === g ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />
                  <Text style={[styles.genderBtnText, customService.gender === g && styles.genderBtnTextActive]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <View style={[styles.sectionRow, { marginTop: 4 }]}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Description <Text style={styles.requiredStar}>*</Text></Text>
            </View>
            <TextInput
              style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
              placeholder="Describe your service in detail — materials, style, turnaround time…"
              placeholderTextColor="#334155"
              value={customService.description}
              onChangeText={t => setCustomService({ ...customService, description: t })}
              multiline
            />

            {/* Price */}
            <View style={[styles.sectionRow, { marginTop: 4 }]}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Price Range <Text style={styles.requiredStar}>*</Text></Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rs. 3500 – 8000"
              placeholderTextColor="#334155"
              value={customService.price_range}
              onChangeText={t => setCustomService({ ...customService, price_range: t })}
              keyboardType="default"
            />

            {/* Images */}
            <View style={[styles.sectionRow, { marginTop: 4 }]}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Service Images <Text style={styles.requiredStar}>*</Text></Text>
              <Text style={styles.sectionHintInline}> (up to 5)</Text>
            </View>

            {/* Image grid */}
            <View style={styles.imageGrid}>
              {customImages.map((uri, idx) => {
                const isPrimary = idx === primaryImageIndex;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.imageGridItem, isPrimary && styles.imageGridItemPrimary]}
                    onPress={() => setPrimaryImageIndex(idx)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri }} style={styles.imageGridThumb} resizeMode="cover" />
                    {/* Primary crown badge */}
                    {isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Ionicons name="star" size={11} color="#fff" />
                        <Text style={styles.primaryBadgeText}>Primary</Text>
                      </View>
                    )}
                    {/* Remove button */}
                    <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeCustomImage(idx)}>
                      <Ionicons name="close-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                    {/* Tap to set primary hint on non-primary */}
                    {!isPrimary && (
                      <View style={styles.setPrimaryHint}>
                        <Ionicons name="star-outline" size={13} color="rgba(255,255,255,0.7)" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {customImages.length < 5 && (
                <TouchableOpacity style={styles.imageAddBox} onPress={pickImages} activeOpacity={0.8}>
                  <LinearGradient colors={['rgba(124,58,237,0.15)', 'rgba(91,33,182,0.08)']} style={styles.imageAddBoxGrad}>
                    <Ionicons name="image-outline" size={28} color="#A78BFA" />
                    <Text style={styles.imageAddText}>Add Photo</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
            {customImages.length > 1 && (
              <Text style={styles.primaryHintText}>
                <Ionicons name="information-circle-outline" size={12} color="#64748b" /> Tap an image to set it as the primary display photo
              </Text>
            )}

            {/* Measurements */}
            <View style={[styles.sectionRow, { marginTop: 8 }]}>
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Required Measurements <Text style={styles.requiredStar}>*</Text></Text>
            </View>
            <Text style={styles.measurementHint}>Select all measurements you'll need from the customer</Text>

            <View style={styles.measurementGrid}>
              {MEASUREMENT_OPTIONS.map(m => {
                const selected = customService.measurements_required.includes(m);
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.measurementChip, selected && styles.measurementChipSelected]}
                    onPress={() => toggleMeasurement(m)}
                    activeOpacity={0.8}
                  >
                    {selected && (
                      <LinearGradient colors={['#7C3AED', '#5B21B6']} style={StyleSheet.absoluteFill} borderRadius={22} />
                    )}
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'add-circle-outline'}
                      size={14}
                      color={selected ? '#fff' : '#A78BFA'}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.measurementChipText, selected && styles.measurementChipTextSelected]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected measurements summary */}
            {customService.measurements_required.length > 0 && (
              <View style={styles.measurementSummary}>
                <Ionicons name="checkmark-done-circle" size={16} color="#A78BFA" />
                <Text style={styles.measurementSummaryText}>
                  {customService.measurements_required.length} measurement{customService.measurements_required.length !== 1 ? 's' : ''} selected:{' '}
                  <Text style={{ color: '#A78BFA' }}>{customService.measurements_required.join(', ')}</Text>
                </Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, submittingCustom && { opacity: 0.7 }]}
              onPress={submitCustomService}
              disabled={submittingCustom}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.submitBtnGrad}>
                {submittingCustom ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.submitBtnText}>{uploadingImages ? 'Uploading Images…' : 'Creating Service…'}</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={20} color="#fff" />
                    <Text style={styles.submitBtnText}>Create Custom Service</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default AddServices;

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_W = IS_TABLET
  ? (CONTENT_MAX - PAGE_GUTTER * 2 - 12 * 3) / 4
  : (SCREEN_W - PAGE_GUTTER * 2 - 12) / 2;

const IMAGE_GRID_SIZE = IS_TABLET ? 120 : (SCREEN_W - PAGE_GUTTER * 2 - 12 * 3) / 3;

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingBottom: 16,
    paddingHorizontal: PAGE_GUTTER,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.1)',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 22, color: '#fff', fontWeight: '800', marginTop: 2 },
  countBadge: { backgroundColor: 'rgba(59,130,246,0.2)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countBadgeText: { color: '#60A5FA', fontWeight: '800', fontSize: 13 },

  tabBar: {
    flexDirection: 'row',
    margin: PAGE_GUTTER,
    backgroundColor: 'rgba(15,23,42,0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.12)',
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 12, overflow: 'hidden',
  },
  tabBtnActive: {},
  tabText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#fff', fontSize: 12, fontWeight: '800' },

  scroll: {
    paddingHorizontal: PAGE_GUTTER,
    paddingBottom: 60,
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    width: '100%',
  },

  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyIconBox: { width: 90, height: 90, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptyDesc: { color: '#64748b', fontSize: 13, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  emptyAddBtn: { borderRadius: 16, overflow: 'hidden' },
  emptyAddBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, gap: 8 },
  emptyAddBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Service cards
  serviceCard: {
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  serviceCardCustom: {
    borderColor: 'rgba(124,58,237,0.35)',
  },
  cardHero: {
    height: IS_TABLET ? 200 : 160,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cardHeroImage: {
    position: 'absolute',
    width: '60%',
    height: '100%',
    right: 0,
    bottom: 0,
  },
  cardHeroImageFull: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardHeroOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '60%',
  },
  cardHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  accentDot: { width: 8, height: 8, borderRadius: 4 },
  cardHeroType: { color: '#fff', fontSize: 18, fontWeight: '900', flex: 1 },
  genderPill: {
    position: 'absolute',
    top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  genderPillText: { fontSize: 11, fontWeight: '800' },
  customBadgeRow: {
    position: 'absolute',
    top: 12, left: 12,
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(124,58,237,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  customBadgeText: { color: '#DDD6FE', fontSize: 11, fontWeight: '800' },

  measurementPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124,58,237,0.12)',
  },
  measurementPill: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  measurementPillText: { color: '#A78BFA', fontSize: 11, fontWeight: '700' },

  cardBody: { padding: 16 },
  cardDesc: { color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 10, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  priceText: { fontSize: 14, fontWeight: '800', color: '#F59E0B' },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 12, gap: 6 },
  editBtn: { backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)' },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  saveBtn: { backgroundColor: '#10B981' },
  cancelBtn: { backgroundColor: '#475569' },
  editBtnText: { color: '#3B82F6', fontWeight: '700', fontSize: 13 },
  deleteBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Section labels
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 20 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  sectionHintInline: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  requiredStar: { color: '#F87171', fontSize: 14 },

  // Catalogue grid
  catalogueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  catalogCard: {
    width: CARD_W, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)',
  },
  catalogCardSelected: { borderColor: '#3B82F6', borderWidth: 2 },
  catalogCardDisabled: { opacity: 0.45 },
  catalogCardBg: { height: CARD_W * 0.9, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  catalogImg: { width: '90%', height: '90%' },
  selectedOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  disabledOverlay: {
    position: 'absolute', top: 8, right: 8,
    alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
    flexDirection: 'row', gap: 4,
  },
  disabledText: { color: '#10B981', fontSize: 10, fontWeight: '700' },
  catalogLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(10,15,28,0.9)',
    paddingHorizontal: 10, paddingVertical: 8,
  },
  catalogAccentDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  catalogLabelText: { color: '#94a3b8', fontSize: 11, fontWeight: '700', flex: 1 },

  // Gender
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  genderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 14, overflow: 'hidden',
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)',
  },
  genderBtnActive: { borderColor: '#2563EB' },
  genderBtnCustomActive: { borderColor: '#5B21B6' },
  genderBtnText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  genderBtnTextActive: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Inputs
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    color: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.18)',
    fontSize: 14,
  },
  fieldLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

  // Custom service hero banner
  customHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    gap: 16,
  },
  customHeroIconWrap: { borderRadius: 16, overflow: 'hidden' },
  customHeroIconGrad: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  customHeroTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  customHeroSub: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },

  // Image grid
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  imageGridItem: {
    width: IMAGE_GRID_SIZE, height: IMAGE_GRID_SIZE, borderRadius: 14,
    overflow: 'hidden', position: 'relative',
    borderWidth: 2, borderColor: 'transparent',
  },
  imageGridItemPrimary: {
    borderColor: '#A78BFA',
    borderWidth: 2.5,
  },
  imageGridThumb: { width: '100%', height: '100%', borderRadius: 12 },
  imageRemoveBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  primaryBadge: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    backgroundColor: 'rgba(124,58,237,0.85)',
  },
  primaryBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  setPrimaryHint: {
    position: 'absolute',
    bottom: 6, left: 0, right: 0,
    alignItems: 'center',
  },
  primaryHintText: { color: '#64748b', fontSize: 11, fontWeight: '600', marginBottom: 8, marginTop: -4 },
  imageAddBox: { width: IMAGE_GRID_SIZE, height: IMAGE_GRID_SIZE, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(124,58,237,0.35)', borderStyle: 'dashed' },
  imageAddBoxGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  imageAddText: { color: '#A78BFA', fontSize: 11, fontWeight: '700' },

  // Measurement chips
  measurementHint: { color: '#64748b', fontSize: 12, fontWeight: '600', marginBottom: 12, marginTop: -6 },
  measurementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  measurementChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 22, borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    backgroundColor: 'rgba(124,58,237,0.06)',
    overflow: 'hidden',
  },
  measurementChipSelected: { borderColor: '#7C3AED' },
  measurementChipText: { color: '#A78BFA', fontSize: 13, fontWeight: '700' },
  measurementChipTextSelected: { color: '#fff', fontSize: 13, fontWeight: '700' },

  measurementSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  measurementSummaryText: { color: '#94a3b8', fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },

  // Submit
  submitBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 12 },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
