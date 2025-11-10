import { Badge, DataTable, DataList, NoDataFound, StatsGrid } from "./ResultComponents";
import { ExpandableSection, SummaryCard } from "./ResultComponents";

// Identity Section
export function IdentitySection({ data }) {
  if (!data || !data.identity) return null;

  const identity = data.identity;

  return (
    <ExpandableSection
      title="👤 Identity Information"
      count={identity.total_unique_names}
      defaultOpen={true}
    >
      <div className="space-y-4">
        {identity.summary && (
          <SummaryCard title="Summary" summary={identity.summary} />
        )}

        {identity.names && identity.names.length > 0 ? (
          <div>
            <h4 className="mb-3 text-sm font-medium text-slate-300">
              Names Found ({identity.names.length})
            </h4>
            <DataList
              items={identity.names}
              renderItem={(item) => (
                <div className="space-y-1">
                  <div className="font-medium text-slate-200">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    Found in {item.found_in_breaches} breach record
                    {item.found_in_breaches > 1 ? "s" : ""}
                  </div>
                  {item.breach_sources?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.breach_sources.map((breach, idx) => (
                        <Badge key={idx} variant="warning">
                          {breach.database}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        ) : (
          <NoDataFound />
        )}
      </div>
    </ExpandableSection>
  );
}

// Contacts Section
export function ContactsSection({ data }) {
  if (!data || !data.contacts) return null;

  const contacts = data.contacts;

  return (
    <ExpandableSection title="📧 Contacts" count={contacts.emails?.total_unique + contacts.phones?.total_unique} defaultOpen={true}>
      <div className="space-y-6">
        {contacts.summary && (
          <SummaryCard title="Summary" summary={contacts.summary} />
        )}

        {/* Emails */}
        {contacts.emails && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-slate-300">
              Email Addresses ({contacts.emails.total_unique})
            </h4>
            {contacts.emails.all_emails?.length > 0 ? (
              <DataList
                items={contacts.emails.all_emails}
                renderItem={(item) => (
                  <div className="space-y-1">
                    <div className="font-mono text-sm text-slate-200 break-all">{item.email}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Badge variant="info">{item.type}</Badge>
                      <span>{item.found_in_breaches} breach record(s)</span>
                      {item.breach_sources?.[0]?.has_password && (
                        <Badge variant="danger">Has Password</Badge>
                      )}
                    </div>
                    {item.breach_sources?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.breach_sources.map((breach, idx) => (
                          <Badge key={idx} variant="warning">
                            {breach.database}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              />
            ) : (
              <NoDataFound />
            )}
          </div>
        )}

        {/* Phones */}
        {contacts.phones && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-slate-300">
              Phone Numbers ({contacts.phones.total_unique})
            </h4>
            {contacts.phones.all_phones?.length > 0 ? (
              <DataList
                items={contacts.phones.all_phones}
                renderItem={(item) => (
                  <div className="space-y-1">
                    <div className="font-mono text-sm text-slate-200">{item.phone}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{item.found_in_breaches} breach record(s)</span>
                    </div>
                    {item.breach_sources?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.breach_sources.map((breach, idx) => (
                          <Badge key={idx} variant="warning">
                            {breach.database}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              />
            ) : (
              <NoDataFound />
            )}
          </div>
        )}
      </div>
    </ExpandableSection>
  );
}

// Professional Section
export function ProfessionalSection({ data }) {
  if (!data || !data.professional) return null;

  const professional = data.professional;

  return (
    <ExpandableSection
      title="💼 Professional Information"
      count={professional.companies?.total || 0}
      defaultOpen={true}
    >
      <div className="space-y-6">
        {professional.summary && (
          <SummaryCard title="Summary" summary={professional.summary} />
        )}

        {/* Profiles */}
        {professional.profiles && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-slate-300">
              Professional Profiles ({professional.profiles.total || 0})
            </h4>
            {professional.profiles.all_profiles?.length > 0 ? (
              <DataList
                items={professional.profiles.all_profiles}
                renderItem={(item) => (
                  <div className="space-y-2">
                    {/* Name and Email */}
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-slate-200">{item.full_name}</div>
                      <div className="font-mono text-xs text-blue-400 break-all">{item.email}</div>
                    </div>
                    
                    {/* First and Last Name */}
                    {(item.first_name || item.last_name) && (
                      <div className="flex gap-4 text-xs text-slate-500">
                        {item.first_name && <span>First: <span className="text-slate-300">{item.first_name}</span></span>}
                        {item.last_name && <span>Last: <span className="text-slate-300">{item.last_name}</span></span>}
                      </div>
                    )}
                    
                    {/* Additional Emails */}
                    {item.additional_emails?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Additional Emails:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.additional_emails.map((email, idx) => (
                            <Badge key={idx} variant="info">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Social Links */}
                    {item.social_links?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Social Links:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.social_links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800 hover:bg-blue-900/50 transition break-all"
                            >
                              {link.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              />
            ) : (
              <NoDataFound />
            )}
          </div>
        )}

        {/* Companies */}
        {professional.companies && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-slate-300">
              Companies ({professional.companies.total || 0})
            </h4>
            {professional.companies.all_companies?.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900">
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">
                        Domain
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">
                        Employees
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {professional.companies.all_companies.map((company, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-800 hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {company.domain}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {company.employee_count?.toLocaleString() || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {company.source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <NoDataFound />
            )}
          </div>
        )}
      </div>
    </ExpandableSection>
  );
}

// Digital Footprint Section
export function DigitalFootprintSection({ data }) {
  if (!data || !data.digital_footprint) return null;

  const footprint = data.digital_footprint;

  return (
    <ExpandableSection
      title="🔗 Digital Footprint"
      count={(footprint.usernames?.total_unique || 0) + (footprint.urls?.total_unique || 0)}
    >
      <div className="space-y-6">
        {footprint.summary && (
          <SummaryCard title="Summary" summary={footprint.summary} />
        )}

        {/* Usernames */}
        {footprint.usernames && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-slate-300">
              Usernames ({footprint.usernames.total_unique})
            </h4>
            {footprint.usernames.all_usernames?.length > 0 ? (
              <DataList
                items={footprint.usernames.all_usernames}
                renderItem={(item) => (
                  <div className="space-y-1">
                    <div className="font-mono text-sm text-slate-200">
                      @{item.username}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.found_in_breaches} breach record(s)
                    </div>
                    {item.breach_sources?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.breach_sources.map((breach, idx) => (
                          <Badge key={idx} variant="warning">
                            {breach.database}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              />
            ) : (
              <NoDataFound />
            )}
          </div>
        )}

        {/* URLs */}
        {footprint.urls && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-slate-300">
              URLs ({footprint.urls.total_unique})
            </h4>
            {footprint.urls.all_urls?.length > 0 ? (
              <DataList
                items={footprint.urls.all_urls}
                renderItem={(item) => (
                  <div className="space-y-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-400 hover:text-blue-300 break-all"
                    >
                      {item.url}
                    </a>
                    <div className="text-xs text-slate-500">
                      {item.found_in_breaches} breach record(s)
                    </div>
                    {item.breach_sources?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.breach_sources.map((breach, idx) => (
                          <Badge key={idx} variant="warning">
                            {breach.database}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              />
            ) : (
              <NoDataFound />
            )}
          </div>
        )}
      </div>
    </ExpandableSection>
  );
}

// Locations Section
export function LocationsSection({ data }) {
  if (!data || !data.locations) return null;

  const locations = data.locations;

  return (
    <ExpandableSection
      title="📍 Locations"
      count={locations.total_unique}
    >
      <div className="space-y-4">
        {locations.summary && (
          <SummaryCard title="Summary" summary={locations.summary} />
        )}

        {locations.addresses && locations.addresses.length > 0 ? (
          <DataList
            items={locations.addresses}
            renderItem={(item) => (
              <div className="space-y-1">
                <div className="font-medium text-slate-200">{item.address}</div>
                <div className="text-xs text-slate-500">
                  {item.found_in_breaches} breach record(s)
                </div>
                {item.breach_sources?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.breach_sources.map((breach, idx) => (
                      <Badge key={idx} variant="warning">
                        {breach.database}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
        ) : (
          <NoDataFound />
        )}
      </div>
    </ExpandableSection>
  );
}

// Breach Data Section
export function BreachDataSection({ data }) {
  if (!data || !data.breach_data) return null;

  const breachData = data.breach_data;

  return (
    <ExpandableSection
      title="⚠️ Breach Database Records"
      count={breachData.total_records}
    >
      <div className="space-y-4">
        {breachData.summary && (
          <SummaryCard title="Summary" summary={breachData.summary} />
        )}

        {breachData.databases && breachData.databases.length > 0 ? (
          <div>
            <h4 className="mb-3 text-sm font-medium text-slate-300">
              Compromised Databases ({breachData.databases.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {breachData.databases.map((db, idx) => (
                <Badge key={idx} variant="danger">
                  {db}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <NoDataFound />
        )}
      </div>
    </ExpandableSection>
  );
}

// Web Intelligence Section
export function WebIntelligenceSection({ data }) {
  if (!data || !data.web_intelligence) return null;

  const intelligence = data.web_intelligence;

  return (
    <ExpandableSection
      title="🌐 Web Intelligence"
      count={intelligence.total_results}
    >
      <div className="space-y-4">
        {intelligence.summary && (
          <SummaryCard title="Summary" summary={intelligence.summary} />
        )}

        {intelligence.all_results && intelligence.all_results.length > 0 ? (
          <DataList
            items={intelligence.all_results}
            renderItem={(item) => (
              <div className="space-y-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-medium text-blue-400 hover:text-blue-300 break-all"
                >
                  {item.title}
                </a>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {item.content_preview}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">{item.url}</span>
                  {item.relevance_score && (
                    <Badge variant="success">
                      {(item.relevance_score * 100).toFixed(1)}% match
                    </Badge>
                  )}
                </div>
              </div>
            )}
          />
        ) : (
          <NoDataFound />
        )}
      </div>
    </ExpandableSection>
  );
}

// Overview Stats Component
export function OverviewStats({ data }) {
  if (!data || !data.investigation_overview) return null;

  const overview = data.investigation_overview;
  const uniqueData = overview.unique_data_points || {};

  const stats = [
    { label: "Breach Records", value: overview.total_breach_records || 0 },
    { label: "Databases", value: overview.total_databases || 0 },
    { label: "Web Results", value: overview.total_web_results || 0 },
    { label: "Emails Found", value: uniqueData.emails || 0 },
    { label: "Phones Found", value: uniqueData.phones || 0 },
    { label: "Usernames Found", value: uniqueData.usernames || 0 },
  ];

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-slate-200">
        Investigation Overview
      </h3>
      <StatsGrid stats={stats} />
    </div>
  );
}
