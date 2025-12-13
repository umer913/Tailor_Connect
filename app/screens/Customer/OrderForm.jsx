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

export default function OrderForm({ route, navigation }) {
  const { price, serviceType, gender, images: passedImages } = route.params || {};
  const images = Array.isArray(passedImages) ? passedImages : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedFormGender, setSelectedFormGender] = useState(null);

  // Measurements state keyed by gender ('male' or 'female')
  const [measurements, setMeasurements] = useState({ male: {}, female: {} });

  // Track errors for empty fields
  const [errors, setErrors] = useState({});

  const scale = useRef(new Animated.Value(1)).current;

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

  const onPinchEvent = Animated.event([{ nativeEvent: { scale } }], {
    useNativeDriver: true,
  });

  const onPinchStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      let newScale = event.nativeEvent.scale;
      if (newScale < 1 || newScale > 4) {
        Animated.spring(scale, {
          toValue: Math.min(Math.max(newScale, 1), 4),
          useNativeDriver: true,
        }).start();
      }
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

    // Update error state for this field
    setErrors((prev) => ({
      ...prev,
      [fieldKey]: !value || value.trim() === "",
    }));
  };

  // Validate all fields for current form gender are filled
  const isFormValid = () => {
    if (!selectedFormGender || !serviceType || !measurementFields[serviceType])
      return false;
    const fields = measurementFields[serviceType][selectedFormGender];
    return fields.every((field) => {
      const key = field.toLowerCase().replace(/\s+/g, "");
      return measurements[selectedFormGender][key] && measurements[selectedFormGender][key].trim() !== "";
    });
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
        `Please fill all required measurement fields for ${
          formGender === "male" ? "men" : "women"
        }.`
      );
      return;
    }

    console.log("Placing order:", {
      serviceType,
      price,
      measurements: measurements[formGender],
    });
    // TODO: API call here

    Alert.alert("Order placed", "Your order & measurements were submitted.");
    setBuyModalVisible(false);
    setSelectedFormGender(null);
    setMeasurements({ male: {}, female: {} });
    setErrors({});
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

  return (
    <>
      <ScrollView style={styles.container}>
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

        <TouchableOpacity style={styles.buyButton} onPress={openBuyModal}>
          <Text style={styles.buyText}>Buy It Now</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Zoom Modal */}
      <Modal visible={zoomVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <PinchGestureHandler
            onGestureEvent={onPinchEvent}
            onHandlerStateChange={onPinchStateChange}
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

                {((gender || "").toLowerCase() === "both" ||
                  (gender || "").trim() === "") && (
                  <View style={styles.selectorRow}>
                    {["male", "female"].map((genderKey) => (
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
                  style={{ maxHeight: 320 }}
                  contentContainerStyle={{ paddingBottom: 12 }}
                >
                  {fields.length > 0 ? (
                    fields.map((field) => {
                      const key = field.toLowerCase().replace(/\s+/g, "");
                      const value = measurements[selectedFormGender]?.[key] || "";
                      const hasError = errors[key];

                      return (
                        <View key={key} style={{ marginBottom: 8 }}>
                          <TextInput
                            placeholder={`${field} (inches)`}
                            placeholderTextColor="#777"
                            value={value}
                            onChangeText={(v) => setField(selectedFormGender, field, v)}
                            maxLength={4}
                            keyboardType="numeric"
                            style={[styles.input, hasError && { borderColor: "red" }]}
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
                    })
                  ) : (
                    <Text style={{ textAlign: "center", marginTop: 20 }}>
                      No measurement fields available for this service.
                    </Text>
                  )}
                </ScrollView>

                <View style={styles.buyButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#ddd" }]}
                    onPress={() => {
                      setBuyModalVisible(false);
                      setSelectedFormGender(null);
                      setErrors({});
                    }}
                  >
                    <Text style={styles.modalBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      { backgroundColor: isFormValid() ? "#111" : "#888" },
                    ]}
                    onPress={handleSubmitOrder}
                    disabled={!isFormValid()}
                  >
                    <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                      Submit Order
                    </Text>
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
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 10, color: "#111" },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  newPrice: { color: "#d92323", fontWeight: "700", fontSize: 22 },
  genderText: { fontSize: 14, color: "#444", marginBottom: 20 },
  imageWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mainImage: { width: "100%", height: 350, resizeMode: "contain", borderRadius: 12 },
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
  arrowText: { fontSize: 22, color: "#fff", fontWeight: "bold" },
  buyButton: { marginTop: 12, backgroundColor: "#000", paddingVertical: 14, borderRadius: 8 },
  buyText: { color: "#fff", fontSize: 17, textAlign: "center", fontWeight: "700" },
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
  closeText: { color: "#000", fontWeight: "700", fontSize: 16 },
  buyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  buyModalContainer: { width: "100%" },
  buyCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  buyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12, textAlign: "center" },
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
    marginHorizontal: 8,
  },
  selectorBtnActive: { backgroundColor: "#000", borderColor: "#000" },
  selectorText: { fontSize: 16, color: "#444" },
  selectorTextActive: { color: "#fff", fontWeight: "700" },
  buyButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
