import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { routesApi, salesApi } from '../../src/services/api';
import type { Stop, Sale } from '../../src/services/api';
import { Colors, Spacing, Radius, FontSize } from '../../src/constants/theme';

export default function VisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [stop,         setStop]         = useState<Stop | null>(null);
  const [sales,        setSales]        = useState<Sale[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [marking,      setMarking]      = useState(false);
  const [addingSale,   setAddingSale]   = useState(false);

  // Sale form
  const [product,   setProduct]   = useState('');
  const [quantity,  setQuantity]  = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const route = await routesApi.myToday();
      if (!route) { setLoading(false); return; }
      const found = route.stops.find(s => s.id === id);
      if (found) setStop(found);
      const { sales: mySales } = await salesApi.myToday();
      setSales(mySales.filter((s: any) => s.stopId === id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const getCoords = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return undefined;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch { return undefined; }
  };

  const handleCheckIn = async () => {
    if (!stop) return;
    setMarking(true);
    try {
      const coords = await getCoords();
      const updated = await routesApi.updateStop(stop.id, { status: 'VISITED', ...coords });
      setStop(updated);
      Alert.alert('Checked in ✓', `Visit logged for ${stop.customerName}`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not check in.');
    } finally {
      setMarking(false);
    }
  };

  const handleSkip = () => {
    Alert.alert('Skip this stop?', 'This will mark the stop as skipped.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Skip', style: 'destructive',
        onPress: async () => {
          setMarking(true);
          try {
            const updated = await routesApi.updateStop(stop!.id, { status: 'SKIPPED' });
            setStop(updated);
          } finally {
            setMarking(false);
          }
        },
      },
    ]);
  };

  const handleAddSale = async () => {
    if (!product.trim() || !unitPrice.trim()) {
      Alert.alert('Missing fields', 'Please enter a product name and unit price.');
      return;
    }
    const qty   = parseInt(quantity)   || 1;
    const price = parseFloat(unitPrice) || 0;
    if (price <= 0) { Alert.alert('Invalid price', 'Unit price must be greater than 0.'); return; }

    setAddingSale(true);
    try {
      const coords = await getCoords();
      const sale = await salesApi.create({
        product:   product.trim(),
        quantity:  qty,
        unitPrice: price,
        stopId:    stop?.id,
        localId:   `${stop?.id}-${Date.now()}`,
        ...coords,
      });
      setSales(prev => [...prev, sale]);
      setProduct(''); setQuantity('1'); setUnitPrice('');
      Alert.alert('Sale recorded ✓', `ZMW ${sale.total.toLocaleString()} added.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not record sale.');
    } finally {
      setAddingSale(false);
    }
  };

  const totalRevenue = sales.reduce((s, r) => s + r.total, 0);
  const isVisited    = stop?.status === 'VISITED';
  const isSkipped    = stop?.status === 'SKIPPED';

  if (loading) return (
    <SafeAreaView style={[s.root, s.center]}>
      <ActivityIndicator size="large" color={Colors.primary}/>
    </SafeAreaView>
  );

  if (!stop) return (
    <SafeAreaView style={[s.root, s.center]}>
      <Text style={s.errorText}>Stop not found</Text>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backBtnText}>← Back to Routes</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
            <Text style={s.backLinkText}>← Routes</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{stop.customerName}</Text>
          <Text style={s.headerAddress} numberOfLines={1}>{stop.address}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Status card */}
          <View style={s.statusCard}>
            <View style={s.statusRow}>
              <Text style={s.statusLabel}>Status</Text>
              <View style={[s.badge, {
                backgroundColor: isVisited ? '#dcfce7' : isSkipped ? '#f1f5f9' : '#fef9c3'
              }]}>
                <Text style={[s.badgeText, {
                  color: isVisited ? '#16a34a' : isSkipped ? '#64748b' : '#a16207'
                }]}>
                  {isVisited ? '✓ Visited' : isSkipped ? 'Skipped' : '⏳ Pending'}
                </Text>
              </View>
            </View>

            {isVisited && stop.visitedAt && (
              <Text style={s.visitTime}>
                Checked in at {new Date(stop.visitedAt).toLocaleTimeString('en-ZM', { hour:'2-digit', minute:'2-digit' })}
              </Text>
            )}

            {/* Action buttons */}
            {!isVisited && !isSkipped && (
              <View style={s.actionRow}>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: Colors.success, flex:2 }]}
                  onPress={handleCheckIn} disabled={marking} activeOpacity={0.85}>
                  {marking
                    ? <ActivityIndicator color="white" size="small"/>
                    : <Text style={s.actionBtnText}>✓  Check In</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor:'#f1f5f9', flex:1 }]}
                  onPress={handleSkip} disabled={marking} activeOpacity={0.85}>
                  <Text style={[s.actionBtnText, { color: Colors.textSecondary }]}>Skip</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Revenue summary */}
          {isVisited && (
            <View style={s.summaryRow}>
              {[
                { label:'Sales',    value: sales.length.toString(),              color: Colors.primary },
                { label:'Revenue',  value:`ZMW ${totalRevenue.toLocaleString()}`, color: Colors.success },
              ].map(c => (
                <View key={c.label} style={s.summaryCard}>
                  <Text style={[s.summaryValue, { color: c.color }]}>{c.value}</Text>
                  <Text style={s.summaryLabel}>{c.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Add sale form */}
          {isVisited && (
            <View style={s.saleForm}>
              <Text style={s.sectionTitle}>Record a Sale</Text>

              <Text style={s.fieldLabel}>Product Name</Text>
              <TextInput style={s.input} placeholder="e.g. Coca-Cola 2L"
                placeholderTextColor={Colors.textMuted}
                value={product} onChangeText={setProduct}/>

              <View style={s.saleRow}>
                <View style={{ flex:1 }}>
                  <Text style={s.fieldLabel}>Quantity</Text>
                  <TextInput style={s.input} keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    value={quantity} onChangeText={setQuantity}/>
                </View>
                <View style={{ width: Spacing.sm }}/>
                <View style={{ flex:2 }}>
                  <Text style={s.fieldLabel}>Unit Price (ZMW)</Text>
                  <TextInput style={s.input} keyboardType="decimal-pad"
                    placeholder="0.00" placeholderTextColor={Colors.textMuted}
                    value={unitPrice} onChangeText={setUnitPrice}/>
                </View>
              </View>

              {/* Total preview */}
              {unitPrice && (
                <View style={s.totalPreview}>
                  <Text style={s.totalPreviewLabel}>Total</Text>
                  <Text style={s.totalPreviewValue}>
                    ZMW {((parseInt(quantity)||1) * (parseFloat(unitPrice)||0)).toLocaleString()}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={[s.actionBtn, { backgroundColor: Colors.primary, marginTop: Spacing.sm }]}
                onPress={handleAddSale} disabled={addingSale} activeOpacity={0.85}>
                {addingSale
                  ? <ActivityIndicator color="white" size="small"/>
                  : <Text style={s.actionBtnText}>+ Record Sale</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Sales list */}
          {sales.length > 0 && (
            <View style={s.salesList}>
              <Text style={s.sectionTitle}>Sales at this Stop</Text>
              {sales.map(sale => (
                <View key={sale.id} style={s.saleRow2}>
                  <View style={{ flex:1 }}>
                    <Text style={s.saleName}>{sale.product}</Text>
                    <Text style={s.saleDetail}>Qty {sale.quantity} × ZMW {sale.unitPrice.toLocaleString()}</Text>
                  </View>
                  <Text style={s.saleTotal}>ZMW {sale.total.toLocaleString()}</Text>
                </View>
              ))}
              <View style={s.salesTotalRow}>
                <Text style={s.salesTotalLabel}>Total</Text>
                <Text style={s.salesTotalValue}>ZMW {totalRevenue.toLocaleString()}</Text>
              </View>
            </View>
          )}

          <View style={{ height: Spacing.xl }}/>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex:1, backgroundColor: Colors.bg },
  center: { justifyContent:'center', alignItems:'center' },

  header:        { backgroundColor: Colors.bgDark, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.md },
  backLink:      { marginBottom: Spacing.xs },
  backLinkText:  { fontSize: FontSize.sm, color:'#94a3b8' },
  headerTitle:   { fontSize: FontSize.xl, fontWeight:'700', color: Colors.textInverse },
  headerAddress: { fontSize: FontSize.sm, color:'#94a3b8', marginTop:2 },

  statusCard:  { margin: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg },
  statusRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: Spacing.sm },
  statusLabel: { fontSize: FontSize.base, fontWeight:'600', color: Colors.textPrimary },
  badge:       { paddingHorizontal:10, paddingVertical:4, borderRadius: Radius.full },
  badgeText:   { fontSize: FontSize.sm, fontWeight:'600' },
  visitTime:   { fontSize: FontSize.sm, color: Colors.success, marginBottom: Spacing.md },
  actionRow:   { flexDirection:'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn:   { borderRadius: Radius.md, paddingVertical:13, alignItems:'center', justifyContent:'center' },
  actionBtnText:{ fontSize: FontSize.base, fontWeight:'700', color:'white' },

  summaryRow:  { flexDirection:'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.sm },
  summaryCard: { flex:1, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.md, alignItems:'center' },
  summaryValue:{ fontSize: FontSize.lg, fontWeight:'700', marginBottom:2 },
  summaryLabel:{ fontSize: FontSize.xs, color: Colors.textSecondary },

  saleForm:   { margin: Spacing.lg, marginTop:0, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg },
  sectionTitle:{ fontSize: FontSize.base, fontWeight:'700', color: Colors.textPrimary, marginBottom: Spacing.md },
  fieldLabel: { fontSize: FontSize.xs, fontWeight:'600', color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform:'uppercase', letterSpacing:0.4 },
  input:      { borderWidth:1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical:11, fontSize: FontSize.base, color: Colors.textPrimary, backgroundColor:'#f8fafc', marginBottom: Spacing.sm },
  saleRow:    { flexDirection:'row' },
  totalPreview:     { flexDirection:'row', justifyContent:'space-between', backgroundColor:'#f0fdf4', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xs },
  totalPreviewLabel:{ fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight:'600' },
  totalPreviewValue:{ fontSize: FontSize.base, fontWeight:'700', color: Colors.success },

  salesList:     { margin: Spacing.lg, marginTop:0, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg },
  saleRow2:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical: Spacing.sm, borderBottomWidth:1, borderBottomColor: Colors.borderLight },
  saleName:      { fontSize: FontSize.sm, fontWeight:'600', color: Colors.textPrimary },
  saleDetail:    { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop:2 },
  saleTotal:     { fontSize: FontSize.base, fontWeight:'700', color: Colors.success },
  salesTotalRow: { flexDirection:'row', justifyContent:'space-between', paddingTop: Spacing.sm, marginTop: Spacing.xs },
  salesTotalLabel:{ fontSize: FontSize.sm, fontWeight:'600', color: Colors.textSecondary },
  salesTotalValue:{ fontSize: FontSize.lg, fontWeight:'700', color: Colors.success },

  errorText: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing.md },
  backBtn:   { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  backBtnText:{ fontSize: FontSize.sm, fontWeight:'600', color:'white' },
});
