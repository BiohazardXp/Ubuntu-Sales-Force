import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { salesApi } from '../../src/services/api';
import type { Sale } from '../../src/services/api';
import { Colors, Spacing, Radius, FontSize } from '../../src/constants/theme';

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[s.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ── Sale row ──────────────────────────────────────────────────────────────────

function SaleRow({ sale, index }: { sale: Sale; index: number }) {
  const time = new Date(sale.createdAt).toLocaleTimeString('en-ZM', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={[s.saleRow, index % 2 === 0 && s.saleRowAlt]}>
      <View style={s.saleIcon}>
        <Text style={s.saleIconText}>🛒</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.saleName}>{sale.product}</Text>
        <Text style={s.saleDetail}>
          Qty {sale.quantity} × ZMW {sale.unitPrice.toLocaleString()} · {time}
        </Text>
      </View>
      <Text style={s.saleTotal}>ZMW {sale.total.toLocaleString()}</Text>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SalesScreen() {
  const [sales,      setSales]      = useState<Sale[]>([]);
  const [total,      setTotal]      = useState(0);
  const [count,      setCount]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    try {
      const res = await salesApi.myToday();
      setSales(res.sales);
      setTotal(res.total);
      setCount(res.count);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const avgOrder = count > 0 ? total / count : 0;

  // Group sales by hour for a simple breakdown
  const byHour: Record<string, number> = {};
  sales.forEach(s => {
    const h = new Date(s.createdAt).getHours();
    const label = `${String(h).padStart(2, '0')}:00`;
    byHour[label] = (byHour[label] ?? 0) + s.total;
  });
  const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];

  if (loading) return (
    <SafeAreaView style={[s.root, s.center]}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Sales Today</Text>
        <Text style={s.headerDate}>
          {new Date().toLocaleDateString('en-ZM', { weekday: 'short', day: 'numeric', month: 'short' })}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={Colors.primary} />
        }>

        {/* Stats */}
        <View style={s.statsGrid}>
          <StatCard
            label="Total Revenue"
            value={`ZMW ${total.toLocaleString()}`}
            color={Colors.success} />
          <StatCard
            label="Transactions"
            value={count.toString()}
            color={Colors.primary} />
        </View>
        <View style={s.statsGrid}>
          <StatCard
            label="Avg Order"
            value={avgOrder > 0 ? `ZMW ${Math.round(avgOrder).toLocaleString()}` : '—'}
            color={Colors.purple} />
          <StatCard
            label="Peak Hour"
            value={peakHour ? peakHour[0] : '—'}
            color={Colors.warning} />
        </View>

        {/* Revenue banner */}
        {total > 0 && (
          <View style={s.banner}>
            <Text style={s.bannerLabel}>Total Revenue Today</Text>
            <Text style={s.bannerValue}>ZMW {total.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</Text>
          </View>
        )}

        {/* Sales list */}
        <View style={s.listCard}>
          <View style={s.listHeader}>
            <Text style={s.listTitle}>Transactions</Text>
            <Text style={s.listCount}>{count} total</Text>
          </View>

          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>Could not load sales. Pull down to retry.</Text>
            </View>
          )}

          {!error && sales.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={s.emptyTitle}>No sales yet today</Text>
              <Text style={s.emptySub}>Visit a customer and record your first sale.</Text>
            </View>
          )}

          {sales.map((sale, i) => (
            <SaleRow key={sale.id} sale={sale} index={i} />
          ))}

          {sales.length > 0 && (
            <View style={s.listFooter}>
              <Text style={s.listFooterLabel}>Total</Text>
              <Text style={s.listFooterValue}>
                ZMW {total.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  header:      { backgroundColor: Colors.bgDark, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textInverse },
  headerDate:  { fontSize: FontSize.sm, color: '#94a3b8', marginTop: 2 },

  statsGrid: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  statCard:  { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.md },
  statValue: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },

  banner:      { margin: Spacing.lg, marginBottom: 0, backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center' },
  bannerLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  bannerValue: { fontSize: FontSize.xxl, fontWeight: '700', color: 'white' },

  listCard:   { margin: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, overflow: 'hidden' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  listTitle:  { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  listCount:  { fontSize: FontSize.sm, color: Colors.textSecondary },

  saleRow:    { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: Spacing.sm },
  saleRowAlt: { backgroundColor: '#fafafa' },
  saleIcon:   { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  saleIconText: { fontSize: 16 },
  saleName:   { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  saleDetail: { fontSize: FontSize.xs, color: Colors.textSecondary },
  saleTotal:  { fontSize: FontSize.base, fontWeight: '700', color: Colors.success },

  listFooter:      { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: Colors.border },
  listFooterLabel: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textSecondary },
  listFooterValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.success },

  errorBox:  { padding: Spacing.lg, alignItems: 'center' },
  errorText: { fontSize: FontSize.sm, color: Colors.danger },

  emptyBox:   { padding: Spacing.xl, alignItems: 'center' },
  emptyIcon:  { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptySub:   { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
});
