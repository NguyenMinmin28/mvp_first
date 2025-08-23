# WhatsApp Authentication Guide

## 🎯 Tổng Quan

Ứng dụng đã được tích hợp chức năng đăng nhập bằng WhatsApp, cho phép người dùng xác thực thông qua số điện thoại và verification code. Trang chủ (/) giờ đây là trang private, chỉ hiển thị sau khi đăng nhập thành công.

## 🚀 Tính Năng

### ✅ Đã Hoàn Thành

- **Dual Authentication**: Hỗ trợ cả WhatsApp và Google
- **Phone Number Verification**: Xác thực qua SMS
- **Tab Navigation**: Chuyển đổi giữa các phương thức đăng nhập
- **Responsive UI**: Giao diện đẹp mắt và dễ sử dụng
- **Error Handling**: Xử lý lỗi thân thiện với người dùng
- **Session Management**: Quản lý phiên đăng nhập an toàn
- **Private Homepage**: Trang chủ chỉ hiển thị cho user đã đăng nhập
- **User Dashboard**: Hiển thị thông tin user và profile

### ✅ Mới Cập Nhật

- **WhatsApp Business API Integration**: Tích hợp thực tế với WhatsApp Business API
- **OTP Database Storage**: Lưu trữ và quản lý verification codes trong database
- **Rate Limiting**: Giới hạn số lần request OTP để tránh spam
- **Error Handling**: Xử lý lỗi chuyên nghiệp cho mọi trường hợp
- **Webhook Support**: Nhận và xử lý updates từ WhatsApp
- **Production Ready**: Sẵn sàng cho production với fallback strategies

## 📱 Cách Sử Dụng

### 1. **Demo Mode (Hiện tại)**

```
1. Truy cập /auth/signin
2. Chọn tab "WhatsApp"
3. Nhập số điện thoại (tối thiểu 10 số)
4. Click "Send Verification Code"
5. Nhập code: 123456
6. Click "Verify & Sign In"
7. Đăng nhập thành công → Redirect đến trang chủ (/)
8. Hiển thị thông tin user và dashboard
```

### 2. **Production Mode (Tương lai)**

```
1. Nhập số điện thoại
2. Hệ thống gửi SMS verification code thực tế
3. Người dùng nhập code từ SMS
4. Xác thực và đăng nhập
5. Hiển thị dashboard với thông tin thực tế
```

## 🏗️ Kiến Trúc Hệ Thống

### **Protected Routes**

```
/ (trang chủ) - Yêu cầu đăng nhập
/auth/signin - Trang đăng nhập công khai
```

### **Components**

```
src/features/auth/
├── components/
│   ├── whatsapp-signin.tsx      # Form đăng nhập WhatsApp
│   └── auth-buttons.tsx        # Nút đăng nhập Google
├── whatsapp-provider.ts         # Custom NextAuth provider
└── auth-server.ts               # Server-side auth utilities
```

### **API Routes**

```
src/app/api/auth/
└── whatsapp/
    └── route.ts                 # Endpoint gửi verification code
```

### **Pages**

```
src/app/
├── page.tsx                     # Trang chủ private (dashboard)
└── auth/
    └── signin/
        ├── page.tsx            # Server component với metadata
        └── signin-client.tsx   # Client component với tabs
```

## 🚀 Setup WhatsApp Business API

### **1. Tạo Facebook Business Account**

1. Truy cập [Facebook Business Manager](https://business.facebook.com/)
2. Tạo hoặc chọn Business Account
3. Thêm WhatsApp Business Product

### **2. Thiết Lập WhatsApp Business API**

1. Trong [Meta Developers Console](https://developers.facebook.com/):
   - Tạo app mới (Business type)
   - Thêm WhatsApp product
   - Cấu hình số điện thoại business

2. Lấy credentials cần thiết:
   - **Access Token**: Từ App Dashboard
   - **Phone Number ID**: Từ WhatsApp Settings
   - **Business Account ID**: Từ Business Settings
   - **Webhook Verify Token**: Tự tạo random string

### **3. Cấu Hình Webhook**

1. URL: `https://your-domain.com/api/webhooks/whatsapp`
2. Verify Token: Giá trị bạn set trong env
3. Subscribe to: `messages`

### **4. Message Templates**

Tạo template cho verification code:

```json
{
  "name": "verification_code",
  "language": "en_US",
  "category": "AUTHENTICATION",
  "components": [
    {
      "type": "BODY",
      "text": "Your verification code is: {{1}}. This code expires in 5 minutes."
    }
  ]
}
```

## ⚙️ Cấu Hình

### **Environment Variables**

```bash
# Database
DATABASE_URL=mongodb://localhost:27017/my-app

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token

# Public
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **NextAuth Config**

```typescript
// config/auth.config.ts
export default {
  providers: [
    GoogleProvider({...}),
    CredentialsProvider({
      id: "whatsapp",
      name: "WhatsApp",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        verificationCode: { label: "Verification Code", type: "text" }
      },
      async authorize(credentials) {
        // Xác thực logic
      }
    })
  ]
}
```

## 🔒 Bảo Mật

### **Hiện Tại**

- JWT-based authentication
- Middleware route protection cho trang chủ
- Input validation
- Error handling
- Private homepage chỉ cho authenticated users

### **Kế Hoạch**

- Rate limiting cho API calls
- Phone number validation chặt chẽ
- 2FA support
- Device tracking
- Session timeout

## 🧪 Testing

### **Manual Testing**

```bash
# 1. Cài đặt dependencies
pnpm install

# 2. Tạo .env file từ .env.example
cp .env.example .env

# 3. Cấu hình database
pnpm prisma:generate
pnpm prisma:push

# 4. Chạy ứng dụng
pnpm dev

# 5. Test WhatsApp authentication flow
# 6. Cleanup expired OTPs (maintenance)
pnpm cleanup:otps
```

### **Test Cases**

- [ ] Truy cập trang chủ khi chưa đăng nhập → Redirect đến signin
- [ ] Nhập số điện thoại hợp lệ
- [ ] Nhập số điện thoại không hợp lệ
- [ ] Gửi verification code
- [ ] Nhập code đúng (123456)
- [ ] Nhập code sai
- [ ] Chuyển đổi giữa tabs
- [ ] Redirect sau khi đăng nhập → Trang chủ private
- [ ] Hiển thị thông tin user trên trang chủ
- [ ] Sign out hoạt động đúng

## 🐛 Troubleshooting

### **Lỗi Thường Gặp**

#### 1. **"use client" directive error**

```
Error: You are attempting to export "metadata" from a component marked with "use client"
```

**Giải pháp**: Tách metadata ra khỏi client component

#### 2. **Build fails với ESLint errors**

```
Error: Unexpected any. Specify a different type.
```

**Giải pháp**: Sửa các type annotations và loại bỏ unused variables

#### 3. **Authentication không hoạt động**

```
Error: Invalid credentials
```

**Giải pháp**: Kiểm tra cấu hình NextAuth và environment variables

#### 4. **Trang chủ không hiển thị thông tin user**

```
Error: Property 'phoneNumber' does not exist
```

**Giải pháp**: Cập nhật type trong auth-server.ts để bao gồm phoneNumber

### **Debug Steps**

1. Kiểm tra console logs
2. Kiểm tra Network tab trong DevTools
3. Kiểm tra NextAuth configuration
4. Kiểm tra middleware logs
5. Kiểm tra session data

## 📚 Tài Liệu Tham Khảo

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)
- [React Server Components](https://nextjs.org/docs/getting-started/react-essentials)

## 🤝 Đóng Góp

Để cải thiện chức năng WhatsApp Authentication:

1. Fork repository
2. Tạo feature branch
3. Implement changes
4. Test thoroughly
5. Submit pull request

## 📄 License

Dự án này được cấp phép theo MIT License.
