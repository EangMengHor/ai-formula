# OSINT Tools Integration

## Overview

This feature integrates an OSINT (Open Source Intelligence) API that investigates publicly available information about emails, phone numbers, names, and usernames.

## File Structure

```
src/
├── pages/
│   └── _osint/
│       ├── OsintLayout.jsx          # Layout wrapper for OSINT pages
│       ├── OsintTools.jsx           # Main input form page
│       ├── OsintFinding.jsx         # Results display page
│       └── components/
│           ├── ResultComponents.jsx  # Reusable UI components
│           ├── OsintSections.jsx    # Data section components
│           └── downloadUtils.js     # Download functionality
└── services/
    └── osint/
        └── osintInvestigation.js    # API integration service
```

## Routes

- `/osint-tools` - Input form page where users enter query and select type
- `/osint-finding` - Results page displaying investigation findings

## Features

### Input Form (OsintTools.jsx)

- Query input with 50-character limit
- Search type selection: Email, Phone, Name, Username
- Real-time validation
- Accessible UI with Tailwind styling
- Loading state with estimated time (30-60 seconds)

### Results Display (OsintFinding.jsx)

- Expandable sections for each data category
- Clean, organized layout with neutral colors (slate, white, black)
- Investigation metadata (time taken, API calls)
- Multiple result categories:
  - **Identity Information** - Names found
  - **Contacts** - Emails and phone numbers
  - **Professional Information** - Companies and profiles
  - **Digital Footprint** - Usernames and URLs
  - **Locations** - Addresses found
  - **Breach Data** - Compromised databases
  - **Web Intelligence** - Web search results

### Download Features

Multiple export formats available:

- **CSV** - Tabular format for spreadsheet analysis
- **TXT** - Formatted text report with clear sections
- **JSON** - Raw data for programmatic access

## API Integration

### Service: `osintInvestigation()`

```javascript
import { osintInvestigation } from "@/services/osint/osintInvestigation";

const result = await osintInvestigation({
  query: "example@email.com", // max 50 characters
  type: "email", // one of: email, phone, name, username
});
```

### Environment Variable

```env
VITE_OSINT_API_URL=http://localhost:8080/api/osint/osint
```

## API Response Structure

The API returns data in this structure:

```javascript
{
  statuscode: 200,
  message: "OSINT investigation completed successfully.",
  data: {
    success: true,
    investigation_time_ms: 12220,
    api_calls_made: 10,
    data: {
      summary: "Found 433 breach records across 185 emails...",
      investigation_overview: { /* stats */ },
      identity: { /* names */ },
      contacts: { /* emails and phones */ },
      professional: { /* companies and profiles */ },
      digital_footprint: { /* usernames and urls */ },
      locations: { /* addresses */ },
      web_intelligence: { /* web results */ },
      breach_data: { /* databases */ }
    },
    metadata: {
      phase_timings: { /* timings */ },
      timestamp: "2025-11-10T10:44:18.122Z"
    }
  }
}
```

## Error Handling

- Input validation (query length, type validation)
- Network error handling with user-friendly messages
- API timeout (120 seconds)
- Session storage for data persistence between page navigation

## UI/UX Features

- **Color Scheme**: Neutral palette (slate-950, slate-900, slate-800, slate-700, white, black)
- **Interactive Elements**: Expandable sections for detailed exploration
- **Data Visualization**: Stats grids, tables, and lists
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Loading States**: Clear feedback during investigation
- **Accessibility**: Semantic HTML, proper contrast ratios

## Usage Flow

1. User navigates to `/osint-tools`
2. Enters search query (email, phone, name, or username)
3. Clicks "Start Investigation"
4. UI shows loading state with estimated time
5. API completes investigation (30-60 seconds)
6. Results displayed on `/osint-finding` page
7. User can explore expandable sections for details
8. Download results in preferred format (CSV, TXT, JSON)
9. Start new investigation or navigate away

## Data Storage

Results are stored in `sessionStorage` for the current session:

- `osintResult` - Full API response
- `osintQuery` - Original search query
- `osintType` - Search type used

Session data is cleared when starting a new investigation.

## Performance

- API timeout: 120 seconds (recommended 30-60 seconds)
- Download generation: Instant (client-side)
- Session storage: No server requests for already-loaded data

## Browser Compatibility

Requires modern browser with:

- ES6+ JavaScript support
- `sessionStorage` API
- Blob API for downloads
