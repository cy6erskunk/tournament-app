# Implement Device Management in Admin Panel

## Summary

This PR implements comprehensive device management functionality in the admin panel, following the foundation established in PR #78. The implementation follows a clean architecture where devices self-register via external API, and the admin panel provides view and delete capabilities for monitoring and managing registered devices.

## Key Changes

### Database Layer
- **`src/database/getDevices.ts`**: Service for fetching all devices and individual devices
  - Uses Kysely's `Selectable` type for proper TypeScript typing
  - Returns devices ordered by creation date (newest first)
- **`src/database/deleteDevice.ts`**: Service for device deletion with existence checking
- **`src/database/registerDevice.ts`**: Refactored device registration logic
  - Auto-generates secure device tokens using `generateMatchId()`
  - Validates device names (required, max 255 chars)
  - Handles trimming and error cases

### API Endpoints
- **`/api/admin/devices`** (GET): List all registered devices (admin-only)
- **`/api/admin/devices/[deviceToken]`** (DELETE): Remove specific device (admin-only)
- **`/api/submitter/register`**: Refactored to use database layer function

### UI Components
- **`DeviceManagement.tsx`**: Main component displaying device table (view/delete-only)
  - Shows device token, submitter name, created date, last used date
  - Loading and error states
  - Delete confirmation via modal
- **`DeleteDeviceModal.tsx`**: Confirmation dialog for device removal

### Architecture Decisions
1. **View/Delete Only**: Admin panel does not create devices manually
   - Devices self-register when external apps call `/api/submitter/register`
   - Eliminates error-prone out-of-band token distribution
2. **Code Organization**: All database operations follow project patterns
   - Extracted from API routes to dedicated service files in `/src/database/`
   - Comprehensive test coverage for all database functions
3. **Clean Codebase**: Removed unused code identified during implementation
   - No manual device creation flow
   - No unused API endpoints

### Testing
- **138 tests passing** across 19 test files
- New test suites:
  - `getDevices.test.ts` (7 tests)
  - `deleteDevice.test.ts` (5 tests)
  - `registerDevice.test.ts` (9 tests)
- Comprehensive coverage including:
  - Successful operations
  - Validation edge cases
  - Database error handling
  - Empty state handling

### Internationalization
- Full translation coverage for 4 languages (fi, en, se, ee)
- Translations clarify self-registration flow:
  - "View and manage registered devices. Devices self-register automatically when submitting QR code matches."
  - Empty state: "No registered devices. Devices will appear here after their first QR code match submission."

### Documentation
- Updated `CLAUDE.md` with comprehensive Admin Panel section
- Documented device management architecture and workflow
- Explained registration flow and security model

## TypeScript Improvements
- Fixed `ColumnType` wrapper issues by using `Selectable<SubmitterDevices>`
- All type errors resolved
- Proper typing throughout the implementation

## Commit History
1. Implement device management in admin panel
2. Fix TypeScript type errors in device management
3. Refactor device registration to follow architecture pattern
4. Remove manual device creation from admin panel
5. Remove unused createDevice function and tests
6. Remove unused GET endpoint from device API

## Testing
```bash
npm run test    # All 138 tests pass
npm run lint    # No linting issues
```

## Breaking Changes
None. This is new functionality.

## Security Considerations
- All admin endpoints verify admin role before processing
- Device tokens are cryptographically secure (generated via `generateMatchId()`)
- Self-registration prevents token leakage through manual processes

## Future Enhancements
- QR Audit page (placeholder exists at `/admin/qr-audit`)
- Device usage analytics
- Bulk device management operations
