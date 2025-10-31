# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Phase 1: Authentication & Authorization
- Azure AD B2C authentication integration
- JWT token validation middleware
- Authentication routes (`/api/auth/me`, `/api/auth/logout`, `/api/auth/verify`)
- Frontend AuthProvider with MSAL integration
- ProtectedRoute component for route protection
- Login/Logout UI in sidebar
- User profile dropdown with logout functionality

### Added - Phase 2: Multi-Tenancy
- Tenant and TenantMember models in database schema
- Tenant middleware for request isolation
- Tenant-based data filtering in all routes
- Tenant management API (`/api/tenants`)
- Tenant selector/switcher component in frontend
- Tenant store for state management
- Multi-tenant document isolation
- Role-based access control per tenant (OWNER, ADMIN, MEMBER, VIEWER)

### Changed
- Updated README.md with new authentication and multi-tenancy features
- Extended user schema with Azure AD fields (`azureId`, `azureOID`)
- Documents, Templates, and Conversations now tenant-aware
- All document routes require tenant context

### Fixed
- Fixed Azure SQL Server firewall error handling
- Improved error messages for database connection issues
- Fixed CORS configuration for better frontend-backend communication
- Fixed missing `authLimiter` import in backend index.ts

### Dependencies
- Backend: Added `jsonwebtoken`, `jwks-rsa`, `@types/jsonwebtoken`
- Frontend: Added `@azure/msal-browser`, `@azure/msal-react`

### Documentation
- Created `docs/PHASE_1_2_IMPLEMENTATION.md` with detailed implementation guide
- Updated `docs/TROUBLESHOOTING.md` with database connection issues
- Added authentication and multi-tenancy sections to README

## [1.0.0] - 2025-01-XX

### Added
- Initial project setup
- Document management (CRUD)
- AI chat assistant with Azure OpenAI
- File upload functionality
- GitHub integration
- Template system
- Rich text editor (TipTap)
- Dark mode support
- Analytics dashboard

---

## Upgrade Instructions

### For Phase 1 & 2 Implementation

1. **Install new dependencies:**
   ```bash
   cd backend && npm install jsonwebtoken jwks-rsa @types/jsonwebtoken
   cd ../frontend && npm install @azure/msal-browser @azure/msal-react
   ```

2. **Run Prisma migrations:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_azure_ad_fields
   npx prisma migrate dev --name add_multi_tenancy
   npx prisma generate
   ```

3. **Configure environment variables:**
   - Backend `.env`: Add `AZURE_TENANT_ID` and `AZURE_CLIENT_ID`
   - Frontend `.env`: Add `VITE_AZURE_CLIENT_ID` and `VITE_AZURE_TENANT_ID`

4. **Restart backend and frontend**

---

## Migration Notes

### Breaking Changes
- All document endpoints now require `X-Tenant-ID` or `X-Tenant-Slug` header
- Authentication required for most endpoints
- Document creation requires authenticated user context

### Deprecations
- Old password-based authentication (replaced by Azure AD B2C)
- Non-tenant-aware endpoints (all endpoints now tenant-aware)

