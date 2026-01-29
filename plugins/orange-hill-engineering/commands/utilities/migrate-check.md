---
name: migrate-check
description: Validate Laravel migrations for safety and best practices before running
argument-hint: "[migration-file|--all|--pending]"
---

# Migrate Check Command

Validate Laravel migrations for safety issues, performance concerns, and best practices before executing them.

## Usage

```bash
/migrate-check                              # Check pending migrations
/migrate-check --all                        # Check all migrations
/migrate-check 2024_01_15_create_users      # Check specific migration
/migrate-check --production                 # Extra checks for production
```

## Validation Checks

### 1. Schema Safety

**Destructive Operations:**
- 🔴 `dropColumn()` - Data loss
- 🔴 `dropTable()` - Data loss
- 🔴 `dropIfExists()` - Silent data loss
- 🟡 `renameColumn()` - May break running code
- 🟡 `change()` - Type changes need care

**Report format:**
```
⚠️  DESTRUCTIVE OPERATION DETECTED

File: 2024_01_15_remove_legacy_fields.php
Line 23: $table->dropColumn('old_field');

Impact: This will permanently delete data in the 'old_field' column.

Questions to verify:
1. Has data been migrated to the new location?
2. Is there a backfill script that needs to run first?
3. Has this been tested on a production copy?
```

### 2. Performance Analysis

**Large Table Operations:**
```php
// Flag operations on large tables
Schema::table('users', function (Blueprint $table) {
    $table->index('email'); // May lock table during creation
});
```

**Suggestions:**
```
⚠️  INDEX ON POTENTIALLY LARGE TABLE

Adding index to 'users' table may cause:
- Table lock during index creation (InnoDB)
- Slow migration on tables with >100k rows

Recommendations:
1. Run during low-traffic period
2. Consider ALGORITHM=INPLACE (MySQL 5.6+)
3. Use pt-online-schema-change for zero-downtime
```

### 3. Rollback Safety

**Check down() method:**
```php
// Migration file
public function up()
{
    Schema::table('orders', function (Blueprint $table) {
        $table->string('tracking_number')->nullable();
    });
}

public function down()
{
    // ⚠️ MISSING - Needs implementation
}
```

**Report:**
```
❌ MISSING ROLLBACK

File: 2024_01_15_add_tracking_to_orders.php
The down() method is empty or missing.

Required rollback:
public function down()
{
    Schema::table('orders', function (Blueprint $table) {
        $table->dropColumn('tracking_number');
    });
}
```

### 4. Best Practice Violations

**Check for:**
- [ ] Foreign key indexes
- [ ] Nullable defaults on new columns
- [ ] Proper column types
- [ ] Index naming conventions

**Example report:**
```
🟡 NEW NON-NULLABLE COLUMN

File: 2024_01_15_add_status_to_orders.php
Line 15: $table->string('status');

Issue: Adding non-nullable column to existing table will fail
       if table has data and no default is provided.

Fix options:
1. Add default: $table->string('status')->default('pending');
2. Make nullable: $table->string('status')->nullable();
3. Add in two steps: nullable first, then backfill, then make required
```

## Pre-Migration Checklist

Before running migrations in production:

```
📋 MIGRATION CHECKLIST

File: 2024_01_15_update_orders_schema.php

Safety Checks:
  ✅ Has proper down() method
  ✅ No destructive operations without confirmation
  ⚠️  Adds index to large table (review timing)

Performance Checks:
  ✅ No full table scans
  ⚠️  Consider running during maintenance window

Data Integrity:
  ✅ Foreign keys have indexes
  ✅ New columns have appropriate defaults

Recommended Actions:
  1. Take database backup
  2. Run during low-traffic period
  3. Monitor table locks during execution
```

## Execution Flow

### 1. Identify Pending Migrations

```bash
php artisan migrate:status
```

### 2. Analyze Each Migration

For each pending migration:
1. Parse the migration file
2. Identify schema operations
3. Check for safety concerns
4. Verify rollback capability

### 3. Generate Report

```
Migration Analysis Report
═════════════════════════

Pending Migrations: 3

1. 2024_01_15_create_audit_logs_table.php
   ✅ Safe - New table creation
   ✅ Has rollback

2. 2024_01_16_add_tracking_to_orders.php
   ✅ Safe - Nullable column addition
   ⚠️  Rollback: Verify before dropping column

3. 2024_01_17_remove_legacy_columns.php
   🔴 DESTRUCTIVE - Drops 3 columns
   ⚠️  Verify data migration complete

Overall: REVIEW REQUIRED before production
```

## Integration Points

### With Review Command

The `/workflows:review` command will automatically invoke `/migrate-check` when migrations are detected in a PR.

### With Deploy Workflow

Before deployment:
1. `/migrate-check --production`
2. Review report
3. Proceed or halt deployment

## Related Commands

- `/test-laravel` - Run tests after migration
- `/queue-status` - Check for pending jobs before migration
- `/workflows:work` - Full implementation workflow
