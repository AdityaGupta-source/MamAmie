import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { parseMedicalOcrText, SAMPLE_LAB_REPORT_TEXT } from '../utils/medicalOcrParser';

function recognizeTextWithMlKit(imageUri) {
  try {
    // Dynamically require so Expo Go does not crash at bundle load time
    const TextRecognition = require('@react-native-ml-kit/text-recognition').default;
    if (!TextRecognition || typeof TextRecognition.recognize !== 'function') {
      return Promise.reject(new Error('ML_KIT_UNAVAILABLE'));
    }
    return TextRecognition.recognize(imageUri);
  } catch (err) {
    return Promise.reject(new Error('ML_KIT_UNAVAILABLE'));
  }
}

export default function ScanReportModal({ visible, onClose, onApplyVitals }) {
  const [imageUri, setImageUri] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [hemoglobin, setHemoglobin] = useState('');
  const [detectedFields, setDetectedFields] = useState([]);

  const applyParsedResult = (parsed, sourceText) => {
    setRawText(sourceText);
    setDetectedFields(parsed.detectedFields || []);
    if (parsed.systolic) setSystolic(parsed.systolic);
    if (parsed.diastolic) setDiastolic(parsed.diastolic);
    if (parsed.heartRate) setHeartRate(parsed.heartRate);
    if (parsed.bloodSugar) setBloodSugar(parsed.bloodSugar);
    if (parsed.hemoglobin) setHemoglobin(parsed.hemoglobin);
  };

  const processImage = async (uri) => {
    setScanning(true);
    try {
      // Resize & normalize orientation for faster, cleaner on-device OCR
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUri(manipulated.uri);

      const ocrResult = await recognizeTextWithMlKit(manipulated.uri);
      const extractedText = ocrResult?.text || '';
      const parsed = parseMedicalOcrText(extractedText);
      applyParsedResult(parsed, extractedText);

      if ((parsed.detectedFields || []).length === 0) {
        Alert.alert(
          'No Vitals Auto-Detected',
          'Text was scanned, but no standard BP, Pulse, or Glucose labels were matched. You can review the raw text or enter values below.'
        );
      }
    } catch (error) {
      if (error.message === 'ML_KIT_UNAVAILABLE') {
        Alert.alert(
          'Native Build Required for Camera OCR',
          'On-device ML Kit OCR requires a standalone/development build (npx expo run:android) and is not bundled inside Expo Go. Loading a sample lab report so you can test the auto-fill parser now!',
          [
            {
              text: 'Load Sample Scan',
              onPress: handleRunSampleScan,
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Scan Error', 'Could not read this image. Please try a clearer photo.');
      }
    } finally {
      setScanning(false);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera Permission', 'Please allow camera access to scan lab reports.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  };

  const handleChooseGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery Permission', 'Please allow photo library access to pick a lab report.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  };

  const handleRunSampleScan = () => {
    const parsed = parseMedicalOcrText(SAMPLE_LAB_REPORT_TEXT);
    applyParsedResult(parsed, SAMPLE_LAB_REPORT_TEXT);
  };

  const handleApplyAndSave = () => {
    if (!systolic && !diastolic && !heartRate && !bloodSugar) {
      Alert.alert('No Values Ready', 'Please scan a report or enter at least one vital measurement.');
      return;
    }
    onApplyVitals({
      systolic: systolic || undefined,
      diastolic: diastolic || undefined,
      heartRate: heartRate || undefined,
      bloodSugar: bloodSugar || undefined,
      hemoglobin: hemoglobin || undefined,
    });
    onClose();
  };

  const isDetected = (field) => detectedFields.includes(field);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Stack Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan Lab Report</Text>
          <View style={styles.offlineBadge}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.secondary} />
            <Text style={styles.offlineBadgeText}>On-Device</Text>
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tactile Camera Viewfinder / Document Preview Card */}
          <View style={styles.viewfinderCard}>
            <View style={styles.previewBox}>
              {/* Corner Framing Brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {scanning ? (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.scanningText}>Reading clinical text on-device...</Text>
                </View>
              ) : imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
              ) : (
                <View style={styles.placeholderWrap}>
                  <View style={styles.placeholderIcon}>
                    <Ionicons name="scan-outline" size={34} color={Colors.primary} />
                  </View>
                  <Text style={styles.placeholderTitle}>Align Lab Report or BP Screen</Text>
                  <Text style={styles.placeholderSub}>
                    Keep text well-lit and flat for instant offline recognition
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.captureActions}>
              <TouchableOpacity style={styles.primaryPillBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.primaryPillText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.softPillBtn} onPress={handleChooseGallery} activeOpacity={0.85}>
                <Ionicons name="images-outline" size={18} color={Colors.primaryDark} />
                <Text style={styles.softPillText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sampleLink} onPress={handleRunSampleScan}>
              <Text style={styles.sampleLinkText}>Test auto-fill with sample lab report</Text>
            </TouchableOpacity>
          </View>

          {/* Extracted Vitals Preview Card */}
          <View style={styles.extractedCard}>
            <View style={styles.extractedHeader}>
              <View>
                <Text style={styles.cardTitle}>Extracted Vitals Preview</Text>
                <Text style={styles.cardSub}>Tap any value to adjust before saving</Text>
              </View>
              {detectedFields.length > 0 && (
                <View style={styles.verifiedPill}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.secondary} />
                  <Text style={styles.verifiedText}>{detectedFields.length} Detected</Text>
                </View>
              )}
            </View>

            {/* Blood Pressure Row */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Blood Pressure (mmHg)</Text>
                {isDetected('bloodPressure') && <Text style={styles.autoTag}>Auto-detected</Text>}
              </View>
              <View style={styles.bpSplitRow}>
                <TextInput
                  style={[styles.pillInput, styles.bpInput]}
                  placeholder="Sys (118)"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  value={systolic}
                  onChangeText={setSystolic}
                />
                <Text style={styles.bpSlash}>/</Text>
                <TextInput
                  style={[styles.pillInput, styles.bpInput]}
                  placeholder="Dia (76)"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  value={diastolic}
                  onChangeText={setDiastolic}
                />
              </View>
            </View>

            {/* Maternal Pulse */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Maternal Pulse (bpm)</Text>
                {isDetected('heartRate') && <Text style={styles.autoTag}>Auto-detected</Text>}
              </View>
              <TextInput
                style={styles.pillInput}
                placeholder="e.g. 74"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
                value={heartRate}
                onChangeText={setHeartRate}
              />
            </View>

            {/* Fasting Glucose */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Fasting Glucose (mg/dL)</Text>
                {isDetected('bloodSugar') && <Text style={styles.autoTag}>Auto-detected</Text>}
              </View>
              <TextInput
                style={styles.pillInput}
                placeholder="e.g. 92"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
                value={bloodSugar}
                onChangeText={setBloodSugar}
              />
            </View>

            {/* Hemoglobin */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Hemoglobin (g/dL)</Text>
                {isDetected('hemoglobin') && <Text style={styles.autoTag}>Auto-detected</Text>}
              </View>
              <TextInput
                style={styles.pillInput}
                placeholder="e.g. 11.8"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
                value={hemoglobin}
                onChangeText={setHemoglobin}
              />
            </View>
          </View>

          {/* Bottom Actions */}
          <TouchableOpacity style={styles.applyCtaBtn} onPress={handleApplyAndSave} activeOpacity={0.85}>
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
            <Text style={styles.applyCtaText}>Apply to Vitals & Save</Text>
          </TouchableOpacity>

          {rawText ? (
            <TouchableOpacity style={styles.rawLinkBtn} onPress={() => setShowRawText(!showRawText)}>
              <Text style={styles.rawLinkText}>
                {showRawText ? 'Hide Raw Scanned Text' : 'View Raw Scanned Text'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {showRawText && rawText ? (
            <View style={styles.rawTextBox}>
              <Text style={styles.rawTextContent}>{rawText}</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  viewfinderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewBox: {
    height: 190,
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: Colors.primary,
    zIndex: 2,
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  scanningOverlay: {
    alignItems: 'center',
    gap: 10,
  },
  scanningText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  captureActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryPillBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 24,
    gap: 8,
  },
  primaryPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  softPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
    paddingVertical: 13,
    borderRadius: 24,
    gap: 6,
  },
  softPillText: {
    color: Colors.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  sampleLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  sampleLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.tertiary,
    textDecorationLine: 'underline',
  },
  extractedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  extractedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  fieldRow: {
    marginBottom: 12,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  autoTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  pillInput: {
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bpSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bpInput: {
    flex: 1,
  },
  bpSlash: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  applyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 26,
    paddingVertical: 15,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  applyCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rawLinkBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  rawLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  rawTextBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rawTextContent: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
