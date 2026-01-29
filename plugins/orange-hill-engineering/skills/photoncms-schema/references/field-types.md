# PhotonCMS Field Types Reference

Complete reference for all PhotonCMS field types and their configuration options.

## Text Fields

### input_text

Single-line text input.

```php
[
    'name' => 'title',
    'type' => 'input_text',
    'column_name' => 'title',
    'validation_rules' => 'required|max:255',
    'tooltip_text' => 'Enter the page title',
    'default_value' => null,
]
```

**DB Column:** `VARCHAR(255)`

### text_area

Multi-line plain text.

```php
[
    'name' => 'excerpt',
    'type' => 'text_area',
    'column_name' => 'excerpt',
    'validation_rules' => 'nullable|max:500',
]
```

**DB Column:** `TEXT`

### rich_text

WYSIWYG editor content.

```php
[
    'name' => 'content',
    'type' => 'rich_text',
    'column_name' => 'content',
    'validation_rules' => 'required',
]
```

**DB Column:** `LONGTEXT`

---

## Numeric Fields

### integer

Whole numbers.

```php
[
    'name' => 'quantity',
    'type' => 'integer',
    'column_name' => 'quantity',
    'validation_rules' => 'required|integer|min:0',
    'default_value' => '0',
]
```

**DB Column:** `INT`

### decimal

Decimal numbers (prices, measurements).

```php
[
    'name' => 'price',
    'type' => 'decimal',
    'column_name' => 'price',
    'validation_rules' => 'required|numeric|min:0',
    'default_value' => '0.00',
]
```

**DB Column:** `DECIMAL(10,2)`

---

## Date/Time Fields

### date

Date picker (no time).

```php
[
    'name' => 'published_date',
    'type' => 'date',
    'column_name' => 'published_date',
    'validation_rules' => 'nullable|date',
]
```

**DB Column:** `DATE`

### datetime

Date and time picker.

```php
[
    'name' => 'event_start',
    'type' => 'datetime',
    'column_name' => 'event_start',
    'validation_rules' => 'required|date',
]
```

**DB Column:** `DATETIME`

---

## Selection Fields

### boolean

Toggle/checkbox.

```php
[
    'name' => 'is_featured',
    'type' => 'boolean',
    'column_name' => 'is_featured',
    'default_value' => '0',
]
```

**DB Column:** `TINYINT(1)`

### select

Dropdown with predefined options.

```php
[
    'name' => 'status',
    'type' => 'select',
    'column_name' => 'status',
    'validation_rules' => 'required|in:draft,published,archived',
    // Options defined in admin panel or config
]
```

**DB Column:** `VARCHAR(50)`

---

## Media Fields

### image

Single image upload.

```php
[
    'name' => 'featured_image',
    'type' => 'image',
    'column_name' => 'featured_image',
    'validation_rules' => 'nullable',
]
```

**DB Column:** `VARCHAR(255)` (stores path)

**Accessing:**
```php
$article->featured_image; // Returns path or null
$article->getImageUrl('featured_image'); // Full URL
```

### gallery

Multiple images.

```php
[
    'name' => 'gallery',
    'type' => 'gallery',
    'column_name' => null, // Uses pivot table
    'related_module' => null, // Photon assets
]
```

**DB:** Creates pivot table

**Accessing:**
```php
$article->gallery; // Collection of images
foreach ($article->gallery as $image) {
    echo $image->file_url;
}
```

### file

Single file upload.

```php
[
    'name' => 'attachment',
    'type' => 'file',
    'column_name' => 'attachment',
    'validation_rules' => 'nullable|mimes:pdf,doc,docx',
]
```

**DB Column:** `VARCHAR(255)`

### assets

Multiple file uploads.

```php
[
    'name' => 'documents',
    'type' => 'assets',
    'column_name' => null, // Uses pivot table
]
```

**DB:** Creates pivot table

---

## Relationship Fields

### many_to_one

Belongs to relationship (foreign key).

```php
[
    'name' => 'category',
    'type' => 'many_to_one',
    'column_name' => 'category_id',
    'related_module' => $categoryModuleId,
    'validation_rules' => 'required|exists:categories,id',
]
```

**DB Column:** `INT UNSIGNED` (foreign key)

**Accessing:**
```php
$article->category;      // Related model
$article->category->name; // Attribute
```

### many_to_many

Many-to-many relationship.

```php
[
    'name' => 'tags',
    'type' => 'many_to_many',
    'column_name' => null, // Uses pivot table
    'related_module' => $tagsModuleId,
    'pivot_table' => 'article_tag',
]
```

**DB:** Creates pivot table

**Accessing:**
```php
$article->tags;        // Collection
$article->tags->pluck('name'); // ['PHP', 'Laravel']
```

### one_to_many

Has many relationship (inverse).

```php
[
    'name' => 'comments',
    'type' => 'one_to_many',
    'column_name' => null, // No column needed
    'related_module' => $commentsModuleId,
    'local_key' => 'id',
    'foreign_key' => 'article_id',
]
```

**DB:** No column (defined by foreign key on related table)

**Accessing:**
```php
$article->comments;      // Collection
$article->comments()->count(); // 15
```

---

## Special Fields

### system fields

Auto-managed by PhotonCMS:

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update |
| `created_by` | many_to_one | Creator user |
| `updated_by` | many_to_one | Last editor |

### anchor_text

Display text for the entry:

```php
// In module config
'anchor_text' => '{{title}} - {{category.name}}',
```

---

## Validation Rules Reference

Common validation rules for PhotonCMS fields:

```php
// Required
'required'

// Nullable (optional)
'nullable'

// String length
'max:255'
'min:10'
'between:10,255'

// Numeric
'numeric'
'integer'
'min:0'
'max:100'

// Date
'date'
'after:today'
'before:2030-01-01'

// File types
'mimes:pdf,doc,docx'
'image'
'max:2048' // KB

// Database
'unique:table,column'
'exists:table,column'

// Custom
'in:draft,published,archived'
'regex:/^[a-z0-9-]+$/'
'url'
'email'
```

---

## Field Configuration Options

All fields support these options:

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | Field identifier |
| `type` | string | Field type |
| `column_name` | string|null | DB column |
| `validation_rules` | string | Laravel validation |
| `tooltip_text` | string | Help text |
| `default_value` | mixed | Default value |
| `is_system` | bool | System managed |
| `order` | int | Display order |
| `hidden` | bool | Hide from list |
| `disabled` | bool | Read-only |
