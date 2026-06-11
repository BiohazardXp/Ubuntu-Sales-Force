import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../src/hooks/useAuth';
import { attendanceApi, salesApi, routesApi } from '../../src/services/api';
import type { Attendance, Route } from '../../src/services/api';
import { Colors, Spacing, Radius, FontSize } from '../../src/constants/theme';

// ── Small components ──────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[scard.wrap, { borderLeftColor: color }]}>
      <Text style={scard.value}>{value}</Text>
      <Text style={scard.label}>{label}</Text>
    </View>
  );
}
const scard = StyleSheet.create({
  wrap:  { flex:1, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth:3, margin: Spacing.xs / 2 },
  value: { fontSize: FontSize.xl, fontWeight:'700', color: Colors.textPrimary, marginBottom:2 },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary },
});

function ClockBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    PRESENT: { bg:'#dcfce7', text:'#16a34a', label:'On Time' },
    LATE:    { bg:'#fef9c3', text:'#a16207', label:'Clocked In (Late)' },
    ABSENT:  { bg:'#fee2e2', text:'#dc2626', label:'Absent' },
  };
  const s = map[status] ?? map.ABSENT;
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: Radius.full, paddingHorizontal:10, paddingVertical:4 }}>
      <Text style={{ fontSize: FontSize.xs, fontWeight:'600', color: s.text }}>{s.label}</Text>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user, logout } = useAuth();

  const [attendance,    setAttendance]    = useState<Attendance | null>(null);
  const [route,         setRoute]         = useState<Route | null>(null);
  const [salesTotal,    setSalesTotal]    = useState(0);
  const [salesCount,    setSalesCount]    = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [clockLoading,  setClockLoading]  = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [att, rt, salesRes] = await Promise.allSettled([
        attendanceApi.today(),
        routesApi.myToday(),
        salesApi.myToday(),
      ]);
      if (att.status    === 'fulfilled') setAttendance(att.value);
      if (rt.status     === 'fulfilled') setRoute(rt.value);
      if (salesRes.status === 'fulfilled') {
        setSalesTotal(salesRes.value.total);
        setSalesCount(salesRes.value.count);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Get GPS coords — ask permission first
  const getCoords = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return undefined;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch { return undefined; }
  };

  const handleClockIn = async () => {
    setClockLoading(true);
    try {
      const coords = await getCoords();
      const record = await attendanceApi.clockIn(coords);
      setAttendance(record);
      Alert.alert('Clocked in ✓', `Welcome ${user?.firstName}! Have a great day.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : (msg ?? 'Could not clock in.'));
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    Alert.alert('Clock out', 'Are you sure you want to clock out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clock Out', style: 'destructive',
        onPress: async () => {
          setClockLoading(true);
          try {
            const coords = await getCoords();
            const record = await attendanceApi.clockOut(coords);
            setAttendance(record);
            Alert.alert('Clocked out ✓', 'See you tomorrow!');
          } catch (err: any) {
            const msg = err?.response?.data?.message;
            Alert.alert('Error', Array.isArray(msg) ? msg[0] : (msg ?? 'Could not clock out.'));
          } finally {
            setClockLoading(false);
          }
        },
      },
    ]);
  };

  const isClockedIn  = !!attendance?.clockIn;
  const isClockedOut = !!attendance?.clockOut;
  const stopsTotal   = route?.stops?.length ?? 0;
  const stopsVisited = route?.stops?.filter(s => s.status === 'VISITED').length ?? 0;
  const routePct     = stopsTotal ? Math.round((stopsVisited / stopsTotal) * 100) : 0;

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-ZM', { hour:'2-digit', minute:'2-digit' });

  if (loading) return (
    <SafeAreaView style={[s.root, { justifyContent:'center', alignItems:'center' }]}>
      <ActivityIndicator size="large" color={Colors.primary}/>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary}/>}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'},
            </Text>
            <Text style={s.name}>{user?.firstName} {user?.lastName} 👋</Text>
            {user?.territory && (
              <Text style={s.territory}>📍 {user.territory}</Text>
            )}
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Attendance card */}
        <View style={s.section}>
          <View style={s.attendanceCard}>
            <View style={s.attendanceTop}>
              <Text style={s.sectionTitle}>Today's Attendance</Text>
              {attendance && <ClockBadge status={attendance.status}/>}
            </View>

            {/* Clock times */}
            {isClockedIn && (
              <View style={s.timeRow}>
                <View style={s.timeItem}>
                  <Text style={s.timeLabel}>Clock In</Text>
                  <Text style={s.timeValue}>{fmtTime(attendance!.clockIn!)}</Text>
                </View>
                {isClockedOut && (
                  <View style={s.timeItem}>
                    <Text style={s.timeLabel}>Clock Out</Text>
                    <Text style={s.timeValue}>{fmtTime(attendance!.clockOut!)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Clock in / out button */}
            {!isClockedIn && (
              <TouchableOpacity style={[s.clockBtn, { backgroundColor: Colors.success }]}
                onPress={handleClockIn} disabled={clockLoading} activeOpacity={0.85}>
                {clockLoading
                  ? <ActivityIndicator color="white" size="small"/>
                  : <Text style={s.clockBtnText}>✓  Clock In</Text>}
              </TouchableOpacity>
            )}
            {isClockedIn && !isClockedOut && (
              <TouchableOpacity style={[s.clockBtn, { backgroundColor: Colors.danger }]}
                onPress={handleClockOut} disabled={clockLoading} activeOpacity={0.85}>
                {clockLoading
                  ? <ActivityIndicator color="white" size="small"/>
                  : <Text style={s.clockBtnText}>✕  Clock Out</Text>}
              </TouchableOpacity>
            )}
            {isClockedOut && (
              <View style={[s.clockBtn, { backgroundColor:'#f1f5f9' }]}>
                <Text style={[s.clockBtnText, { color: Colors.textSecondary }]}>Shift complete</Text>
              </View>
            )}
          </View>
        </View>

        {/* Today's stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Today's Performance</Text>
          <View style={s.statsRow}>
            <StatCard label="Sales Revenue"   value={`ZMW ${salesTotal.toLocaleString()}`} color={Colors.success}/>
            <StatCard label="Transactions"     value={salesCount.toString()}                 color={Colors.primary}/>
          </View>
          <View style={s.statsRow}>
            <StatCard label="Stops Visited"    value={`${stopsVisited} / ${stopsTotal}`}     color={Colors.warning}/>
            <StatCard label="Route Progress"   value={`${routePct}%`}                         color={Colors.purple}/>
          </View>
        </View>

        {/* Route progress */}
        {route && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Today's Route</Text>
            <View style={s.routeCard}>
              <View style={s.routeHeader}>
                <Text style={s.routeName}>{route.name ?? 'My Route'}</Text>
                <Text style={s.routeCount}>{stopsVisited}/{stopsTotal} stops</Text>
              </View>

              {/* Progress bar */}
              <View style={s.progressBg}>
                <View style={[s.progressFill, {
                  width: `${routePct}%` as any,
                  backgroundColor: routePct === 100 ? Colors.success : Colors.primary,
                }]}/>
              </View>

              {/* Next pending stop */}
              {route.stops.find(s => s.status === 'PENDING') && (
                <View style={s.nextStop}>
                  <Text style={s.nextStopLabel}>Next stop</Text>
                  <Text style={s.nextStopName}>
                    {route.stops.find(s => s.status === 'PENDING')?.customerName}
                  </Text>
                  <Text style={s.nextStopAddress}>
                    {route.stops.find(s => s.status === 'PENDING')?.address}
                  </Text>
                </View>
              )}
              {routePct === 100 && (
                <Text style={s.allDone}>🎉 All stops completed!</Text>
              )}
            </View>
          </View>
        )}

        {!route && (
          <View style={s.section}>
            <View style={s.emptyRoute}>
              <Text style={s.emptyIcon}>🗺️</Text>
              <Text style={s.emptyTitle}>No route assigned</Text>
              <Text style={s.emptySub}>Your supervisor hasn't assigned a route for today yet.</Text>
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xl }}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex:1, backgroundColor: Colors.bg },
  header:  { backgroundColor: Colors.bgDark, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg, flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  greeting:{ fontSize: FontSize.sm, color:'#94a3b8' },
  name:    { fontSize: FontSize.xl, fontWeight:'700', color: Colors.textInverse, marginTop:2 },
  territory:{ fontSize: FontSize.sm, color:'#94a3b8', marginTop:4 },
  logoutBtn:{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth:1, borderColor:'#334155' },
  logoutText:{ fontSize: FontSize.xs, color:'#94a3b8' },

  section:     { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  sectionTitle:{ fontSize: FontSize.sm, fontWeight:'700', color: Colors.textSecondary, textTransform:'uppercase', letterSpacing:0.5, marginBottom: Spacing.sm },

  // Attendance card
  attendanceCard:{ backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg },
  attendanceTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: Spacing.md },
  timeRow:   { flexDirection:'row', gap: Spacing.xl, marginBottom: Spacing.md },
  timeItem:  {},
  timeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom:2 },
  timeValue: { fontSize: FontSize.lg, fontWeight:'700', color: Colors.textPrimary },
  clockBtn:  { borderRadius: Radius.md, paddingVertical:14, alignItems:'center' },
  clockBtnText:{ fontSize: FontSize.base, fontWeight:'700', color:'white' },

  // Stats
  statsRow: { flexDirection:'row', marginHorizontal: -Spacing.xs / 2 },

  // Route card
  routeCard:   { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg },
  routeHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: Spacing.sm },
  routeName:   { fontSize: FontSize.base, fontWeight:'600', color: Colors.textPrimary },
  routeCount:  { fontSize: FontSize.sm, color: Colors.textSecondary },
  progressBg:  { height:8, backgroundColor:'#f1f5f9', borderRadius: Radius.full, overflow:'hidden', marginBottom: Spacing.md },
  progressFill:{ height:'100%', borderRadius: Radius.full },
  nextStop:    { backgroundColor:'#f8fafc', borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth:3, borderLeftColor: Colors.primary },
  nextStopLabel:{ fontSize: FontSize.xs, color: Colors.textMuted, marginBottom:2 },
  nextStopName: { fontSize: FontSize.base, fontWeight:'600', color: Colors.textPrimary },
  nextStopAddress:{ fontSize: FontSize.sm, color: Colors.textSecondary, marginTop:2 },
  allDone:     { textAlign:'center', fontSize: FontSize.base, color: Colors.success, fontWeight:'600' },

  // Empty
  emptyRoute:  { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.xl, alignItems:'center' },
  emptyIcon:   { fontSize:40, marginBottom: Spacing.sm },
  emptyTitle:  { fontSize: FontSize.lg, fontWeight:'700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptySub:    { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign:'center' },
});
