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

// Schema validation based on ClientProfile model
const clientProfileSchema = z.object({
  // User basic fields
  name: z.string().min(2, "Name must be at least 2 characters"),

  // ClientProfile fields
  companyName: z.string().optional(),
  location: z.string().min(1, "Please enter your location"),
});

type ClientProfileFormData = z.infer<typeof clientProfileSchema>;

interface ClientProfileFormProps {
  onBack: () => void;
  onSubmit: (data: ClientProfileFormData) => Promise<void>;
  initialData?: Partial<ClientProfileFormData>;
  isLoading?: boolean;
}

// List of popular countries/cities
const locations = [
  "Ho Chi Minh, Vietnam",
  "Hanoi, Vietnam",
  "Da Nang, Vietnam",
  "Can Tho, Vietnam",
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
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error submitting client profile:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50    flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 
              <Building2 className="h-8 w-8 text-blue-600  />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900  mb-2">
            Complete Client Profile
          </h1>
          <p className="text-lg text-gray-600 
            Provide information so we can connect you with suitable developers
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              This information will be displayed to developers when you post
              projects
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
                  Display Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. John Doe"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (optional)</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. ABC Technology Co., Ltd"
                  {...register("companyName")}
                />
                <p className="text-sm text-gray-500 
                  Leave blank if you are an individual recruiter
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={location}
                  onValueChange={(value: string) => setValue("location", value)}
                >
                  <SelectTrigger
                    className={errors.location ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select your location" />
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
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50  border-blue-200 
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 
                <Building2 className="h-5 w-5 text-blue-600  />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900  mb-1">
                  Next you can:
                </h3>
                <ul className="text-sm text-blue-700  space-y-1">
                  <li>• Post your first project</li>
                  <li>• Browse available developers</li>
                  <li>• Set up payment methods</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
