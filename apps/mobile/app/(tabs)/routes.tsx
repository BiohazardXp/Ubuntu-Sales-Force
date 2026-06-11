import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { routesApi } from '../../src/services/api';
import type { Route, Stop } from '../../src/services/api';
import { Colors, Spacing, Radius, FontSize } from '../../src/constants/theme';

// ── Stop row ──────────────────────────────────────────────────────────────────

function StopRow({ stop, index, onPress }: { stop: Stop; index: number; onPress: () => void }) {
  const isVisited = stop.status === 'VISITED';
  const isSkipped = stop.status === 'SKIPPED';

  const badgeStyle = isVisited
    ? { bg: '#dcfce7', text: '#16a34a', label: 'Visited' }
    : isSkipped
    ? { bg: '#f1f5f9', text: '#64748b', label: 'Skipped' }
    : { bg: '#fef9c3', text: '#a16207', label: 'Pending' };

  return (
    <TouchableOpacity style={s.stopRow} onPress={onPress} activeOpacity={0.7}>
      <View style={s.stopLeft}>
        {/* Step indicator */}
        <View style={[s.stepDot, isVisited && s.stepDotDone]}>
          {isVisited
            ? <Text style={s.stepDotText}>✓</Text>
            : <Text style={s.stepDotText}>{index + 1}</Text>}
        </View>
        {/* Connector line */}
        <View style={s.connector}/>
      </View>

      <View style={s.stopBody}>
        <View style={s.stopContent}>
          <View style={{ flex: 1 }}>
            <Text style={s.stopName}>{stop.customerName}</Text>
            <Text style={s.stopAddress} numberOfLines={1}>{stop.address}</Text>
            {stop.visitedAt && (
              <Text style={s.visitedAt}>
                ✓ {new Date(stop.visitedAt).toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={[s.badge, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[s.badgeText, { color: badgeStyle.text }]}>{badgeStyle.label}</Text>
            </View>
            {!isVisited && !isSkipped && (
              <Text style={s.tapHint}>Tap to visit →</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RoutesScreen() {
  const [route,     setRoute]     = useState<Route | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    try {
      const data = await routesApi.myToday();
      setRoute(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stops    = route?.stops ?? [];
  const visited  = stops.filter(s => s.status === 'VISITED').length;
  const pct      = stops.length ? Math.round((visited / stops.length) * 100) : 0;

  if (loading) return (
    <SafeAreaView style={[s.root, s.center]}>
      <ActivityIndicator size="large" color={Colors.primary}/>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Today's Route</Text>
        <Text style={s.headerDate}>
          {new Date().toLocaleDateString('en-ZM', { weekday:'short', day:'numeric', month:'short' })}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={Colors.primary}/>
        }>

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>Could not load route. Pull down to retry.</Text>
          </View>
        )}

        {!error && !route && !loading && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🗺️</Text>
            <Text style={s.emptyTitle}>No route assigned today</Text>
            <Text style={s.emptySub}>Your supervisor hasn't assigned a route yet.</Text>
          </View>
        )}

        {route && (
          <>
            {/* Progress card */}
            <View style={s.progressCard}>
              <View style={s.progressTop}>
                <Text style={s.routeName}>{route.name ?? 'My Route'}</Text>
                <Text style={[s.progressPct, { color: pct === 100 ? Colors.success : Colors.primary }]}>
                  {pct}%
                </Text>
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressFill, {
                  width: `${pct}%` as any,
                  backgroundColor: pct === 100 ? Colors.success : Colors.primary,
                }]}/>
              </View>
              <Text style={s.progressSub}>
                {visited} of {stops.length} stops completed
              </Text>
            </View>

            {/* Stops list */}
            <View style={s.stopsList}>
              {stops.map((stop, i) => (
                <StopRow
                  key={stop.id}
                  stop={stop}
                  index={i}
                  onPress={() => router.push(`/visit/${stop.id}`)}
                />
              ))}
            </View>

            {pct === 100 && (
              <View style={s.allDoneBox}>
                <Text style={s.allDoneText}>🎉 All stops completed! Great work today.</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: Spacing.xl }}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex:1, backgroundColor: Colors.bg },
  center: { justifyContent:'center', alignItems:'center' },

  header:      { backgroundColor: Colors.bgDark, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerTitle: { fontSize: FontSize.xl, fontWeight:'700', color: Colors.textInverse },
  headerDate:  { fontSize: FontSize.sm, color:'#94a3b8', marginTop:2 },

  progressCard: { margin: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg },
  progressTop:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: Spacing.sm },
  routeName:    { fontSize: FontSize.base, fontWeight:'600', color: Colors.textPrimary, flex:1 },
  progressPct:  { fontSize: FontSize.lg, fontWeight:'700' },
  progressBg:   { height:8, backgroundColor:'#f1f5f9', borderRadius: Radius.full, overflow:'hidden', marginBottom: Spacing.xs },
  progressFill: { height:'100%', borderRadius: Radius.full },
  progressSub:  { fontSize: FontSize.sm, color: Colors.textSecondary },

  stopsList: { paddingHorizontal: Spacing.lg },

  stopRow:  { flexDirection:'row', marginBottom: Spacing.sm },
  stopLeft: { alignItems:'center', width:32, marginRight: Spacing.sm },
  stepDot:  { width:28, height:28, borderRadius:14, backgroundColor:'#dbeafe', alignItems:'center', justifyContent:'center' },
  stepDotDone: { backgroundColor:'#dcfce7' },
  stepDotText: { fontSize: FontSize.xs, fontWeight:'700', color: Colors.textPrimary },
  connector:   { flex:1, width:2, backgroundColor:'#e2e8f0', marginTop:2 },

  stopBody:    { flex:1, backgroundColor: Colors.bgCard, borderRadius: Radius.md, marginBottom:4, overflow:'hidden' },
  stopContent: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', padding: Spacing.md },
  stopName:    { fontSize: FontSize.base, fontWeight:'600', color: Colors.textPrimary, marginBottom:2 },
  stopAddress: { fontSize: FontSize.sm, color: Colors.textSecondary },
  visitedAt:   { fontSize: FontSize.xs, color: Colors.success, marginTop:4 },
  badge:       { paddingHorizontal:8, paddingVertical:3, borderRadius: Radius.full },
  badgeText:   { fontSize: FontSize.xs, fontWeight:'600' },
  tapHint:     { fontSize: FontSize.xs, color: Colors.primary },

  errorBox:  { margin: Spacing.lg, backgroundColor:'#fee2e2', borderRadius: Radius.md, padding: Spacing.md },
  errorText: { fontSize: FontSize.sm, color:'#dc2626', textAlign:'center' },

  emptyBox:   { alignItems:'center', paddingTop: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyIcon:  { fontSize:48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight:'700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptySub:   { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign:'center' },

  allDoneBox:  { margin: Spacing.lg, backgroundColor:'#dcfce7', borderRadius: Radius.md, padding: Spacing.md },
  allDoneText: { fontSize: FontSize.sm, color:'#16a34a', textAlign:'center', fontWeight:'600' },
});
