import { downloadDocument } from "@/lib/downloadModule";

/**
 * Generate OSINT report content as formatted HTML/text for PDF
 */
function generateOsintReportContent(data, query, type, investigationTime, apiCalls) {
    let content = `
OSINT INVESTIGATION REPORT
${"=".repeat(80)}

INVESTIGATION DETAILS
${"-".repeat(80)}
Query: ${query}
Type: ${type.toUpperCase()}
Investigation Time: ${(investigationTime / 1000).toFixed(2)}s
API Calls Made: ${apiCalls}
Report Generated: ${new Date().toLocaleString()}
${"=".repeat(80)}

EXECUTIVE SUMMARY
${"-".repeat(80)}
${data.summary || "No summary available"}

INVESTIGATION OVERVIEW
${"-".repeat(80)}
`;

    if (data.investigation_overview) {
        const overview = data.investigation_overview;
        content += `
Total Breach Records: ${overview.total_breach_records || 0}
Total Databases: ${overview.total_databases || 0}
Web Results: ${overview.total_web_results || 0}
Professional Profiles: ${overview.total_professional_profiles || 0}
Companies Found: ${overview.total_companies || 0}

UNIQUE DATA POINTS
`;
        if (overview.unique_data_points) {
            const unique = overview.unique_data_points;
            content += `
  • Emails: ${unique.emails || 0}
  • Phones: ${unique.phones || 0}
  • Names: ${unique.names || 0}
  • Usernames: ${unique.usernames || 0}
  • Addresses: ${unique.addresses || 0}
  • URLs: ${unique.urls || 0}
  • Domains: ${unique.domains || 0}
`;
        }
    }

    // Identity Section
    if (data.identity?.names?.length > 0) {
        content += `

IDENTITY INFORMATION
${"-".repeat(80)}
Total Unique Names Found: ${data.identity.total_unique_names}

`;
        data.identity.names.forEach((item) => {
            content += `
Name: ${item.name}
  Found in Breaches: ${item.found_in_breaches}
`;
            if (item.breach_sources?.length > 0) {
                content += `  Databases: ${item.breach_sources.map((b) => b.database).join(", ")}\n`;
            }
        });
    }

    // Contacts Section
    if (data.contacts) {
        content += `

CONTACTS
${"-".repeat(80)}
${data.contacts.summary || ""}

`;
        // Emails
        if (data.contacts.emails?.all_emails?.length > 0) {
            content += `EMAIL ADDRESSES (${data.contacts.emails.total_unique} unique)
`;
            data.contacts.emails.all_emails.forEach((item) => {
                content += `
  Email: ${item.email}
  Type: ${item.type}
  Found in Breaches: ${item.found_in_breaches}
`;
                if (item.breach_sources?.some((b) => b.has_password)) {
                    content += `  ⚠️ PASSWORD EXPOSED\n`;
                }
                if (item.breach_sources?.length > 0) {
                    content += `  Databases: ${item.breach_sources.map((b) => b.database).join(", ")}\n`;
                }
            });
        }

        // Phones
        if (data.contacts.phones?.all_phones?.length > 0) {
            content += `

PHONE NUMBERS (${data.contacts.phones.total_unique} unique)
`;
            data.contacts.phones.all_phones.forEach((item) => {
                content += `
  Phone: ${item.phone}
  Found in Breaches: ${item.found_in_breaches}
`;
                if (item.breach_sources?.length > 0) {
                    content += `  Databases: ${item.breach_sources.map((b) => b.database).join(", ")}\n`;
                }
            });
        }
    }

    // Professional Section
    if (data.professional) {
        content += `

PROFESSIONAL INFORMATION
${"-".repeat(80)}
${data.professional.summary || ""}

`;
        if (data.professional.profiles?.all_profiles?.length > 0) {
            content += `PROFESSIONAL PROFILES (${data.professional.profiles.total})
`;
            data.professional.profiles.all_profiles.forEach((profile) => {
                content += `
  Name: ${profile.full_name}
  Email: ${profile.email}
`;
                if (profile.first_name || profile.last_name) {
                    content += `  Name Breakdown: ${profile.first_name || ""} ${profile.last_name || ""}\n`;
                }
                if (profile.additional_emails?.length > 0) {
                    content += `  Additional Emails: ${profile.additional_emails.join(", ")}\n`;
                }
                if (profile.social_links?.length > 0) {
                    content += `  Social Links: ${profile.social_links.join(", ")}\n`;
                }
            });
        }

        if (data.professional.companies?.all_companies?.length > 0) {
            content += `

COMPANIES (${data.professional.companies.total})
`;
            data.professional.companies.all_companies.forEach((company) => {
                content += `
  Domain: ${company.domain}
  Employee Count: ${company.employee_count?.toLocaleString() || "N/A"}
  Source: ${company.source}
`;
            });
        }
    }

    // Digital Footprint Section
    if (data.digital_footprint) {
        content += `

DIGITAL FOOTPRINT
${"-".repeat(80)}
${data.digital_footprint.summary || ""}

`;
        if (data.digital_footprint.usernames?.all_usernames?.length > 0) {
            content += `USERNAMES (${data.digital_footprint.usernames.total_unique})
`;
            data.digital_footprint.usernames.all_usernames.forEach((item) => {
                content += `
  Username: @${item.username}
  Found in Breaches: ${item.found_in_breaches}
`;
                if (item.breach_sources?.length > 0) {
                    content += `  Databases: ${item.breach_sources.map((b) => b.database).join(", ")}\n`;
                }
            });
        }

        if (data.digital_footprint.urls?.all_urls?.length > 0) {
            content += `

URLS (${data.digital_footprint.urls.total_unique})
`;
            data.digital_footprint.urls.all_urls.forEach((item) => {
                content += `
  URL: ${item.url}
  Found in Breaches: ${item.found_in_breaches}
`;
                if (item.breach_sources?.length > 0) {
                    content += `  Databases: ${item.breach_sources.map((b) => b.database).join(", ")}\n`;
                }
            });
        }
    }

    // Locations Section
    if (data.locations?.addresses?.length > 0) {
        content += `

LOCATIONS
${"-".repeat(80)}
${data.locations.summary || ""}

Total Addresses Found: ${data.locations.total_unique}

`;
        data.locations.addresses.forEach((item) => {
            content += `
  Location: ${item.address}
  Found in Breaches: ${item.found_in_breaches}
`;
            if (item.breach_sources?.length > 0) {
                content += `  Databases: ${item.breach_sources.map((b) => b.database).join(", ")}\n`;
            }
        });
    }

    // Breach Data Section
    if (data.breach_data?.databases?.length > 0) {
        content += `

COMPROMISED DATABASES
${"-".repeat(80)}
Total Records: ${data.breach_data.total_records}

Databases Involved (${data.breach_data.databases.length}):
`;
        data.breach_data.databases.forEach((db) => {
            content += `  • ${db}\n`;
        });
    }

    // Web Intelligence Section
    if (data.web_intelligence?.all_results?.length > 0) {
        content += `

WEB INTELLIGENCE
${"-".repeat(80)}
${data.web_intelligence.summary || ""}

Total Results: ${data.web_intelligence.total_results}

`;
        data.web_intelligence.all_results.forEach((result) => {
            content += `
  Title: ${result.title}
  URL: ${result.url}
  Relevance: ${((result.relevance_score || 0) * 100).toFixed(1)}%
  Preview: ${result.content_preview?.substring(0, 200)}...
`;
        });
    }

    content += `

${"=".repeat(80)}
END OF REPORT
${"=".repeat(80)}
`;

    return content;
}

/**
 * Download OSINT data as PDF
 */
export async function downloadOsintPDF(osintData, query, type) {
    try {
        const data = osintData.data || {};
        const investigationTime = osintData.investigation_time_ms || 0;
        const apiCalls = osintData.api_calls_made || 0;

        // Generate formatted content
        const content = generateOsintReportContent(data, query, type, investigationTime, apiCalls);

        // Use downloadDocument from downloadModule
        // The function expects content and type
        const result = await downloadDocument({
            content,
            type: "pdf",
            fileName: `osint-report-${query.replace(/\s+/g, "-")}-${Date.now()}.pdf`,
        });

        return {
            success: true,
            message: "PDF downloaded successfully",
        };
    } catch (error) {
        console.error("PDF download error:", error);
        return {
            success: false,
            error: error.message || "Failed to download PDF",
        };
    }
}
