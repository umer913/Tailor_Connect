import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL } from '../../api.js';

const SCREEN_W = Dimensions.get('window').width;
const IS_TABLET = SCREEN_W >= 768;
const PAGE_GUTTER = IS_TABLET ? 28 : 18;
const CONTENT_MAX = IS_TABLET ? 760 : SCREEN_W;

// ─── Service catalogue with local images ─────────────────────────────────────
const SERVICE_CATALOGUE = [
  {
    type: '2 Piece Suits',
    image: require('../../../assets/images/2Peice.png'),
    femaleImage: require('../../../assets/images/F2Peice.png'),
    color: ['#1e3a5f', '#0f2040'],
    accent: '#60A5FA',
  },
  {
    type: '3 Piece Suits',
    image: require('../../../assets/images/3Peice.png'),
    femaleImage: require('../../../assets/images/F3Peice.png'),
    color: ['#2d1b4e', '#1a0f2e'],
    accent: '#A78BFA',
  },
  {
    type: 'Sherwani',
    image: require('../../../assets/images/sherwani.png'),
    femaleImage: require('../../../assets/images/Fsherwani.png'),
    color: ['#1a3a2a', '#0d2018'],
    accent: '#34D399',
  },
  {
    type: 'Shalwar Kameez',
    image: require('../../../assets/images/shalwar.png'),
    femaleImage: require('../../../assets/images/Fshalwar.png'),
    color: ['#3b2a1a', '#221808'],
    accent: '#FBBF24',
  },
  {
    type: 'Blazers',
    image: require('../../../assets/images/blazer.png'),
    femaleImage: require('../../../assets/images/Fblazers.png'),
    color: ['#1e2a3b', '#111827'],
    accent: '#38BDF8',
  },
  {
    type: 'Dress Pants',
    image: require('../../../assets/images/pant.png'),
    femaleImage: require('../../../assets/images/Fpant.png'),
    color: ['#1e1e3b', '#111127'],
    accent: '#818CF8',
  },
  {
    type: 'Kurta',
    image: require('../../../assets/images/Kurta.png'),
    femaleImage: require('../../../assets/images/FKurta.png'),
    color: ['#2a1a1a', '#1a0f0f'],
    accent: '#F87171',
  },
  {
    type: 'Waistcoats',
    image: require('../../../assets/images/coat.png'),
    femaleImage: require('../../../assets/images/Fcoat.png'),
    color: ['#1a2a1a', '#0f1a0f'],
    accent: '#4ADE80',
  },
  {
    type: 'Pyjama',
    image: require('../../../assets/images/pyj.png'),
    femaleImage: require('../../../assets/images/Fpyj.png'),
    color: ['#2a1a2a', '#1a0f1a'],
    accent: '#E879F9',
  },
  {
    type: 'Shalwar',
    image: require('../../../assets/images/shalwer.png'),
    femaleImage: require('../../../assets/images/Fshalwer.png'),
    color: ['#2a2a1a', '#1a1a0f'],
    accent: '#FCD34D',
  },
  {
    type: 'Shirts',
    image: require('../../../assets/images/shirt.png'),
    femaleImage: require('../../../assets/images/Fshirt.png'),
    color: ['#1a2a3a', '#0f1a28'],
    accent: '#7DD3FC',
  },
  {
    type: 'Pico',
    image: require('../../../assets/images/pico.png'),
    femaleImage: require('../../../assets/images/pico.png'),
    color: ['#3a1a2a', '#280f1a'],
    accent: '#FB7185',
  },
  {
    type: 'Overlock',
    image: require('../../../assets/images/overlock.png'),
    femaleImage: require('../../../assets/images/overlock.png'),
    color: ['#1a3a3a', '#0f2828'],
    accent: '#2DD4BF',
  },
  {
    type: 'Button Hole',
    image: require('../../../assets/images/buttonhole.png'),
    femaleImage: require('../../../assets/images/buttonhole.png'),
    color: ['#3a2a1a', '#28180f'],
    accent: '#FB923C',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const AddServices = ({ route, navigation }) => {
  const { email } = route.params;

  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState('my');   // 'my' | 'add'
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

  const [newService, setNewService] = useState({
    service_types: [],
    gender: 'both',
    description: '',
    price_range: '',
  });

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/services/get-services`,
        { params: { email } }
      );
      setServices(res.data.services || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch services');
    }
  };

  const toggleServiceType = (type) => {
    const current = newService.service_types;
    setNewService({
      ...newService,
      service_types: current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type],
    });
  };

  const addService = async () => {
    if (!newService.service_types.length) {
      Alert.alert('Error', 'Please select at least one service type');
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/services/add-services`,
        { email, services: [newService] }
      );
      Alert.alert('Success', 'Service added!');
      setNewService({ service_types: [], gender: 'both', description: '', price_range: '' });
      fetchServices();
      setActiveTab('my');
    } catch {
      Alert.alert('Error', 'Failed to add service');
    }
  };

  const deleteService = async (id) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/services/delete-service/${id}`
      );
      fetchServices();
    } catch {
      Alert.alert('Error', 'Failed to delete service');
    }
  };

  const saveEdit = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/services/update-service`,
        {
          email,
          id: editingId,
          service_types: editingData.service_types,
          gender: editingData.gender,
          description: editingData.description,
          price_range: editingData.price_range,
        }
      );
      Alert.alert('Success', 'Service updated!');
      setEditingId(null);
      setEditingData({});
      fetchServices();
    } catch {
      Alert.alert('Error', 'Failed to update service');
    }
  };

  // ── helpers ──
  const getCatalogue = (type) =>
    SERVICE_CATALOGUE.find(c => c.type === type) || SERVICE_CATALOGUE[0];

  const getServiceImage = (cat, gender) =>
    gender === 'women' ? cat.femaleImage : cat.image;

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
        {/* badge */}
        {services.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{services.length}</Text>
          </View>
        )}
      </View>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        {['my', 'add'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.85}
          >
            {activeTab === tab && (
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={StyleSheet.absoluteFill} borderRadius={12} />
            )}
            <Ionicons
              name={tab === 'my' ? 'list-outline' : 'add-circle-outline'}
              size={16}
              color={activeTab === tab ? '#fff' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'my' ? 'My Services' : 'Add Service'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════ MY SERVICES ═══════════ */}
        {activeTab === 'my' && (
          <>
            {services.length === 0 ? (
              <View style={styles.emptyWrap}>
                <LinearGradient colors={['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.04)']} style={styles.emptyIconBox}>
                  <Ionicons name="cut-outline" size={44} color="rgba(148,163,184,0.5)" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No services yet</Text>
                <Text style={styles.emptyDesc}>Tap "Add Service" to showcase your skills</Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setActiveTab('add')} activeOpacity={0.85}>
                  <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.emptyAddBtnGrad}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.emptyAddBtnText}>Add Your First Service</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              services.map(s => {
                const isEditing = editingId === s.id;
                const cat = getCatalogue(s.service_types?.[0]);
                return (
                  <View key={s.id} style={styles.serviceCard}>
                    {/* Card hero image */}
                    <LinearGradient colors={cat.color} style={styles.cardHero}>
                      <Image source={getServiceImage(cat, s.gender)} style={styles.cardHeroImage} resizeMode="contain" />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.cardHeroOverlay}
                      />
                      <View style={styles.cardHeroBadge}>
                        <View style={[styles.accentDot, { backgroundColor: cat.accent }]} />
                        <Text style={styles.cardHeroType} numberOfLines={1}>
                          {s.service_types.join(' · ')}
                        </Text>
                      </View>
                      <View style={[styles.genderPill, { borderColor: cat.accent + '66' }]}>
                        <Text style={[styles.genderPillText, { color: cat.accent }]}>
                          {(s.gender || 'both').charAt(0).toUpperCase() + (s.gender || 'both').slice(1)}
                        </Text>
                      </View>
                    </LinearGradient>

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
                          {s.description ? (
                            <Text style={styles.cardDesc} numberOfLines={7}>{s.description}</Text>
                          ) : null}
                          <View style={styles.priceRow}>

                            <Text style={styles.priceText}>
                              {s.price_range} Rs
                            </Text>
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

        {/* ═══════════ ADD SERVICE ═══════════ */}
        {activeTab === 'add' && (
          <>
            {/* Section title */}
            <View style={styles.sectionRow}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Choose Service Types</Text>
            </View>


            {/* Service type grid */}
            <View style={styles.catalogueGrid}>
              {SERVICE_CATALOGUE.map(cat => {
                const selected = newService.service_types.includes(cat.type);
                const disabled = addedTypes.has(cat.type);
                return (
                  <TouchableOpacity
                    key={cat.type}
                    style={[
                      styles.catalogCard,
                      selected && styles.catalogCardSelected,
                      disabled && styles.catalogCardDisabled,
                    ]}
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
                      <Text style={[styles.catalogLabelText, selected && { color: '#fff' }]} numberOfLines={2}>
                        {cat.type}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Gender */}
            <View style={[styles.sectionRow, { marginTop: 8 }]}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Gender</Text>
            </View>
            <View style={styles.genderRow}>
              {['men', 'women', 'both'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, newService.gender === g && styles.genderBtnActive]}
                  onPress={() => setNewService({ ...newService, gender: g })}
                  activeOpacity={0.85}
                >
                  {newService.gender === g && (
                    <LinearGradient colors={['#3B82F6', '#2563EB']} style={StyleSheet.absoluteFill} borderRadius={14} />
                  )}
                  <Ionicons
                    name={g === 'men' ? 'man-outline' : g === 'women' ? 'woman-outline' : 'people-outline'}
                    size={16}
                    color={newService.gender === g ? '#fff' : '#64748b'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.genderBtnText, newService.gender === g && styles.genderBtnTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
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

            {/* Price */}
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

            {/* Submit */}
            <TouchableOpacity style={styles.submitBtn} onPress={addService} activeOpacity={0.85}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.submitBtnGrad}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Add Service</Text>
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

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
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

  // Tabs
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
    paddingVertical: 11, borderRadius: 12, overflow: 'hidden',
  },
  tabBtnActive: {},
  tabText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Scroll
  scroll: {
    paddingHorizontal: PAGE_GUTTER,
    paddingBottom: 50,
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    width: '100%',
  },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyIconBox: { width: 90, height: 90, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptyDesc: { color: '#64748b', fontSize: 13, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  emptyAddBtn: { borderRadius: 16, overflow: 'hidden' },
  emptyAddBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, gap: 8 },
  emptyAddBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // My Services cards
  serviceCard: {
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    marginBottom: 16,
    overflow: 'hidden',
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
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  genderPillText: { fontSize: 11, fontWeight: '800' },

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

  // Add Service — section labels
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 20 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  sectionHint: { color: '#475569', fontSize: 12, fontWeight: '600', marginBottom: 16, marginTop: -6 },

  // Catalogue grid
  catalogueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  catalogCard: {
    width: CARD_W,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  catalogCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  catalogCardDisabled: { opacity: 0.45 },
  catalogCardBg: {
    height: CARD_W * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  catalogImg: {
    width: '90%',
    height: '90%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  disabledOverlay: {
    position: 'absolute',
    top: 8, right: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 4,
  },
  disabledText: { color: '#10B981', fontSize: 10, fontWeight: '700' },
  catalogLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,15,28,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  fieldLabel: {
    fontSize: 11, color: '#64748b', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },

  // Submit
  submitBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 8 },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
