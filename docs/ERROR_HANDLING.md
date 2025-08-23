# Hệ thống Xử lý Lỗi

Tài liệu này mô tả cách sử dụng hệ thống xử lý lỗi mới trong ứng dụng.

## Tổng quan

Hệ thống xử lý lỗi mới cung cấp:

- Xử lý lỗi nhất quán từ server
- Hiển thị lỗi đẹp mắt trên giao diện
- Hooks tùy chỉnh để xử lý API calls
- Components có thể tái sử dụng để hiển thị lỗi
- Xử lý Google authentication tự động

## Cấu trúc Files

```
src/
├── core/
│   ├── utils/
│   │   └── error-handler.ts      # Utility functions để xử lý lỗi
│   └── hooks/
│       └── use-api.ts            # Custom hooks cho API calls
├── ui/
│   └── components/
│       ├── error-display.tsx      # Component hiển thị lỗi
│       ├── loading-spinner.tsx    # Component loading spinner
│       └── profile-completion-notice.tsx # Thông báo hoàn thành profile
└── app/
    └── api/
        └── auth/
            ├── signup/
            │   └── route.ts       # API đăng ký email
            └── google-signup/
                └── route.ts       # API đăng ký Google
```

## Xử lý Google Authentication

### Yêu cầu đăng ký trước

Khi user đăng nhập bằng Google:

1. Hệ thống kiểm tra xem email đã tồn tại trong database chưa
2. **Nếu chưa có** → Từ chối đăng nhập và yêu cầu đăng ký trước
3. **Nếu đã có** → Cho phép đăng nhập bình thường

### Flow xử lý

```typescript
// Trong auth.config.ts
async signIn({ user, account, profile }) {
  if (account?.provider === "google") {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!existingUser) {
      // Từ chối đăng nhập - user phải đăng ký trước
      return false;
    }
    return true;
  }
  return true;
}
```

### Xử lý lỗi AccessDenied

Khi Google sign in bị từ chối:

1. User được redirect về trang signin
2. Hiển thị thông báo: "This Google account has not been registered. Please register first."
3. Cung cấp link đến trang đăng ký
4. User phải đăng ký trước khi có thể đăng nhập

### Hiển thị lỗi

Hệ thống sử dụng `setServerError` để hiển thị lỗi thay vì toast:

- **serverError**: Lỗi từ Google authentication hoặc các lỗi khác
- **formError**: Lỗi từ form submission (API calls)
- Lỗi được hiển thị bằng `ErrorDisplay` component
- Có thể dismiss lỗi bằng cách click nút X
- Tự động clear lỗi khi user thực hiện action mới

### Error Messages (English)

- **AccessDenied**: "This Google account has not been registered. Please register first."
- **Configuration**: "Authentication configuration error. Please contact admin."
- **Verification**: "Account not verified. Please check your email."
- **Generic**: "An error occurred during authentication. Please try again."

## Sử dụng

### 1. API Route (Server-side)

```typescript
import {
  ApiError,
  ApiResponse,
  handleApiError,
} from "@/core/utils/error-handler";

export async function POST(request: NextRequest) {
  try {
    // Your logic here
    const response: ApiResponse = {
      success: true,
      data: result,
      message: "Success",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const serverError = handleApiError(error);

    const response: ApiResponse = {
      success: false,
      error: serverError.error,
      details: serverError.details,
    };

    return NextResponse.json(response, {
      status: serverError.status || 500,
    });
  }
}
```

### 2. Client Component với Hook

```typescript
import { useFormSubmit } from "@/core/hooks/use-api";
import { ErrorDisplay } from "@/ui/components/error-display";

export default function MyComponent() {
  const { submit, error, isLoading, reset } = useFormSubmit({
    onSuccess: (data) => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    }
  });

  const handleSubmit = async (formData: any) => {
    await submit("/api/endpoint", formData);
  };

  return (
    <div>
      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={() => reset()}
        />
      )}

      <button onClick={() => handleSubmit(data)} disabled={isLoading}>
        {isLoading ? "Loading..." : "Submit"}
      </button>
    </div>
  );
}
```

### 3. Hiển thị Lỗi Field

```typescript
import { FieldError } from "@/ui/components/error-display";

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    {...register("email")}
    className={errors.email ? "border-red-500" : ""}
  />
  <FieldError error={errors.email?.message} />
</div>
```

### 4. Thông báo Hoàn thành Profile

```typescript
import { ProfileCompletionNotice } from "@/ui/components/profile-completion-notice";

<ProfileCompletionNotice
  onCompleteProfile={() => router.push("/complete-profile")}
/>
```

## Components

### ErrorDisplay

Component chính để hiển thị lỗi từ server.

```typescript
<ErrorDisplay
  error="Error message"
  onDismiss={() => setError(null)}
  variant="destructive" // "default" | "destructive" | "warning"
/>
```

### FieldError

Component để hiển thị lỗi validation của từng field.

```typescript
<FieldError error={errors.email?.message} />
```

### LoadingSpinner

Component loading spinner có thể tái sử dụng.

```typescript
<LoadingSpinner size="md" /> // "sm" | "md" | "lg"
```

### ProfileCompletionNotice

Component để thông báo user cần hoàn thành profile.

```typescript
<ProfileCompletionNotice
  onCompleteProfile={() => router.push("/complete-profile")}
/>
```

## Hooks

### useApi

Hook cơ bản để xử lý API calls.

```typescript
const { execute, data, error, isLoading, reset } = useApi({
  onSuccess: (data) => console.log(data),
  onError: (error) => console.error(error),
});

await execute("/api/endpoint", { method: "GET" });
```

### useFormSubmit

Hook chuyên dụng cho form submissions.

```typescript
const { submit, error, isLoading, reset } = useFormSubmit({
  onSuccess: (data) => console.log(data),
});

await submit("/api/endpoint", formData);
```

## Xử lý Lỗi Validation

Hệ thống tự động xử lý lỗi validation từ Zod và hiển thị chúng một cách thân thiện:

```typescript
// Server trả về
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "message": "Name must be at least 2 characters" },
    { "message": "Invalid email address" }
  ]
}

// Client sẽ hiển thị: "Name must be at least 2 characters, Invalid email address"
```

## Google Authentication Flow

### Đăng nhập Google

1. User click "Continue with Google"
2. Google OAuth flow
3. Hệ thống kiểm tra email trong database
4. **Nếu chưa có** → Từ chối đăng nhập, redirect về trang signin
5. **Nếu đã có** → Đăng nhập thành công, redirect về trang chủ

### Thông báo lỗi

Khi tài khoản Google chưa được đăng ký:

- Hiển thị: "This Google account has not been registered. Please register first."
- Cung cấp link: "Go to Sign Up →"
- User phải đăng ký trước khi có thể đăng nhập

### Bảo mật

- Chỉ cho phép đăng nhập với tài khoản đã được đăng ký
- Ngăn chặn việc tạo tài khoản tự động
- Yêu cầu user chủ động đăng ký trước

## Best Practices

1. **Luôn sử dụng try-catch** trong API routes
2. **Sử dụng ApiError class** để tạo lỗi có cấu trúc
3. **Hiển thị lỗi ngay lập tức** khi có lỗi từ server
4. **Reset error state** khi user thực hiện action mới
5. **Sử dụng hooks** thay vì xử lý API calls thủ công
6. **Cung cấp feedback** cho user về trạng thái của request
7. **Yêu cầu đăng ký trước** khi đăng nhập Google để đảm bảo bảo mật
8. **Cung cấp hướng dẫn rõ ràng** khi user gặp lỗi AccessDenied
9. **Sử dụng setServerError** thay vì toast để hiển thị lỗi
10. **Phân biệt rõ ràng** giữa serverError và formError

## Ví dụ Hoàn chỉnh

Xem `src/app/auth/signup/signup-client.tsx` và `src/app/api/auth/signup/route.ts` để có ví dụ hoàn chỉnh về cách sử dụng hệ thống.

## Troubleshooting

### Google Sign In không hoạt động

1. Kiểm tra `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong environment
2. Kiểm tra console logs để xem lỗi cụ thể
3. Đảm bảo Google OAuth được cấu hình đúng trong Google Cloud Console

### User không được tạo tự động

1. Kiểm tra database connection
2. Kiểm tra logs trong `signIn` callback
3. Đảm bảo Prisma schema đúng với database
