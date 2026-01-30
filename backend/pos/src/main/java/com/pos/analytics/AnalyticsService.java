package com.pos.analytics;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.IsoFields;
import java.util.*;
import java.util.stream.Collectors;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import com.pos.analytics.dto.InvoiceRow;
import com.pos.analytics.dto.PaymentSlice;
import com.pos.analytics.dto.SeriesPoint;
import com.pos.analytics.dto.SummaryDTO;
import com.pos.analytics.dto.TopProductDTO;

@Service
public class AnalyticsService {

    /* ================== adjust to your schema if needed ================== */
    private static final String SALES_COLL     = "sales";
    private static final String PURCHASES_COLL = "purchases";
    private static final String F_DATE         = "date";

    private static final String[] INVOICE_NO_KEYS     = {"invoiceNo","invNo","invoice","billNo"};
    private static final String[] CUSTOMER_NAME_KEYS  = {"customerName","customer","partyName"};
    private static final String[] CUSTOMER_ID_KEYS    = {"customerId","partyId"};

    private static final String[] TOTAL_KEYS = {
        "grandTotal","total","grand_total","netAmount","amount","grand",
        "totals.grand","totals.total","totals.net","summary.grandTotal","summary.total"
    };

    private static final String[] ITEMS_KEYS      = {"sale_items","items","lines","details"};
    private static final String[] ITEM_QTY_KEYS   = {"quantity","qty","pcs","count"};
    private static final String[] ITEM_PRICE_KEYS = {"rate","price","unitPrice","sellingPrice"};
    private static final String[] ITEM_LINE_KEYS  = {"lineTotal","total","amount","priceTotal"};
    private static final String[] VAT_KEYS        = {"vat","tax","totals.vat","summary.vat"};
    /* ==================================================================== */

    private static final ZoneId ZONE = ZoneId.of("Asia/Dubai");

    private final MongoTemplate mongo;
    public AnalyticsService(MongoTemplate mongo) { this.mongo = mongo; }

    /* ------------------------- SUMMARY ------------------------- */

    public SummaryDTO summary(String period, LocalDate from, LocalDate to) {
        double sales    = sumAmountJava(SALES_COLL, from, to);
        double purchase = sumAmountJava(PURCHASES_COLL, from, to);
        long invoices   = countDocsJava(SALES_COLL, from, to);
        long customers  = countDistinctCustomerJava(SALES_COLL, from, to);

        SummaryDTO dto = new SummaryDTO();
        dto.setGrossSales(sales);
        dto.setPurchase(purchase);
        dto.setProfit(Math.max(0, sales - purchase));
        dto.setCustomers(customers);
        dto.setAvgBill(invoices == 0 ? 0 : sales / invoices);
        dto.setVat(sales * 0.05);
        return dto;
    }

    /* ------------------- SALES vs PURCHASE (Mon..Sun / Week / Month) ------------------- */

    public List<SeriesPoint> salesVsPurchase(String period, LocalDate from, LocalDate to) {
        Map<String, Double> sales = seriesAmountJava(SALES_COLL, period, from, to);
        Map<String, Double> purch = seriesAmountJava(PURCHASES_COLL, period, from, to);

        Set<String> labels = new LinkedHashSet<>();
        labels.addAll(sales.keySet());
        labels.addAll(purch.keySet());

        if ("daily".equalsIgnoreCase(period)) {
            List<String> order = Arrays.asList("Mon","Tue","Wed","Thu","Fri","Sat","Sun");
            labels = labels.stream()
                    .sorted(Comparator.comparingInt(l -> {
                        int i = order.indexOf(l);
                        return i < 0 ? 1000 : i;
                    }))
                    .collect(Collectors.toCollection(LinkedHashSet::new));
        }

        double max = 1;
        for (String k : labels) {
            max = Math.max(max, sales.getOrDefault(k, 0.0));
            max = Math.max(max, purch.getOrDefault(k, 0.0));
        }

        List<SeriesPoint> out = new ArrayList<>();
        for (String k : labels) {
            double sVal = sales.getOrDefault(k, 0.0);
            double pVal = purch.getOrDefault(k, 0.0);
            SeriesPoint pt = new SeriesPoint();
            pt.setLabel(k);
            pt.setSales(roundPct(sVal / max * 100.0));
            pt.setPurchase(roundPct(pVal / max * 100.0));
            pt.setSalesValue(sVal);
            pt.setPurchaseValue(pVal);
            out.add(pt);
        }
        return out;
    }

    /* ------------------- SALES vs PURCHASE per calendar date (yyyy-MM-dd) ------------------- */
    /** Dashboard weekly ഗ്രാഫിന് – ദിവസേന label = yyyy-MM-dd */
    public List<SeriesPoint> salesVsPurchaseByDate(LocalDate from, LocalDate to) {
        Map<String, Double> sales = seriesAmountByDate(SALES_COLL, from, to);
        Map<String, Double> purch = seriesAmountByDate(PURCHASES_COLL, from, to);

        double max = 1;
        LocalDate d = from;
        while (!d.isAfter(to)) {
            String key = d.toString();
            max = Math.max(max, sales.getOrDefault(key, 0d));
            max = Math.max(max, purch.getOrDefault(key, 0d));
            d = d.plusDays(1);
        }

        List<SeriesPoint> out = new ArrayList<>();
        d = from;
        while (!d.isAfter(to)) {
            String k = d.toString();
            double sVal = sales.getOrDefault(k, 0d);
            double pVal = purch.getOrDefault(k, 0d);

            SeriesPoint pt = new SeriesPoint();
            pt.setLabel(k);
            pt.setSales(roundPct(sVal / max * 100.0));
            pt.setPurchase(roundPct(pVal / max * 100.0));
            pt.setSalesValue(sVal);
            pt.setPurchaseValue(pVal);
            out.add(pt);

            d = d.plusDays(1);
        }
        return out;
    }

    /* ------------------------- TOP PRODUCTS ------------------------- */

    public List<TopProductDTO> topProducts(String period, LocalDate from, LocalDate to, int limit) {
        Map<String, Long> qtyMap = new HashMap<>();
        for (Document d : findByDate(SALES_COLL, from, to)) {
            List<Document> items = firstArray(d, ITEMS_KEYS);
            if (items == null) continue;
            for (Object o : items) {
                if (!(o instanceof Document)) continue;
                Document it = (Document) o;
                String name = str(firstValue(it, "productName","name","item","title"));
                if (name.isEmpty()) continue;
                long q = Math.round(num(firstValue(it, ITEM_QTY_KEYS)));
                qtyMap.merge(name, q, Long::sum);
            }
        }

        List<Map.Entry<String,Long>> sorted = qtyMap.entrySet().stream()
                .sorted(Map.Entry.<String,Long>comparingByValue().reversed())
                .limit(Math.max(1, limit))
                .collect(Collectors.toList());

        long max = sorted.stream().mapToLong(Map.Entry::getValue).max().orElse(1);
        List<TopProductDTO> list = new ArrayList<>();
        for (Map.Entry<String,Long> e : sorted) {
            TopProductDTO tp = new TopProductDTO();
            tp.setName(e.getKey());
            tp.setQty(e.getValue());
            tp.setPct(e.getValue() * 100.0 / max);
            list.add(tp);
        }
        return list;
    }

    /* ------------------------- RECENT INVOICES ------------------------- */

    public List<InvoiceRow> recentInvoices(int limit, LocalDate from, LocalDate to) {
        List<Document> docs = mongo.getCollection(SALES_COLL)
                .find(dateFilter(F_DATE, from, to))
                .sort(new Document(F_DATE, -1))
                .limit(limit)
                .into(new ArrayList<>());

        List<InvoiceRow> out = new ArrayList<>();
        for (Document d : docs) {
            InvoiceRow row = new InvoiceRow();
            row.setNo(str(firstValue(d, INVOICE_NO_KEYS)));
            Date dt = toDate(d.get(F_DATE));
            row.setDate(dt == null ? "" : dt.toInstant().atZone(ZONE).toLocalDate().toString());
            row.setCustomer(str(firstValue(d, CUSTOMER_NAME_KEYS), "Walk-in"));
            row.setAmount(readTotal(d));
            row.setStatus(str(firstValue(d, "status","state","paymentStatus"), "Paid"));
            out.add(row);
        }
        return out;
    }

    /* ------------------------- PAYMENTS BREAKDOWN ------------------------- */

    public List<PaymentSlice> paymentsBreakdown(String period, LocalDate from, LocalDate to) {
        Map<String, Double> sums = new HashMap<>();
        for (Document d : findByDate(SALES_COLL, from, to)) {
            List<Document> pays = firstArray(d, "payments","pay","settlements");
            if (pays == null) continue;
            for (Object o : pays) {
                if (!(o instanceof Document)) continue;
                Document p = (Document) o;
                String method = str(firstValue(p, "method","mode","type"), "Other");
                double amt    = num(firstValue(p, "amount","paid","value"));
                sums.merge(method, amt, Double::sum);
            }
        }
        double total = sums.values().stream().mapToDouble(Double::doubleValue).sum();
        if (total <= 0) total = 1;

        List<PaymentSlice> out = new ArrayList<>();
        for (Map.Entry<String,Double> e : sums.entrySet()) {
            PaymentSlice s = new PaymentSlice();
            s.setName(e.getKey());
            s.setPct(roundPct(e.getValue() / total * 100.0));
            out.add(s);
        }
        out.sort(Comparator.comparingDouble(PaymentSlice::getPct).reversed());
        return out;
    }

    /* ============================= helpers ============================= */

    private double sumAmountJava(String coll, LocalDate from, LocalDate to) {
        double sum = 0;
        for (Document d : findByDate(coll, from, to)) sum += readTotal(d);
        return sum;
    }

    private long countDocsJava(String coll, LocalDate from, LocalDate to) {
        return mongo.getCollection(coll).countDocuments(dateFilter(F_DATE, from, to));
    }

    private long countDistinctCustomerJava(String coll, LocalDate from, LocalDate to) {
        Set<String> set = new HashSet<>();
        for (Document d : findByDate(coll, from, to)) {
            Object id = firstValue(d, CUSTOMER_ID_KEYS);
            Object nm = firstValue(d, CUSTOMER_NAME_KEYS);
            String key = (id != null ? id.toString() : "") + "|" + (nm != null ? nm.toString() : "");
            set.add(key);
        }
        return set.size();
    }

    /** label -> sum(total) for Mon..Sun / weekly / monthly */
    private Map<String, Double> seriesAmountJava(String coll, String period, LocalDate from, LocalDate to) {
        String p = (period == null ? "daily" : period.toLowerCase());
        Map<String, Double> map = new LinkedHashMap<>();

        for (Document d : findByDate(coll, from, to)) {
            Date dt = toDate(d.get(F_DATE));
            if (dt == null) continue;
            ZonedDateTime zdt = dt.toInstant().atZone(ZONE);
            String label;
            switch (p) {
                case "weekly": {
                    int year = zdt.get(IsoFields.WEEK_BASED_YEAR);
                    int week = zdt.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
                    label = year + "-W" + String.format("%02d", week);
                    break;
                }
                case "monthly": {
                    label = zdt.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                    break;
                }
                default: {
                    String d3 = zdt.getDayOfWeek().toString(); // MONDAY
                    label = d3.substring(0,1).toUpperCase() + d3.substring(1,3).toLowerCase(); // Mon
                }
            }
            map.merge(label, readTotal(d), Double::sum);
        }

        if ("daily".equalsIgnoreCase(p)) {
            List<String> order = Arrays.asList("Mon","Tue","Wed","Thu","Fri","Sat","Sun");
            Map<String, Double> ordered = new LinkedHashMap<>();
            for (String k : order) if (map.containsKey(k)) ordered.put(k, map.get(k));
            for (Map.Entry<String,Double> e : map.entrySet())
                if (!ordered.containsKey(e.getKey())) ordered.put(e.getKey(), e.getValue());
            return ordered;
        }
        return map;
    }

    /** yyyy-MM-dd -> sum(total) (dashboard weeklyയ്ക്ക്) */
    private Map<String, Double> seriesAmountByDate(String coll, LocalDate from, LocalDate to) {
        Map<String, Double> map = new LinkedHashMap<>();
        for (Document d : findByDate(coll, from, to)) {
            Date dt = toDate(d.get(F_DATE));
            if (dt == null) continue;
            String label = dt.toInstant().atZone(ZONE).toLocalDate().toString();
            map.merge(label, readTotal(d), Double::sum);
        }
        return map;
    }

    /* ----- total reader (nested / strings / compute from items) ----- */
    private double readTotal(Document d) {
        Object v = firstByPath(d, TOTAL_KEYS);
        double total = num(v);
        if (total > 0) return total;

        List<Document> items = firstArray(d, ITEMS_KEYS);
        double sub = 0;
        if (items != null) {
            for (Object o : items) {
                if (!(o instanceof Document)) continue;
                Document it = (Document) o;
                double line = num(firstValue(it, ITEM_LINE_KEYS));
                if (line == 0) {
                    double qty   = num(firstValue(it, ITEM_QTY_KEYS));
                    double price = num(firstValue(it, ITEM_PRICE_KEYS));
                    line = qty * price;
                }
                sub += line;
            }
        }
        sub += num(firstByPath(d, VAT_KEYS));
        return sub;
    }

    /* --------------------------- tiny utils --------------------------- */

    private List<Document> findByDate(String coll, LocalDate from, LocalDate to) {
        return mongo.getCollection(coll)
                .find(dateFilter(F_DATE, from, to))
                .into(new ArrayList<>());
    }

    private Document dateFilter(String field, LocalDate from, LocalDate to) {
        Date start = Date.from(from.atStartOfDay(ZONE).toInstant());
        Date end   = Date.from(to.plusDays(1).atStartOfDay(ZONE).toInstant());
        return new Document(field, new Document("$gte", start).append("$lt", end));
    }

    private static Object firstValue(Document d, String... keys) {
        for (String k : keys) {
            Object v = d.get(k);
            if (v != null) return v;
        }
        return null;
    }

    /** supports dotted paths like "totals.grand" */
    private static Object firstByPath(Document root, String... paths) {
        for (String p : paths) {
            String[] parts = p.split("\\.");
            Object cur = root;
            boolean ok = true;
            for (String part : parts) {
                if (!(cur instanceof Document)) { ok = false; break; }
                cur = ((Document) cur).get(part);
                if (cur == null) { ok = false; break; }
            }
            if (ok) return cur;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static List<Document> firstArray(Document d, String... keys) {
        for (String k : keys) {
            Object v = d.get(k);
            if (v instanceof List) return (List<Document>) v;
        }
        return null;
    }

    private static Date toDate(Object o) {
        if (o instanceof Date) return (Date) o;
        if (o instanceof String) {
            try { return java.sql.Date.valueOf((String) o); } catch (Exception ignore) {}
        }
        return null;
    }

    private static double num(Object o) {
        if (o == null) return 0;
        if (o instanceof Number) return ((Number) o).doubleValue();
        try {
            String s = o.toString().trim();
            s = s.replaceAll("[^0-9.\\-]", "");
            return s.isEmpty() ? 0 : Double.parseDouble(s);
        } catch (Exception e) { return 0; }
    }

    private static String str(Object o) { return str(o, ""); }
    private static String str(Object o, String def) { return o == null ? def : String.valueOf(o); }
    private static double roundPct(double v) { return Math.round(v * 10.0) / 10.0; }
}
