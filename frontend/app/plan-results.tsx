import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/utils/theme';
import { api } from '../src/utils/api';

const EFFORT_COLORS: Record<string, string> = {
  low: Colors.success,
  medium: Colors.warning,
  high: Colors.danger,
};

const SECTION_ICONS: Record<string, string> = {
  produce: 'leaf-outline',
  meat: 'restaurant-outline',
  dairy: 'water-outline',
  frozen: 'snow-outline',
  pantry: 'basket-outline',
  snacks: 'pizza-outline',
  beverages: 'cafe-outline',
  household: 'home-outline',
  misc: 'ellipsis-horizontal-outline',
};

export default function PlanResults() {
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const data = await api.getCurrentPlan();
      setPlan(data?.plan || null);
    } catch (e) {
      console.error('Load plan failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    setRemovingId(recipeId);
    try {
      const updated = await api.removeRecipe(recipeId);
      setPlan(updated?.plan || null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setRemovingId(null);
    }
  };

  const handleRegenerateRecipe = async (recipeId: string) => {
    setRegeneratingId(recipeId);
    try {
      const updated = await api.regenerateRecipe(recipeId, 'similar');
      setPlan(updated?.plan || null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setRegeneratingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={56} color={Colors.border} />
          <Text style={styles.emptyTitle}>No plan yet</Text>
          <TouchableOpacity testID="go-back-empty" style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const recipes = plan.selectedRecipes || [];
  const grocerySections = plan.mergedGroceryListBySection || [];
  const householdItems = plan.householdItems || [];
  const substitutions = plan.substitutions || [];
  const notes = plan.notes || [];
  const estimatedTotal = plan.estimatedTotal;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="back-button" onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Your Plan</Text>
          <Text style={styles.headerSubtitle}>{recipes.length} meals ready</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Recipe Cards */}
        <Text style={styles.sectionTitle}>Meal Plan</Text>
        {recipes.map((recipe: any) => (
          <View key={recipe.id} style={styles.recipeCard} testID={`recipe-card-${recipe.id}`}>
            <View style={styles.recipeHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.recipeReason}>{recipe.reasonChosen}</Text>
              </View>
              <View style={[styles.effortBadge, { backgroundColor: EFFORT_COLORS[recipe.effortLevel] || Colors.textMuted }]}>
                <Text style={styles.effortText}>{recipe.effortLevel}</Text>
              </View>
            </View>

            <View style={styles.recipeMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="flame-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{recipe.cookMethod}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{recipe.mealType}</Text>
              </View>
            </View>

            {/* Ingredients */}
            <View style={styles.ingredientList}>
              {recipe.ingredients?.map((ing: any, idx: number) => (
                <View key={idx} style={styles.ingredientRow}>
                  <View style={[styles.ingredientDot, { backgroundColor: ing.onHand ? Colors.success : Colors.accent }]} />
                  <Text style={styles.ingredientText}>
                    {ing.name}{ing.quantity ? ` — ${ing.quantity}` : ''}{ing.unit ? ` ${ing.unit}` : ''}
                  </Text>
                  <Text style={[styles.ingredientStatus, { color: ing.onHand ? Colors.success : Colors.accent }]}>
                    {ing.onHand ? 'Have' : 'Buy'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Recipe actions */}
            <View style={styles.recipeActions}>
              <TouchableOpacity
                testID={`regenerate-${recipe.id}`}
                style={styles.recipeActionBtn}
                onPress={() => handleRegenerateRecipe(recipe.id)}
                disabled={regeneratingId === recipe.id}
              >
                {regeneratingId === recipe.id ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
                    <Text style={styles.recipeActionText}>Replace</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                testID={`remove-${recipe.id}`}
                style={[styles.recipeActionBtn, styles.recipeActionDanger]}
                onPress={() => handleRemoveRecipe(recipe.id)}
                disabled={removingId === recipe.id}
              >
                {removingId === recipe.id ? (
                  <ActivityIndicator size="small" color={Colors.danger} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    <Text style={[styles.recipeActionText, { color: Colors.danger }]}>Remove</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Grocery List */}
        <Text style={styles.sectionTitle}>Grocery List</Text>
        {grocerySections.map((section: any, idx: number) => (
          <View key={idx} style={styles.grocerySection}>
            <View style={styles.grocerySectionHeader}>
              <Ionicons
                name={(SECTION_ICONS[section.section] || 'ellipsis-horizontal-outline') as any}
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.grocerySectionTitle}>
                {section.section.charAt(0).toUpperCase() + section.section.slice(1)}
              </Text>
              <Text style={styles.grocerySectionCount}>{section.items?.length || 0}</Text>
            </View>
            {section.items?.map((item: any, i: number) => (
              <View key={i} style={styles.groceryItem}>
                <Text style={styles.groceryItemName}>{item.name}</Text>
                <Text style={styles.groceryItemQty}>
                  {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                </Text>
                {item.estimatedPrice != null && (
                  <Text style={styles.groceryItemPrice}>${item.estimatedPrice.toFixed(2)}</Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Household Items */}
        {householdItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Household Items</Text>
            <View style={styles.householdCard}>
              {householdItems.map((item: any, idx: number) => (
                <View key={idx} style={styles.householdRow}>
                  <Ionicons name="home-outline" size={16} color={Colors.primary} />
                  <Text style={styles.householdItemText}>{item.name}</Text>
                  <Text style={styles.householdItemQty}>
                    {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Substitutions */}
        {substitutions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Substitutions</Text>
            <View style={styles.subsCard}>
              {substitutions.map((sub: any, idx: number) => (
                <View key={idx} style={styles.subRow}>
                  <Text style={styles.subOriginal}>{sub.original}</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
                  <Text style={styles.subReplacement}>{sub.substitute}</Text>
                  <Text style={styles.subReason}>{sub.reason}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Budget Summary */}
        {estimatedTotal != null && (
          <View style={styles.budgetCard}>
            <Text style={styles.budgetLabel}>Estimated Total</Text>
            <Text style={styles.budgetAmount}>${estimatedTotal.toFixed(2)}</Text>
          </View>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Notes</Text>
            {notes.map((note: string, idx: number) => (
              <Text key={idx} style={styles.noteText}>{note}</Text>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textMuted, marginTop: 16 },
  backButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primary },
  backButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBackBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textMain },
  headerSubtitle: { fontSize: 14, color: Colors.textMuted },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.textMain, marginTop: 20, marginBottom: 12 },
  recipeCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  recipeHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  recipeName: { fontSize: 17, fontWeight: '700', color: Colors.textMain },
  recipeReason: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  effortBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  effortText: { fontSize: 11, fontWeight: '700', color: '#FFF', textTransform: 'uppercase' },
  recipeMeta: { flexDirection: 'row', gap: 16, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.textMuted },
  ingredientList: { marginTop: 16 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  ingredientDot: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  ingredientText: { flex: 1, fontSize: 14, color: Colors.textMain },
  ingredientStatus: { fontSize: 12, fontWeight: '600' },
  recipeActions: { flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  recipeActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surfaceMuted },
  recipeActionDanger: { backgroundColor: '#FEF2F2' },
  recipeActionText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  grocerySection: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  grocerySectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  grocerySectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
  grocerySectionCount: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, backgroundColor: Colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  groceryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  groceryItemName: { flex: 1, fontSize: 15, color: Colors.textMain },
  groceryItemQty: { fontSize: 14, color: Colors.textMuted, marginRight: 8 },
  groceryItemPrice: { fontSize: 14, fontWeight: '500', color: Colors.textMain },
  householdCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  householdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  householdItemText: { flex: 1, fontSize: 15, color: Colors.textMain },
  householdItemQty: { fontSize: 14, color: Colors.textMuted },
  subsCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, flexWrap: 'wrap' },
  subOriginal: { fontSize: 14, color: Colors.textMuted, textDecorationLine: 'line-through' },
  subReplacement: { fontSize: 14, fontWeight: '600', color: Colors.success },
  subReason: { fontSize: 12, color: Colors.textMuted, width: '100%', marginTop: 2 },
  budgetCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary, borderRadius: 16, padding: 24, marginTop: 20,
  },
  budgetLabel: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  budgetAmount: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  notesCard: { backgroundColor: Colors.surfaceMuted, borderRadius: 14, padding: 16, marginTop: 12 },
  notesTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  noteText: { fontSize: 14, color: Colors.textMain, lineHeight: 20, marginBottom: 4 },
});
