package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "pos_settings")
public class PosSettings {
  @Id
  private String id;
  private General general = new General();
  private Pos pos = new Pos();
  private Tax tax = new Tax();
  private Invoice invoice = new Invoice();

  public PosSettings() {}

  // id
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  // sections
  public General getGeneral() { return general; }
  public void setGeneral(General general) { this.general = general; }

  public Pos getPos() { return pos; }
  public void setPos(Pos pos) { this.pos = pos; }

  public Tax getTax() { return tax; }
  public void setTax(Tax tax) { this.tax = tax; }

  public Invoice getInvoice() { return invoice; }
  public void setInvoice(Invoice invoice) { this.invoice = invoice; }

  // ---- nested classes (also plain POJOs)
  public static class General {
    private boolean customerCodeAutoIncrement;
    private boolean showStockInSales;
    private boolean showCostInSales;
    private boolean showStockInPurchase;
    private boolean dotMatrixInvoicePrint;
    private String dotMatrixFormat;

    public boolean isCustomerCodeAutoIncrement() { return customerCodeAutoIncrement; }
    public void setCustomerCodeAutoIncrement(boolean v) { this.customerCodeAutoIncrement = v; }
    public boolean isShowStockInSales() { return showStockInSales; }
    public void setShowStockInSales(boolean v) { this.showStockInSales = v; }
    public boolean isShowCostInSales() { return showCostInSales; }
    public void setShowCostInSales(boolean v) { this.showCostInSales = v; }
    public boolean isShowStockInPurchase() { return showStockInPurchase; }
    public void setShowStockInPurchase(boolean v) { this.showStockInPurchase = v; }
    public boolean isDotMatrixInvoicePrint() { return dotMatrixInvoicePrint; }
    public void setDotMatrixInvoicePrint(boolean v) { this.dotMatrixInvoicePrint = v; }
    public String getDotMatrixFormat() { return dotMatrixFormat; }
    public void setDotMatrixFormat(String dotMatrixFormat) { this.dotMatrixFormat = dotMatrixFormat; }
  }

  public static class Pos {
    private boolean enableFixedDiscount;
    private boolean enableVariableDiscount;
    private boolean autoPrintAfterSave;
    private boolean enableBillReprint;
    private boolean allowSplitPayment;
    private boolean showCostInInvoice;
    private boolean allowReturnWithoutBill;

    public boolean isEnableFixedDiscount() { return enableFixedDiscount; }
    public void setEnableFixedDiscount(boolean v) { this.enableFixedDiscount = v; }
    public boolean isEnableVariableDiscount() { return enableVariableDiscount; }
    public void setEnableVariableDiscount(boolean v) { this.enableVariableDiscount = v; }
    public boolean isAutoPrintAfterSave() { return autoPrintAfterSave; }
    public void setAutoPrintAfterSave(boolean v) { this.autoPrintAfterSave = v; }
    public boolean isEnableBillReprint() { return enableBillReprint; }
    public void setEnableBillReprint(boolean v) { this.enableBillReprint = v; }
    public boolean isAllowSplitPayment() { return allowSplitPayment; }
    public void setAllowSplitPayment(boolean v) { this.allowSplitPayment = v; }
    public boolean isShowCostInInvoice() { return showCostInInvoice; }
    public void setShowCostInInvoice(boolean v) { this.showCostInInvoice = v; }
    public boolean isAllowReturnWithoutBill() { return allowReturnWithoutBill; }
    public void setAllowReturnWithoutBill(boolean v) { this.allowReturnWithoutBill = v; }
  }

  public static class Tax {
    private boolean enableTax;
    private boolean priceIncludesTax;
    private double defaultRate = 5.0;
    private String label = "VAT";
    private String inputTaxLedger;
    private String outputTaxLedger;

    public boolean isEnableTax() { return enableTax; }
    public void setEnableTax(boolean v) { this.enableTax = v; }
    public boolean isPriceIncludesTax() { return priceIncludesTax; }
    public void setPriceIncludesTax(boolean v) { this.priceIncludesTax = v; }
    public double getDefaultRate() { return defaultRate; }
    public void setDefaultRate(double defaultRate) { this.defaultRate = defaultRate; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getInputTaxLedger() { return inputTaxLedger; }
    public void setInputTaxLedger(String inputTaxLedger) { this.inputTaxLedger = inputTaxLedger; }
    public String getOutputTaxLedger() { return outputTaxLedger; }
    public void setOutputTaxLedger(String outputTaxLedger) { this.outputTaxLedger = outputTaxLedger; }
  }

  public static class Invoice {
    private String format = "Format 1";
    private String logoFileId;
    private String footerMessage = "Thank you for shopping with us!";
    private boolean showQr = true;
    private boolean showBarcode = true;

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public String getLogoFileId() { return logoFileId; }
    public void setLogoFileId(String logoFileId) { this.logoFileId = logoFileId; }
    public String getFooterMessage() { return footerMessage; }
    public void setFooterMessage(String footerMessage) { this.footerMessage = footerMessage; }
    public boolean isShowQr() { return showQr; }
    public void setShowQr(boolean showQr) { this.showQr = showQr; }
    public boolean isShowBarcode() { return showBarcode; }
    public void setShowBarcode(boolean showBarcode) { this.showBarcode = showBarcode; }
  }
}
