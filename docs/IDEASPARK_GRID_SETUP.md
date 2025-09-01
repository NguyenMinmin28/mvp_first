# IdeaSpark Grid Component Setup

## Overview

The IdeaSpark Grid component is a comprehensive display component for showcasing ideas in a grid format, similar to popular content platforms. It includes:

- **Navigation Categories**: 9 main categories with icons and colors
- **Content Grid**: 2x3 grid layout for displaying ideas
- **Interaction Features**: Like, bookmark, share, and view buttons
- **Responsive Design**: Mobile-first approach with responsive grid
- **Real-time Updates**: Live interaction counts and user states

## Features

### Navigation Categories
1. **Post Idea** - For submitting new ideas
2. **Trending** - Popular and trending ideas
3. **Graphics & Design** - Visual design concepts
4. **Programming & Tech** - Software and technology ideas
5. **Digital Marketing** - Marketing and promotion concepts
6. **Video & Animation** - Multimedia content ideas
7. **Writing & Translation** - Content creation ideas
8. **Music & Audio** - Audio and music projects
9. **Business** - Business and entrepreneurship ideas

### Interaction Features
- **Like/Unlike**: Toggle like status with real-time count updates
- **Bookmark**: Save ideas for later viewing
- **Share**: Native sharing or clipboard copy
- **View**: Navigate to detailed idea view

## Component Structure

```
src/features/ideas/components/
├── ideaspark-grid.tsx          # Main grid component
├── ideaspark-hero.tsx          # Hero section
└── index.ts                    # Component exports
```

## API Endpoints

### Required Endpoints
- `GET /api/ideas` - Fetch approved ideas
- `POST /api/ideas/[id]/like` - Toggle like status
- `POST /api/ideas/[id]/bookmark` - Toggle bookmark status

### API Response Format
```typescript
interface Idea {
  id: string;
  title: string;
  summary: string;
  cover?: {
    id: string;
    storageKey: string;
  };
  author: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
  createdAt: string;
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Database Setup
Ensure your database is running and migrations are applied:
```bash
pnpm prisma generate
pnpm prisma db push
```

### 3. Seed Sample Data
Run the seeding script to create sample ideas:
```bash
npx tsx scripts/seed-ideas.ts
```

### 4. Environment Variables
Ensure these environment variables are set:
```env
DATABASE_URL="your_mongodb_connection_string"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Run Development Server
```bash
pnpm dev
```

## Usage

### Basic Implementation
```tsx
import { IdeaSparkGrid } from "@/features/ideas/components";

export default function IdeasPage() {
  return (
    <div>
      <h1>IdeaSpark</h1>
      <IdeaSparkGrid />
    </div>
  );
}
```

### With Initial Data
```tsx
import { IdeaSparkGrid } from "@/features/ideas/components";

export default function IdeasPage({ ideas }) {
  return <IdeaSparkGrid initialIdeas={ideas} />;
}
```

## Customization

### Styling
The component uses Tailwind CSS classes and can be customized by:
- Modifying the `categories` array for different navigation options
- Updating color schemes in the category definitions
- Adjusting grid layout classes for different column counts

### Functionality
- Modify interaction handlers for custom behavior
- Add new API endpoints for additional features
- Implement custom sharing mechanisms

## Default Images

The component includes fallback images for ideas without covers:
- `/images/spark/ed-sheeran.jpg`
- `/images/spark/colorful-burst.jpg`
- `/images/spark/autumn-variations.jpg`
- `/images/spark/astronaut.jpg`
- `/images/spark/idea-bubble.jpg`
- `/images/spark/abstract-paint.jpg`

## Troubleshooting

### Common Issues

1. **No Ideas Displayed**
   - Check if ideas exist in the database
   - Verify API endpoint is working
   - Check browser console for errors

2. **Interaction Buttons Not Working**
   - Ensure user is authenticated
   - Check API endpoint implementations
   - Verify database connections

3. **Images Not Loading**
   - Check if default images exist in public folder
   - Verify file storage configuration
   - Check image paths in component

### Debug Mode
Enable debug logging by adding console.log statements in the component or checking browser developer tools.

## Performance Considerations

- **Pagination**: Implement cursor-based pagination for large datasets
- **Image Optimization**: Use Next.js Image component for automatic optimization
- **Caching**: Implement client-side caching for user interactions
- **Lazy Loading**: Consider lazy loading for images below the fold

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live interaction updates
- **Advanced Filtering**: Category-based filtering and search
- **User Preferences**: Personalized content recommendations
- **Analytics**: Track user engagement and popular content
- **Moderation**: Admin tools for content moderation
