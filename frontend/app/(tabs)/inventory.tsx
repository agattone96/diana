import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/utils/theme';
import { api } from '../../src/utils/api';

const LOCATIONS = ['pantry', 'fridge', 'freezer'] as const;
type Location = typeof LOCATIONS[number];

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: string;
}

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<Location>('pantry');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<InventoryItem[]>([]);
  const [showExtracted, setShowExtracted] = useState(false);

  // Add form
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('');

  const loadItems = useCallback(async () => {
    try {
      const data = await api.getInventory(activeTab);
      setItems(data);
    } catch (e) {
      console.error('Load inventory failed:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    loadItems();
  }, [activeTab, loadItems]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const item = await api.addInventoryItem({
        name: newName.trim(),
        quantity: parseFloat(newQty) || 1,
        unit: newUnit.trim(),
        location: activeTab,
      });
      setItems(prev => [item, ...prev]);
      setNewName('');
      setNewQty('1');
      setNewUnit('');
      setShowAdd(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteInventoryItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to upload photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]?.base64) return;

      setExtracting(true);
      const response = await api.extractPhoto(result.assets[0].base64, activeTab);
      if (response.items?.length > 0) {
        setExtractedItems(response.items);
        setShowExtracted(true);
      } else {
        Alert.alert('No items found', 'Could not identify items in the photo. Try a clearer photo.');
      }
    } catch (e: any) {
      Alert.alert('Extraction Failed', e.message || 'Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  const handleCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]?.base64) return;

      setExtracting(true);
      const response = await api.extractPhoto(result.assets[0].base64, activeTab);
      if (response.items?.length > 0) {
        setExtractedItems(response.items);
        setShowExtracted(true);
      } else {
        Alert.alert('No items found', 'Could not identify items in the photo.');
      }
    } catch (e: any) {
      Alert.alert('Extraction Failed', e.message || 'Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  const saveExtractedItems = async () => {
    try {
      const itemsToSave = extractedItems.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        location: activeTab,
      }));
      const saved = await api.addInventoryBatch(itemsToSave);
      setItems(prev => [...saved, ...prev]);
      setShowExtracted(false);
      setExtractedItems([]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const removeExtracted = (id: string) => {
    setExtractedItems(prev => prev.filter(i => i.id !== id));
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <View style={styles.itemRow} testID={`inventory-item-${item.id}`}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetail}>
          {item.quantity}{item.unit ? ` ${item.unit}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        testID={`delete-item-${item.id}`}
        onPress={() => handleDelete(item.id)}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <Text style={styles.headerSubtitle}>Track what you have on hand</Text>
      </View>

      {/* Location Tabs */}
      <View style={styles.tabBar}>
        {LOCATIONS.map(loc => (
          <TouchableOpacity
            key={loc}
            testID={`tab-${loc}`}
            style={[styles.tab, activeTab === loc && styles.tabActive]}
            onPress={() => setActiveTab(loc)}
          >
            <Ionicons
              name={loc === 'pantry' ? 'basket-outline' : loc === 'fridge' ? 'snow-outline' : 'cube-outline'}
              size={18}
              color={activeTab === loc ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === loc && styles.tabTextActive]}>
              {loc.charAt(0).toUpperCase() + loc.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity testID="add-item-btn" style={styles.actionBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.actionText}>Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="upload-photo-btn" style={styles.actionBtn} onPress={handlePhotoUpload} disabled={extracting}>
          <Ionicons name="image-outline" size={18} color={Colors.primary} />
          <Text style={styles.actionText}>Upload Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="camera-btn" style={styles.actionBtn} onPress={handleCamera} disabled={extracting}>
          <Ionicons name="camera-outline" size={18} color={Colors.primary} />
          <Text style={styles.actionText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {extracting && (
        <View style={styles.extractingBanner}>
          <ActivityIndicator size="small" color={Colors.accent} />
          <Text style={styles.extractingText}>Scanning photo for items...</Text>
        </View>
      )}

      {/* Items List */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name={activeTab === 'pantry' ? 'basket-outline' : activeTab === 'fridge' ? 'snow-outline' : 'cube-outline'} size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>No items in {activeTab}</Text>
          <Text style={styles.emptySubtitle}>Add items manually or upload a photo</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Item Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item</Text>
              <TouchableOpacity testID="close-add-modal" onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              testID="new-item-name"
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Item name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.modalRow}>
              <TextInput
                testID="new-item-qty"
                style={[styles.modalInput, { flex: 1, marginRight: 8 }]}
                value={newQty}
                onChangeText={setNewQty}
                placeholder="Qty"
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />
              <TextInput
                testID="new-item-unit"
                style={[styles.modalInput, { flex: 1 }]}
                value={newUnit}
                onChangeText={setNewUnit}
                placeholder="Unit (e.g. lbs, cans)"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <TouchableOpacity testID="save-item-btn" style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Add to {activeTab}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Extracted Items Modal */}
      <Modal visible={showExtracted} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Found Items</Text>
              <TouchableOpacity testID="close-extracted-modal" onPress={() => setShowExtracted(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.extractedHint}>Review and edit before saving:</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {extractedItems.map(item => (
                <View key={item.id} style={styles.extractedRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDetail}>{item.quantity} {item.unit}</Text>
                  </View>
                  <TouchableOpacity testID={`remove-extracted-${item.id}`} onPress={() => removeExtracted(item.id)}>
                    <Ionicons name="close-circle" size={22} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            {extractedItems.length > 0 && (
              <TouchableOpacity testID="save-extracted-btn" style={styles.saveBtn} onPress={saveExtractedItems}>
                <Text style={styles.saveBtnText}>Save {extractedItems.length} items to {activeTab}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  headerSection: { paddingHorizontal: 20, paddingTop: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.textMain },
  headerSubtitle: { fontSize: 15, color: Colors.textMuted, marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: { fontSize: 13, fontWeight: '500', color: Colors.primary },
  extractingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  extractingText: { fontSize: 14, color: Colors.textMain },
  listContent: { padding: 20 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.textMain },
  itemDetail: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 8 },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textMuted, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textMain },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.textMain,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  modalRow: { flexDirection: 'row' },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  extractedHint: { fontSize: 14, color: Colors.textMuted, marginBottom: 12 },
  extractedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
