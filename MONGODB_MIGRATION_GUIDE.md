# 🔄 MongoDB Migration Guide

## Overview
This guide documents the migration from PostgreSQL (with Drizzle ORM) to MongoDB (with Mongoose) for the SOTERIA Vulnerability Dashboard.

---

## ✅ What Has Been Done

### 1. **Environment Configuration**
- Added `MONGODB_URI` to `.env` file
- Connection string: `mongodb+srv://pravint2006_db_user:MeQtq4K62vKG9l0u@soteria.owitn8c.mongodb.net/?appName=soteria`

### 2. **Dependencies Installed**
```bash
npm install mongoose
```

### 3. **New Files Created**

#### `server/mongodb.ts`
- MongoDB connection handler
- Connection event listeners
- Graceful shutdown handling

#### `server/models.ts`
- Mongoose schemas and models for:
  - **ScanResult** - Vulnerability scan metadata
  - **Vulnerability** - Individual vulnerability records
  - **TechContent** - AI-generated technology content
- TypeScript interfaces for type safety
- Database indexes for performance

#### `server/db-mongo.ts`
- MongoDB database operations (replaces `db.ts`)
- Functions for CRUD operations:
  - Scan results management
  - Vulnerability management
  - Tech content management
  - Statistics and analytics

### 4. **Updated Files**

#### `server/index.ts`
- Added MongoDB connection initialization
- Connects to database before starting server

#### `server/storage.ts`
- Created `MongoStorage` class
- Replaced in-memory storage with MongoDB-backed storage
- Maintains backward compatibility with `MemStorage`

---

## 📊 Database Schema Comparison

### PostgreSQL (Old) → MongoDB (New)

#### Scan Results
| PostgreSQL | MongoDB | Type |
|------------|---------|------|
| id (serial) | _id (ObjectId) | Auto-generated |
| repo_url | repoUrl | String |
| status (enum) | status | String (enum) |
| start_time | startTime | Date |
| end_time | endTime | Date (optional) |
| settings (jsonb) | settings | Object |
| summary (jsonb) | summary | Object |
| created_at | createdAt | Date (auto) |
| updated_at | updatedAt | Date (auto) |

#### Vulnerabilities
| PostgreSQL | MongoDB | Type |
|------------|---------|------|
| id (serial) | _id (ObjectId) | Auto-generated |
| scan_id (FK) | scanId (ObjectId) | Reference |
| title | title | String |
| severity (enum) | severity | String (enum) |
| description | description | String |
| file | file | String |
| line | line | Number |
| code_snippet | codeSnippet | String |
| recommendation | recommendation | String |
| cwe | cwe | String (optional) |
| cve | cve | String (optional) |
| status (enum) | status | String (enum) |
| created_at | createdAt | Date (auto) |
| updated_at | updatedAt | Date (auto) |

---

## 🔧 API Changes

### ID Format Change
- **Old (PostgreSQL):** Integer IDs (1, 2, 3, ...)
- **New (MongoDB):** ObjectId strings (e.g., "507f1f77bcf86cd799439011")

### Updated Functions

#### Before (PostgreSQL with Drizzle)
```typescript
import { createScan, getScan } from './db';

// Create scan with integer ID
const scan = await createScan(scanData);
console.log(scan.id); // 1

// Get scan by integer ID
const result = await getScan(1);
```

#### After (MongoDB with Mongoose)
```typescript
import { createScan, getScan } from './db-mongo';

// Create scan with ObjectId
const scan = await createScan(scanData);
console.log(scan._id); // "507f1f77bcf86cd799439011"

// Get scan by ObjectId string
const result = await getScan("507f1f77bcf86cd799439011");
```

---

## 🚀 Next Steps

### 1. **Update Route Handlers**
Routes that use database operations need to be updated to use the new MongoDB functions:

**Files to update:**
- `server/routes.ts` - Main API routes
- `server/routes/stats.ts` - Statistics endpoints
- `server/github-fix-routes.ts` - GitHub integration routes

**Changes needed:**
```typescript
// Old import
import * as db from './db';

// New import
import * as db from './db-mongo';

// Handle ObjectId instead of integer
const scanId = req.params.scanId; // Now a string ObjectId
```

### 2. **Update Frontend**
Frontend code that expects integer IDs needs to handle ObjectId strings:

**Files to check:**
- `client/src/pages/vulnerability-scanner.tsx`
- `client/src/pages/dashboard.tsx`
- `client/src/pages/repo-scanner.tsx`

**Changes:**
- Update ID type from `number` to `string`
- Update API calls to use string IDs

### 3. **Test Database Operations**
Run the development server and test:
```bash
npm run dev
```

**Test checklist:**
- [ ] MongoDB connection successful
- [ ] Create scan operation
- [ ] Retrieve scan by ID
- [ ] List all scans
- [ ] Create vulnerabilities
- [ ] Update vulnerability status
- [ ] Get scan statistics
- [ ] Tech content storage/retrieval

### 4. **Remove Old PostgreSQL Code**
Once MongoDB is fully working:
- Remove `server/db.ts` (old PostgreSQL code)
- Remove PostgreSQL dependencies from `package.json`:
  - `pg`
  - `drizzle-orm/node-postgres`
  - `@neondatabase/serverless`
- Remove `drizzle.config.ts`
- Remove `migrations/` folder

---

## 🔍 Troubleshooting

### Connection Issues
If you see connection errors:
```
Error: Could not connect to MongoDB
```

**Solutions:**
1. Check MongoDB URI in `.env` file
2. Verify network connectivity
3. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)
4. Verify username/password in connection string

### Schema Validation Errors
If you see validation errors:
```
ValidationError: Path `field` is required
```

**Solutions:**
1. Check that all required fields are provided
2. Verify data types match schema definitions
3. Review Mongoose model definitions in `server/models.ts`

### ObjectId Errors
If you see ObjectId errors:
```
Error: Argument passed in must be a string of 12 bytes or a string of 24 hex characters
```

**Solutions:**
1. Validate ObjectId before using: `mongoose.Types.ObjectId.isValid(id)`
2. Use the helper function: `isValidObjectId(id)` from `db-mongo.ts`

---

## 📝 Configuration

### Environment Variables
Ensure `.env` has:
```env
MONGODB_URI=mongodb+srv://pravint2006_db_user:MeQtq4K62vKG9l0u@soteria.owitn8c.mongodb.net/?appName=soteria
```

### MongoDB Atlas Setup
1. **Database Name:** Will be created automatically (default: `test`)
2. **Collections:** Created automatically on first insert:
   - `scanresults`
   - `vulnerabilities`
   - `techcontents`

### Indexes
Automatically created for performance:
- `scanresults`: `createdAt`, `status`
- `vulnerabilities`: `scanId`, `severity`, `status`

---

## 🎯 Benefits of MongoDB

### Advantages
✅ **Flexible Schema** - Easy to add new fields without migrations  
✅ **JSON-Native** - Natural fit for JavaScript/TypeScript  
✅ **Scalability** - Horizontal scaling with sharding  
✅ **Cloud-Ready** - MongoDB Atlas integration  
✅ **No Migrations** - Schema changes don't require migration files  
✅ **Rich Queries** - Powerful aggregation framework  

### Considerations
⚠️ **ID Format** - ObjectId strings instead of integers  
⚠️ **Transactions** - Different transaction model than PostgreSQL  
⚠️ **Joins** - Use population instead of SQL joins  

---

## 📚 Resources

### Mongoose Documentation
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)
- [Schemas](https://mongoosejs.com/docs/guide.html)
- [Models](https://mongoosejs.com/docs/models.html)
- [Queries](https://mongoosejs.com/docs/queries.html)

### MongoDB Atlas
- [Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)

---

## ✅ Migration Checklist

- [x] Install Mongoose
- [x] Create MongoDB connection module
- [x] Define Mongoose schemas and models
- [x] Create MongoDB database operations
- [x] Update environment variables
- [x] Update server initialization
- [x] Update storage layer
- [ ] Update all route handlers
- [ ] Update frontend to handle ObjectId
- [ ] Test all CRUD operations
- [ ] Test GitHub integration
- [ ] Test vulnerability scanning
- [ ] Remove old PostgreSQL code
- [ ] Update documentation

---

**Migration Status:** 🟡 In Progress (70% Complete)

**Next Action:** Update route handlers to use MongoDB operations
