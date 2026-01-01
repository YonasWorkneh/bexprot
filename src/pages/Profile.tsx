import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, RefreshCw, Upload, Camera } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTradingStore } from "@/store/tradingStore";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const user = useAuthStore((state) => state.user);
  const { isDemo, toggleDemoMode, resetDemoAccount, demoBalance } = useTradingStore();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.preferences?.phone || "");
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalTrades, setTotalTrades] = useState(0);

  // Fetch total trades count
  useEffect(() => {
    const fetchTotalTrades = async () => {
      if (!user?.id) return;

      try {
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (!error && count !== null) {
          setTotalTrades(count);
        }
      } catch (error) {
        console.error('Error fetching total trades:', error);
      }
    };

    fetchTotalTrades();
  }, [user?.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (JPG, PNG, GIF)');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setUploading(true);
      toast.loading('Uploading profile picture...');

      // Create unique file name with user ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Store directly in the bucket root or a folder if configured

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting if filename collision (unlikely with timestamp)
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload file');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(updateError.message || 'Failed to update profile');
      }

      // Update local state
      setAvatarUrl(publicUrl);
      useAuthStore.setState({
        user: { ...user!, avatarUrl: publicUrl }
      });

      toast.dismiss();
      toast.success('Profile picture updated successfully! 🎉');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      toast.loading("Updating profile...");

      // Create new preferences object
      const currentPreferences = user.preferences || {};
      const newPreferences = {
        ...currentPreferences,
        phone: phone
      };

      // Update using store action which handles both DB and local state
      const { updatePreferences } = useAuthStore.getState();
      const result = await updatePreferences(newPreferences);

      if (!result.success) {
        toast.dismiss();
        throw new Error(result.error || "Failed to update preferences");
      }

      // Also update name if changed
      if (name !== user.name) {
        const { error } = await supabase
          .from('users')
          .update({ name })
          .eq('id', user.id);
          
        if (error) {
          toast.dismiss();
          throw error;
        }
        
        // Update local user state for name
        useAuthStore.setState({
            user: { ...user, name, preferences: newPreferences }
        });
      }

      // Update email if changed (via Supabase Auth)
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });

        if (emailError) {
          toast.dismiss();
          throw emailError;
        }

        // Update email in users table and local state
        const { error } = await supabase
          .from('users')
          .update({ email })
          .eq('id', user.id);

        if (error) {
          toast.dismiss();
          throw error;
        }

        useAuthStore.setState({
          user: { ...user, name, email, preferences: newPreferences }
        });

        toast.dismiss();
        toast.success("Profile updated! Please check your new email to confirm the change.");
        return;
      }

      toast.dismiss();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.dismiss();
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleResetDemo = () => {
    if (confirm("Are you sure you want to reset your demo account? This will clear all demo trades and reset balance to $100,000.")) {
      resetDemoAccount();
      toast.success("Demo account reset successfully");
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : "January 2024";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <div className="max-w-2xl">


        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-20 h-20 group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-secondary rounded-xl flex items-center justify-center text-3xl font-bold">
                  <User size={40} className="text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="text-white" size={24} />
              </div>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="border-border mb-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </>
                )}
              </Button>
              <div className="text-xs text-muted-foreground">JPG, PNG up to 5MB</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Phone</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="bg-background border-border"
              />
            </div>

            <Button onClick={handleSave} className="bg-primary text-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Account Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Member Since</div>
              <div className="text-lg font-semibold text-foreground">{memberSince}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Trades</div>
              <div className="text-lg font-semibold text-foreground">{totalTrades}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Verification Status</div>
              <div className="text-lg font-semibold text-warning">
                {user?.kycStatus === "verified" ? "Verified" : user?.kycStatus === "pending" ? "Pending" : "Not Started"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Account Type</div>
              <div className="text-lg font-semibold text-foreground">{isDemo ? "Demo" : "Live"}</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mt-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">KYC Verification</h2>
          <p className="text-muted-foreground mb-4">
            Complete your KYC verification to unlock full trading features and higher limits.
          </p>
          <Button
            onClick={() => window.location.href = "/kyc"}
            variant={user?.kycStatus === "verified" ? "outline" : "default"}
            className="bg-primary text-foreground hover:bg-primary/90 rounded-xl"
          >
            {user?.kycStatus === "verified" ? "View KYC Details" : user?.kycStatus === "pending" ? "KYC Under Review" : "Start KYC Verification"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
