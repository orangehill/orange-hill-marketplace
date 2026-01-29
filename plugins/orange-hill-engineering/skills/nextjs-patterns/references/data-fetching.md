# Next.js Data Fetching Patterns

Detailed patterns for data fetching in Next.js App Router.

## Fetch API Extensions

Next.js extends the native fetch API:

```tsx
// Cached by default (like getStaticProps)
const data = await fetch('https://api.example.com/data');

// No caching (like getServerSideProps)
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});

// Time-based revalidation (ISR)
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }, // Revalidate every 60 seconds
});
```

## Parallel Data Fetching

Avoid waterfalls by fetching in parallel:

```tsx
// ❌ BAD: Waterfall
async function Page() {
  const user = await getUser();           // Wait...
  const posts = await getPosts(user.id);  // Then wait...
  const comments = await getComments();   // Then wait...
}

// ✅ GOOD: Parallel
async function Page() {
  const [user, posts, comments] = await Promise.all([
    getUser(),
    getPosts(),
    getComments(),
  ]);
}
```

## Sequential When Necessary

Some data depends on previous results:

```tsx
async function Page({ params }: { params: { id: string } }) {
  // First fetch user (needed for authorization)
  const user = await getUser(params.id);

  // Then fetch their private data
  const privateData = await getPrivateData(user.id, user.permissions);

  return <Profile user={user} data={privateData} />;
}
```

## Preloading Data

Preload data before it's needed:

```tsx
// lib/data.ts
import { cache } from 'react';

export const preload = (id: string) => {
  void getItem(id);
};

export const getItem = cache(async (id: string) => {
  // Expensive operation
  return db.item.findUnique({ where: { id } });
});
```

```tsx
// app/item/[id]/page.tsx
import { preload, getItem } from '@/lib/data';

export default async function Page({ params }: { params: { id: string } }) {
  // Start fetching early
  preload(params.id);

  // Do other work...
  const otherData = await getOtherData();

  // Data likely already fetched
  const item = await getItem(params.id);

  return <ItemView item={item} other={otherData} />;
}
```

## React Cache for Deduplication

Use React's cache for request deduplication:

```tsx
import { cache } from 'react';

// Deduplicated across components in single request
export const getUser = cache(async (id: string) => {
  const response = await fetch(`https://api.example.com/users/${id}`);
  return response.json();
});
```

```tsx
// Multiple components can call getUser(id)
// Only one request is made

async function UserProfile({ userId }) {
  const user = await getUser(userId); // Deduped
  return <Profile user={user} />;
}

async function UserPosts({ userId }) {
  const user = await getUser(userId); // Same cache
  return <Posts authorId={user.id} />;
}
```

## Tag-Based Revalidation

Use tags for granular cache control:

```tsx
// Fetch with tags
async function getPosts() {
  const response = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] },
  });
  return response.json();
}

async function getPost(id: string) {
  const response = await fetch(`https://api.example.com/posts/${id}`, {
    next: { tags: ['posts', `post-${id}`] },
  });
  return response.json();
}
```

```tsx
// Revalidate specific post
import { revalidateTag } from 'next/cache';

export async function updatePost(id: string, data: PostData) {
  await db.post.update({ where: { id }, data });

  // Revalidate this post and the list
  revalidateTag(`post-${id}`);
  revalidateTag('posts');
}
```

## Path-Based Revalidation

Revalidate entire pages:

```tsx
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  await db.post.create({ ... });

  // Revalidate the posts page
  revalidatePath('/posts');

  // Revalidate with layout
  revalidatePath('/posts', 'layout');

  // Revalidate everything
  revalidatePath('/', 'layout');
}
```

## Streaming with Suspense

Stream data as it becomes available:

```tsx
import { Suspense } from 'react';

export default async function Page() {
  // This data loads fast
  const header = await getHeader();

  return (
    <div>
      <Header data={header} />

      {/* Slow data streams in */}
      <Suspense fallback={<LoadingRecommendations />}>
        <Recommendations />
      </Suspense>

      {/* Even slower data */}
      <Suspense fallback={<LoadingAnalytics />}>
        <Analytics />
      </Suspense>
    </div>
  );
}

async function Recommendations() {
  const data = await getSlowRecommendations();
  return <RecommendationList data={data} />;
}
```

## Database Queries

Direct database access in Server Components:

```tsx
import { db } from '@/lib/db';

async function PostList() {
  const posts = await db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { author: true },
  });

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title} by {post.author.name}</li>
      ))}
    </ul>
  );
}
```

## External API with Error Handling

```tsx
async function getExternalData() {
  try {
    const response = await fetch('https://api.external.com/data', {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch external data:', error);
    // Return fallback or throw to trigger error boundary
    return { data: [], error: true };
  }
}
```

## Route Segment Config

Configure caching at the route level:

```tsx
// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Force static rendering
export const dynamic = 'force-static';

// Revalidate interval
export const revalidate = 60;

// Runtime
export const runtime = 'edge'; // or 'nodejs'
```
