"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Badge } from "@/ui/components/badge";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import {
  CheckCircle,
  Phone,
  Shield,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

interface WhatsAppTabProps {
  profileData: any;
  isEditing: boolean;
  isLoading: boolean;
  showOtpInput: boolean;
  otpCode: string;
  isVerifyingOtp: boolean;
  onInputChange: (field: string, value: string | number | boolean | string[]) => void;
  onOtpCodeChange: (value: string) => void;
  onWhatsAppVerification: () => void;
  onWhatsAppConfirm: (otp: string) => void;
  onCancelOtp: () => void;
}

export default function WhatsAppTab({
  profileData,
  isEditing,
  isLoading,
  showOtpInput,
  otpCode,
  isVerifyingOtp,
  onInputChange,
  onOtpCodeChange,
  onWhatsAppVerification,
  onWhatsAppConfirm,
  onCancelOtp,
}: WhatsAppTabProps) {
  return (
    <div className="space-y-6">
      {/* Main WhatsApp Card */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">
                WhatsApp Verification
              </CardTitle>
              <p className="text-green-100 text-sm mt-1">
                Verify your WhatsApp number for seamless client communication
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* WhatsApp Number Input Section */}
          <div className="space-y-3">
            <Label
              htmlFor="whatsappNumber"
              className="text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <Phone className="h-4 w-4 text-green-600" />
              WhatsApp Number
            </Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  id="whatsappNumber"
                  value={profileData.whatsappNumber || ""}
                  onChange={(e) =>
                    onInputChange("whatsappNumber", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="+1234567890"
                  className="pl-10 h-12 text-base border-2 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              {isEditing && (
                <Button
                  onClick={onWhatsAppVerification}
                  variant="outline"
                  disabled={isLoading || !profileData.whatsappNumber}
                  className="h-12 px-6 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Send Code
                    </span>
                  )}
                </Button>
              )}
            </div>

            {/* Verification Status Badge */}
            {profileData.whatsappVerified && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <Badge
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Verified
                </Badge>
                <span className="text-sm font-medium text-green-800">
                  WhatsApp number verified successfully!
                </span>
              </div>
            )}
          </div>

          {/* OTP Verification Input */}
          {showOtpInput && (
            <div className="p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 shadow-inner">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-600" />
                <Label
                  htmlFor="otpCode"
                  className="text-base font-semibold text-blue-900"
                >
                  Enter Verification Code
                </Label>
              </div>
              <div className="flex gap-3 mb-3">
                <Input
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => onOtpCodeChange(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="flex-1 h-12 text-center text-lg font-mono tracking-widest border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <Button
                  onClick={() => onWhatsAppConfirm(otpCode)}
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
                >
                  {isVerifyingOtp ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Verify
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={onCancelOtp}
                  className="h-12 px-6 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Enter the 6-digit code sent to your WhatsApp number
              </p>
            </div>
          )}

          {/* WhatsApp Verification Status */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-600" />
              Verification Status
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  WhatsApp Number:
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {profileData.whatsappNumber || (
                    <span className="text-gray-500 italic">Not set</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Verification Status:
                </span>
                <Badge
                  variant={
                    profileData.whatsappVerified ? "default" : "secondary"
                  }
                  className={
                    profileData.whatsappVerified
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-500 hover:bg-gray-600"
                  }
                >
                  {profileData.whatsappVerified ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Not Verified
                    </span>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
