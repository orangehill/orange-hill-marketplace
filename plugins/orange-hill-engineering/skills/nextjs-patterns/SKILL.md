---
name: nextjs-patterns
description: This skill provides patterns and best practices for Next.js 14+ App Router development. It should be used when implementing Next.js features, structuring applications, or troubleshooting App Router issues.
---

# Next.js Patterns Skill

This skill provides comprehensive guidance for Next.js 14+ App Router development patterns.

## Overview

Next.js App Router represents a paradigm shift in React application development, introducing Server Components, Server Actions, and a new file-system based routing approach.

For detailed data fetching patterns, see [data-fetching.md](./references/data-fetching.md).

---

## Core Concepts

### Server Components (Default)

All components are Server Components by default:

```tsx
// app/page.tsx - Server Component (default)
async function Page() {
  const data = await fetchData(); // Direct server-side fetch
  return <div>{data.title}</div>;
}
```

### Client Components

Add `'use client'` only when needed:

```tsx
'use client'

import { useState } from 'react';

// Client Component - for interactivity
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### When to Use Each

| Server Component | Client Component |
|-----------------|------------------|
| Fetch data | Event handlers (onClick) |
| Access backend resources | useState, useEffect |
| Keep sensitive info server-side | Browser APIs |
| Reduce client bundle | Real-time updates |
| SEO-critical content | User interactions |

---

## Routing Patterns

### File-System Routing

```
app/
├── page.tsx                 # /
├── about/
│   └── page.tsx             # /about
├── blog/
│   ├── page.tsx             # /blog
│   └── [slug]/
│       └── page.tsx         # /blog/[slug]
├── (marketing)/             # Route group (no URL segment)
│   ├── pricing/
│   │   └── page.tsx         # /pricing
│   └── features/
│       └── page.tsx         # /features
└── @modal/                  # Parallel route
    └── login/
        └── page.tsx         # Modal slot
```

### Special Files

| File | Purpose |
|------|---------|
| `page.tsx` | Route UI |
| `layout.tsx` | Shared layout |
| `loading.tsx` | Loading state |
| `error.tsx` | Error boundary |
| `not-found.tsx` | 404 page |
| `route.ts` | API endpoint |

### Dynamic Routes

```tsx
// app/blog/[slug]/page.tsx
interface Props {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BlogPost({ params, searchParams }: Props) {
  const post = await getPost(params.slug);
  return <Article post={post} />;
}

// Generate static paths
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}
```

---

## Data Patterns

### Server-Side Data Fetching

```tsx
// app/dashboard/page.tsx
async function Dashboard() {
  // Fetch in parallel
  const [user, posts, notifications] = await Promise.all([
    getUser(),
    getPosts(),
    getNotifications(),
  ]);

  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
      <NotificationBell count={notifications.length} />
    </div>
  );
}
```

### Caching Strategies

```tsx
// Default: cached
const data = await fetch('https://api.example.com/data');

// No cache
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});

// Revalidate every hour
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 },
});

// Tag-based revalidation
const data = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
});

// Revalidate by tag
import { revalidateTag } from 'next/cache';
revalidateTag('posts');
```

### Server Actions

```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await db.post.create({ data: { title, content } });

  revalidatePath('/posts');
}
```

```tsx
// app/posts/new/page.tsx
import { createPost } from '../actions';

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## Component Patterns

### Composition Pattern

```tsx
// Compose Server and Client Components
async function Page() {
  const data = await fetchData(); // Server

  return (
    <div>
      <ServerHeader data={data} />
      <InteractiveSection initialData={data} /> {/* Client */}
    </div>
  );
}
```

### Streaming Pattern

```tsx
import { Suspense } from 'react';

async function Page() {
  return (
    <div>
      <Header /> {/* Immediate */}
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile /> {/* Streams when ready */}
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <PostList /> {/* Streams independently */}
      </Suspense>
    </div>
  );
}
```

### Error Boundary

```tsx
// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

---

## Authentication Pattern

```tsx
// lib/auth.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  return verifyToken(token);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}
```

```tsx
// app/dashboard/page.tsx
import { requireAuth } from '@/lib/auth';

export default async function Dashboard() {
  const session = await requireAuth();

  return <div>Welcome, {session.user.name}</div>;
}
```

---

## Metadata Pattern

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}
```

---

## Best Practices

### Do's

- ✅ Use Server Components by default
- ✅ Fetch data in parallel with Promise.all
- ✅ Use Suspense for streaming
- ✅ Implement proper loading/error states
- ✅ Use Server Actions for mutations
- ✅ Keep Client Components small and focused

### Don'ts

- ❌ Add 'use client' unnecessarily
- ❌ Fetch data in Client Components when Server works
- ❌ Create waterfall fetches
- ❌ Forget error boundaries
- ❌ Use useEffect for data that can be server-fetched

---

## Related Agents

- `nextjs-reviewer` - Code review
- `nextjs-async-reviewer` - Async patterns
- `tailwind-reviewer` - Styling review
