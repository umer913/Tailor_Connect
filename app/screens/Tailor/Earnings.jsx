import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SERVER = "https://tailorconnect-production.up.railway.app";
const SCREEN_W = Dimensions.get("window").width;
const IS_TABLET = SCREEN_W >= 768;
const CONTENT_MAX_WIDTH = SCREEN_W >= 1024 ? 920 : IS_TABLET ? 760 : SCREEN_W;
const PAGE_GUTTER = IS_TABLET ? 28 : 20;

const STATUS_COLORS = {
  pending:     { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  text: "#F59E0B" },
  accepted:    { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  text: "#3B82F6" },
  in_progress: { bg: "rgba(124,58,237,0.12)",  border: "rgba(124,58,237,0.3)",  text: "#8B5CF6" },
  completed:   { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  text: "#10B981" },
  paid:        { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  text: "#10B981" },
  cancelled:   { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   text: "#EF4444" },
  rejected:    { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   text: "#EF4444" },
};

// Time span config: label shown in pill, value used in state, # of periods
const TIME_SPANS = [
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "2Y", value: "2y" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function Earnings({ route, navigation }) {
  const email = route.params?.email;
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedBar, setSelectedBar]   = useState(null);
  const [timeSpan, setTimeSpan]         = useState("6m");
  const chartScrollRef                  = useRef(null);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${SERVER}/orders/tailor-orders`, { params: { email } });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.log("Error fetching tailor orders:", err);
      Alert.alert("Error", "Failed to load earnings data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const validOrders = orders.filter(
    (o) => o.status && !["cancelled","rejected"].includes(o.status.toLowerCase())
  );
  const totalSales        = validOrders.reduce((s, o) => s + (Number(o.price) || 0), 0);
  const completedEarnings = orders
    .filter((o) => ["completed","paid"].includes((o.status || "").toLowerCase()))
    .reduce((s, o) => s + (Number(o.price) || 0), 0);
  const activeEarnings    = orders
    .filter((o) => ["accepted","in_progress"].includes((o.status || "").toLowerCase()))
    .reduce((s, o) => s + (Number(o.price) || 0), 0);
  const pendingEarnings   = orders
    .filter((o) => (o.status || "").toLowerCase() === "pending")
    .reduce((s, o) => s + (Number(o.price) || 0), 0);
  const avgOrderValue     = validOrders.length > 0 ? totalSales / validOrders.length : 0;

  // ─── Chart Data ───────────────────────────────────────────────────────────
  const getChartData = () => {
    const now    = new Date();
    const result = [];

    const addMonthBuckets = (count) => {
      // For 2Y (24 months) use short year label to save space
      const shortYear = count > 12;
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push({
          label:    MONTHS[d.getMonth()],
          subLabel: shortYear ? `'${d.getFullYear().toString().slice(2)}` : d.getFullYear().toString(),
          amount:   0,
          count:    0,
          id:       `${d.getFullYear()}-${d.getMonth()}`,
        });
      }
      validOrders.forEach((order) => {
        const od = new Date(order.created_at || order.createdAt);
        if (isNaN(od.getTime())) return;
        const match = result.find((r) => r.id === `${od.getFullYear()}-${od.getMonth()}`);
        if (match) { match.amount += Number(order.price) || 0; match.count += 1; }
      });
    };

    if (timeSpan === "3m")      addMonthBuckets(3);
    else if (timeSpan === "6m") addMonthBuckets(6);
    else if (timeSpan === "1y") addMonthBuckets(12);
    else if (timeSpan === "2y") addMonthBuckets(24);

    return result;
  };

  const chartData  = getChartData();
  const maxAmount  = Math.max(...chartData.map((m) => m.amount), 1);
  const totalChart = chartData.reduce((s, m) => s + m.amount, 0);

  // Bar sizing: narrow for many bars
  const barWidth  = chartData.length > 20 ? 8 : chartData.length > 10 ? 14 : chartData.length > 6 ? 18 : 22;
  const barGap    = chartData.length > 20 ? 4 : chartData.length > 10 ? 6  : 10;
  const chartScrollable = chartData.length > 8; // scroll if too many bars

  // ─── Filtered orders list ─────────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    const s = (o.status || "").toLowerCase();
    if (activeFilter === "completed") return s === "completed" || s === "paid";
    if (activeFilter === "pending")   return s === "pending";
    if (activeFilter === "active")    return s === "accepted" || s === "in_progress";
    return true;
  });

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <LinearGradient colors={["#050811","#0b1220","#141c30"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </LinearGradient>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={["#050811","#0b1220","#141c30"]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#050811" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginLeft: 14 }}>
        
          <Text style={styles.headerTitle}>Earnings Dashboard</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── KPI GRID ── */}
        <View style={styles.gridRow}>
          <KpiCard
            label="Total Sales"
            value={`Rs. ${totalSales.toLocaleString()}`}
            sub={`${validOrders.length} valid orders`}
            icon="wallet-outline"
            iconColor="#3B82F6"
            iconBg="rgba(59,130,246,0.15)"
          />
          <KpiCard
            label="Completed"
            value={`Rs. ${completedEarnings.toLocaleString()}`}
            sub="Payout ready"
            icon="checkmark-done"
            iconColor="#10B981"
            iconBg="rgba(16,185,129,0.15)"
          />
        </View>

        <View style={[styles.gridRow, { marginTop: 12 }]}>
          <KpiCard
            label="Active Sales"
            value={`Rs. ${activeEarnings.toLocaleString()}`}
            sub="In production"
            icon="hourglass-outline"
            iconColor="#8B5CF6"
            iconBg="rgba(139,92,246,0.15)"
          />
          <KpiCard
            label="Avg Order"
            value={`Rs. ${Math.round(avgOrderValue).toLocaleString()}`}
            sub="Per order"
            icon="trending-up-outline"
            iconColor="#F59E0B"
            iconBg="rgba(245,158,11,0.15)"
          />
        </View>

        {/* ── CHART ── */}
        <View style={styles.chartContainer}>

          {/* Title row */}
          <View style={styles.chartTitleRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <LinearGradient colors={["#3B82F6","#2563EB"]} style={styles.accentBar} />
              <Text style={styles.chartTitle}>Earnings Trend</Text>
            </View>
            <Text style={styles.chartSubValue}>Rs. {totalChart.toLocaleString()}</Text>
          </View>

          {/* Time span pills — scrollable row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeSpanRow}
          >
            {TIME_SPANS.map((opt) => {
              const active = timeSpan === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.timeSpanPill, active && styles.timeSpanPillActive]}
                  onPress={() => { setTimeSpan(opt.value); setSelectedBar(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.timeSpanText, active && styles.timeSpanTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tooltip */}
          {selectedBar !== null && chartData[selectedBar] && (
            <LinearGradient colors={["#1d4ed8","#2563EB"]} style={styles.tooltip}>
              <Text style={styles.tooltipLabel}>
                {chartData[selectedBar].label}
                {chartData[selectedBar].subLabel ? `  ${chartData[selectedBar].subLabel}` : ""}
              </Text>
              <Text style={styles.tooltipAmount}>
                Rs. {chartData[selectedBar].amount.toLocaleString()}
              </Text>
              <View style={styles.tooltipBadge}>
                <Text style={styles.tooltipBadgeText}>
                  {chartData[selectedBar].count} order{chartData[selectedBar].count !== 1 ? "s" : ""}
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Y-axis labels + bars */}
          <View style={styles.chartBody}>
            {/* Y-axis */}
            <View style={styles.yAxis}>
              {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                <Text key={ratio} style={styles.yLabel}>
                  {ratio === 0 ? "0" : `${Math.round((maxAmount * ratio) / 1000)}k`}
                </Text>
              ))}
            </View>

            {/* Horizontal grid lines + bars */}
            <View style={{ flex: 1 }}>
              {/* Grid lines */}
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                  <View
                    key={ratio}
                    style={[styles.gridLine, { bottom: ratio * BAR_MAX_H }]}
                  />
                ))}
              </View>

              {/* Bars scroll or static */}
              <ScrollView
                ref={chartScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={chartScrollable}
                contentContainerStyle={[
                  styles.barsContent,
                  !chartScrollable && { flex: 1, justifyContent: "space-between" },
                ]}
                style={{ height: BAR_MAX_H + 40 }}
              >
                {chartData.map((item, idx) => {
                  const barH     = Math.max((item.amount / maxAmount) * BAR_MAX_H, 4);
                  const isActive = selectedBar === idx;
                  const hasData  = item.amount > 0;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.barCol, { marginHorizontal: barGap / 2 }]}
                      onPress={() => setSelectedBar(isActive ? null : idx)}
                      activeOpacity={0.75}
                    >
                      {/* Value label on top when selected */}
                      {isActive && (
                        <Text style={styles.barValueLabel}>
                          {item.amount >= 1000
                            ? `${(item.amount / 1000).toFixed(1)}k`
                            : item.amount}
                        </Text>
                      )}
                      <View style={[styles.barTrack, { width: barWidth }]}>
                        {hasData ? (
                          <LinearGradient
                            colors={
                              isActive
                                ? ["#FBBF24","#F59E0B"]
                                : ["#60A5FA","#3B82F6","#2563EB"]
                            }
                            style={[styles.barFill, { height: barH, width: barWidth }]}
                          />
                        ) : (
                          <View style={[styles.barEmpty, { width: barWidth }]} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.barLabel,
                          { fontSize: barWidth <= 10 ? 8 : barWidth <= 14 ? 9 : 10 },
                          isActive && styles.barLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Monthly Revenue</Text>
            {chartScrollable && (
              <Text style={styles.legendHint}>← scroll to see all →</Text>
            )}
          </View>
        </View>

        {/* ── ORDERS LIST ── */}
        <View style={styles.salesSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <LinearGradient colors={["#3B82F6","#2563EB"]} style={styles.accentBar} />
              <Text style={styles.sectionTitle}>Sales & Orders</Text>
            </View>
            <View style={styles.orderCountBadge}>
              <Text style={styles.orderCountText}>{filteredOrders.length}</Text>
            </View>
          </View>

          {/* Filter tabs */}
          <View style={styles.filterBar}>
            {["all","active","completed","pending"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab)}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredOrders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="receipt-outline" size={32} color="rgba(255,255,255,0.2)" />
              </View>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptyText}>Try a different filter to see your orders.</Text>
            </View>
          ) : (
            filteredOrders.map((item) => {
              const statusLower  = (item.status || "pending").toLowerCase();
              const badgeStyle   = STATUS_COLORS[statusLower] || STATUS_COLORS.pending;
              return (
                <View key={item.id || item._id} style={styles.orderCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.service_type || "Stitching Service"}
                      </Text>
                      <Text style={styles.cardCustomerText}>{item.customer_email}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
                      <Text style={[styles.statusText, { color: badgeStyle.text }]}>
                        {item.status
                          ? item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " ")
                          : "Pending"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardDivider} />
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.footerLabel}>PLACED ON</Text>
                      <Text style={styles.footerVal}>{formatDate(item.created_at || item.createdAt)}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.footerLabel}>AMOUNT</Text>
                      <Text style={styles.footerAmount}>
                        Rs. {item.price ? Number(item.price).toLocaleString() : 0}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

// ─── KPI Card sub-component ───────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, iconColor, iconBg }) {
  return (
    <LinearGradient colors={["#1e293b","#0f172a"]} style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <View style={[styles.kpiIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiSub}>{sub}</Text>
    </LinearGradient>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BAR_MAX_H = IS_TABLET ? 160 : 130;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText:      { color: "#94a3b8", marginTop: 12, fontSize: 15, fontWeight: "600" },

  header: {
    paddingTop:          Platform.OS === "ios" ? 56 : 42,
    paddingBottom:       20,
    paddingHorizontal:   PAGE_GUTTER,
    flexDirection:       "row",
    alignItems:          "center",
    borderBottomWidth:   1,
    borderBottomColor:   "rgba(59,130,246,0.1)",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  headerSub:   { fontSize: 11, color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.2 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2 },

  scrollContent: {
    paddingHorizontal: PAGE_GUTTER,
    paddingBottom:     50,
    paddingTop:        16,
    width:             "100%",
    maxWidth:          CONTENT_MAX_WIDTH,
    alignSelf:         "center",
  },

  // ── KPI ──
  gridRow:    { flexDirection: "row", gap: 12 },
  kpiCard:    { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "rgba(59,130,246,0.12)" },
  kpiHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  kpiLabel:   { color: "#94a3b8", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  kpiIconWrap:{ width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  kpiValue:   { color: "#fff", fontSize: IS_TABLET ? 18 : 16, fontWeight: "900" },
  kpiSub:     { color: "rgba(148,163,184,0.6)", fontSize: 11, marginTop: 4, fontWeight: "600" },

  // ── Chart container ──
  chartContainer: {
    backgroundColor: "rgba(15,23,42,0.65)",
    padding:         IS_TABLET ? 24 : 18,
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     "rgba(59,130,246,0.18)",
    marginVertical:  16,
  },
  chartTitleRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   14,
  },
  accentBar:      { width: 4, height: 16, borderRadius: 2 },
  chartTitle:     { color: "#fff", fontSize: 15, fontWeight: "800" },
  chartSubValue:  { color: "#94a3b8", fontSize: 13, fontWeight: "700" },

  // ── Time span pills ──
  timeSpanRow: {
    flexDirection:  "row",
    gap:            6,
    paddingBottom:  14,
  },
  timeSpanPill: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      20,
    backgroundColor:   "rgba(255,255,255,0.04)",
    borderWidth:       1,
    borderColor:       "rgba(255,255,255,0.08)",
  },
  timeSpanPillActive: {
    backgroundColor: "rgba(59,130,246,0.2)",
    borderColor:     "rgba(59,130,246,0.45)",
  },
  timeSpanText:       { color: "#64748b", fontSize: 12, fontWeight: "700" },
  timeSpanTextActive: { color: "#60A5FA", fontWeight: "800" },

  // ── Tooltip ──
  tooltip: {
    alignSelf:       "center",
    alignItems:      "center",
    paddingVertical:   10,
    paddingHorizontal: 20,
    borderRadius:      16,
    marginBottom:      14,
    borderWidth:       1,
    borderColor:       "rgba(255,255,255,0.15)",
    gap: 2,
  },
  tooltipLabel:      { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  tooltipAmount:     { color: "#fff", fontSize: 18, fontWeight: "900" },
  tooltipBadge:      { backgroundColor: "rgba(245,158,11,0.2)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 2 },
  tooltipBadgeText:  { color: "#F59E0B", fontSize: 11, fontWeight: "700" },

  // ── Chart body (y-axis + bars) ──
  chartBody: {
    flexDirection: "row",
    alignItems:    "flex-end",
    marginTop:     4,
  },
  yAxis: {
    width:          30,
    height:         BAR_MAX_H + 40,
    justifyContent: "space-between",
    alignItems:     "flex-end",
    paddingRight:   6,
    paddingBottom:  30,
    paddingTop:     4,
  },
  yLabel: { color: "rgba(148,163,184,0.5)", fontSize: 9, fontWeight: "600" },

  gridLine: {
    position:        "absolute",
    left:            0,
    right:           0,
    height:          1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  // bars
  barsContent: {
    flexDirection:  "row",
    alignItems:     "flex-end",
    paddingBottom:  30,
    paddingTop:     20,
    paddingHorizontal: 4,
    minHeight:      BAR_MAX_H + 40,
  },
  barCol: {
    alignItems:     "center",
    justifyContent: "flex-end",
  },
  barValueLabel: {
    color:       "#FBBF24",
    fontSize:    9,
    fontWeight:  "800",
    marginBottom: 4,
  },
  barTrack: {
    height:          BAR_MAX_H,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius:    8,
    justifyContent:  "flex-end",
    overflow:        "hidden",
  },
  barFill:  { borderRadius: 8 },
  barEmpty: { height: 4, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)" },
  barLabel: {
    color:      "#64748b",
    fontWeight: "700",
    marginTop:  6,
  },
  barLabelActive: { color: "#FBBF24", fontWeight: "800" },

  // legend
  legendRow: {
    flexDirection: "row",
    alignItems:    "center",
    marginTop:     12,
    gap:           6,
  },
  legendDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3B82F6" },
  legendText: { color: "rgba(148,163,184,0.5)", fontSize: 11, fontWeight: "600", flex: 1 },
  legendHint: { color: "rgba(148,163,184,0.35)", fontSize: 10, fontWeight: "600" },

  // ── Orders ──
  salesSection:   { marginTop: 8 },
  sectionHeaderRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    marginBottom:   16,
  },
  sectionTitle:    { color: "#fff", fontSize: 16, fontWeight: "800" },
  orderCountBadge: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth:     1,
    borderColor:     "rgba(59,130,246,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius:    20,
  },
  orderCountText: { color: "#60A5FA", fontSize: 12, fontWeight: "800" },

  filterBar: {
    flexDirection:   "row",
    backgroundColor: "rgba(15,23,42,0.4)",
    padding:         4,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     "rgba(59,130,246,0.1)",
    marginBottom:    12,
  },
  filterTab: {
    flex: 1, paddingVertical: 10,
    alignItems: "center", justifyContent: "center",
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth: 1, borderColor: "rgba(59,130,246,0.25)",
  },
  filterTabText:       { color: "#64748b", fontSize: 12, fontWeight: "700" },
  filterTabTextActive: { color: "#3B82F6", fontWeight: "800" },

  emptyWrap:    { alignItems: "center", paddingVertical: 48 },
  emptyIconWrap:{ width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle:   { color: "#e2e8f0", fontSize: 15, fontWeight: "800", marginBottom: 4 },
  emptyText:    { color: "#64748b", fontSize: 13, fontWeight: "600" },

  orderCard: {
    backgroundColor: "rgba(15,23,42,0.65)",
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     "rgba(59,130,246,0.15)",
    padding:         16,
    marginVertical:  6,
  },
  cardHeader:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle:        { color: "#fff", fontSize: 15, fontWeight: "800" },
  cardCustomerText: { color: "#64748b", fontSize: 12, marginTop: 2, fontWeight: "600" },
  statusBadge:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText:       { fontSize: 11, fontWeight: "800" },
  cardDivider:      { height: 1, backgroundColor: "rgba(59,130,246,0.1)", marginVertical: 12 },
  cardFooter:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerLabel:      { color: "#94a3b8", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  footerVal:        { color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 2 },
  footerAmount:     { color: "#F59E0B", fontSize: 14, fontWeight: "800", marginTop: 2 },

  // time span selector
  timeSpanSelector: { flexDirection: "row", gap: 4 },
});
