import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/utils/theme';
import { api } from '../../src/utils/api';

interface RequiredItem { id: string; name: string; quantity: number; unit: string; note: string; category: string; }

const SECTION_ICONS: Record<string, string> = { produce: 'leaf-outline', meat: 'restaurant-outline', dairy: 'water-outline', frozen: 'snow-outline', pantry: 'basket-outline', snacks: 'pizza-outline', beverages: 'cafe-outline', household: 'home-outline', misc: 'ellipsis-horizontal-outline' };

export default function Lists() {
  const [view, setView] = useState<'required' | 'final'>('required');
  const [requiredItems, setRequiredItems] = useState<RequiredItem[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<'grocery' | 'household'>('grocery');

  const loadData = useCallback(async () => {
    try {
      const [items, planData] = await Promise.all([api.getRequiredItems(), api.getCurrentPlan()]);
      setRequiredItems(items); setPlan(planData?.plan || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      const item = await api.addRequiredItem({ name: name.trim(), quantity: parseFloat(qty) || 1, unit: unit.trim(), note: note.trim(), category });
      setRequiredItems(prev => [item, ...prev]);
      setName(''); setQty('1'); setUnit(''); setNote(''); setShowAdd(false);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDelete = async (id: string) => {
    try { await api.deleteRequiredItem(id); setRequiredItems(p => p.filter(i => i.id !== id)); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  const grocerySections = plan?.mergedGroceryListBySection || [];
  const householdItems = plan?.householdItems || [];
  const estimatedTotal = plan?.estimatedTotal;

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.title}>Lists</Text><Text style={s.subtitle}>Required items & shopping lists</Text></View>

      {/* View Toggle */}
      <View style={s.toggle}>
        <TouchableOpacity testID="view-required" style={[s.toggleBtn, view === 'required' && s.toggleOn]} onPress={() => setView('required')}>
          <Text style={[s.toggleText, view === 'required' && s.toggleTextOn]}>Required Items</Text>
          {requiredItems.length > 0 && <View style={s.toggleBadge}><Text style={s.toggleBadgeText}>{requiredItems.length}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity testID="view-final" style={[s.toggleBtn, view === 'final' && s.toggleOn]} onPress={() => setView('final')}>
          <Text style={[s.toggleText, view === 'final' && s.toggleTextOn]}>Final Lists</Text>
        </TouchableOpacity>
      </View>

      {view === 'required' ? (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollInner}>
          <TouchableOpacity testID="add-required-btn" style={s.addRow} onPress={() => setShowAdd(true)} activeOpacity={0.7}>
            <View style={s.addIcon}><Ionicons name="add" size={16} color={Colors.primary} /></View>
            <Text style={s.addText}>Add required item</Text>
          </TouchableOpacity>

          {requiredItems.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIconWrap}><Ionicons name="cart-outline" size={28} color={Colors.border} /></View>
              <Text style={s.emptyTitle}>No required items</Text>
              <Text style={s.emptyBody}>Add items you know you need this week — they'll be included in your generated grocery list.</Text>
            </View>
          ) : requiredItems.map(item => (
            <View key={item.id} style={s.itemCard} testID={`required-item-${item.id}`}>
              <View style={s.itemLeft}>
                <View style={[s.catBadge, item.category === 'household' && s.catHouse]}>
                  <Text style={s.catText}>{item.category}</Text>
                </View>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.itemMeta}>{item.quantity}{item.unit ? ` ${item.unit}` : ''}{item.note ? ` · ${item.note}` : ''}</Text>
              </View>
              <TouchableOpacity testID={`delete-required-${item.id}`} onPress={() => handleDelete(item.id)} style={s.itemDel}>
                <Ionicons name="close-circle" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollInner}>
          {!plan ? (
            <View style={s.empty}>
              <View style={s.emptyIconWrap}><Ionicons name="receipt-outline" size={28} color={Colors.border} /></View>
              <Text style={s.emptyTitle}>No plan generated yet</Text>
              <Text style={s.emptyBody}>Head to "This Week" and tap "Build This Week's Plan" to generate your grocery and household lists.</Text>
            </View>
          ) : (
            <>
              {grocerySections.map((section: any, idx: number) => (
                <View key={idx} style={s.sectionCard}>
                  <View style={s.sectionHead}>
                    <Ionicons name={(SECTION_ICONS[section.section] || 'ellipsis-horizontal-outline') as any} size={15} color={Colors.primary} />
                    <Text style={s.sectionName}>{section.section.charAt(0).toUpperCase() + section.section.slice(1)}</Text>
                    <View style={s.countBadge}><Text style={s.countText}>{section.items?.length || 0}</Text></View>
                  </View>
                  {section.items?.map((item: any, i: number) => (
                    <View key={i} style={s.groceryRow}>
                      <View style={s.groceryDot} />
                      <Text style={s.groceryName}>{item.name}</Text>
                      <Text style={s.groceryQty}>{item.quantity}{item.unit ? ` ${item.unit}` : ''}</Text>
                      {item.estimatedPrice != null && <Text style={s.groceryPrice}>${item.estimatedPrice.toFixed(2)}</Text>}
                    </View>
                  ))}
                </View>
              ))}
              {householdItems.length > 0 && (
                <View style={s.sectionCard}>
                  <View style={s.sectionHead}><Ionicons name="home-outline" size={15} color={Colors.primary} /><Text style={s.sectionName}>Household</Text><View style={s.countBadge}><Text style={s.countText}>{householdItems.length}</Text></View></View>
                  {householdItems.map((item: any, i: number) => (
                    <View key={i} style={s.groceryRow}>
                      <View style={s.groceryDot} />
                      <Text style={s.groceryName}>{item.name}</Text>
                      <Text style={s.groceryQty}>{item.quantity}{item.unit ? ` ${item.unit}` : ''}</Text>
                    </View>
                  ))}
                </View>
              )}
              {estimatedTotal != null && (
                <View style={s.totalCard}><Text style={s.totalLabel}>Estimated Total</Text><Text style={s.totalAmt}>${estimatedTotal.toFixed(2)}</Text></View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modal}>
            <View style={s.modalHead}><Text style={s.modalTitle}>Add Required Item</Text><TouchableOpacity testID="close-required-modal" onPress={() => setShowAdd(false)}><Ionicons name="close" size={22} color={Colors.textMuted} /></TouchableOpacity></View>
            <TextInput testID="required-name-input" style={s.input} value={name} onChangeText={setName} placeholder="Item name" placeholderTextColor={Colors.textLight} autoFocus />
            <View style={s.inputRow}>
              <TextInput testID="required-qty-input" style={[s.input, { flex: 1, marginRight: 8 }]} value={qty} onChangeText={setQty} placeholder="Qty" keyboardType="numeric" placeholderTextColor={Colors.textLight} />
              <TextInput testID="required-unit-input" style={[s.input, { flex: 1 }]} value={unit} onChangeText={setUnit} placeholder="Unit" placeholderTextColor={Colors.textLight} />
            </View>
            <TextInput testID="required-note-input" style={s.input} value={note} onChangeText={setNote} placeholder="Note (optional)" placeholderTextColor={Colors.textLight} />
            <View style={s.catToggle}>
              <TouchableOpacity testID="category-grocery" style={[s.catBtn, category === 'grocery' && s.catBtnOn]} onPress={() => setCategory('grocery')}><Text style={[s.catBtnText, category === 'grocery' && s.catBtnTextOn]}>Grocery</Text></TouchableOpacity>
              <TouchableOpacity testID="category-household" style={[s.catBtn, category === 'household' && s.catBtnOn]} onPress={() => setCategory('household')}><Text style={[s.catBtnText, category === 'household' && s.catBtnTextOn]}>Household</Text></TouchableOpacity>
            </View>
            <TouchableOpacity testID="save-required-btn" style={s.primaryBtn} onPress={handleAdd} activeOpacity={0.8}><Text style={s.primaryBtnText}>Add Item</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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

  toggle: { flexDirection: 'row', marginHorizontal: 20, marginTop: 18, backgroundColor: Colors.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  toggleOn: { backgroundColor: Colors.primaryMuted },
  toggleText: { fontSize: 13, fontWeight: '500', color: Colors.textLight },
  toggleTextOn: { color: Colors.primary, fontWeight: '700' },
  toggleBadge: { backgroundColor: Colors.primary, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  toggleBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },

  scroll: { flex: 1 },
  scrollInner: { padding: 20 },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  addIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  itemLeft: { flex: 1 },
  catBadge: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceMuted, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 5 },
  catHouse: { backgroundColor: Colors.warning + '18' },
  catText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.textMain },
  itemMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  itemDel: { padding: 6 },

  empty: { alignItems: 'center', marginTop: 50, paddingHorizontal: 40 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMuted },
  emptyBody: { fontSize: 13, color: Colors.textLight, textAlign: 'center', marginTop: 6, lineHeight: 18, maxWidth: 260 },

  sectionCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionName: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  countBadge: { backgroundColor: Colors.surfaceMuted, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  countText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  groceryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  groceryDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary, marginRight: 10, opacity: 0.4 },
  groceryName: { flex: 1, fontSize: 14, color: Colors.textMain },
  groceryQty: { fontSize: 13, color: Colors.textMuted, marginRight: 6 },
  groceryPrice: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 14, padding: 20, marginTop: 6 },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  totalAmt: { fontSize: 24, fontWeight: '800', color: '#FFF' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textMain },
  input: { backgroundColor: Colors.background, borderRadius: 10, padding: 14, fontSize: 15, color: Colors.textMain, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  inputRow: { flexDirection: 'row' },
  catToggle: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  catBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.surfaceMuted },
  catBtnOn: { backgroundColor: Colors.primary },
  catBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  catBtnTextOn: { color: '#FFF' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
