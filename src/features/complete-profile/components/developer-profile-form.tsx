"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Badge } from "@/ui/components/badge";
import {
  Code2,
  User,
  Briefcase,
  ArrowLeft,
  Plus,
  X,
  Linkedin,
  ExternalLink,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

// Schema validation dựa theo DeveloperProfile model
const developerProfileSchema = z.object({
  // User basic fields
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),

  // DeveloperProfile fields
  bio: z
    .string()
    .min(10, "Bio phải có ít nhất 10 ký tự")
    .max(500, "Bio không được quá 500 ký tự"),
  experienceYears: z
    .number()
    .min(0, "Số năm kinh nghiệm không thể âm")
    .max(50, "Số năm kinh nghiệm quá lớn"),
  level: z.enum(["FRESHER", "MID", "EXPERT"]),
  linkedinUrl: z
    .string()
    .url("LinkedIn URL không hợp lệ")
    .optional()
    .or(z.literal("")),
  portfolioLinks: z
    .array(z.string().url("Portfolio URL không hợp lệ"))
    .optional(),
  whatsappNumber: z.string().optional(),

  // Skills sẽ được handle riêng vì cần liên kết với Skill model
  skillsInput: z
    .array(
      z.object({
        name: z.string().min(1, "Tên skill không được trống"),
        years: z.number().min(0, "Số năm kinh nghiệm không thể âm").max(50),
        rating: z.number().min(1, "Rating từ 1-5").max(5, "Rating từ 1-5"),
      })
    )
    .min(1, "Phải có ít nhất 1 skill"),
});

type DeveloperProfileFormData = z.infer<typeof developerProfileSchema>;

interface DeveloperProfileFormProps {
  onBack: () => void;
  onSubmit: (data: DeveloperProfileFormData) => Promise<void>;
  initialData?: Partial<DeveloperProfileFormData>;
  isLoading?: boolean;
}

const levelOptions = [
  {
    value: "FRESHER",
    label: "Fresher (0-2 năm)",
    description: "Mới tốt nghiệp hoặc ít kinh nghiệm",
  },
  {
    value: "MID",
    label: "Mid-level (2-5 năm)",
    description: "Có kinh nghiệm và tự tin với công việc",
  },
  {
    value: "EXPERT",
    label: "Expert (5+ năm)",
    description: "Chuyên gia với kinh nghiệm sâu",
  },
];

const popularSkills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Django",
  "FastAPI",
  "Java",
  "Spring Boot",
  "PHP",
  "Laravel",
  "C#",
  ".NET",
  "Go",
  "Rust",
  "Vue.js",
  "Angular",
  "Flutter",
  "React Native",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "AWS",
  "Docker",
  "Kubernetes",
  "Git",
];

export default function DeveloperProfileForm({
  onBack,
  onSubmit,
  initialData,
  isLoading = false,
}: DeveloperProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<DeveloperProfileFormData>({
    resolver: zodResolver(developerProfileSchema),
    defaultValues: {
      skillsInput: [{ name: "", years: 0, rating: 1 }],
      portfolioLinks: [""],
      ...initialData,
    },
    mode: "onChange",
  });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: "skillsInput",
  });

  const {
    fields: portfolioFields,
    append: appendPortfolio,
    remove: removePortfolio,
  } = useFieldArray({
    control,
    name: "portfolioLinks",
  });

  const level = watch("level");

  const handleFormSubmit = async (data: DeveloperProfileFormData) => {
    if (isSubmitting || isLoading) return;

    setIsSubmitting(true);
    try {
      // Filter out empty portfolio links
      const cleanedData = {
        ...data,
        portfolioLinks:
          data.portfolioLinks?.filter((link) => link.trim() !== "") || [],
      };

      await onSubmit(cleanedData);
      toast.success("Hồ sơ đã được cập nhật thành công!");
    } catch (error) {
      console.error("Error submitting developer profile:", error);
      toast.error("Có lỗi xảy ra khi cập nhật hồ sơ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPopularSkill = (skillName: string) => {
    const currentSkills = watch("skillsInput") || [];
    if (!currentSkills.some((skill: any) => skill.name === skillName)) {
      appendSkill({ name: skillName, years: 1, rating: 3 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <Code2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Hoàn thiện hồ sơ Developer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Tạo hồ sơ chuyên nghiệp để thu hút các client tiềm năng
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp (tùy chọn)</Label>
                  <Input
                    id="whatsappNumber"
                    placeholder="VD: +84901234567"
                    {...register("whatsappNumber")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">
                  Giới thiệu bản thân <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Mô tả ngắn gọn về bản thân, kinh nghiệm và sở thích..."
                  className={`min-h-[100px] ${errors.bio ? "border-red-500" : ""}`}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  {watch("bio")?.length || 0}/500 ký tự
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Experience & Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Kinh nghiệm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">
                    Số năm kinh nghiệm <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min="0"
                    max="50"
                    placeholder="VD: 3"
                    {...register("experienceYears", { valueAsNumber: true })}
                    className={errors.experienceYears ? "border-red-500" : ""}
                  />
                  {errors.experienceYears && (
                    <p className="text-sm text-red-500">
                      {errors.experienceYears.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Cấp độ <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={level}
                    onValueChange={(value: string) =>
                      setValue("level", value as any)
                    }
                  >
                    <SelectTrigger
                      className={errors.level ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Chọn cấp độ của bạn" />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500">
                              {option.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.level && (
                    <p className="text-sm text-red-500">
                      {errors.level.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>
                Kỹ năng <span className="text-red-500">*</span>
              </CardTitle>
              <CardDescription>
                Thêm các kỹ năng và đánh giá mức độ thành thạo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Popular Skills */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Kỹ năng phổ biến:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {popularSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950"
                      onClick={() => addPopularSkill(skill)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skills List */}
              <div className="space-y-3">
                {skillFields.map((field: any, index: number) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-end"
                  >
                    <div className="col-span-5">
                      <Label className="text-sm">Tên kỹ năng</Label>
                      <Input
                        placeholder="VD: React"
                        {...register(`skillsInput.${index}.name`)}
                        className={
                          errors.skillsInput?.[index]?.name
                            ? "border-red-500"
                            : ""
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-sm">Kinh nghiệm (năm)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        {...register(`skillsInput.${index}.years`, {
                          valueAsNumber: true,
                        })}
                        className={
                          errors.skillsInput?.[index]?.years
                            ? "border-red-500"
                            : ""
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-sm">Rating (1-5)</Label>
                      <Select
                        value={watch(`skillsInput.${index}.rating`)?.toString()}
                        onValueChange={(value: string) =>
                          setValue(
                            `skillsInput.${index}.rating`,
                            parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} ⭐
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      {skillFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSkill(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => appendSkill({ name: "", years: 0, rating: 1 })}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm kỹ năng
              </Button>

              {errors.skillsInput && (
                <p className="text-sm text-red-500">
                  {errors.skillsInput.message ||
                    "Vui lòng điền đầy đủ thông tin kỹ năng"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ExternalLink className="mr-2 h-5 w-5" />
                Liên kết
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">
                  <Linkedin className="inline mr-1 h-4 w-4" />
                  LinkedIn URL
                </Label>
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/your-profile"
                  {...register("linkedinUrl")}
                  className={errors.linkedinUrl ? "border-red-500" : ""}
                />
                {errors.linkedinUrl && (
                  <p className="text-sm text-red-500">
                    {errors.linkedinUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Portfolio Links</Label>
                {portfolioFields.map((field: any, index: number) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="https://your-portfolio.com"
                      {...register(`portfolioLinks.${index}`)}
                      className="flex-1"
                    />
                    {portfolioFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePortfolio(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendPortfolio("")}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm portfolio link
                </Button>
              </div>
            </CardContent>
          </Card>

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

        {/* Info Card */}
        <Card className="mt-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Code2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Sau khi hoàn tất:
                </h3>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• Hồ sơ sẽ được gửi đến admin để phê duyệt</li>
                  <li>• Bạn có thể cập nhật thông tin bất cứ lúc nào</li>
                  <li>• Thiết lập trạng thái online/offline</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
