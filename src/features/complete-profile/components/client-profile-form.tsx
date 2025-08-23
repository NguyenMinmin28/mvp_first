"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Building2, MapPin, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// Schema validation dựa theo ClientProfile model
const clientProfileSchema = z.object({
  // User basic fields
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),

  // ClientProfile fields
  companyName: z.string().optional(),
  location: z.string().min(1, "Vui lòng nhập địa điểm"),
});

type ClientProfileFormData = z.infer<typeof clientProfileSchema>;

interface ClientProfileFormProps {
  onBack: () => void;
  onSubmit: (data: ClientProfileFormData) => Promise<void>;
  initialData?: Partial<ClientProfileFormData>;
  isLoading?: boolean;
}

// Danh sách các quốc gia/thành phố phổ biến
const locations = [
  "Hồ Chí Minh, Việt Nam",
  "Hà Nội, Việt Nam",
  "Đà Nẵng, Việt Nam",
  "Cần Thơ, Việt Nam",
  "Singapore",
  "Bangkok, Thailand",
  "Manila, Philippines",
  "Jakarta, Indonesia",
  "Kuala Lumpur, Malaysia",
  "Remote",
];

export default function ClientProfileForm({
  onBack,
  onSubmit,
  initialData,
  isLoading = false,
}: ClientProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ClientProfileFormData>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: initialData,
    mode: "onChange",
  });

  const location = watch("location");

  const handleFormSubmit = async (data: ClientProfileFormData) => {
    if (isSubmitting || isLoading) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success("Hồ sơ đã được cập nhật thành công!");
    } catch (error) {
      console.error("Error submitting client profile:", error);
      toast.error("Có lỗi xảy ra khi cập nhật hồ sơ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Hoàn thiện hồ sơ Client
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Cung cấp thông tin để chúng tôi có thể kết nối bạn với những
            developer phù hợp
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Thông tin cá nhân
            </CardTitle>
            <CardDescription>
              Thông tin này sẽ hiển thị cho các developer khi bạn đăng dự án
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-6"
            >
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tên hiển thị <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="VD: Nguyễn Văn A"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Tên công ty (tùy chọn)</Label>
                <Input
                  id="companyName"
                  placeholder="VD: ABC Technology Co., Ltd"
                  {...register("companyName")}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Để trống nếu bạn là cá nhân tuyển dụng
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  Địa điểm <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={location}
                  onValueChange={(value: string) => setValue("location", value)}
                >
                  <SelectTrigger
                    className={errors.location ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Chọn địa điểm của bạn" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" />
                          {loc}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location && (
                  <p className="text-sm text-red-500">
                    {errors.location.message}
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting || isLoading}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting || isLoading}
                  className="flex-1"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Hoàn tất hồ sơ"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Tiếp theo bạn có thể:
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Đăng dự án đầu tiên của bạn</li>
                  <li>• Duyệt qua danh sách developer có sẵn</li>
                  <li>• Thiết lập phương thức thanh toán</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
