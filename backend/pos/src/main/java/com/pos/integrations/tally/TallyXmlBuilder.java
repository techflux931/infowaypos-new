// src/main/java/com/pos/integrations/tally/TallyXmlBuilder.java
package com.pos.integrations.tally;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

public final class TallyXmlBuilder {
  private TallyXmlBuilder() {}

  public static String envMasters(String company, String inner) {
    return envelope(company, "All Masters", inner);
  }
  public static String envVouchers(String company, String inner) {
    return envelope(company, "Vouchers", inner);
  }

  private static String envelope(String company, String reportName, String inner) {
    return ""
        + "<ENVELOPE>"
        + "<HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>"
        + "<BODY><IMPORTDATA>"
        +   "<REQUESTDESC>"
        +     "<REPORTNAME>" + esc(reportName) + "</REPORTNAME>"
        +     "<STATICVARIABLES><SVCURRENTCOMPANY>" + esc(company) + "</SVCURRENTCOMPANY></STATICVARIABLES>"
        +   "</REQUESTDESC>"
        +   "<REQUESTDATA>" + inner + "</REQUESTDATA>"
        + "</IMPORTDATA></BODY>"
        + "</ENVELOPE>";
  }

  /** Master: one Ledger (openingSigned: Dr = +, Cr = -) */
  public static String ledger(String name, String parentGroup, double openingSigned, boolean costCenter) {
    return ""
        + "<TALLYMESSAGE xmlns:UDF=\"TallyUDF\">"
        +   "<LEDGER NAME=\"" + esc(name) + "\" ACTION=\"Create\">"
        +     "<PARENT>" + esc(parentGroup) + "</PARENT>"
        +     "<OPENINGBALANCE>" + amt(openingSigned) + "</OPENINGBALANCE>"
        +     "<ISCOSTCENTRESON>" + (costCenter ? "Yes" : "No") + "</ISCOSTCENTRESON>"
        +   "</LEDGER>"
        + "</TALLYMESSAGE>";
  }

  /** Simple line holder (no records → Java 8 safe) */
  public static final class Line {
    public final String ledgerName;
    public final boolean debit;
    public final double amount;
    public Line(String ledgerName, boolean debit, double amount) {
      this.ledgerName = ledgerName;
      this.debit = debit;
      this.amount = amount;
    }
  }

  /** Generic voucher (Sales/Purchase/Payment/Receipt/Journal) */
  public static String voucher(
      String vchType, String voucherNo, LocalDate date,
      String partyLedgerOrNull, String narrationOrNull,
      List<Line> lines) {

    StringBuilder linesXml = new StringBuilder();
    for (Line ln : lines) {
      boolean isDebit = ln.debit;
      double value = Math.abs(ln.amount);
      String deemed = isDebit ? "No" : "Yes";
      String signed = isDebit ? amt(value) : "-" + amt(value);

      linesXml.append(
          "<ALLLEDGERENTRIES.LIST>"
        +   "<LEDGERNAME>" + esc(ln.ledgerName) + "</LEDGERNAME>"
        +   "<ISDEEMEDPOSITIVE>" + deemed + "</ISDEEMEDPOSITIVE>"
        +   "<AMOUNT>" + signed + "</AMOUNT>"
        + "</ALLLEDGERENTRIES.LIST>");
    }

    String date8 = date.format(DateTimeFormatter.BASIC_ISO_DATE); // yyyyMMdd
    String partyBlock = (partyLedgerOrNull == null || partyLedgerOrNull.isEmpty())
        ? "" : "<PARTYLEDGERNAME>" + esc(partyLedgerOrNull) + "</PARTYLEDGERNAME>";
    String narration = (narrationOrNull == null) ? "" : "<NARRATION>" + esc(narrationOrNull) + "</NARRATION>";

    return ""
        + "<TALLYMESSAGE xmlns:UDF=\"TallyUDF\">"
        +   "<VOUCHER VCHTYPE=\"" + esc(vchType) + "\" ACTION=\"Create\">"
        +     "<DATE>" + date8 + "</DATE>"
        +     "<VOUCHERNUMBER>" + esc(voucherNo) + "</VOUCHERNUMBER>"
        +     partyBlock
        +     narration
        +     linesXml
        +   "</VOUCHER>"
        + "</TALLYMESSAGE>";
  }

  private static String esc(String s) {
    if (s == null) return "";
    return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;");
  }
  private static String amt(double v) {
    return String.format(java.util.Locale.US, "%.2f", v);
  }
}
