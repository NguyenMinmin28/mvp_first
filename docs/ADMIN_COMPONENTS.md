# Admin Components - Hướng dẫn sử dụng

## 📁 Cấu trúc Components

```
src/features/shared/components/
├── admin-header.tsx      # Header admin có thể tái sử dụng
├── admin-layout.tsx      # Layout wrapper cho admin pages
└── mode-toggle.tsx       # Component chuyển đổi theme (đã có sẵn)
```

## 🎯 AdminHeader Component

### Mô tả

Component header admin với sticky positioning, có thể tái sử dụng cho tất cả trang admin.

### Tính năng

- ✅ **Sticky positioning**: Header luôn ở top khi scroll
- ✅ **Backdrop blur**: Hiệu ứng blur background
- ✅ **Responsive design**: Tự động điều chỉnh theo màn hình
- ✅ **Dark mode support**: Hỗ trợ theme sáng/tối
- ✅ **Sign out functionality**: Chức năng đăng xuất tích hợp

### Props

```typescript
interface AdminHeaderProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
}
```

### Sử dụng

```tsx
import { AdminHeader } from "@/features/shared/components/admin-header";

export function MyAdminPage({ user }: { user: User }) {
  return (
    <div>
      <AdminHeader user={user} />
      {/* Your content here */}
    </div>
  );
}
```

### CSS Classes

- `sticky top-0`: Giữ header ở top
- `z-50`: Đảm bảo header luôn trên cùng
- `backdrop-blur-sm`: Hiệu ứng blur
- `bg-opacity-95`: Background semi-transparent

## 🎨 AdminLayout Component

### Mô tả

Component layout wrapper cho admin pages, bao gồm header và page header tùy chọn.

### Tính năng

- ✅ **Header tích hợp**: Tự động include AdminHeader
- ✅ **Page header tùy chọn**: Có thể thêm title và description
- ✅ **Consistent styling**: Giao diện nhất quán cho tất cả admin pages
- ✅ **Responsive container**: Container tự động điều chỉnh
- ✅ **Theme support**: Hỗ trợ dark mode

### Props

```typescript
interface AdminLayoutProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
  children: ReactNode;
  title?: string; // Tùy chọn
  description?: string; // Tùy chọn
}
```

### Sử dụng

#### Cơ bản

```tsx
import { AdminLayout } from "@/features/shared/components/admin-layout";

export function AdminDashboard({ user }: { user: User }) {
  return (
    <AdminLayout user={user}>
      <div>Your dashboard content here</div>
    </AdminLayout>
  );
}
```

#### Với title và description

```tsx
export function AdminUsersPage({ user }: { user: User }) {
  return (
    <AdminLayout
      user={user}
      title="User Management"
      description="Manage user accounts and permissions"
    >
      <div>User management content here</div>
    </AdminLayout>
  );
}
```

### Cấu trúc HTML

```tsx
<main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
  <AdminHeader user={user} />

  {/* Optional Page Header */}
  {(title || description) && (
    <div className="bg-white dark:bg-gray-800 border-b">
      <div className="container mx-auto px-4 py-6">
        {title && <h1>{title}</h1>}
        {description && <p>{description}</p>}
      </div>
    </div>
  )}

  {/* Main Content */}
  <div className="container mx-auto px-4 py-8">{children}</div>
</main>
```

## 🚀 Cách tạo Admin Page mới

### 1. Tạo component page

```tsx
// src/features/(admin)/users/admin-users.tsx
"use client";

import { AdminLayout } from "@/features/shared/components/admin-layout";

interface AdminUsersProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
}

export function AdminUsers({ user }: AdminUsersProps) {
  return (
    <AdminLayout
      user={user}
      title="User Management"
      description="Manage all user accounts in the system"
    >
      {/* Your users management content */}
      <div className="grid gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Users List</h2>
          {/* Users table or list */}
        </div>
      </div>
    </AdminLayout>
  );
}
```

### 2. Tạo page route

```tsx
// src/app/(admin)/admin/users/page.tsx
import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { redirect } from "next/navigation";
import { AdminUsers } from "@/features/(admin)/users/admin-users";

export const metadata: Metadata = {
  title: "User Management | Admin",
  description: "Manage user accounts and permissions",
};

export default async function AdminUsersPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminUsers user={user} />;
}
```

### 3. Cập nhật middleware (nếu cần)

```typescript
// src/middleware.ts
const adminRoutes = ["/admin", "/admin/users", "/admin/settings"];
```

## 🎨 Customization

### 1. Thay đổi theme colors

```tsx
// Trong AdminLayout
<main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
```

### 2. Thay đổi header style

```tsx
// Trong AdminHeader
<header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
```

### 3. Thêm navigation menu

```tsx
// Trong AdminHeader, thêm navigation
<div className="flex items-center gap-6">
  <nav className="hidden md:flex items-center gap-4">
    <Link href="/admin" className="text-gray-700 hover:text-red-600">
      Dashboard
    </Link>
    <Link href="/admin/users" className="text-gray-700 hover:text-red-600">
      Users
    </Link>
    <Link href="/admin/settings" className="text-gray-700 hover:text-red-600">
      Settings
    </Link>
  </nav>
  <ModeToggle />
  <SignOutButton />
</div>
```

## 🔧 Troubleshooting

### 1. Header không sticky

- Kiểm tra CSS classes: `sticky top-0 z-50`
- Đảm bảo parent container không có `overflow: hidden`

### 2. Layout không responsive

- Kiểm tra container classes: `container mx-auto px-4`
- Đảm bảo sử dụng Tailwind responsive classes

### 3. Theme không hoạt động

- Kiểm tra ThemeProvider đã được wrap
- Đảm bảo ModeToggle component hoạt động

## 📱 Responsive Design

### Mobile (< 768px)

- Header compact với icon và text nhỏ
- Container padding giảm: `px-4 py-4`
- Grid layout stack: `grid-cols-1`

### Tablet (768px - 1024px)

- Header với thông tin đầy đủ
- Container padding vừa phải: `px-4 py-6`
- Grid layout 2 cột: `md:grid-cols-2`

### Desktop (> 1024px)

- Header với navigation menu
- Container padding đầy đủ: `px-4 py-8`
- Grid layout 4 cột: `lg:grid-cols-4`

## 🌟 Best Practices

1. **Luôn sử dụng AdminLayout** cho admin pages mới
2. **Tái sử dụng AdminHeader** nếu cần custom layout
3. **Sử dụng consistent spacing** với Tailwind classes
4. **Test responsive** trên nhiều kích thước màn hình
5. **Maintain accessibility** với semantic HTML và ARIA labels
