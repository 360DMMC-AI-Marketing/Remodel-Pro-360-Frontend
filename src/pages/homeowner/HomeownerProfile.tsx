import { useState, useEffect, useRef } from "react";
import { Camera, MapPin, Phone, Mail, Save, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/stores/useAuth";
import { getImageUrl } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Card } from "@/components/molecules/Card";
import LocationPickerMap from "@/components/ui/LocationPickerMap";
import { reverseGeocode } from "@/api/geolocation";

const HomeownerProfile = () => {
  const { user, updateProfile, updateAvatar, removeAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    coordinates: undefined as [number, number] | undefined,
  });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const coords = user.address?.coordinates?.coordinates as [number, number] | undefined;
    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      street: user.address?.street ?? "",
      city: user.address?.city ?? "",
      state: user.address?.state ?? "",
      zipCode: user.address?.zipCode ?? "",
      coordinates: coords,
    });
  }, [user]);

  const handleLocationChange = async (coordinates: [number, number] | null) => {
    if (!coordinates) {
      setForm((f) => ({ ...f, coordinates: undefined }));
      return;
    }

    setIsGeocoding(true);
    try {
      const addressData = await reverseGeocode(coordinates[0], coordinates[1]);
      if (addressData) {
        setForm((f) => ({
          ...f,
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
          coordinates,
        }));
        toast.success("Address auto-filled from location");
      } else {
        setForm((f) => ({ ...f, coordinates }));
        toast.info("Could not auto-fill address. Please fill in manually.");
      }
    } catch {
      setForm((f) => ({ ...f, coordinates }));
      toast.error("Error auto-filling address. Please fill in manually.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Upload avatar if changed
      if (avatarFile) {
        await updateAvatar(avatarFile);
        setAvatarFile(null);
        setAvatarPreview(null);
      }

      await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phone || undefined,
        address: {
          street: form.street || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          zipCode: form.zipCode || undefined,
          ...(form.coordinates && {
            coordinates: { type: "Point" as const, coordinates: form.coordinates },
          }),
        },
      });

      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatar();
      setAvatarPreview(null);
      setAvatarFile(null);
      toast.success("Avatar removed.");
    } catch {
      toast.error("Failed to remove avatar.");
    }
  };

  const avatarSrc = avatarPreview
    ?? (user?.avatar
      ? (user.avatar.startsWith("http") ? user.avatar : getImageUrl(user.avatar))
      : null);

  const initials = (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "");

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-lg font-semibold text-neutral-800">My Profile</h2>

      {/* Avatar section */}
      <Card className="flex flex-col items-center gap-4 py-8">
        <div className="relative group">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Avatar"
              referrerPolicy="no-referrer"
              className="size-24 rounded-full object-cover ring-4 ring-primary-100"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-600 ring-4 ring-primary-50">
              {initials || <User size={32} />}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera size={20} className="text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarSelect}
          />
        </div>
        <div className="text-center">
          <p className="font-semibold text-neutral-800">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-neutral-500">{user?.email}</p>
          {user?.createdAt && (
            <p className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
              <Calendar size={12} />
              Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        {(avatarSrc && !avatarPreview) && (
          <Button variant="ghost" size="xs" onClick={() => void handleRemoveAvatar()}>
            Remove avatar
          </Button>
        )}
      </Card>

      {/* Personal info */}
      <Card>
        <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
          <User size={16} /> Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">First Name</label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="First name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Last Name</label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Last name"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium text-neutral-500 mb-1 block flex items-center gap-1">
            <Phone size={12} /> Phone Number
          </label>
          <Input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+1234567890"
          />
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium text-neutral-500 mb-1 block flex items-center gap-1">
            <Mail size={12} /> Email
          </label>
          <Input value={user?.email ?? ""} disabled className="bg-neutral-50" />
          <p className="text-[11px] text-neutral-400 mt-1">Email cannot be changed.</p>
        </div>
      </Card>

      {/* Address */}
      <Card>
        <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
          <MapPin size={16} /> Address
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">Pick your location on the map</label>
            <div className="rounded-lg overflow-hidden border border-neutral-200">
              <LocationPickerMap
                value={form.coordinates ?? null}
                onChange={handleLocationChange}
              />
            </div>
            {isGeocoding && (
              <p className="text-xs text-primary-500 mt-1">Auto-filling address...</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Street</label>
            <Input
              value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">City</label>
              <Input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">State</label>
              <Input
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                placeholder="State"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">ZIP Code</label>
              <Input
                value={form.zipCode}
                onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))}
                placeholder="12345"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default HomeownerProfile;
