---
name: photoncms-schema
description: This skill provides guidance for working with PhotonCMS dynamic schemas, module types, field configurations, and content queries. It should be used when implementing PhotonCMS content structures or troubleshooting schema issues.
---

# PhotonCMS Schema Skill

This skill provides comprehensive guidance for working with PhotonCMS's dynamic schema system.

## Overview

PhotonCMS is a Laravel-based headless CMS with dynamic schema management. This skill covers:

- Module structure and types
- Field type configuration
- Relationship design
- Content querying
- Schema migrations

For detailed field type configurations, see [field-types.md](./references/field-types.md).

---

## Module Types

### Regular Modules

Standard content types with multiple entries:

```php
// Creating a regular module programmatically
$module = Module::create([
    'name' => 'Articles',
    'table_name' => 'articles',
    'type' => 'regular',
    'anchor_text' => '{{title}}',
    'icon' => 'newspaper',
]);
```

### Single Entry Modules

For singleton content (settings, homepage, etc.):

```php
$module = Module::create([
    'name' => 'Site Settings',
    'table_name' => 'site_settings',
    'type' => 'single_entry',
]);
```

### Sortable Modules

Content with manual ordering:

```php
$module = Module::create([
    'name' => 'Featured Items',
    'table_name' => 'featured_items',
    'type' => 'sortable',
]);
```

### Nested Modules

Hierarchical content with parent-child relationships:

```php
$module = Module::create([
    'name' => 'Categories',
    'table_name' => 'categories',
    'type' => 'multilevel_sortable',
    'max_depth' => 3,
]);
```

---

## Field Configuration

### Adding Fields to Modules

```php
// Text field
$module->fields()->create([
    'name' => 'title',
    'type' => 'input_text',
    'column_name' => 'title',
    'tooltip_text' => 'Enter the article title',
    'validation_rules' => 'required|max:255',
    'is_system' => false,
    'pivot_table' => null,
]);

// Rich text field
$module->fields()->create([
    'name' => 'content',
    'type' => 'rich_text',
    'column_name' => 'content',
    'validation_rules' => 'required',
]);

// Image field
$module->fields()->create([
    'name' => 'featured_image',
    'type' => 'image',
    'column_name' => 'featured_image',
    'validation_rules' => 'nullable',
]);

// Relationship field (many_to_one)
$module->fields()->create([
    'name' => 'category',
    'type' => 'many_to_one',
    'column_name' => 'category_id',
    'related_module' => $categoryModule->id,
    'validation_rules' => 'required|exists:categories,id',
]);
```

### Field Types Quick Reference

| Type | DB Column | Use Case |
|------|-----------|----------|
| `input_text` | VARCHAR | Titles, short text |
| `rich_text` | TEXT | Formatted content |
| `text_area` | TEXT | Plain long text |
| `image` | VARCHAR | Single image |
| `gallery` | pivot table | Multiple images |
| `file` | VARCHAR | Single file upload |
| `assets` | pivot table | Multiple files |
| `boolean` | TINYINT | Toggles, checkboxes |
| `date` | DATE | Date only |
| `datetime` | DATETIME | Date and time |
| `integer` | INT | Numbers |
| `decimal` | DECIMAL | Prices, measurements |
| `select` | VARCHAR | Single selection |
| `many_to_one` | INT (FK) | Belongs to relationship |
| `many_to_many` | pivot table | Multiple relationships |
| `one_to_many` | inverse | Has many relationship |

---

## Content Queries

### Basic Queries

```php
// Get all published articles
$articles = \Photon::module('articles')
    ->where('published', true)
    ->orderBy('created_at', 'desc')
    ->get();

// Get with relationships
$articles = \Photon::module('articles')
    ->with(['category', 'author', 'tags'])
    ->where('published', true)
    ->get();

// Paginate results
$articles = \Photon::module('articles')
    ->where('published', true)
    ->paginate(15);
```

### Relationship Queries

```php
// Filter by related module
$articles = \Photon::module('articles')
    ->whereHas('category', function ($query) {
        $query->where('slug', 'technology');
    })
    ->get();

// Eager load nested relationships
$articles = \Photon::module('articles')
    ->with(['author.profile', 'tags', 'comments.user'])
    ->get();
```

### Advanced Queries

```php
// Search across fields
$articles = \Photon::module('articles')
    ->where('title', 'LIKE', "%{$search}%")
    ->orWhere('content', 'LIKE', "%{$search}%")
    ->get();

// Date range filtering
$articles = \Photon::module('articles')
    ->whereBetween('published_at', [$startDate, $endDate])
    ->get();

// Sorting by relationship field
$articles = \Photon::module('articles')
    ->join('categories', 'articles.category_id', '=', 'categories.id')
    ->orderBy('categories.name')
    ->select('articles.*')
    ->get();
```

---

## Schema Migrations

### Creating Modules via Migration

```php
// database/migrations/create_articles_module.php
class CreateArticlesModule extends Migration
{
    public function up()
    {
        // Create the module
        $module = Module::create([
            'name' => 'Articles',
            'table_name' => 'articles',
            'type' => 'regular',
        ]);

        // Add fields
        $module->fields()->createMany([
            [
                'name' => 'title',
                'type' => 'input_text',
                'column_name' => 'title',
                'validation_rules' => 'required|max:255',
            ],
            [
                'name' => 'slug',
                'type' => 'input_text',
                'column_name' => 'slug',
                'validation_rules' => 'required|unique:articles',
            ],
            [
                'name' => 'content',
                'type' => 'rich_text',
                'column_name' => 'content',
            ],
            [
                'name' => 'published',
                'type' => 'boolean',
                'column_name' => 'published',
                'default_value' => '0',
            ],
        ]);

        // Run schema generator
        Artisan::call('photon:sync');
    }

    public function down()
    {
        $module = Module::where('table_name', 'articles')->first();
        if ($module) {
            $module->fields()->delete();
            $module->delete();
        }

        Schema::dropIfExists('articles');
    }
}
```

### Adding Fields to Existing Modules

```php
class AddSeoFieldsToArticles extends Migration
{
    public function up()
    {
        $module = Module::where('table_name', 'articles')->firstOrFail();

        $module->fields()->createMany([
            [
                'name' => 'meta_title',
                'type' => 'input_text',
                'column_name' => 'meta_title',
                'validation_rules' => 'nullable|max:60',
            ],
            [
                'name' => 'meta_description',
                'type' => 'text_area',
                'column_name' => 'meta_description',
                'validation_rules' => 'nullable|max:160',
            ],
        ]);

        Artisan::call('photon:sync');
    }
}
```

---

## Best Practices

### Field Naming

- Use snake_case: `featured_image` not `featuredImage`
- Be descriptive: `published_at` not `date`
- Use consistent prefixes for related fields: `seo_title`, `seo_description`

### Relationship Design

```php
// Good: Clear relationship names
'name' => 'author',        // many_to_one to users
'name' => 'category',      // many_to_one to categories
'name' => 'tags',          // many_to_many to tags
'name' => 'related_posts', // many_to_many self-referential

// Avoid: Ambiguous names
'name' => 'user_id',  // Should be 'author' or 'creator'
'name' => 'data',     // Too generic
```

### Validation

Always include appropriate validation:

```php
// Required fields
'validation_rules' => 'required|max:255',

// Optional with constraints
'validation_rules' => 'nullable|url|max:255',

// Numeric fields
'validation_rules' => 'required|numeric|min:0',

// Unique fields
'validation_rules' => 'required|unique:articles,slug',
```

### Performance

```php
// Eager load relationships
$articles = \Photon::module('articles')
    ->with(['category', 'author']) // Prevents N+1
    ->paginate(15);

// Select only needed fields for large datasets
$articles = \Photon::module('articles')
    ->select(['id', 'title', 'slug', 'published_at'])
    ->get();
```

---

## Troubleshooting

### Schema Out of Sync

```bash
# Rebuild schema
php artisan photon:sync

# Force rebuild
php artisan photon:sync --force
```

### Field Not Appearing

1. Check field is assigned to module
2. Verify field type is valid
3. Run `photon:sync`
4. Clear cache: `php artisan cache:clear`

### Relationship Issues

1. Verify related module exists
2. Check foreign key column exists
3. Ensure proper cascade on delete

---

## Related Agents

- `photoncms-navigator` - Navigate and understand schemas
- `laravel-reviewer` - General Laravel code review
- `data-integrity-guardian` - Data migration concerns
