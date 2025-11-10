/**
 * Generate CSV from OSINT data
 */
export function generateOsintCSV(data, query, type) {
  let csv = "OSINT Investigation Report\n";
  csv += `Query: ${query}\n`;
  csv += `Type: ${type}\n`;
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Overview Section
  if (data.investigation_overview) {
    csv += "=== INVESTIGATION OVERVIEW ===\n";
    csv += `Total Breach Records,${data.investigation_overview.total_breach_records}\n`;
    csv += `Total Databases,${data.investigation_overview.total_databases}\n`;
    csv += `Web Results,${data.investigation_overview.total_web_results}\n`;
    csv += `Professional Profiles,${data.investigation_overview.total_professional_profiles}\n`;
    csv += `Companies Found,${data.investigation_overview.total_companies}\n\n`;

    if (data.investigation_overview.unique_data_points) {
      const unique = data.investigation_overview.unique_data_points;
      csv += "=== UNIQUE DATA POINTS ===\n";
      csv += `Emails,${unique.emails}\n`;
      csv += `Phones,${unique.phones}\n`;
      csv += `Names,${unique.names}\n`;
      csv += `Usernames,${unique.usernames}\n`;
      csv += `Addresses,${unique.addresses}\n`;
      csv += `URLs,${unique.urls}\n`;
      csv += `Domains,${unique.domains}\n\n`;
    }
  }

  // Identity Section
  if (data.identity?.names?.length > 0) {
    csv += "=== NAMES FOUND ===\n";
    csv += "Name,Found in Breaches,Databases\n";
    data.identity.names.forEach((item) => {
      const dbs = item.breach_sources?.map((b) => b.database).join("; ") || "-";
      csv += `"${item.name}",${item.found_in_breaches},"${dbs}"\n`;
    });
    csv += "\n";
  }

  // Contacts Section
  if (data.contacts?.emails?.all_emails?.length > 0) {
    csv += "=== EMAILS FOUND ===\n";
    csv += "Email,Type,Found in Breaches,Password Exposed,Databases\n";
    data.contacts.emails.all_emails.forEach((item) => {
      const dbs = item.breach_sources?.map((b) => b.database).join("; ") || "-";
      const hasPassword = item.breach_sources?.some((b) => b.has_password) ? "Yes" : "No";
      csv += `"${item.email}","${item.type}",${item.found_in_breaches},"${hasPassword}","${dbs}"\n`;
    });
    csv += "\n";
  }

  if (data.contacts?.phones?.all_phones?.length > 0) {
    csv += "=== PHONE NUMBERS FOUND ===\n";
    csv += "Phone,Found in Breaches,Databases\n";
    data.contacts.phones.all_phones.forEach((item) => {
      const dbs = item.breach_sources?.map((b) => b.database).join("; ") || "-";
      csv += `"${item.phone}",${item.found_in_breaches},"${dbs}"\n`;
    });
    csv += "\n";
  }

  // Professional Section
  if (data.professional?.companies?.all_companies?.length > 0) {
    csv += "=== COMPANIES FOUND ===\n";
    csv += "Domain,Employee Count,Webmail,Source\n";
    data.professional.companies.all_companies.forEach((item) => {
      csv += `"${item.domain}",${item.employee_count},${item.is_webmail ? "Yes" : "No"},"${item.source}"\n`;
    });
    csv += "\n";
  }

  // Digital Footprint Section
  if (data.digital_footprint?.usernames?.all_usernames?.length > 0) {
    csv += "=== USERNAMES FOUND ===\n";
    csv += "Username,Found in Breaches,Databases\n";
    data.digital_footprint.usernames.all_usernames.forEach((item) => {
      const dbs = item.breach_sources?.map((b) => b.database).join("; ") || "-";
      csv += `"${item.username}",${item.found_in_breaches},"${dbs}"\n`;
    });
    csv += "\n";
  }

  if (data.digital_footprint?.urls?.all_urls?.length > 0) {
    csv += "=== URLs FOUND ===\n";
    csv += "URL,Found in Breaches,Databases\n";
    data.digital_footprint.urls.all_urls.forEach((item) => {
      const dbs = item.breach_sources?.map((b) => b.database).join("; ") || "-";
      csv += `"${item.url}",${item.found_in_breaches},"${dbs}"\n`;
    });
    csv += "\n";
  }

  // Locations Section
  if (data.locations?.addresses?.length > 0) {
    csv += "=== LOCATIONS FOUND ===\n";
    csv += "Address,Found in Breaches,Databases\n";
    data.locations.addresses.forEach((item) => {
      const dbs = item.breach_sources?.map((b) => b.database).join("; ") || "-";
      csv += `"${item.address}",${item.found_in_breaches},"${dbs}"\n`;
    });
    csv += "\n";
  }

  // Breach Databases Section
  if (data.breach_data?.databases?.length > 0) {
    csv += "=== COMPROMISED DATABASES ===\n";
    csv += "Database\n";
    data.breach_data.databases.forEach((db) => {
      csv += `"${db}"\n`;
    });
    csv += "\n";
  }

  // Web Intelligence Section
  if (data.web_intelligence?.all_results?.length > 0) {
    csv += "=== WEB SEARCH RESULTS ===\n";
    csv += "Title,URL,Relevance Score\n";
    data.web_intelligence.all_results.forEach((item) => {
      csv += `"${item.title}","${item.url}","${(item.relevance_score * 100).toFixed(1)}%"\n`;
    });
    csv += "\n";
  }

  return csv;
}

/**
 * Generate text report from OSINT data
 */
export function generateOsintTextReport(data, query, type) {
  let report = "╔════════════════════════════════════════════════════════════════╗\n";
  report += "║              OSINT INVESTIGATION REPORT                       ║\n";
  report += "╚════════════════════════════════════════════════════════════════╝\n\n";

  report += `Query: ${query}\n`;
  report += `Type: ${type}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Summary
  if (data.summary) {
    report += "SUMMARY\n";
    report += "─".repeat(60) + "\n";
    report += data.summary + "\n\n";
  }

  // Overview
  if (data.investigation_overview) {
    const overview = data.investigation_overview;
    report += "INVESTIGATION OVERVIEW\n";
    report += "─".repeat(60) + "\n";
    report += `  Total Breach Records: ${overview.total_breach_records}\n`;
    report += `  Total Databases: ${overview.total_databases}\n`;
    report += `  Web Results: ${overview.total_web_results}\n`;
    report += `  Professional Profiles: ${overview.total_professional_profiles}\n`;
    report += `  Companies Found: ${overview.total_companies}\n`;

    if (overview.unique_data_points) {
      const unique = overview.unique_data_points;
      report += "\n  Unique Data Points:\n";
      report += `    • Emails: ${unique.emails}\n`;
      report += `    • Phones: ${unique.phones}\n`;
      report += `    • Names: ${unique.names}\n`;
      report += `    • Usernames: ${unique.usernames}\n`;
      report += `    • Addresses: ${unique.addresses}\n`;
      report += `    • URLs: ${unique.urls}\n`;
      report += `    • Domains: ${unique.domains}\n`;
    }
    report += "\n";
  }

  // Identity
  if (data.identity?.names?.length > 0) {
    report += "IDENTITY INFORMATION\n";
    report += "─".repeat(60) + "\n";
    data.identity.names.forEach((item) => {
      report += `\n  Name: ${item.name}\n`;
      report += `  Found in Breaches: ${item.found_in_breaches}\n`;
      if (item.breach_sources?.length > 0) {
        report += `  Databases: ${item.breach_sources.map((b) => b.database).join(", ")}\n`;
      }
    });
    report += "\n";
  }

  // Emails
  if (data.contacts?.emails?.all_emails?.length > 0) {
    report += "EMAIL ADDRESSES\n";
    report += "─".repeat(60) + "\n";
    data.contacts.emails.all_emails.forEach((item) => {
      report += `\n  ${item.email}\n`;
      report += `  Type: ${item.type}\n`;
      report += `  Found in Breaches: ${item.found_in_breaches}\n`;
      if (item.breach_sources?.some((b) => b.has_password)) {
        report += `  ⚠️  PASSWORD EXPOSED\n`;
      }
      if (item.breach_sources?.length > 0) {
        report += `  Databases: ${item.breach_sources.map((b) => b.database).join(", ")}\n`;
      }
    });
    report += "\n";
  }

  // Phones
  if (data.contacts?.phones?.all_phones?.length > 0) {
    report += "PHONE NUMBERS\n";
    report += "─".repeat(60) + "\n";
    data.contacts.phones.all_phones.forEach((item) => {
      report += `\n  ${item.phone}\n`;
      report += `  Found in Breaches: ${item.found_in_breaches}\n`;
      if (item.breach_sources?.length > 0) {
        report += `  Databases: ${item.breach_sources.map((b) => b.database).join(", ")}\n`;
      }
    });
    report += "\n";
  }

  // Companies
  if (data.professional?.companies?.all_companies?.length > 0) {
    report += "COMPANIES\n";
    report += "─".repeat(60) + "\n";
    data.professional.companies.all_companies.forEach((item) => {
      report += `\n  Domain: ${item.domain}\n`;
      report += `  Employee Count: ${item.employee_count?.toLocaleString() || "N/A"}\n`;
      report += `  Source: ${item.source}\n`;
    });
    report += "\n";
  }

  // Usernames
  if (data.digital_footprint?.usernames?.all_usernames?.length > 0) {
    report += "USERNAMES\n";
    report += "─".repeat(60) + "\n";
    data.digital_footprint.usernames.all_usernames.forEach((item) => {
      report += `\n  @${item.username}\n`;
      report += `  Found in Breaches: ${item.found_in_breaches}\n`;
      if (item.breach_sources?.length > 0) {
        report += `  Databases: ${item.breach_sources.map((b) => b.database).join(", ")}\n`;
      }
    });
    report += "\n";
  }

  // Databases
  if (data.breach_data?.databases?.length > 0) {
    report += "COMPROMISED DATABASES\n";
    report += "─".repeat(60) + "\n";
    data.breach_data.databases.forEach((db) => {
      report += `  • ${db}\n`;
    });
    report += "\n";
  }

  return report;
}

/**
 * Download OSINT data as file
 */
export function downloadOsintData(data, query, type, format = "csv") {
  try {
    let content, filename, mimeType;

    if (format === "csv") {
      content = generateOsintCSV(data, query, type);
      filename = `osint-report-${query.replace(/\s+/g, "-")}-${Date.now()}.csv`;
      mimeType = "text/csv";
    } else if (format === "txt") {
      content = generateOsintTextReport(data, query, type);
      filename = `osint-report-${query.replace(/\s+/g, "-")}-${Date.now()}.txt`;
      mimeType = "text/plain";
    } else if (format === "json") {
      content = JSON.stringify(data, null, 2);
      filename = `osint-report-${query.replace(/\s+/g, "-")}-${Date.now()}.json`;
      mimeType = "application/json";
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error("Download error:", error);
    return { success: false, error: error.message };
  }
}
