import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from "react";

import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { PinchGestureHandler, State } from "react-native-gesture-handler";

const window = Dimensions.get("window");
const SCREEN_W = window.width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;
const isWeb = Platform.OS === "web";
const buyModalMaxWidth = isWeb ? Math.min(window.width * 0.72, 760) : undefined;
const buyModalMaxHeight = isWeb ? Math.min(window.height * 0.82, 780) : undefined;

const measurementFields = {
  "Shalwar Kameez": {
    male: ["Chest", "Shoulder", "Sleeve", "Bicep", "Wrist", "Waist", "Hip", "Inseam", "Shirt Length", "Neck"],
    female: ["Bust", "Under Bust", "Waist", "Shoulder", "Armhole", "Sleeve", "Hip", "Length", "Neck"],
  },
  Kurta: {
    male: ["Chest", "Shoulder", "Sleeve", "Bicep", "Wrist", "Waist", "Hip", "Length", "Neck"],
    female: ["Bust", "Under Bust", "Waist", "Shoulder", "Armhole", "Sleeve", "Hip", "Length", "Neck"],
  },
  Sherwani: {
    male: ["Chest", "Shoulder", "Sleeve", "Bicep", "Wrist", "Waist", "Hip", "Length", "Neck"],
    female: ["Bust", "Under Bust", "Waist", "Shoulder", "Armhole", "Sleeve", "Hip", "Length", "Neck"],
  },
  Blazers: {
    male: ["Chest", "Shoulder", "Sleeve", "Bicep", "Wrist", "Waist", "Hip", "Length", "Neck"],
    female: ["Bust", "Under Bust", "Waist", "Shoulder", "Armhole", "Sleeve", "Hip", "Length", "Neck"],
  },
  "Dress Pants": {
    male: ["Waist", "Hip", "Length", "Inseam"],
    female: ["Waist", "Hip", "Length"],
  },
  "2 Piece Suits": {
    male: ["Chest", "Shoulder", "Sleeve", "Bicep", "Wrist", "Waist", "Hip", "Length", "Neck"],
    female: ["Bust", "Under Bust", "Waist", "Shoulder", "Armhole", "Sleeve", "Hip", "Length", "Neck"],
  },
  "3 Piece Suits": {
    male: ["Chest", "Shoulder", "Sleeve", "Bicep", "Wrist", "Waist", "Hip", "Length", "Neck"],
    female: ["Bust", "Under Bust", "Waist", "Shoulder", "Armhole", "Sleeve", "Hip", "Length", "Neck"],
  },
  Pyjama: {
    male: ["Waist", "Hip", "Length", "Inseam"],
    female: ["Waist", "Hip", "Length"],
  },
  Waistcoats: {
    male: ["Chest", "Waist", "Length", "Neck"],
    female: ["Bust", "Waist", "Length", "Neck"],
  },
  Shirts: {
    male: ["Chest", "Shoulder", "Sleeve", "Bicep", "Wrist", "Waist", "Neck", "Shirt Length"],
    female: ["Bust", "Under Bust", "Waist", "Shoulder", "Armhole", "Sleeve", "Neck", "Length"],
  },
  Shalwar: {
    male: ["Waist", "Hip", "Length", "Inseam"],
    female: ["Waist", "Hip", "Length"],
  },
};

const noMeasurementServices = [
  "Pico",
  "Overlock",
  "Button Hole",
];

const parseNumericPrice = (rawPrice) => {
  const firstMatch = String(rawPrice || "").match(/\d+(?:\.\d+)?/);
  return firstMatch ? Number.parseFloat(firstMatch[0]) : 0;
};

const measurementRanges = {
  Chest: "34–48",
  Bust: "30–46",
  "Under Bust": "26–42",
  Shoulder: "14–20",
  Sleeve: "20–26",
  Bicep: "10–18",
  Wrist: "6–9",
  Waist: "24–44",
  Hip: "32–50",
  Length: "36–48",
  "Shirt Length": "26–36",
  Inseam: "26–34",
  Neck: "13–18",
  Armhole: "14–22",
};

const serviceOptionsGrouped = {
  male: {
    "2 Piece Suits": {
      "Suit Fit": ["Slim", "Regular", "Relaxed"],
      "Lapel Style": ["Peak Lapel", "Notched Lapel", "Shawl Lapel"],
      "Vent Style": ["Italian Vent", "American Vent", "English Vent"],
    },
    "3 Piece Suits": {
      "Suit Fit": ["Slim", "Regular", "Relaxed"],
      "Lapel Style": ["Peak Lapel", "Notched Lapel", "Shawl Lapel"],
      "Vent Style": ["Italian Vent", "American Vent", "English Vent"],
    },
    "Sherwani": {
      "Front Style": ["Open", "Closed"],
    },
    "Shalwar Kameez": {
      "Daman Style": ["Straight", "Round"],
      "Sleeve Style": ["Cuff Sleeve", "Simple Sleeve"],
      "Pocket": ["Front Pocket", "Side Pocket"],
    },
    "Dress Pants": {
      "Front Style": ["Flat Front", "Pleated"],
      "Bottom Style": ["Cuffed", "Plain"],
    },
    "Shirts": {
      "Collar Type": ["Collared", "Non-collared"],
      "Cuff Style": ["Buttoned", "Plain"],
      "Fit": ["Slim", "Regular"],
    },
  },
  female: {
    "Shalwar Kameez": {
      "Daman Style": ["Straight", "A-line"],
      "Neck Style": ["Boat Neck", "Round Neck", "V Neck"],
      "Side Slit Height": ["Short", "Medium", "Long"],
    },

    "Dress Pants": {
      "Waist Style": ["High Waist", "Mid Waist"],
      "Leg Style": ["Flared", "Straight"],
    },
    "Shirts": {
      "Fit": ["Fitted", "Loose"],
      "Collar": ["Collared", "Collarless"],
    },
  },
};

export default function OrderForm({ route, navigation }) {
  const { CustomerEmail, tailorEmail, price, serviceType, gender, images: passedImages, description, name } = route.params || {};

  console.log("Customer Email:", CustomerEmail);
  console.log("Tailor=", tailorEmail)

  const images = Array.isArray(passedImages) ? passedImages : [];
  const [openGroup, setOpenGroup] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedFormGender, setSelectedFormGender] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [fabricImage, setFabricImage] = useState(null);

  const [measurements, setMeasurements] = useState({ male: {}, female: {} });
  const [errors, setErrors] = useState({});
  const [selectedOptionGroups, setSelectedOptionGroups] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [activeCartItem, setActiveCartItem] = useState(null);

  const [scale] = useState(new Animated.Value(1));

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const stored = await AsyncStorage.getItem('customer_cart');
        if (stored) setCart(JSON.parse(stored));
      } catch (e) { /* ignore */ }
    };
    loadCart();
  }, []);

  const saveCart = async (newCart) => {
    setCart(newCart);
    await AsyncStorage.setItem('customer_cart', JSON.stringify(newCart));
  };

  const addToCart = () => {
    const item = {
      id: Date.now().toString(),
      serviceType,
      price,
      gender,
      tailorEmail,
      tailorName: name,
      image: images.length > 0 ? images[0] : null,
    };
    const newCart = [...cart, item];
    saveCart(newCart);
    Alert.alert('Added to Cart', `${serviceType} has been added to your cart.`);
  };

  const removeFromCart = (id) => {
    const newCart = cart.filter((item) => item.id !== id);
    saveCart(newCart);
  };

  // Define fields and optionGroups based on current selections
  function normalizeGender(gender) {
    if (!gender) return null;
    gender = gender.toLowerCase();
    if (gender === "men" || gender === "male") return "male";
    if (gender === "women" || gender === "female") return "female";
    if (gender === "both") return "both";
    return null;
  }

  const normalizedGender = normalizeGender(gender);
  const effectiveGender = selectedFormGender || normalizedGender;

  // Use activeCartItem data when ordering from cart, otherwise page-level props
  const activeServiceType = activeCartItem ? activeCartItem.serviceType : serviceType;
  const activeGenderRaw = activeCartItem ? activeCartItem.gender : gender;
  const activeNormalizedGender = normalizeGender(activeGenderRaw);
  const activeEffectiveGender = selectedFormGender || activeNormalizedGender;
  const activeUnitPrice = parseNumericPrice(activeCartItem ? activeCartItem.price : price);
  const activeTotalPrice = Number((activeUnitPrice * orderQuantity).toFixed(2));

  const fields = measurementFields[activeServiceType]?.[activeEffectiveGender] || [];
  const optionsGroups = serviceOptionsGrouped[activeEffectiveGender]?.[activeServiceType] || {};


  // Image moving controls
  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scale.setValue(1);
    }
  };
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      scale.setValue(1);
    }
  };
  console.log("selectedFormGender:", selectedFormGender);
  console.log("gender prop:", gender);
  console.log("effectiveGender:", effectiveGender);
  console.log("fields:", fields);

  // Pick fabric image from gallery
  const pickFabricImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setFabricImage(result.assets[0].uri);
    }
  };

  // Open the buy modal
  const openBuyModal = () => {
    setBuyModalVisible(true);
  };

  const setField = (genderKey, key, value) => {
    const fieldKey = key.toLowerCase().replace(/\s+/g, "");
    setMeasurements((prev) => ({
      ...prev,
      [genderKey]: {
        ...prev[genderKey],
        [fieldKey]: value,
      },
    }));

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (!value || value.trim() === "") {
        newErrors[fieldKey] = true;
      } else {
        delete newErrors[fieldKey];
      }
      return newErrors;
    });
  };

  const isFormValid = () => {
    const svcType = activeCartItem ? activeCartItem.serviceType : serviceType;
    if (!selectedFormGender || !svcType || !measurementFields[svcType]) return false;
    const requiredFields = measurementFields[svcType][selectedFormGender];
    const allMeasurementsFilled = requiredFields.every((field) => {
      const key = field.toLowerCase().replace(/\s+/g, "");
      return measurements[selectedFormGender][key] && measurements[selectedFormGender][key].trim() !== "";
    });

    const optionGroups = serviceOptionsGrouped[selectedFormGender]?.[svcType];
    if (!optionGroups) return allMeasurementsFilled;

    const allOptionsSelected = Object.keys(optionGroups).every(
      (groupName) => selectedOptionGroups[groupName]
    );

    return allMeasurementsFilled && allOptionsSelected;
  };

  const handleSubmitOrder = async () => {
    const srcGender = activeCartItem ? activeCartItem.gender : gender;
    const finalGenderRaw = (srcGender || "").toLowerCase();
    const finalGender = normalizeGender(finalGenderRaw);
    const formGender = finalGender === "both" ? selectedFormGender : finalGender;

    if (!formGender) {
      Alert.alert("Choose gender", "Please choose Men or Women form.");
      return;
    }

    if (!isFormValid()) {
      Alert.alert(
        "Missing fields",
        `Please fill all required measurement fields and select options for ${formGender === "male" ? "men" : "women"
        }.`
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("tailor_email", activeCartItem ? activeCartItem.tailorEmail : tailorEmail);
      formData.append("tailor_name", activeCartItem ? activeCartItem.tailorName : name);
      formData.append("customer_email", CustomerEmail);
      formData.append("service_type", activeCartItem ? activeCartItem.serviceType : serviceType);
      formData.append("gender", formGender);
      formData.append("price", (activeCartItem ? activeCartItem.price : price).toString());
      formData.append("quantity", orderQuantity.toString());
      formData.append("measurements", JSON.stringify(measurements[formGender]));
      formData.append("options", JSON.stringify(selectedOptionGroups));

      if (fabricImage) {
        const uriParts = fabricImage.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append("fabric", {
          uri: fabricImage,
          name: `fabric.${fileType}`,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        });
      }

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        "https://tailorconnect-production.up.railway.app/orders/place-order",
        {
          method: "POST",
          body: formData,
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        }
      );

      const resData = await response.json();

      if (!response.ok || resData.error) {
        throw new Error(resData.error || `Request failed with status ${response.status}`);
      }

      // If ordering from cart, remove item from cart
      if (activeCartItem) {
        removeFromCart(activeCartItem.id);
      }

      // Reset form state
      setBuyModalVisible(false);
      setSelectedFormGender(null);
      setMeasurements({ male: {}, female: {} });
      setErrors({});
      setSelectedOptionGroups({});
      setFabricImage(null);
      setActiveCartItem(null);
      navigation.navigate("Form", {
        CustomerEmail: CustomerEmail,
        tailorEmail: activeCartItem ? activeCartItem.tailorEmail : tailorEmail,
        name: activeCartItem ? activeCartItem.tailorName : name,
        orderId: resData.order_id,
      })
      // Navigate after successful submission
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to place order.");
    }
  };
  const submitOrderWithoutMeasurements = async () => {
    try {
      const formData = new FormData();
      formData.append("tailor_email", tailorEmail);
      formData.append("tailor_name", name);
      formData.append("customer_email", CustomerEmail);
      formData.append("service_type", serviceType);
      const genderToSend = normalizeGender(gender) === "both" ? (selectedFormGender || "male") : normalizeGender(gender) || "male";
      formData.append("gender", genderToSend);
      formData.append("price", price.toString());
      formData.append("quantity", orderQuantity.toString());
      formData.append("measurements", JSON.stringify({})); // empty
      formData.append("options", JSON.stringify({}));      // empty

      if (fabricImage) {
        const uriParts = fabricImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append("fabric", {
          uri: fabricImage,
          name: `fabric.${fileType}`,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        });
      }

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        "https://tailorconnect-production.up.railway.app/orders/place-order",
        {
          method: "POST",
          body: formData,
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        }
      );

      const resData = await response.json();

      if (!response.ok || resData.error) {
        throw new Error(resData.error || `Request failed with status ${response.status}`);
      }

      Alert.alert(
        "Order placed",
        "Your order has been submitted successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("Form", {
                CustomerEmail: CustomerEmail,
                tailorEmail: tailorEmail,
                name: name,
                orderId: resData.order_id,
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to place order.");
    }
  };

  return (
    <LinearGradient colors={["#0f0f13", "#1a0610", "#2a0a18"]} style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#E6B0B0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartIconButton}
            onPress={() => setCartModalVisible(true)}
          >
            <Ionicons name="cart" size={24} color="#E6B0B0" />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>



        {/* Service Title */}
        <Text style={styles.title}>{serviceType || "Service"}</Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.newPrice}>Rs. {price}</Text>
        </View>

        {/* Gender */}
        <Text style={styles.genderText}>Gender: {gender || "N/A"}</Text>

        {/* Image Slider */}
        {images.length > 0 ? (
          <View style={styles.imageWrapper}>
            <TouchableOpacity
              style={styles.leftArrow}
              onPress={handlePrev}
              disabled={currentIndex === 0}
            >
              <Text style={styles.arrowText}>{"<"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setZoomVisible(true)}
              style={{ flex: 1 }}
            >
              <Image
                style={styles.mainImage}
                source={images[currentIndex]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rightArrow}
              onPress={handleNext}
              disabled={currentIndex === images.length - 1}
            >
              <Text style={styles.arrowText}>{">"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ textAlign: "center", marginVertical: 20 }}>
            No images available
          </Text>
        )}

        {/* Buy Button */}
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => {
            setActiveCartItem(null);
            if (noMeasurementServices.includes(serviceType)) {
              submitOrderWithoutMeasurements();
              return;
            }

            const lowerGender = normalizeGender(gender);
            setSelectedFormGender(
              lowerGender === "male" || lowerGender === "female"
                ? lowerGender
                : null
            );
            setBuyModalVisible(true);
          }}
        >
          <Text style={styles.buyText}>Buy It Now</Text>
        </TouchableOpacity>

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={addToCart}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>


      {/* Zoom Modal */}
      <Modal visible={zoomVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <PinchGestureHandler
            onGestureEvent={Animated.event(
              [{ nativeEvent: { scale: scale } }],
              { useNativeDriver: true }
            )}
            onHandlerStateChange={(event) => {
              if (event.nativeEvent.oldState === State.ACTIVE) {
                let newScale = event.nativeEvent.scale;
                if (newScale < 1 || newScale > 4) {
                  Animated.spring(scale, {
                    toValue: Math.min(Math.max(newScale, 1), 4),
                    useNativeDriver: true,
                  }).start();
                }
              }
            }}
          >
            <Animated.Image
              source={images[currentIndex]}
              style={[styles.zoomedImage, { transform: [{ scale }] }]}
            />
          </PinchGestureHandler>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setZoomVisible(false);
              scale.setValue(1);
            }}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={cartModalVisible} transparent animationType="slide">
        <View style={styles.buyModalOverlay}>
          <View style={[styles.buyModalContainer, { alignItems: 'center' }]}>
            <View style={[styles.buyCard, { maxHeight: '70%' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.buyTitle}>My Cart</Text>
                <TouchableOpacity onPress={() => setCartModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color="#9D2A4B" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {cart.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: '#E6B0B0', marginTop: 20 }}>Your cart is empty.</Text>
                ) : (
                  cart.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.cartItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        const itemGender = normalizeGender(item.gender);
                        setActiveCartItem(item);
                        setSelectedFormGender(
                          itemGender === 'male' || itemGender === 'female' ? itemGender : null
                        );
                        setMeasurements({ male: {}, female: {} });
                        setErrors({});
                        setSelectedOptionGroups({});
                        setFabricImage(null);
                        setCartModalVisible(false);
                        setBuyModalVisible(true);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', fontSize: 15, color: '#fff' }}>{item.serviceType}</Text>
                        <Text style={{ color: '#E6B0B0', fontSize: 13 }}>Rs. {item.price}</Text>
                        <Text style={{ color: '#E6B0B0', fontSize: 12 }}>{item.tailorName}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ marginRight: 10 }}>
                        <Ionicons name="trash-outline" size={22} color="#9D2A4B" />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={20} color="#E6B0B0" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

            </View>
          </View>
        </View>
      </Modal>

      {/* Buy Modal */}
      <Modal visible={buyModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.buyModalOverlay}>
            <View style={styles.buyModalContainer}>
              <View
                style={[
                  styles.buyCard,
                  isWeb && { width: buyModalMaxWidth, maxWidth: buyModalMaxWidth, maxHeight: buyModalMaxHeight },
                ]}
              >
                <Text style={styles.buyTitle}>
                  Place Order — {activeServiceType || 'Measurements'}
                </Text>

                {/* Quantity Selector */}
                <View style={styles.quantitySection}>
                  <Text style={styles.quantityLabel}>Quantity: How many do you want to stitch?</Text>
                  <View style={styles.quantityControlRow}>
                    <TouchableOpacity
                      style={styles.decrementBtn}
                      onPress={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    >
                      <Text style={styles.decrementText}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.quantityDisplayBox}>
                      <Text style={styles.quantityDisplayText}>{orderQuantity}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.incrementBtn}
                      onPress={() => setOrderQuantity(Math.min(15, orderQuantity + 1))}
                    >
                      <Text style={styles.incrementText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: "#E6B0B0", marginTop: 8, fontSize: 13 }}>
                    Unit: Rs. {activeUnitPrice} | Total: Rs. {activeTotalPrice}
                  </Text>
                </View>

                {/* Gender Selector */}
                {((activeGenderRaw || "").toLowerCase() === "both" ||
                  (activeGenderRaw || "").trim() === "") && (
                    <View style={styles.selectorRow}>
                      {[
                        "male",
                        "female"
                      ].map((genderKey) => (
                        <TouchableOpacity
                          key={genderKey}
                          style={[
                            styles.selectorBtn,
                            selectedFormGender === genderKey &&
                            styles.selectorBtnActive,
                          ]}
                          onPress={() => {
                            setSelectedFormGender(genderKey);
                            setErrors({});
                            setSelectedOptionGroups({});
                          }}
                        >
                          <Text
                            style={[
                              styles.selectorText,
                              selectedFormGender === genderKey &&
                              styles.selectorTextActive,
                            ]}
                          >
                            {genderKey === "male" ? "Men" : "Women"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                <ScrollView
                  style={styles.buyScroll}
                  contentContainerStyle={styles.buyScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  {/* Measurement Fields */}
                  {fields.length > 0 ? (
                    <>
                      {fields.map((field) => {
                        const key = field
                          .toLowerCase()
                          .replace(/\s+/g, "");
                        const value =
                          measurements[selectedFormGender]?.[key] || "";
                        const hasError = errors[key];

                        return (
                          <View key={key} style={{ marginBottom: 8 }}>
                            <Text style={{ fontWeight: "700", marginBottom: 4 }}>{field}</Text>
                            <TextInput
                              placeholder={`${field} (${measurementRanges[field] || "inches"} in)`}
                              placeholderTextColor="#777"
                              value={value}
                              onChangeText={(v) => {
                                const numericValue = v.replace(
                                  /[^0-9.]/g,
                                  ""
                                );
                                setField(
                                  selectedFormGender,
                                  field,
                                  numericValue
                                );
                              }}
                              maxLength={4}
                              keyboardType="numeric"
                              style={[
                                styles.input,
                                hasError && { borderColor: "red" },
                              ]}
                            />
                            {hasError && (
                              <Text
                                style={{
                                  color: "red",
                                  fontSize: 12,
                                  marginTop: -8,
                                  marginBottom: 8,
                                }}
                              >
                                This field is required
                              </Text>
                            )}
                          </View>
                        );
                      })}

                      {/* Options */}
                      {Object.entries(optionsGroups).map(
                        ([groupName, options]) => (
                          <View key={groupName} style={{ marginBottom: 16 }}>
                            <Text style={{ fontWeight: "700", marginBottom: 8, fontSize: 14 }}>
                              {groupName}
                            </Text>

                            {/* Custom Dropdown Button */}
                            <TouchableOpacity
                              style={[
                                styles.dropdownButton,
                                selectedOptionGroups[groupName] == null && { borderColor: "#FF6B6B" },
                              ]}
                              onPress={() => setOpenDropdown(openDropdown === groupName ? null : groupName)}
                            >
                              <Text style={[
                                styles.dropdownButtonText,
                                !selectedOptionGroups[groupName] && { color: "#999" }
                              ]}>
                                {selectedOptionGroups[groupName] || `Select ${groupName}`}
                              </Text>
                              <Ionicons
                                name={openDropdown === groupName ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#E6B0B0"
                              />
                            </TouchableOpacity>

                            {/* Dropdown Menu */}
                            {openDropdown === groupName && (
                              <View style={styles.dropdownMenu}>
                                {options.map((opt) => (
                                  <TouchableOpacity
                                    key={opt}
                                    style={[
                                      styles.dropdownOption,
                                      selectedOptionGroups[groupName] === opt && styles.dropdownOptionSelected,
                                    ]}
                                    onPress={() => {
                                      setSelectedOptionGroups((prev) => ({
                                        ...prev,
                                        [groupName]: opt,
                                      }));
                                      setOpenDropdown(null);
                                    }}
                                  >
                                    <Text style={[
                                      styles.dropdownOptionText,
                                      selectedOptionGroups[groupName] === opt && styles.dropdownOptionTextSelected,
                                    ]}>
                                      {opt}
                                    </Text>
                                    {selectedOptionGroups[groupName] === opt && (
                                      <Ionicons name="checkmark-circle" size={18} color="#E6B0B0" />
                                    )}
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        )
                      )}
                    </>
                  ) : (
                    <Text style={{ textAlign: "center", marginTop: 20 }}>

                    </Text>
                  )}
                </ScrollView>

                {/* Fabric Upload */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                    Upload Fabric Picture
                  </Text>

                  <TouchableOpacity
                    style={styles.fabricUploadBox}
                    onPress={pickFabricImage}
                    activeOpacity={0.8}
                  >
                    {fabricImage ? (
                      <>
                        <Image
                          source={{ uri: fabricImage }}
                          style={styles.fabricImage}
                        />
                        <TouchableOpacity
                          style={styles.removeImageBtn}
                          onPress={() => setFabricImage(null)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.removeImageText}>Remove</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={{ color: "#777", textAlign: "center" }}>
                        Tap to upload fabric image
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Buttons */}
                <View style={styles.buyButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => {
                      setBuyModalVisible(false);
                      setSelectedFormGender(null);
                      setErrors({});
                      setSelectedOptionGroups({});
                      setActiveCartItem(null);
                    }}
                  >
                    <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      styles.modalBtnSubmit,
                      { opacity: isFormValid() ? 1 : 0.6 },
                    ]}
                    onPress={handleSubmitOrder}
                    disabled={!isFormValid()}
                  >
                    <Text style={styles.modalBtnTextSubmit}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: PAGE_GUTTER,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    color: "#fff",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  newPrice: {
    color: "#E6B0B0",
    fontWeight: "700",
    fontSize: 22,
  },
  genderText: {
    fontSize: 14,
    color: "#E6B0B0",
    marginBottom: 20,
  },

  imageWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: 350,
    resizeMode: "contain",
    borderRadius: 12,
  },

  arrowBase: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 50,
    zIndex: 10,
  },
  leftArrow: {
    left: 5,
  },
  rightArrow: {
    right: 5,
  },
  arrowText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },

  buyButton: {
    marginTop: 12,
    backgroundColor: "#D6406A",
    paddingVertical: 14,
    borderRadius: 8,
  },
  buyText: {
    color: "#eee",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
    color: "#fff",
    backgroundColor: "rgba(26, 6, 16, 0.5)",
  },
  inputError: {
    borderColor: "red",
  },

  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  quantitySection: {
    backgroundColor: "rgba(26, 6, 16, 0.5)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.2)",
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E6B0B0",
    marginBottom: 10,
  },
  quantityControlRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  decrementBtn: {
    width: 40,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#c0392b",
  },
  decrementText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  incrementBtn: {
    width: 40,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#229954",
  },
  incrementText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  quantityDisplayBox: {
    minWidth: 50,
    height: 42,
    borderRadius: 8,
    backgroundColor: "rgba(26, 6, 16, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.3)",
  },
  quantityDisplayText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  descriptionCard: {
    backgroundColor: "rgba(26, 6, 16, 0.45)",
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.2)",
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#fff",
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#fff",
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomedImage: {
    width: window.width * 0.9,
    height: window.height * 0.75,
    resizeMode: "contain",
    borderRadius: 12,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  closeText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },

  buyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,15,19,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  buyModalContainer: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buyCard: {
    backgroundColor: "#1a0610",
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.3)",
    padding: 18,
    borderRadius: 22,
    width: "100%",
    maxWidth: 760,
    maxHeight: "85%",
  },
  buyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: "#fff",
  },

  selectorRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  selectorBtn: {
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.3)",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 6,
    marginVertical: 12,
  },
  imageWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  leftArrow: {
    position: "absolute",
    left: 5,
    backgroundColor: "#00000050",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 50,
    zIndex: 10,
  },

  rightArrow: {
    position: "absolute",
    right: 5,
    backgroundColor: "#00000050",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 50,
    zIndex: 10,
  },

  selectorBtnActive: {
    backgroundColor: "#9D2A4B",
    borderColor: "#9D2A4B",
  },
  selectorText: {
    color: "#E6B0B0",
    fontWeight: "700",
    fontSize: 14,
  },
  selectorTextActive: {
    color: "#fff",
  },

  buyButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buyScroll: {
    flexGrow: 0,
  },
  buyScrollContent: {
    paddingBottom: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 5,
    marginBottom: 20
  },
  modalBtnCancel: {
    backgroundColor: "rgba(157, 42, 75, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.3)",
  },
  modalBtnSubmit: {
    backgroundColor: "#9D2A4B",
  },
  modalBtnTextCancel: {
    color: "#E6B0B0",
    fontWeight: "700",
    textAlign: "center",
  },
  modalBtnTextSubmit: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.3)",
    borderRadius: 8,
    overflow: "hidden",
    height: 44,
    justifyContent: "center",
    width: "100%",
    alignSelf: "center",
    backgroundColor: "rgba(26, 6, 16, 0.7)",
  },

  fabricUploadBox: {
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.3)",
    borderRadius: 8,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(26, 6, 16, 0.5)",
    marginBottom: 16,
  },
  fabricImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  addToCartButton: {
    marginTop: 10,
    backgroundColor: '#9D2A4B',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d92323',
  },
  closeButtonText: {
    color: '#d92323',
    fontSize: 27,
    fontWeight: '700',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#9D2A4B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(157,42,75,0.15)',
  },
  cartMeasurementBox: {
    backgroundColor: 'rgba(157, 42, 75, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9D2A4B',
  },
  cartMeasurementTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#E6B0B0',
    marginBottom: 8,
  },
  cartMeasurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(157,42,75,0.15)',
  },
  cartMeasurementLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  cartMeasurementRange: {
    fontSize: 13,
    color: '#E6B0B0',
  },
  backButton: {
    width: 44,
    height: 44,
    padding: 8,
    backgroundColor: "rgba(157,42,75,0.15)",
    borderWidth: 1,
    borderColor: "rgba(157,42,75,0.3)",
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIconButton: {
    width: 44,
    height: 44,
    padding: 8,
    backgroundColor: 'rgba(157,42,75,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(157,42,75,0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  removeImageBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgb(0, 0, 0)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  removeImageText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(26, 6, 16, 0.7)",
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: "rgba(157, 42, 75, 0.3)",
    borderRadius: 8,
    backgroundColor: "rgba(26, 6, 16, 0.95)",
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(157, 42, 75, 0.15)",
  },
  dropdownOptionSelected: {
    backgroundColor: "rgba(157, 42, 75, 0.15)",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    flex: 1,
  },
  dropdownOptionTextSelected: {
    fontWeight: "700",
    color: "#E6B0B0",
  },
});