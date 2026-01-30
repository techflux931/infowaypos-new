package com.pos.service;

import java.time.LocalDate;                // <-- use PageResponse
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.AddFieldsOperation;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.match;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.project;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.sort;
import org.springframework.data.mongodb.core.aggregation.ConditionalOperators;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.aggregation.MatchOperation;
import org.springframework.data.mongodb.core.aggregation.ProjectionOperation;
import org.springframework.data.mongodb.core.aggregation.SortOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import com.pos.dto.PageResponse;

@Service
public class VatSummaryService {

  private final MongoTemplate mongo;
  public VatSummaryService(MongoTemplate mongo) { this.mongo = mongo; }

  // adjust these to your schema if needed
  private static final String COLLECTION = "sales";
  private static final String DATE1 = "saleDate";
  private static final String DATE2 = "invoiceDate";
  private static final String DATE3 = "createdAt";

  private static final String TAXABLE1 = "taxable";
  private static final String TAXABLE2 = "subTotal";
  private static final String TAXABLE3 = "netAmount";

  private static final String VAT1 = "vat";
  private static final String VAT2 = "vatAmount";
  private static final String VAT3 = "tax";

  private static final String TOTAL1 = "total";
  private static final String TOTAL2 = "grandTotal";
  private static final String TOTAL3 = "billTotal";

  private static final String INVOICE_NO = "invoiceNo";

  public PageResponse<Document> summary(LocalDate from, LocalDate to, String groupBy, int page, int size) {

    var start = from.atStartOfDay(ZoneId.systemDefault()).toInstant();
    var end   = to.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

    ProjectionOperation normalize = project()
        .and(ConditionalOperators.ifNull(DATE1).thenValueOf(DATE2)).as("_d2")
        .and(ConditionalOperators.ifNull("_d2").thenValueOf(DATE3)).as("_date")
        .and(ConditionalOperators.ifNull(TAXABLE1).thenValueOf(TAXABLE2)).as("_t2")
        .and(ConditionalOperators.ifNull("_t2").thenValueOf(TAXABLE3)).as("_taxable")
        .and(ConditionalOperators.ifNull(VAT1).thenValueOf(VAT2)).as("_v2")
        .and(ConditionalOperators.ifNull("_v2").thenValueOf(VAT3)).as("_vat")
        .and(ConditionalOperators.ifNull(TOTAL1).thenValueOf(TOTAL2)).as("_gt2")
        .and(ConditionalOperators.ifNull("_gt2").thenValueOf(TOTAL3)).as("_total")
        .and(INVOICE_NO).as("_invno");

    MatchOperation range = match(Criteria.where("_date").gte(start).lt(end));

    AddFieldsOperation parts = AddFieldsOperation.addField("yearNum").withValueOfExpression("year(_date)")
        .addField("monthNum").withValueOfExpression("month(_date)")
        .addField("dayNum").withValueOfExpression("dayOfMonth(_date)").build();

    GroupOperation group;
    switch (groupBy == null ? "day" : groupBy.toLowerCase()) {
      case "month" -> group = group(Fields.from(Fields.field("yearNum"), Fields.field("monthNum")))
          .count().as("bills").sum("_taxable").as("taxable")
          .sum("_vat").as("vat").sum("_total").as("total");
      case "invoice" -> group = group("$_invno")
          .count().as("bills").sum("_taxable").as("taxable")
          .sum("_vat").as("vat").sum("_total").as("total");
      default -> group = group(Fields.from(Fields.field("yearNum"), Fields.field("monthNum"), Fields.field("dayNum")))
          .count().as("bills").sum("_taxable").as("taxable")
          .sum("_vat").as("vat").sum("_total").as("total");
    }

    SortOperation sortOp = switch (groupBy == null ? "day" : groupBy.toLowerCase()) {
      case "invoice" -> sort(Sort.Direction.ASC, "_id");
      case "month" -> sort(Sort.Direction.ASC, "_id.yearNum", "_id.monthNum");
      default -> sort(Sort.Direction.ASC, "_id.yearNum", "_id.monthNum", "_id.dayNum");
    };

    Aggregation agg = newAggregation(normalize, range, parts, group, sortOp);
    List<Document> aggDocs = mongo.aggregate(agg, COLLECTION, Document.class).getMappedResults();

    // build rows the frontend expects
    List<Document> rows = new ArrayList<>();
    for (Document d : aggDocs) {
      String label;
      Object id = d.get("_id");
      if (id instanceof Document idd) {
        Integer y = idd.getInteger("yearNum");
        Integer m = idd.getInteger("monthNum");
        Integer day = idd.getInteger("dayNum");
        if (m == null) m = 1;
        var mm = java.time.Month.of(m).name().substring(0, 3);
        label = (day != null) ? String.format("%02d/%s/%d", day, mm, y) : String.format("%s/%d", mm, y);
      } else {
        label = String.valueOf(id);
      }
      rows.add(new Document("date", label)
          .append("bills", ((Number) d.getOrDefault("bills", 0)).longValue())
          .append("taxable", ((Number) d.getOrDefault("taxable", 0)).doubleValue())
          .append("vat", ((Number) d.getOrDefault("vat", 0)).doubleValue())
          .append("total", ((Number) d.getOrDefault("total", 0)).doubleValue()));
    }

    int totalElements = rows.size();
    int fromIdx = Math.min(page * size, totalElements);
    int toIdx = Math.min(fromIdx + size, totalElements);
    int totalPages = Math.max(1, (int) Math.ceil(totalElements / (double) size));

    PageResponse<Document> resp = new PageResponse<>();
    resp.setContent(rows.subList(fromIdx, toIdx));
    resp.setTotalElements(totalElements);
    resp.setTotalPages(totalPages);
    resp.setPage(page + 1);           // 1-based for UI
    resp.setSize(size);
    resp.setLast((page + 1) >= totalPages);
    return resp;
  }
}
