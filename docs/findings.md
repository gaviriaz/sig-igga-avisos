# Findings: SIG IGGA/ISA - Gestión Integral de Avisos

## Research Topics

### 1. SharePoint / OneDrive Access - 0 USD
- **Option A**: MS Graph API via App Registration (Delegated Permissions). This is the best approach for automated scanning.
- **Constraints**: Needs MS 365 Entra ID access. The user provided a URL, so we can use it to build the folder scanning logic.

### 2. PostGIS & Supabase Free Tier
- **Capacity**: 500 MB DB size.
- **GIS Support**: PostGIS is available.
- **Limits**: 5 GB bandwidth/month.

### 3. GeoServer Hosting - 0 USD
- **Railway**: 5 USD credit (free tier) per month. Might expire.
- **Alternative**: Self-hosting (Render or Fly.io with Free Tier).
- **Strategy**: Start with Railway.

### 4. PWA & Offline Support
- **Library**: `serwist` or `vite-plugin-pwa`.
- **IndexedDB**: `idb` or `dexie.js`.

---
## Discovered Files
- `/ANDRESV/prueba-1.1.ps1`: Reference logic for Excel processing. The new system expands this to a full SQL/Web architecture.

## Tooling Achievements (No-Admin)
- **FNM**: Successfully installed via winget. Node.js can now be managed without system admin.
- **Python 3.12**: Installed via Microsoft Store (winget ID: `9NCVDN91XZQP`).
- **VS Code**: Detected as already installed.

## Architectural Decisions
- **Postgres RPC**: Decided to use a Postgres function `get_avisos_as_geojson()` to serve map data. This provides a "0 USD" alternative to a heavy GeoServer for basic visualization.
- **Inmutable RAW**: Every batch import saves its own copy in `avisos_raw`. This ensures auditability if SharePoint files are moved or deleted.

