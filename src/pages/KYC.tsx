import { useState, useEffect } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  FileText,
  Camera,
  Loader2,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface FormData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  idType: string;
  idNumber: string;
  idFront: File | null;
  idBack: File | null;
  selfie: File | null;
}

const KYC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    dateOfBirth: "",
    nationality: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
    idType: "passport",
    idNumber: "",
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [previews, setPreviews] = useState<{
    idFront: string | null;
    idBack: string | null;
    selfie: string | null;
  }>({
    idFront: null,
    idBack: null,
    selfie: null,
  });

  const uploadFile = async (file: File, path: string): Promise<string> => {
    console.log("[KYC Upload] Starting upload:", {
      fileName: file.name,
      size: file.size,
      path,
    });
    const fileExt = file.name.split(".").pop();
    const fileName = `${path}.${fileExt}`;
    const filePath = `kyc/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("kyc-documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("[KYC Upload] Upload FAILED:", uploadError);
      throw uploadError;
    }
    console.log("[KYC Upload] Upload successful:", filePath);

    const { data } = supabase.storage
      .from("kyc-documents")
      .getPublicUrl(filePath);

    console.log("[KYC Upload] Public URL generated:", data.publicUrl);
    return data.publicUrl;
  };

  const handleFileUpload = (field: keyof FormData, file: File | null) => {
    // Clean up previous preview URL if exists
    const previewKey = field as keyof typeof previews;
    if (previews[previewKey]) {
      URL.revokeObjectURL(previews[previewKey]!);
    }

    // Create new preview URL if file is selected
    const previewUrl = file ? URL.createObjectURL(file) : null;

    setFormData({ ...formData, [field]: file });
    setPreviews({ ...previews, [previewKey]: previewUrl });
  };

  // Cleanup preview URLs on component unmount
  useEffect(() => {
    return () => {
      if (previews.idFront) URL.revokeObjectURL(previews.idFront);
      if (previews.idBack) URL.revokeObjectURL(previews.idBack);
      if (previews.selfie) URL.revokeObjectURL(previews.selfie);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      console.log("[KYC] Starting submission for user:", user.id);

      // 1. Upload Documents
      console.log("[KYC] Step 1: Uploading documents...");
      const idFrontUrl = formData.idFront
        ? await uploadFile(
            formData.idFront,
            `${user.id}/id_front_${Date.now()}`
          )
        : "";
      console.log(
        "[KYC] ID Front uploaded:",
        idFrontUrl ? "SUCCESS" : "SKIPPED"
      );

      const idBackUrl = formData.idBack
        ? await uploadFile(formData.idBack, `${user.id}/id_back_${Date.now()}`)
        : "";
      console.log("[KYC] ID Back uploaded:", idBackUrl ? "SUCCESS" : "SKIPPED");

      const selfieUrl = formData.selfie
        ? await uploadFile(formData.selfie, `${user.id}/selfie_${Date.now()}`)
        : "";
      console.log("[KYC] Selfie uploaded:", selfieUrl ? "SUCCESS" : "SKIPPED");

      // 2. Create KYC Submission Record
      console.log("[KYC] Step 2: Creating submission record...");
      const { error: submissionError } = await supabase
        .from("kyc_submissions")
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth,
          nationality: formData.nationality,
          address_line: formData.address,
          city: formData.city,
          zip_code: formData.zipCode,
          country: formData.country,
          id_type: formData.idType,
          id_number: formData.idNumber,
          id_front_url: idFrontUrl,
          id_back_url: idBackUrl,
          selfie_url: selfieUrl,
          status: "pending",
        });

      if (submissionError) {
        console.error(
          "[KYC] Submission record creation FAILED:",
          submissionError
        );
        throw submissionError;
      }
      console.log("[KYC] Submission record created successfully");

      // 3. Update User Profile Status (Best effort)
      console.log("[KYC] Step 3: Updating user profile status...");
      try {
        const { error: profileError } = await supabase
          .from("users")
          .update({ kyc_status: "pending" })
          .eq("id", user.id);

        if (profileError) {
          console.warn(
            "[KYC] Failed to update user profile status, but submission was successful:",
            profileError
          );
          // We don't throw here because the submission record is created
        } else {
          console.log("[KYC] User profile status updated successfully");
        }
      } catch (updateError) {
        console.warn("[KYC] Error updating user profile status:", updateError);
      }

      // 4. Update Local State
      console.log("[KYC] Step 4: Updating local state...");
      useAuthStore.getState().setUser({
        ...user,
        kycStatus: "pending",
      });

      setIsSuccess(true);
      console.log("[KYC] Submission completed successfully!");
      toast.success("KYC Submitted Successfully", {
        description: "Your documents are under review.",
      });
    } catch (error: unknown) {
      console.error("[KYC] Submission Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorObj = error as {
        code?: string;
        details?: string;
        hint?: string;
      };
      console.error("[KYC] Error details:", {
        message: errorMessage,
        code: errorObj?.code,
        details: errorObj?.details,
        hint: errorObj?.hint,
      });
      toast.error("Submission Failed", {
        description: errorMessage || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      console.log("[KYC] Submission process ended");
    }
  };

  // Check if user already has pending or verified status
  if (
    user?.kycStatus === "pending" ||
    user?.kycStatus === "verified" ||
    isSuccess
  ) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-500">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
            user?.kycStatus === "verified"
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-yellow-100 dark:bg-yellow-900/30"
          }`}
        >
          {user?.kycStatus === "verified" ? (
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          ) : (
            <Loader2 className="w-12 h-12 text-yellow-600 dark:text-yellow-400 animate-spin" />
          )}
        </div>
        <h2 className="text-3xl font-bold mb-4">
          {user?.kycStatus === "verified"
            ? "Account Verified! 🎉"
            : "Submission Received!"}
        </h2>
        <p className="text-muted-foreground max-w-md mb-8">
          {user?.kycStatus === "verified"
            ? "Your identity has been verified. You now have full access to all trading features."
            : "Your KYC documents have been securely transmitted to our compliance team. We usually process applications within 24-48 hours."}
        </p>
        <div className="bg-muted/50 p-4 rounded-xl max-w-sm w-full mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <span
              className={`text-sm font-medium flex items-center gap-1 ${
                user?.kycStatus === "verified"
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {user?.kycStatus === "verified" ? (
                <>
                  <CheckCircle className="w-3 h-3" /> Verified
                </>
              ) : (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Pending Review
                </>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Reference ID</span>
            <span className="text-sm font-mono">{user?.id.slice(0, 8)}...</span>
          </div>
        </div>
        <Button onClick={() => navigate("/")} className="min-w-[200px]">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <User className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Personal Information</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your personal details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <div className="mt-1">
                  <DatePicker
                    value={formData.dateOfBirth}
                    onChange={(date) =>
                      setFormData({ ...formData, dateOfBirth: date })
                    }
                    placeholder="Select your date of birth"
                  />
                </div>
              </div>
              <div>
                <Label>Nationality</Label>
                <Input
                  value={formData.nationality}
                  onChange={(e) =>
                    setFormData({ ...formData, nationality: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <MapPin className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Address Information</h3>
                <p className="text-sm text-muted-foreground">
                  Provide your residential address
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Street Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>ZIP Code</Label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <FileText className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Document Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your identification documents
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>ID Type</Label>
                <select
                  value={formData.idType}
                  onChange={(e) =>
                    setFormData({ ...formData, idType: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl"
                >
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="national_id">National ID Card</option>
                </select>
              </div>

              <div>
                <Label>ID Number</Label>
                <Input
                  value={formData.idNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, idNumber: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>ID Front</Label>
                  <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload("idFront", e.target.files?.[0] || null)
                      }
                      className="hidden"
                      id="id-front"
                    />
                    {previews.idFront ? (
                      <label
                        htmlFor="id-front"
                        className="cursor-pointer block"
                      >
                        <img
                          src={previews.idFront}
                          alt="ID Front Preview"
                          className="w-full h-48 object-contain rounded-lg mb-2"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleFileUpload("idFront", null);
                            const input = document.getElementById(
                              "id-front"
                            ) as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 z-10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-sm text-muted-foreground mt-2">
                          {formData.idFront?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click to change image
                        </p>
                      </label>
                    ) : (
                      <label htmlFor="id-front" className="cursor-pointer">
                        <Upload
                          className="mx-auto mb-2 text-muted-foreground"
                          size={32}
                        />
                        <p className="text-sm text-muted-foreground">
                          Upload front side
                        </p>
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>ID Back</Label>
                  <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload("idBack", e.target.files?.[0] || null)
                      }
                      className="hidden"
                      id="id-back"
                    />
                    {previews.idBack ? (
                      <label htmlFor="id-back" className="cursor-pointer block">
                        <img
                          src={previews.idBack}
                          alt="ID Back Preview"
                          className="w-full h-48 object-contain rounded-lg mb-2"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleFileUpload("idBack", null);
                            const input = document.getElementById(
                              "id-back"
                            ) as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 z-10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-sm text-muted-foreground mt-2">
                          {formData.idBack?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click to change image
                        </p>
                      </label>
                    ) : (
                      <label htmlFor="id-back" className="cursor-pointer">
                        <Upload
                          className="mx-auto mb-2 text-muted-foreground"
                          size={32}
                        />
                        <p className="text-sm text-muted-foreground">
                          Upload back side
                        </p>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Camera className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Selfie Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Take a selfie holding your ID
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer relative group">
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) =>
                  handleFileUpload("selfie", e.target.files?.[0] || null)
                }
                className="hidden"
                id="selfie"
              />
              {previews.selfie ? (
                <label htmlFor="selfie" className="cursor-pointer block">
                  <img
                    src={previews.selfie}
                    alt="Selfie Preview"
                    className="w-full max-w-md mx-auto h-64 object-contain rounded-lg mb-4"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleFileUpload("selfie", null);
                      const input = document.getElementById(
                        "selfie"
                      ) as HTMLInputElement;
                      if (input) input.value = "";
                    }}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-sm text-muted-foreground">
                    {formData.selfie?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to change image
                  </p>
                </label>
              ) : (
                <label htmlFor="selfie" className="cursor-pointer">
                  <Camera
                    className="mx-auto mb-4 text-muted-foreground"
                    size={48}
                  />
                  <p className="text-lg font-medium mb-2">
                    Take or upload selfie
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Make sure your face and ID are clearly visible
                  </p>
                </label>
              )}
            </div>

            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tips for a good selfie:</strong>
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                <li>Ensure good lighting</li>
                <li>Hold your ID next to your face</li>
                <li>Make sure all details are readable</li>
                <li>Remove sunglasses or hats</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return (
          formData.fullName && formData.dateOfBirth && formData.nationality
        );
      case 2:
        return (
          formData.address &&
          formData.city &&
          formData.zipCode &&
          formData.country
        );
      case 3:
        return formData.idNumber && formData.idFront && formData.idBack;
      case 4:
        return formData.selfie;
      default:
        return false;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          KYC Verification
        </h1>
        <p className="text-muted-foreground">
          Complete your identity verification to unlock full trading features
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                  step >= s
                    ? "bg-primary text-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle size={20} /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                    step > s ? "bg-primary" : "bg-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Personal</span>
          <span>Address</span>
          <span>Documents</span>
          <span>Selfie</span>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 rounded-xl border-border">
        <form onSubmit={handleSubmit}>
          {renderStep()}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1 || isSubmitting}
              className="rounded-xl"
            >
              Previous
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-primary text-foreground hover:bg-primary/90 rounded-xl"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!canProceed() || isSubmitting}
                className="bg-primary text-foreground hover:bg-primary/90 rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Verification"
                )}
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 p-6 rounded-xl border-border bg-muted/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-primary shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-semibold mb-1">Why do we need this?</h4>
            <p className="text-sm text-muted-foreground">
              KYC verification is required by law to prevent fraud, money
              laundering, and to ensure the security of our platform. Your
              information is encrypted and stored securely.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default KYC;
