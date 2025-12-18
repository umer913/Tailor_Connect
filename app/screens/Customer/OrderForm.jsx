import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";

import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { PinchGestureHandler, State } from "react-native-gesture-handler";

const window = Dimensions.get("window");

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
    Sherwani: {
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
    Shirts: {
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
  const { price, serviceType, gender, images: passedImages } = route.params || {};
  const images = Array.isArray(passedImages) ? passedImages : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedFormGender, setSelectedFormGender] = useState(null);
const [fabricImage, setFabricImage] = useState(null);

  const [measurements, setMeasurements] = useState({ male: {}, female: {} });
  const [errors, setErrors] = useState({});
  const [selectedOptionGroups, setSelectedOptionGroups] = useState({});

  const scale = useRef(new Animated.Value(1)).current;

  // Image carousel controls
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
    if (!selectedFormGender || !serviceType || !measurementFields[serviceType]) return false;
    const fields = measurementFields[serviceType][selectedFormGender];
    const allMeasurementsFilled = fields.every((field) => {
      const key = field.toLowerCase().replace(/\s+/g, "");
      return measurements[selectedFormGender][key] && measurements[selectedFormGender][key].trim() !== "";
    });

    const optionGroups = serviceOptionsGrouped[selectedFormGender]?.[serviceType];
    if (!optionGroups) return allMeasurementsFilled;

    const allOptionsSelected = Object.keys(optionGroups).every(
      (groupName) => selectedOptionGroups[groupName]
    );

    return allMeasurementsFilled && allOptionsSelected;
  };

  const handleSubmitOrder = () => {
    const finalGender = (gender || "").toLowerCase();
    const formGender = finalGender === "both" ? selectedFormGender : finalGender;

    if (!formGender) {
      Alert.alert("Choose gender", "Please choose Men or Women form.");
      return;
    }

    if (!isFormValid()) {
      Alert.alert(
        "Missing fields",
        `Please fill all required measurement fields and select options for ${
          formGender === "male" ? "men" : "women"
        }.`
      );
      return;
    }

    // Submit your order here (API call or logic)
    console.log("Placing order:", {
      serviceType,
      price,
      measurements: measurements[formGender],
      options: selectedOptionGroups,
    });

    Alert.alert("Order placed", "Your order & measurements were submitted.");
    setBuyModalVisible(false);
    setSelectedFormGender(null);
    setMeasurements({ male: {}, female: {} });
    setErrors({});
    setSelectedOptionGroups({});
  };

  const openBuyModal = () => {
    const g = (gender || "").toLowerCase();
    if (g === "male" || g === "men") setSelectedFormGender("male");
    else if (g === "female" || g === "women") setSelectedFormGender("female");
    else setSelectedFormGender(null);
    setBuyModalVisible(true);
  };

  const fields =
    serviceType && selectedFormGender && measurementFields[serviceType]
      ? measurementFields[serviceType][selectedFormGender]
      : [];

  const optionsGroups =
    serviceOptionsGrouped[selectedFormGender]?.[serviceType] || {};
const pickFabricImage = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission required", "Gallery permission is needed.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.7,
  });

  if (!result.canceled) {
    setFabricImage(result.assets[0].uri);
  }
};

  return (
    <>
      <ScrollView  style={styles.container}>
        <Text style={styles.title}>{serviceType || "Service"}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.newPrice}>Rs. {price}</Text>
        </View>
        <Text style={styles.genderText}>Gender: {gender || "N/A"}</Text>

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
              <Image style={styles.mainImage} source={images[currentIndex]} />
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

        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => {
            if (noMeasurementServices.includes(serviceType)) {
              Alert.alert(
                "Order placed",
                "Your order has been submitted successfully."
              );
              return;
            }
            openBuyModal();
          }}
        >
          <Text style={styles.buyText}>Buy It Now</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Zoom Modal */}
      <Modal visible={zoomVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <PinchGestureHandler
            onGestureEvent={Animated.event([{ nativeEvent: { scale: scale } }], { useNativeDriver: true })}
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

      {/* Buy Modal */}
      <Modal visible={buyModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.buyModalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.buyModalContainer}
            >
              <View style={styles.buyCard}>
                <Text style={styles.buyTitle}>Place Order — Measurements</Text>

                {/* Gender selector if needed */}
                {((gender || "").toLowerCase() === "both" || (gender || "").trim() === "") && (
                  <View style={styles.selectorRow}>
                    {["male", "female"].map((genderKey) => (
                      <TouchableOpacity
                        key={genderKey}
                        style={[
                          styles.selectorBtn,
                          selectedFormGender === genderKey && styles.selectorBtnActive,
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
                            selectedFormGender === genderKey && styles.selectorTextActive,
                          ]}
                        >
                          {genderKey === "male" ? "Men" : "Women"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <ScrollView   >
                  {/* Measurement Inputs */}
                  {fields.length > 0 ? (
                    <>
                      {fields.map((field) => {
                        const key = field.toLowerCase().replace(/\s+/g, "");
                        const value = measurements[selectedFormGender]?.[key] || "";
                        const hasError = errors[key];

                        return (
                          
                          <View key={key} style={{ marginBottom: 8 }}>
                            <TextInput
                              placeholder={`${field} (${measurementRanges[field] || "inches"} in)`}
                              placeholderTextColor="#777"
                              value={value}
                              onChangeText={(v) => setField(selectedFormGender, field, v)}
                              maxLength={4}
                              keyboardType="numeric"
                              style={[styles.input, hasError && { borderColor: "red" }]}
                            />
                            {hasError && (
                              <Text style={{ color: "red", fontSize: 12, marginTop: -8, marginBottom: 8 }}>
                                This field is required
                              </Text>
                            )}
                          </View>
                        );
                      })}

                      {/* Dropdown single select options */}
                      {Object.entries(optionsGroups).map(([groupName, options]) => (
                        <View key={groupName} style={{ marginBottom: 16 }}>
                          <Text style={{ fontWeight: "700", marginBottom: 6 }}>{groupName}</Text>
                          <View style={[styles.pickerContainer, selectedOptionGroups[groupName] == null && { borderColor: "red" }]}>
                            <Picker
                              selectedValue={selectedOptionGroups[groupName] || ""}
                              onValueChange={(value) => {
                                setSelectedOptionGroups((prev) => ({
                                  ...prev,
                                  [groupName]: value,
                                }));
                              }}
                            
                             itemStyle={{ fontSize: 20,color:"#000" }}     
                            >
                              <Picker.Item label={`Select ${groupName}`} value="" />
                              {options.map((opt) => (
                                <Picker.Item key={opt} label={opt} value={opt} />
                              ))}
                            </Picker>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text style={{ textAlign: "center", marginTop: 20 }}>
                      No measurement fields available for this service.
                    </Text>
                  )}
                </ScrollView>
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
        <Image source={{ uri: fabricImage }} style={styles.fabricImage} />
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

                <View style={styles.buyButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => {
                      setBuyModalVisible(false);
                      setSelectedFormGender(null);
                      setErrors({});
                      setSelectedOptionGroups({});
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
                    <Text style={styles.modalBtnTextSubmit}>Submit Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: '100%',
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  newPrice: {
    color: "#d92323",
    fontWeight: "700",
    fontSize: 22,
  },
  genderText: {
    fontSize: 14,
    color: "#444",
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
    backgroundColor: "#222",
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
    borderColor: "#aaa",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
    color: "#111",
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  buyModalContainer: {
    width: "100%",
  },
  buyCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  buyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },

  selectorRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  selectorBtn: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 6,
  },
  selectorBtnActive: {
    backgroundColor: "#333",
    borderColor: "#333",
  },
  selectorText: {
    color: "#333",
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
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 5,
        marginBottom:20
  },
  modalBtnCancel: {
    backgroundColor: "#eee",

  },
  modalBtnSubmit: {
    backgroundColor: "#222",
  },
  modalBtnTextCancel: {
    color: "#444",
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
    borderColor: "#aaa",
    borderRadius: 8,
    overflow: "hidden",
    height: 40,
    justifyContent: "center",
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#fff",
  },

  fabricUploadBox: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    marginBottom: 16,
  },
  fabricImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  removeImageBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  
  removeImageText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
