# Blog Setup & Usage Guide

## Overview

The blog system has been implemented with a complete feature set including:

- **Blog Home Page** (`/blog`) - Featured posts, grid layout, filters, and sidebar
- **Individual Post Pages** (`/blog/[slug]`) - Full post content with related posts
- **API Routes** - For fetching posts, tracking views/clicks, and managing data
- **Database Schema** - Complete Prisma models for posts, categories, authors, and comments
- **SEO Optimization** - Meta tags, OpenGraph, and structured data
- **Analytics** - View and click tracking with spam protection

## Features Implemented

### ✅ Completed Features

- [x] **Hero Featured Post** - Large featured post with category, title, excerpt, date, region, and author
- [x] **Post Grid** - Responsive grid layout with post cards
- [x] **CTA Card** - Sign up/sign in card positioned in the middle of the grid
- [x] **Popular Posts Sidebar** - Top posts based on views and clicks (7-day rolling)
- [x] **Pagination** - Load more functionality with infinite scroll
- [x] **Filters** - Category and search filtering
- [x] **Post Detail Pages** - Full post content with author info, read time, and views
- [x] **Related Posts** - Suggestions based on category and tags
- [x] **View/Click Tracking** - Analytics with rate limiting (12-hour cooldown)
- [x] **SEO** - Meta tags, OpenGraph, Twitter Cards, canonical URLs
- [x] **Responsive Design** - Mobile-first approach with Tailwind CSS
- [x] **Loading States** - Skeleton loaders and loading indicators

### 🔄 Future Enhancements

- [ ] **Comments System** - User comments with moderation
- [ ] **Admin CMS** - Post management interface
- [ ] **RSS/Atom Feeds** - Content syndication
- [ ] **Sitemap Generation** - XML sitemap for SEO
- [ ] **Advanced Analytics** - Detailed insights and reporting
- [ ] **Email Newsletters** - Subscriber management
- [ ] **Social Sharing** - Enhanced sharing capabilities

## Database Schema

### Models

```prisma
model Post {
  id          String     @id @default(auto()) @map("_id") @db.ObjectId
  slug        String     @unique
  title       String
  excerpt     String?
  content     String
  coverUrl    String?
  status      PostStatus @default(DRAFT)
  type        PostType   @default(ARTICLE)
  categoryId  String?    @db.ObjectId
  tags        String[]
  authorId    String     @db.ObjectId
  views       Int        @default(0)
  clicks      Int        @default(0)
  isFeatured  Boolean    @default(false)
  publishedAt DateTime?
  region      String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Category {
  id          String @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  slug        String @unique
  description String?
  color       String?
}

model Author {
  id        String @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  avatar    String?
  bio       String?
  userId    String? @db.ObjectId
}

model Comment {
  id        String @id @default(auto()) @map("_id") @db.ObjectId
  content   String
  authorId  String @db.ObjectId
  postId    String @db.ObjectId
  parentId  String? @db.ObjectId
  status    ModerationStatus @default(published)
}
```

## Setup Instructions

### 1. Database Migration

```bash
# Generate Prisma client
pnpm prisma:generate

# Push schema changes to database
pnpm prisma:push
```

### 2. Seed Sample Data

```bash
# Run the blog seeding script
pnpm seed:blog
```

This will create:
- 4 categories (Web Development, Mobile Development, AI & ML, Career Advice)
- 3 authors with sample bios and avatars
- 4 sample blog posts with different types and categories

### 3. Environment Variables

Ensure these environment variables are set:

```env
DATABASE_URL="your-mongodb-connection-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## API Endpoints

### Blog Posts

- `GET /api/blog/posts` - List posts with pagination and filtering
- `GET /api/blog/posts/[slug]` - Get individual post with related posts
- `GET /api/blog/popular` - Get popular posts based on views/clicks
- `GET /api/blog/categories` - Get all categories with post counts

### Analytics

- `POST /api/blog/track/view` - Track post view (rate limited)
- `POST /api/blog/track/click` - Track post click

### Query Parameters

#### Posts API
- `page` - Page number (default: 1)
- `limit` - Posts per page (default: 12)
- `category` - Filter by category slug
- `search` - Search in title, excerpt, and content
- `featured` - Filter featured posts only

#### Popular Posts API
- `days` - Rolling period in days (default: 7)
- `limit` - Number of posts to return (default: 10)

## Component Structure

```
src/features/blog/components/
├── blog-hero.tsx           # Featured post hero section
├── post-card.tsx           # Individual post card
├── popular-posts-sidebar.tsx # Popular posts sidebar
├── blog-filters.tsx        # Search and category filters
├── cta-card.tsx            # Call-to-action card
├── blog-page-client.tsx    # Blog home page client component
├── blog-post-client.tsx    # Individual post page client component
├── related-posts.tsx       # Related posts section
└── index.ts                # Component exports
```

## Usage Examples

### Adding a New Blog Post

1. **Create the post in the database:**
```typescript
const post = await prisma.post.create({
  data: {
    slug: 'my-new-post',
    title: 'My New Post Title',
    excerpt: 'Brief description of the post',
    content: '<h1>Post content in HTML</h1>',
    coverUrl: 'https://example.com/image.jpg',
    status: 'PUBLISHED',
    categoryId: 'category-id',
    tags: ['tag1', 'tag2'],
    authorId: 'author-id',
    publishedAt: new Date(),
    region: 'Global'
  }
});
```

2. **The post will automatically appear on:**
   - Blog home page (if featured)
   - Category pages
   - Search results
   - Related posts suggestions

### Customizing the Design

The blog uses Tailwind CSS classes and can be customized by:

1. **Modifying component styles** in the component files
2. **Updating color schemes** in the Tailwind config
3. **Adjusting layout** by modifying grid classes and spacing

### Adding New Features

To extend the blog system:

1. **Create new components** in `src/features/blog/components/`
2. **Add new API routes** in `src/app/api/blog/`
3. **Update the database schema** if needed
4. **Add new pages** in `src/app/(user)/blog/`

## Performance Features

- **Image Optimization** - Next.js Image component with lazy loading
- **Incremental Static Regeneration** - Fast page loads with fresh content
- **Debounced Analytics** - Efficient view/click tracking
- **Responsive Images** - Optimized for different screen sizes
- **Skeleton Loading** - Smooth loading experience

## SEO Features

- **Meta Tags** - Dynamic title and description
- **OpenGraph** - Social media sharing optimization
- **Twitter Cards** - Twitter-specific meta tags
- **Canonical URLs** - Prevent duplicate content issues
- **Structured Data** - Article schema markup
- **Clean URLs** - SEO-friendly slug-based routing

## Analytics & Tracking

### View Tracking
- Tracks unique views per post
- 12-hour cooldown per IP/cookie
- Spam protection with rate limiting

### Click Tracking
- Tracks when users click "Read more"
- Used for popularity calculations
- No rate limiting (less critical)

### Popularity Algorithm
```
Popularity Score = (views × 0.7) + (clicks × 0.3)
```

## Troubleshooting

### Common Issues

1. **Posts not appearing**
   - Check post status is 'PUBLISHED'
   - Ensure publishedAt date is in the past
   - Verify category and author exist

2. **Images not loading**
   - Check coverUrl is valid
   - Ensure image domain is allowed in Next.js config
   - Verify image format is supported

3. **API errors**
   - Check database connection
   - Verify Prisma client is generated
   - Check environment variables

### Debug Commands

```bash
# Check database connection
pnpm prisma studio

# Reset database (development only)
pnpm prisma db push --force-reset

# Regenerate Prisma client
pnpm prisma:generate
```

## Contributing

When adding new features to the blog:

1. **Follow the existing component patterns**
2. **Add proper TypeScript interfaces**
3. **Include loading states and error handling**
4. **Update this documentation**
5. **Test on different screen sizes**

## Support

For questions or issues with the blog system:

1. Check this documentation first
2. Review the component code examples
3. Check the database schema
4. Verify API endpoints are working
5. Check browser console for errors
