# Migration Guide: Tách Trạng Thái Developer

## Tổng quan

Trước đây, hệ thống sử dụng 1 field `currentStatus` với enum `PresenceStatus` để lưu cả 4 trạng thái:
- `available` / `not_available` (trạng thái nhận dự án)
- `online` / `offline` (trạng thái tài khoản)

Điều này không đúng với nghiệp vụ vì 2 loại trạng thái này độc lập với nhau.

## Thay đổi

### Schema mới

Đã tách thành 2 enum và 2 field riêng biệt:

1. **AccountStatus** (trạng thái tài khoản):
   - `online` - Đã đăng nhập
   - `offline` - Đã đăng xuất
   - Field: `accountStatus` (default: `offline`)

2. **AvailabilityStatus** (trạng thái nhận dự án):
   - `available` - Sẵn sàng nhận dự án
   - `not_available` - Không sẵn sàng nhận dự án
   - Field: `availabilityStatus` (default: `available`)

### Backward Compatibility

Field `currentStatus` vẫn được giữ lại (đánh dấu DEPRECATED) để đảm bảo backward compatibility trong quá trình migration. Sau khi migration hoàn tất, có thể xóa field này.

## Các bước Migration

### 1. Chạy Prisma Migration

```bash
# Generate Prisma client với schema mới
npx prisma generate

# Tạo migration (nếu cần)
npx prisma migrate dev --name split_status_fields
```

### 2. Chạy Migration Script

```bash
# Chạy script để migrate dữ liệu từ currentStatus sang 2 field mới
npx tsx scripts/migrate-status-split.ts
```

Script này sẽ:
- Đọc tất cả developer profiles
- Phân tích `currentStatus` hiện tại
- Gán vào `accountStatus` hoặc `availabilityStatus` tương ứng
- Logic:
  - Nếu `currentStatus` là `online`/`offline` → gán vào `accountStatus`, `availabilityStatus` = `available` (default)
  - Nếu `currentStatus` là `available`/`not_available` → gán vào `availabilityStatus`, `accountStatus` = `offline` (default)

### 3. Cập nhật Code

Các file đã được cập nhật:

#### DeveloperStatusService
- `updateAccountStatus()` - Cập nhật trạng thái tài khoản (online/offline)
- `updateAvailabilityStatus()` - Cập nhật trạng thái nhận dự án (available/not_available)
- `setDeveloperOnline()` / `setDeveloperOffline()` - Cho login/logout
- `setDeveloperAvailable()` / `setDeveloperNotAvailable()` - Cho việc nhận dự án
- `updateDeveloperStatus()` - DEPRECATED, vẫn hoạt động để backward compatibility

#### Rotation Services
- Tất cả queries đã được cập nhật để dùng `availabilityStatus` thay vì `currentStatus`
- Chỉ developers có `availabilityStatus = "available"` mới được thêm vào batch

#### Manual Invite Route
- Kiểm tra `availabilityStatus` trước khi thêm developer vào batch

## Sử dụng mới

### Cập nhật trạng thái tài khoản (login/logout)

```typescript
// Khi user login
await DeveloperStatusService.setDeveloperOnline(userId);

// Khi user logout
await DeveloperStatusService.setDeveloperOffline(userId);

// Hoặc dùng method trực tiếp
await DeveloperStatusService.updateAccountStatus(userId, "online");
```

### Cập nhật trạng thái nhận dự án

```typescript
// Developer sẵn sàng nhận dự án
await DeveloperStatusService.setDeveloperAvailable(userId);

// Developer không sẵn sàng nhận dự án
await DeveloperStatusService.setDeveloperNotAvailable(userId);

// Hoặc dùng method trực tiếp
await DeveloperStatusService.updateAvailabilityStatus(userId, "available");
```

### Query developers

```typescript
// Tìm developers sẵn sàng nhận dự án
const availableDevs = await prisma.developerProfile.findMany({
  where: {
    availabilityStatus: "available",
    adminApprovalStatus: "approved",
  }
});

// Tìm developers đang online
const onlineDevs = await prisma.developerProfile.findMany({
  where: {
    accountStatus: "online",
  }
});
```

## Lưu ý

1. **Backward Compatibility**: Code cũ vẫn hoạt động vì `updateDeveloperStatus()` vẫn được giữ lại
2. **Migration Script**: Chạy script migration trước khi deploy code mới
3. **Index**: Đã thêm index cho `accountStatus` và `availabilityStatus` để tối ưu query
4. **Activity Log**: Vẫn ghi log với `status` field (enum `PresenceStatus`) để backward compatibility

## Sau khi Migration hoàn tất

Sau khi đã migrate tất cả dữ liệu và code đã được cập nhật:

1. Có thể xóa field `currentStatus` khỏi schema
2. Có thể xóa enum `PresenceStatus` nếu không còn được sử dụng
3. Có thể xóa method `updateDeveloperStatus()` nếu không còn cần thiết

