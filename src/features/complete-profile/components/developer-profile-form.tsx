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

// Schema validation based on DeveloperProfile model
const developerProfileSchema = z.object({
  // User basic fields
  name: z.string().min(2, "Name must be at least 2 characters"),

  // DeveloperProfile fields
  bio: z
    .string()
    .min(10, "Bio must be at least 10 characters")
    .max(500, "Bio cannot exceed 500 characters"),
  experienceYears: z
    .number()
    .min(0, "Years of experience cannot be negative")
    .max(50, "Years of experience too high"),
  level: z.enum(["FRESHER", "MID", "EXPERT"]),
  linkedinUrl: z
    .string()
    .url("Invalid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  portfolioLinks: z.array(z.string()).default([]),
  whatsappNumber: z.string().optional(),

  // Skills will be handled separately as they need to link to Skill model
  skillsInput: z
    .array(
      z.object({
        name: z.string().min(1, "Skill name cannot be empty"),
        years: z
          .number()
          .min(0, "Years of experience cannot be negative")
          .max(50),
        rating: z.number().min(1, "Rating from 1-5").max(5, "Rating from 1-5"),
      })
    )
    .min(1, "Must have at least 1 skill"),
});

type DeveloperProfileFormData = z.infer<typeof developerProfileSchema> & {
  portfolioLinks?: string[];
};

interface DeveloperProfileFormProps {
  onBack: () => void;
  onSubmit: (data: DeveloperProfileFormData) => Promise<void>;
  initialData?: Partial<DeveloperProfileFormData>;
  isLoading?: boolean;
}

const levelOptions = [
  {
    value: "FRESHER",
    label: "Fresher (0-2 years)",
    description: "Recently graduated or little experience",
  },
  {
    value: "MID",
    label: "Mid-level (2-5 years)",
    description: "Experienced and confident with work",
  },
  {
    value: "EXPERT",
    label: "Expert (5+ years)",
    description: "Specialist with deep experience",
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
  } = useForm({
    resolver: zodResolver(developerProfileSchema),
    defaultValues: {
      skillsInput: [{ name: "", years: 0, rating: 1 }],
      portfolioLinks: [],
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
    name: "portfolioLinks" as any,
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
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error submitting developer profile:", error);
      toast.error("An error occurred while updating profile");
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
            Complete Developer Profile
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Create a professional profile to attract potential clients
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Display Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. John Doe"
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
                  <Label htmlFor="whatsappNumber">WhatsApp (optional)</Label>
                  <Input
                    id="whatsappNumber"
                    placeholder="e.g. +84901234567"
                    {...register("whatsappNumber")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">
                  Self Introduction <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Brief description about yourself, experience and interests..."
                  className={`min-h-[100px] ${errors.bio ? "border-red-500" : ""}`}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  {watch("bio")?.length || 0}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Experience & Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">
                    Years of Experience <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min="0"
                    max="50"
                    placeholder="e.g. 3"
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
                    Level <span className="text-red-500">*</span>
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
                      <SelectValue placeholder="Select your level" />
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
                Skills <span className="text-red-500">*</span>
              </CardTitle>
              <CardDescription>
                Add skills and rate your proficiency level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Popular Skills */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Popular skills:
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
                      <Label className="text-sm">Skill name</Label>
                      <Input
                        placeholder="e.g. React"
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
                  Add portfolio link
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
              Back
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || isLoading}
              className="flex-1"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                "Complete Profile"
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
                  After completion:
                </h3>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• Profile will be sent to admin for approval</li>
                  <li>• You can update information anytime</li>
                  <li>• Set online/offline status</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
