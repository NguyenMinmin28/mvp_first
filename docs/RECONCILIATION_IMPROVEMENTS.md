# PayPal Reconciliation Improvements

## Tổng quan

Đã thực hiện các cải tiến để giải quyết vấn đề trang usage không cập nhật trạng thái và cải thiện khả năng monitoring reconciliation.

## Các thay đổi chính

### 1. Auto-refresh cho trang Usage Transactions

**File:** `src/features/admin/components/usage-transactions-table.tsx`

- Thêm auto-refresh mỗi 30 giây
- Hiển thị thời gian cập nhật cuối cùng
- Nút refresh manual
- Cache busting với timestamp

### 2. Auto-refresh cho trang Cron Runs

**File:** `src/features/admin/components/cron-runs-table.tsx`

- Thêm auto-refresh mỗi 30 giây
- Hiển thị thời gian cập nhật cuối cùng
- Nút refresh manual
- Hiển thị lỗi chi tiết hơn

### 3. Cải thiện Error Handling

**File:** `src/modules/billing/reconciliation.job.ts`

- Thêm detailed error logging
- Tạo cron run record khi có lỗi
- Hiển thị stack trace và error message chi tiết

### 4. Điều chỉnh tần suất Reconciliation

**File:** `src/modules/billing/reconciliation.job.ts`
**File:** `src/app/api/cron/reconcile-subscriptions/route.ts`

- Thay đổi từ 15-60 phút xuống 5 phút
- Cập nhật documentation
- Cron expression: `"0 */5 * * * *"`

### 5. Test Endpoint

**File:** `src/app/api/cron/reconcile-subscriptions/route.ts`

- Thêm test mode cho GET endpoint
- Có thể chạy reconciliation manually
- URL: `/api/cron/reconcile-subscriptions?test=true`

### 6. Admin Dashboard Monitoring

**File:** `src/features/(admin)/dashboard/admin-dashboard.tsx`

- Thêm section System Monitoring
- Nút test reconciliation
- Nút health check
- Hiển thị kết quả real-time

### 7. Test Script

**File:** `scripts/test-reconciliation.ts`

- Script để test reconciliation từ command line
- Chạy: `npm run test:reconciliation`

## Cách sử dụng

### 1. Test Reconciliation từ Admin Dashboard

1. Vào Admin Dashboard
2. Chọn tab "Settings"
3. Trong section "System Monitoring"
4. Click "Test Now" để chạy reconciliation
5. Click "Check Health" để kiểm tra trạng thái hệ thống

### 2. Test từ Command Line

```bash
npm run test:reconciliation
```

### 3. Test từ API

```bash
# Test reconciliation
curl -X GET "http://localhost:3000/api/cron/reconcile-subscriptions?test=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Health check
curl -X GET "http://localhost:3000/api/cron/reconcile-subscriptions"
```

### 4. Monitoring Real-time

- Trang Usage Transactions sẽ tự động refresh mỗi 30 giây
- Trang Cron Runs sẽ hiển thị lỗi chi tiết
- Có thể refresh manual bằng nút "Refresh"

## Cron Job Setup

Để reconciliation chạy tự động mỗi 5 phút, setup cron job:

```bash
# Crontab entry
0 */5 * * * * curl -X POST "https://your-domain.com/api/cron/reconcile-subscriptions" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Troubleshooting

### 1. Reconciliation không chạy

- Kiểm tra CRON_SECRET environment variable
- Kiểm tra logs trong admin dashboard
- Chạy test script để debug

### 2. Usage không cập nhật

- Kiểm tra PayPal webhook events
- Chạy reconciliation manually
- Kiểm tra subscription status trong database

### 3. Lỗi chi tiết

- Vào trang Cron Runs để xem lỗi chi tiết
- Click "View Error Details" để xem stack trace
- Kiểm tra logs trong console

## Monitoring

### Metrics quan trọng

- **Processed:** Số subscription được xử lý
- **Updated:** Số subscription được cập nhật
- **Errors:** Số lỗi xảy ra
- **Recent Webhooks:** Số webhook gần đây
- **Failed Webhooks:** Số webhook thất bại

### Health Check Status

- **Healthy:** Tất cả hệ thống hoạt động bình thường
- **Degraded:** Có một số vấn đề nhỏ
- **Unhealthy:** Có vấn đề nghiêm trọng

## Lưu ý

- Reconciliation chạy mỗi 5 phút có thể tăng load lên PayPal API
- Đảm bảo rate limiting phù hợp
- Monitor logs để phát hiện vấn đề sớm
- Backup database trước khi thay đổi lớn
