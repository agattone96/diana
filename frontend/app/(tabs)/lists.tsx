import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/utils/theme';
import { api } from '../../src/utils/api';

interface RequiredItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  note: string;
  category: string;
}

interface GrocerySection {
  section: string;
  items: any[];
}

export default function Lists() {
  const [activeView, setActiveView] = useState<'required' | 'final'>('required');
  const [requiredItems, setRequiredItems] = useState<RequiredItem[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<'grocery' | 'household'>('grocery');

  const loadData = useCallback(async () => {
    try {
      const [items, planData] = await Promise.all([
        api.getRequiredItems(),
        api.getCurrentPlan(),
      ]);
      setRequiredItems(items);
      setPlan(planData?.plan || null);
    } catch (e) {
      console.error('Load lists failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      const item = await api.addRequiredItem({
        name: name.trim(),
        quantity: parseFloat(qty) || 1,
        unit: unit.trim(),
        note: note.trim(),
        category,
      });
      setRequiredItems(prev => [item, ...prev]);
      setName(''); setQty('1'); setUnit(''); setNote('');
      setShowAdd(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRequiredItem(id);
      setRequiredItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const grocerySections: GrocerySection[] = plan?.mergedGroceryListBySection || [];
  const householdItems = plan?.householdItems || [];
  const estimatedTotal = plan?.estimatedTotal;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Lists</Text>
        <Text style={styles.headerSubtitle}>Required items & final shopping lists</Text>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          testID="view-required"
          style={[styles.toggleBtn, activeView === 'required' && styles.toggleActive]}
          onPress={() => setActiveView('required')}
        >
          <Text style={[styles.toggleText, activeView === 'required' && styles.toggleTextActive]}>Required Items</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="view-final"
          style={[styles.toggleBtn, activeView === 'final' && styles.toggleActive]}
          onPress={() => setActiveView('final')}
        >
          <Text style={[styles.toggleText, activeView === 'final' && styles.toggleTextActive]}>Final Lists</Text>
        </TouchableOpacity>
      </View>

      {activeView === 'required' ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity testID="add-required-btn" style={styles.addButton} onPress={() => setShowAdd(true)}>
            <Ionicons name="add-circle" size={20} color={Colors.primary} />
            <Text style={styles.addButtonText}>Add Required Item</Text>
          </TouchableOpacity>

          {requiredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No required items yet</Text>
              <Text style={styles.emptySubtitle}>Add items you know you need this week</Text>
            </View>
          ) : (
            requiredItems.map(item => (
              <View key={item.id} style={styles.itemCard} testID={`required-item-${item.id}`}>
                <View style={styles.itemCardLeft}>
                  <View style={[styles.categoryBadge, item.category === 'household' && styles.categoryHousehold]}>
                    <Text style={styles.categoryText}>
                      {item.category === 'household' ? 'Household' : 'Grocery'}
                    </Text>
                  </View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                    {item.note ? ` · ${item.note}` : ''}
                  </Text>
                </View>
                <TouchableOpacity testID={`delete-required-${item.id}`} onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {!plan ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No plan generated yet</Text>
              <Text style={styles.emptySubtitle}>Go to "This Week" and build a plan first</Text>
            </View>
          ) : (
            <>
              {/* Grocery List */}
              <Text style={styles.sectionHeader}>Grocery List</Text>
              {grocerySections.map((section, idx) => (
                <View key={idx} style={styles.sectionCard}>
                  <Text style={styles.sectionName}>
                    {section.section.charAt(0).toUpperCase() + section.section.slice(1)}
                  </Text>
                  {section.items?.map((item: any, i: number) => (
                    <View key={i} style={styles.groceryItemRow}>
                      <Ionicons name="checkbox-outline" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
                      <Text style={styles.groceryItemText}>
                        {item.name}
                        {item.quantity ? ` — ${item.quantity}` : ''}
                        {item.unit ? ` ${item.unit}` : ''}
                      </Text>
                      {item.estimatedPrice ? (
                        <Text style={styles.priceText}>${item.estimatedPrice.toFixed(2)}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))}

              {/* Household Items */}
              {householdItems.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>Household Items</Text>
                  <View style={styles.sectionCard}>
                    {householdItems.map((item: any, i: number) => (
                      <View key={i} style={styles.groceryItemRow}>
                        <Ionicons name="home-outline" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
                        <Text style={styles.groceryItemText}>
                          {item.name}{item.quantity ? ` — ${item.quantity}` : ''}{item.unit ? ` ${item.unit}` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Total */}
              {estimatedTotal != null && (
                <View style={styles.totalCard}>
                  <Text style={styles.totalLabel}>Estimated Total</Text>
                  <Text style={styles.totalAmount}>${estimatedTotal.toFixed(2)}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Required Item</Text>
              <TouchableOpacity testID="close-required-modal" onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput testID="required-name-input" style={styles.input} value={name} onChangeText={setName} placeholder="Item name" placeholderTextColor={Colors.textMuted} autoFocus />
            <View style={styles.row}>
              <TextInput testID="required-qty-input" style={[styles.input, { flex: 1, marginRight: 8 }]} value={qty} onChangeText={setQty} placeholder="Qty" keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
              <TextInput testID="required-unit-input" style={[styles.input, { flex: 1 }]} value={unit} onChangeText={setUnit} placeholder="Unit" placeholderTextColor={Colors.textMuted} />
            </View>
            <TextInput testID="required-note-input" style={styles.input} value={note} onChangeText={setNote} placeholder="Note (optional)" placeholderTextColor={Colors.textMuted} />
            <View style={styles.categoryToggle}>
              <TouchableOpacity
                testID="category-grocery"
                style={[styles.catBtn, category === 'grocery' && styles.catBtnActive]}
                onPress={() => setCategory('grocery')}
              >
                <Text style={[styles.catBtnText, category === 'grocery' && styles.catBtnTextActive]}>Grocery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="category-household"
                style={[styles.catBtn, category === 'household' && styles.catBtnActive]}
                onPress={() => setCategory('household')}
              >
                <Text style={[styles.catBtnText, category === 'household' && styles.catBtnTextActive]}>Household</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity testID="save-required-btn" style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  headerSection: { paddingHorizontal: 20, paddingTop: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.textMain },
  headerSubtitle: { fontSize: 15, color: Colors.textMuted, marginTop: 4 },
  viewToggle: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 20,
    backgroundColor: Colors.surfaceMuted, borderRadius: 12, padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
  toggleTextActive: { color: Colors.textMain, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  addButtonText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  itemCardLeft: { flex: 1 },
  categoryBadge: { backgroundColor: Colors.surfaceMuted, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  categoryHousehold: { backgroundColor: '#F0E6D3' },
  categoryText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.textMain },
  itemMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 8 },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textMuted, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: Colors.textMain, marginTop: 8, marginBottom: 12 },
  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionName: { fontSize: 13, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  groceryItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  groceryItemText: { flex: 1, fontSize: 15, color: Colors.textMain },
  priceText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  totalCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary, borderRadius: 14, padding: 20, marginTop: 8,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  totalAmount: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textMain },
  input: {
    backgroundColor: Colors.background, borderRadius: 12, padding: 14, fontSize: 15,
    color: Colors.textMain, borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  row: { flexDirection: 'row' },
  categoryToggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  catBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.surfaceMuted },
  catBtnActive: { backgroundColor: Colors.primary },
  catBtnText: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
  catBtnTextActive: { color: '#FFF' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
