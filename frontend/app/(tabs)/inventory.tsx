import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Shadows } from '../../src/utils/theme';
import { api } from '../../src/utils/api';

const LOCATIONS = ['pantry', 'fridge', 'freezer'] as const;
type Location = typeof LOCATIONS[number];
const LOC_ICONS: Record<Location, string> = { pantry: 'basket-outline', fridge: 'snow-outline', freezer: 'cube-outline' };

interface Item { id: string; name: string; quantity: number; unit: string; location: string; }

export default function Inventory() {
  const [tab, setTab] = useState<Location>('pantry');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Item[]>([]);
  const [showExtracted, setShowExtracted] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('');

  const load = useCallback(async () => {
    try { setItems(await api.getInventory(tab)); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab]);
  useEffect(() => { setLoading(true); load(); }, [tab, load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const item = await api.addInventoryItem({ name: newName.trim(), quantity: parseFloat(newQty) || 1, unit: newUnit.trim(), location: tab });
      setItems(prev => [item, ...prev]);
      setNewName(''); setNewQty('1'); setNewUnit(''); setShowAdd(false);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };
  const handleDelete = async (id: string) => {
    try { await api.deleteInventoryItem(id); setItems(p => p.filter(i => i.id !== id)); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      const perm = useCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission needed'); return; }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.7 });
      if (result.canceled || !result.assets?.[0]?.base64) return;
      setExtracting(true);
      const res = await api.extractPhoto(result.assets[0].base64, tab);
      if (res.items?.length > 0) { setExtracted(res.items); setShowExtracted(true); }
      else { Alert.alert('No items found', 'Try a clearer photo.'); }
    } catch (e: any) { Alert.alert('Extraction Failed', e.message); }
    finally { setExtracting(false); }
  };

  const saveExtracted = async () => {
    try {
      const saved = await api.addInventoryBatch(extracted.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit, location: tab })));
      setItems(prev => [...saved, ...prev]); setShowExtracted(false); setExtracted([]);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View style={s.itemCard} testID={`inventory-item-${item.id}`}>
      <View style={s.itemLeft}>
        <Text style={s.itemName}>{item.name}</Text>
        <Text style={s.itemQty}>{item.quantity}{item.unit ? ` ${item.unit}` : ''}</Text>
      </View>
      <TouchableOpacity testID={`delete-item-${item.id}`} onPress={() => handleDelete(item.id)} style={s.itemDel} activeOpacity={0.6}>
        <Ionicons name="close-circle" size={20} color={Colors.textLight} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.title}>Inventory</Text><Text style={s.subtitle}>Track what you have on hand</Text></View>

      {/* Location Tabs */}
      <View style={s.tabs}>
        {LOCATIONS.map(loc => (
          <TouchableOpacity key={loc} testID={`tab-${loc}`} style={[s.tab, tab === loc && s.tabOn]} onPress={() => setTab(loc)} activeOpacity={0.7}>
            <Ionicons name={LOC_ICONS[loc] as any} size={16} color={tab === loc ? Colors.primary : Colors.textLight} />
            <Text style={[s.tabLabel, tab === loc && s.tabLabelOn]}>{loc.charAt(0).toUpperCase() + loc.slice(1)}</Text>
            {tab === loc && <View style={s.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity testID="add-item-btn" style={s.actionBtn} onPress={() => setShowAdd(true)} activeOpacity={0.7}>
          <Ionicons name="add" size={16} color={Colors.primary} /><Text style={s.actionText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="upload-photo-btn" style={s.actionBtn} onPress={() => pickImage(false)} disabled={extracting} activeOpacity={0.7}>
          <Ionicons name="image-outline" size={16} color={Colors.primary} /><Text style={s.actionText}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="camera-btn" style={s.actionBtn} onPress={() => pickImage(true)} disabled={extracting} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={16} color={Colors.primary} /><Text style={s.actionText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {extracting && <View style={s.banner}><ActivityIndicator size="small" color={Colors.accent} /><Text style={s.bannerText}>Scanning photo...</Text></View>}

      {loading ? <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View> :
        items.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}><Ionicons name={LOC_ICONS[tab] as any} size={32} color={Colors.border} /></View>
            <Text style={s.emptyTitle}>Your {tab} is empty</Text>
            <Text style={s.emptyBody}>Add items manually or snap a photo to auto-detect what's inside.</Text>
          </View>
        ) : (
          <FlatList data={items} keyExtractor={i => i.id} renderItem={renderItem} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false} />
        )
      }

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modal}>
            <View style={s.modalHead}><Text style={s.modalTitle}>Add to {tab}</Text><TouchableOpacity testID="close-add-modal" onPress={() => setShowAdd(false)}><Ionicons name="close" size={22} color={Colors.textMuted} /></TouchableOpacity></View>
            <TextInput testID="new-item-name" style={s.input} value={newName} onChangeText={setNewName} placeholder="Item name" placeholderTextColor={Colors.textLight} autoFocus />
            <View style={s.inputRow}>
              <TextInput testID="new-item-qty" style={[s.input, { flex: 1, marginRight: 8 }]} value={newQty} onChangeText={setNewQty} placeholder="Qty" keyboardType="numeric" placeholderTextColor={Colors.textLight} />
              <TextInput testID="new-item-unit" style={[s.input, { flex: 1 }]} value={newUnit} onChangeText={setNewUnit} placeholder="Unit (lbs, cans...)" placeholderTextColor={Colors.textLight} />
            </View>
            <TouchableOpacity testID="save-item-btn" style={s.primaryBtn} onPress={handleAdd} activeOpacity={0.8}><Text style={s.primaryBtnText}>Add Item</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Extracted Modal */}
      <Modal visible={showExtracted} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHead}><Text style={s.modalTitle}>Found {extracted.length} Items</Text><TouchableOpacity testID="close-extracted-modal" onPress={() => setShowExtracted(false)}><Ionicons name="close" size={22} color={Colors.textMuted} /></TouchableOpacity></View>
            <Text style={s.extractHint}>Review and edit before saving</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {extracted.map(item => (
                <View key={item.id} style={s.extractRow}>
                  <View style={{ flex: 1 }}><Text style={s.itemName}>{item.name}</Text><Text style={s.itemQty}>{item.quantity} {item.unit}</Text></View>
                  <TouchableOpacity testID={`remove-extracted-${item.id}`} onPress={() => setExtracted(p => p.filter(i => i.id !== item.id))}><Ionicons name="close-circle" size={20} color={Colors.danger} /></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            {extracted.length > 0 && <TouchableOpacity testID="save-extracted-btn" style={s.primaryBtn} onPress={saveExtracted} activeOpacity={0.8}><Text style={s.primaryBtnText}>Save {extracted.length} items</Text></TouchableOpacity>}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textMain, letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },

  tabs: { flexDirection: 'row', marginHorizontal: 20, marginTop: 18, backgroundColor: Colors.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 5 },
  tabOn: { backgroundColor: Colors.primaryMuted },
  tabLabel: { fontSize: 13, fontWeight: '500', color: Colors.textLight },
  tabLabelOn: { color: Colors.primary, fontWeight: '700' },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary },

  actions: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 14, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  actionText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, margin: 20, marginBottom: 0, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.warning + '40' },
  bannerText: { fontSize: 13, color: Colors.textSecondary },

  listContent: { padding: 20 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.textMain },
  itemQty: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  itemDel: { padding: 6 },

  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMuted },
  emptyBody: { fontSize: 13, color: Colors.textLight, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textMain },
  input: { backgroundColor: Colors.background, borderRadius: 10, padding: 14, fontSize: 15, color: Colors.textMain, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  inputRow: { flexDirection: 'row' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  extractHint: { fontSize: 13, color: Colors.textMuted, marginBottom: 12 },
  extractRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
});
