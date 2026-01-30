// src/main/java/com/pos/integrations/tally/TallyClient.java
package com.pos.integrations.tally;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.pos.model.TallySetting;
import com.pos.service.TallySettingService;

@Service
public class TallyClient {

  private final TallySettingService settings;
  private final RestTemplate rest;

  // Robust parsers (Tally varies: sometimes <COMPANYNAME>, sometimes <COMPANY><NAME>…)
  private static final Pattern P_COMPANYNAME =
      Pattern.compile("<COMPANYNAME>(.*?)</COMPANYNAME>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
  private static final Pattern P_COMPANY_NAME_ALT =
      Pattern.compile("<COMPANY\\b[\\s\\S]*?<NAME>(.*?)</NAME>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

  // Exact XML you asked about — keep it here:
  private static final String LIST_COMPANIES_ENVELOPE = """
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
      <BODY>
        <EXPORTDATA>
          <REQUESTDESC>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
            <REPORTNAME>List of Companies</REPORTNAME>
          </REQUESTDESC>
        </EXPORTDATA>
      </BODY>
    </ENVELOPE>
    """;

  public TallyClient(TallySettingService settings) {
    this.settings = settings;
    var rf = new SimpleClientHttpRequestFactory();
    rf.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
    rf.setReadTimeout((int) Duration.ofSeconds(15).toMillis());
    this.rest = new RestTemplate(rf);
  }

  /** Push a Master envelope (e.g., Ledger) to Tally. */
  public String pushMasters(String innerXml) {
    TallySetting s = requireEnabledWithCompany();
    String env = TallyXmlBuilder.envMasters(s.getCompany(), innerXml);
    return postXml(s.getUrl(), env);
  }

  /** Push a Vouchers envelope (e.g., Sales/Purchase) to Tally. */
  public String pushVouchers(String innerXml) {
    TallySetting s = requireEnabledWithCompany();
    String env = TallyXmlBuilder.envVouchers(s.getCompany(), innerXml);
    return postXml(s.getUrl(), env);
  }

  /** Post an already-built Tally envelope (useful for diagnostics). */
  public String pushRawEnvelope(String xmlEnvelope) {
    TallySetting s = requireEnabledUrlOnly();
    return postXml(s.getUrl(), xmlEnvelope);
  }

  /** Get the list of company names currently visible to Tally. */
  public List<String> listCompanies() {
    TallySetting s = requireEnabledUrlOnly();
    String xml = postXml(s.getUrl(), LIST_COMPANIES_ENVELOPE);

    List<String> out = new ArrayList<>();

    Matcher m1 = P_COMPANYNAME.matcher(xml);
    while (m1.find()) out.add(m1.group(1).trim());

    if (out.isEmpty()) {
      Matcher m2 = P_COMPANY_NAME_ALT.matcher(xml);
      while (m2.find()) out.add(m2.group(1).trim());
    }

    if (out.isEmpty()) {
      throw new IllegalStateException("No companies found or unexpected Tally response: "
          + xml.substring(0, Math.min(300, xml.length())));
    }
    return out.stream().filter(s1 -> !s1.isBlank()).distinct().sorted().toList();
  }

  /* -------------------- internal helpers -------------------- */

  private TallySetting requireEnabledWithCompany() {
    TallySetting s = requireEnabledUrlOnly();
    if (isBlank(s.getCompany())) {
      throw new IllegalStateException("Tally company is not set in settings.");
    }
    return s;
  }

  private TallySetting requireEnabledUrlOnly() {
    TallySetting s = settings.get();
    if (s == null || !Boolean.TRUE.equals(s.isEnabled())) {
      throw new IllegalStateException("Tally is disabled or not configured in settings.");
    }
    if (isBlank(s.getUrl())) {
      throw new IllegalStateException("Tally URL is not set in settings.");
    }
    return s;
  }

  private String postXml(String url, String xml) {
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(new MediaType("text", "xml", StandardCharsets.UTF_8));
      headers.setAccept(List.of(new MediaType("text", "xml"), MediaType.ALL));

      String target = normalizeUrl(url);
      ResponseEntity<String> resp = rest.postForEntity(target, new HttpEntity<>(xml, headers), String.class);
      String body = resp.getBody();
      if (body == null) throw new IllegalStateException("Tally returned empty response.");
      return body;
    } catch (RestClientException ex) {
      throw new RuntimeException("Failed to POST XML to Tally at " + url + ": " + ex.getMessage(), ex);
    }
  }

  private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }

  private static String normalizeUrl(String url) {
    return Objects.requireNonNull(url).trim().replaceAll("/+$", "");
  }
}
