# Admin Panel Setup Guide

## Tổng quan

Admin panel được tạo riêng biệt với giao diện người dùng thông thường, sử dụng API login email hiện có nhưng với kiểm tra quyền admin.

## Cấu trúc thư mục

```
src/app/(admin)/
├── admin/
│   ├── login/
│   │   ├── page.tsx          # Trang login admin
│   │   └── admin-login-client.tsx  # Component client cho login
│   ├── page.tsx              # Trang dashboard admin
│   └── admin-dashboard.tsx   # Component dashboard
└── layout.tsx                 # Layout riêng cho admin
```

## Tính năng

### 1. Trang Login Admin (`/admin/login`)

- Giao diện đăng nhập riêng cho admin
- Sử dụng API login email hiện có
- Kiểm tra quyền admin sau khi đăng nhập
- Redirect tự động nếu đã đăng nhập

### 2. Trang Dashboard Admin (`/admin`)

- Hiển thị thống kê hệ thống
- Quản lý thông tin admin
- Các action nhanh (User Management, System Settings, Analytics, Logs)
- Hiển thị trạng thái hệ thống

### 3. Bảo mật

- Middleware kiểm tra quyền admin
- Chỉ user có role `ADMIN` mới có thể truy cập
- Redirect tự động nếu không có quyền

## Setup

### 1. Tạo tài khoản admin

Chạy script để tạo tài khoản admin đầu tiên:

```bash
pnpm create:admin
```

Hoặc chạy trực tiếp:

```bash
tsx scripts/create-admin.ts
```

**Thông tin mặc định:**

- Email: `admin@example.com`
- Password: `admin123`

**Tùy chỉnh thông tin admin:**

```bash
ADMIN_EMAIL=your-admin@example.com ADMIN_PASSWORD=your-password pnpm create:admin
```

### 2. Cập nhật database

Đảm bảo database đã được sync với schema:

```bash
pnpm prisma:push
```

### 3. Khởi động ứng dụng

```bash
pnpm dev
```

## Sử dụng

### 1. Truy cập admin panel

- URL: `http://localhost:3000/admin`
- Nếu chưa đăng nhập: tự động redirect đến `/admin/login`
- Nếu không có quyền admin: redirect về trang chủ

### 2. Đăng nhập admin

- Truy cập: `http://localhost:3000/admin/login`
- Sử dụng email và password admin đã tạo
- Sau khi đăng nhập thành công: tự động chuyển đến dashboard

### 3. Dashboard admin

- **Stats Grid**: Hiển thị thống kê hệ thống
- **Quick Actions**: Các action nhanh (có thể mở rộng)
- **Admin Profile**: Thông tin tài khoản admin
- **System Status**: Trạng thái hệ thống

## Bảo mật

### 1. Middleware Protection

```typescript
// Kiểm tra quyền admin cho tất cả route /admin/*
if (isAdminRoute) {
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
```

### 2. Server-side Protection

```typescript
// Kiểm tra trong page component
if (user.role !== "ADMIN") {
  redirect("/");
}
```

### 3. Role-based Access Control

- Chỉ user có `role: "ADMIN"` mới có thể truy cập
- Tự động redirect nếu không có quyền
- Session được kiểm tra ở cả client và server

## Tùy chỉnh

### 1. Thêm action mới

Chỉnh sửa `quickActions` trong `admin-dashboard.tsx`:

```typescript
const quickActions = [
  // ... existing actions
  {
    title: "New Action",
    description: "Description of new action",
    icon: NewIcon,
    color: "blue",
    href: "/admin/new-action",
  },
];
```

### 2. Thêm stat mới

Chỉnh sửa `adminStats` trong `admin-dashboard.tsx`:

```typescript
const adminStats = [
  // ... existing stats
  {
    title: "New Stat",
    value: "123",
    change: "+5%",
    changeType: "positive",
    icon: NewIcon,
    color: "blue",
  },
];
```

### 3. Thay đổi giao diện

- Sửa đổi CSS classes trong components
- Thay đổi icons từ `lucide-react`
- Cập nhật layout và spacing

## Troubleshooting

### 1. Không thể đăng nhập admin

- Kiểm tra tài khoản admin đã được tạo chưa
- Kiểm tra role trong database có đúng `ADMIN` không
- Kiểm tra console log để debug

### 2. Không thể truy cập dashboard

- Kiểm tra middleware configuration
- Kiểm tra session và token
- Kiểm tra role trong JWT token

### 3. Lỗi database

- Chạy `pnpm prisma:generate` để update client
- Kiểm tra database connection
- Kiểm tra schema validation

## Mở rộng

### 1. Thêm trang admin mới

```typescript
// src/app/(admin)/admin/users/page.tsx
export default function UsersPage() {
  // User management page
}
```

### 2. Thêm API endpoint admin

```typescript
// src/app/api/admin/users/route.ts
export async function GET() {
  // Admin-only API endpoint
}
```

### 3. Thêm middleware admin

```typescript
// src/middleware.ts
// Thêm route mới vào adminRoutes
const adminRoutes = ["/admin", "/admin/users", "/admin/settings"];
```

## Lưu ý

- Admin panel sử dụng theme riêng (red/orange) để phân biệt với user panel
- Tất cả API calls đều sử dụng NextAuth session
- Role checking được thực hiện ở nhiều layer để đảm bảo bảo mật
- Có thể mở rộng thêm các tính năng quản trị khác
