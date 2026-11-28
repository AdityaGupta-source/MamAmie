import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../constants/theme';
import { StorageService } from '../constants/storage';
import ScanReportModal from '../components/ScanReportModal';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_HISTORY = [
  { date: 'Today • 08:30 AM', reading: '118/76 mmHg • 74 bpm', status: 'Normal' },
  { date: 'Yesterday • 07:15 PM', reading: '122/78 mmHg • 78 bpm', status: 'Normal' },
  { date: 'Nov 5 • 09:00 AM', reading: '116/74 mmHg • 72 bpm', status: 'Normal' },
];

export default function VitalsScreen() {
  const [systolic, setSystolic] = useState('118');
  const [diastolic, setDiastolic] = useState('76');
  const [heartRate, setHeartRate] = useState('74');
  const [bloodSugar, setBloodSugar] = useState('92');
  const [history, setHistory] = useState(DEFAULT_HISTORY);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);

  useEffect(() => {
    StorageService.getVitals().then((data) => {
      if (data) {
        if (data.systolic) setSystolic(data.systolic);
        if (data.diastolic) setDiastolic(data.diastolic);
        if (data.heartRate) setHeartRate(data.heartRate);
        if (data.bloodSugar) setBloodSugar(data.bloodSugar);
        if (data.history && data.history.length > 0) setHistory(data.history);
      }
    });
  }, []);

  const persistVitals = (sys, dia, hr, sugar, sourceLabel = null) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sysNum = parseInt(sys, 10) || 118;
    const diaNum = parseInt(dia, 10) || 76;
    const status = sysNum >= 140 || diaNum >= 90 ? 'Elevated' : 'Normal';

    const newEntry = {
      date: `Today • ${timeStr}${sourceLabel ? ` (${sourceLabel})` : ''}`,
      reading: `${sys}/${dia} mmHg • ${hr} bpm • ${sugar} mg/dL`,
      status,
    };

    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    StorageService.setVitals({
      systolic: sys,
      diastolic: dia,
      heartRate: hr,
      bloodSugar: sugar,
      history: updatedHistory,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveVitals = () => {
    persistVitals(systolic, diastolic, heartRate, bloodSugar);
  };

  const handleApplyScannedVitals = (scanned) => {
    const nextSys = scanned.systolic || systolic;
    const nextDia = scanned.diastolic || diastolic;
    const nextHr = scanned.heartRate || heartRate;
    const nextSugar = scanned.bloodSugar || bloodSugar;

    setSystolic(nextSys);
    setDiastolic(nextDia);
    setHeartRate(nextHr);
    setBloodSugar(nextSugar);

    persistVitals(nextSys, nextDia, nextHr, nextSugar, 'OCR Scan');
  };

  const sysNum = parseInt(systolic, 10) || 0;
  const diaNum = parseInt(diastolic, 10) || 0;
  const isElevated = sysNum >= 140 || diaNum >= 90;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Vitals Summary Telemetry Card */}
      <View style={styles.summaryCard}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Clinical Telemetry Status</Text>
          <View style={[styles.statusPill, isElevated && { backgroundColor: Colors.errorContainer }]}>
            <View style={[styles.dotOnline, isElevated && { backgroundColor: Colors.error }]} />
            <Text style={[styles.statusText, isElevated && { color: Colors.errorText }]}>
              {isElevated ? 'Check with Midwife' : 'Normotensive'}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Blood Pressure</Text>
            <Text style={styles.metricValue}>{systolic}/{diastolic}</Text>
            <Text style={styles.metricUnit}>mmHg ({isElevated ? 'Elevated' : 'Optimal'})</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Maternal Pulse</Text>
            <Text style={styles.metricValue}>{heartRate}</Text>
            <Text style={styles.metricUnit}>BPM (Resting)</Text>
          </View>
        </View>
      </View>

      {/* OCR Quick Scan Banner */}
      <TouchableOpacity
        style={styles.ocrBanner}
        activeOpacity={0.85}
        onPress={() => setScanModalVisible(true)}
      >
        <View style={styles.ocrIconWrap}>
          <Ionicons name="scan" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.ocrTextWrap}>
          <Text style={styles.ocrTitle}>Scan Lab Report or BP Monitor</Text>
          <Text style={styles.ocrSub}>Auto-fill vitals offline using on-device OCR</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.primaryDark} />
      </TouchableOpacity>

      {/* Input / Measurement Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Record Clinical Measurements</Text>
        <Text style={styles.formSub}>Synchronized with prenatal telemetry chart</Text>

        <View style={styles.inputGrid}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Systolic (Top)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={systolic}
                onChangeText={setSystolic}
              />
              <Text style={styles.unitSuffix}>mmHg</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Diastolic (Bottom)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={diastolic}
                onChangeText={setDiastolic}
              />
              <Text style={styles.unitSuffix}>mmHg</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Heart Rate</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={heartRate}
                onChangeText={setHeartRate}
              />
              <Text style={styles.unitSuffix}>BPM</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fasting Glucose</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={bloodSugar}
                onChangeText={setBloodSugar}
              />
              <Text style={styles.unitSuffix}>mg/dL</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.8}
          onPress={handleSaveVitals}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {savedSuccess ? 'Telemetry Recorded!' : 'Save & Sync Vitals'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Historical Telemetry Insights */}
      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>Recent Clinical Telemetry Trends</Text>

        {history.map((item, idx) => (
          <View key={idx} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyDate}>{item.date}</Text>
              <Text style={styles.historyReading}>{item.reading}</Text>
            </View>
            <View style={[styles.tagNormal, item.status === 'Elevated' && { backgroundColor: Colors.errorContainer }]}>
              <Text style={[styles.tagNormalText, item.status === 'Elevated' && { color: Colors.errorText }]}>
                {item.status}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* OCR Scanner Modal */}
      <ScanReportModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
        onApplyVitals={handleApplyScannedVitals}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  dotOnline: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.border,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  metricUnit: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ocrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(180, 106, 114, 0.25)',
    gap: 12,
  },
  ocrIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ocrTextWrap: {
    flex: 1,
  },
  ocrTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  ocrSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  formSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  unitSuffix: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  historyReading: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  tagNormal: {
    backgroundColor: Colors.secondarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagNormalText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
});
