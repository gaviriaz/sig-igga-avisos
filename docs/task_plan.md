# Task Plan: SIG IGGA / ISA - Gestión Integral de Avisos (Zero Cost)

## Phase 1: Infrastructure & Environment Setup (0 USD)
- [x] 1.1 **Create GitHub Repositories**: Project folder initialized.
- [ ] 1.2 **Supabase Setup**: Initialized project via schema.sql.
- [x] 1.3 **Local Development Environment**: 
    - [x] Backend: FastAPI + Python requirements.
    - [x] Frontend: React + Vite + TS boilerplate.
- [ ] 1.4 **GeoServer (Free Tier)**: Railway setup (Discovery phase).

## Phase 2: Database Schema (SQL PostGIS)
- [x] 2.1 **Create Base Tables**: `import_batch`, `avisos_raw`, `aviso`.
- [x] 2.2 **Create Operational Tables**: `aviso_historial`, `aviso_estado`, `aviso_sla`, `aviso_evidencia`, `aviso_comentario`.
- [x] 2.3 **Create Domain Tables**: `dom_*`.
- [x] 2.4 **Spatial Logic**: Triggers for geom and GeoJSON RPC.

## Phase 3: Backend - ETL & Core API
- [ ] 3.1 **SharePoint Connector**: MS Graph delegated OAuth (0 USD).
- [x] 3.2 **ETL Discovery Logic**: Year/Month/File scanning (Implemented).
- [x] 3.3 **Ingesta Service**: RAW Snapshot + Upsert Operational (Implemented).
- [ ] 3.4 **Auth & RBAC**: Supabase Auth integration + Role checks.

## Phase 4: Frontend - Core GIS & Dashboard
- [x] 4.1 **React Boilerplate**: Vite + Tailwind + Shadcn (PRO MAX UI).
- [x] 4.2 **GIS Module**: OpenLayers + Hybrid Local/RPC Vector layers.
- [x] 4.3 **Aviso Management**: List, Detail view, Insumos UI.
- [x] 4.4 **Dashboard**: Statistics by role, Risk score, SLAs (Implemented).

## Phase 5: Advanced Modules
- [x] 5.1 **Insumos Module**: UI Gate implemented. Backend logic pending real OneDrive.
- [ ] 5.2 **KML Validation**: Actual spatial buffer check (Python logic).
- [x] 5.3 **Offline PWA**: Service workers (Registered/Caching).

## Phase 6: Export & Final Polish
- [ ] 6.1 **Export Service**: GPKG, GeoJSON, CSV, PDF.
- [ ] 6.2 **CI/CD**: GitHub Actions.
- [ ] 6.3 **Documentation**: README, Setup guide (0 USD proof).

---
## Progress Log
- [2026-03-02]: Project directory structure created (`backend`, `frontend`, `docs`).
- [2026-03-02]: Task plan initialized.
- [2026-03-02]: PRO MAX UI Dashboard and Hybrid GIS Engine implemented (0 USD).
- [2026-03-02]: PWA Service Worker added.
- [2026-03-02]: Spatial BBOX fetching and Local Layer Serving (Lines/Towers/Predios) implemented.

