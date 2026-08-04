import { useState } from "react";
import { useNotifications } from "../../context/NotificationContext";
import Button from "../../ui/Button.jsx";
import Field, { Input } from "../../ui/Field.jsx";
import Select from "../../ui/Select.jsx";

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule py-3 last:border-b-0">
      <dt className="font-label text-label text-ink-faint">{label}</dt>
      <dd className="text-body-s text-ink">{children}</dd>
    </div>
  );
}

/**
 * Account details and the form that edits them.
 *
 * Save and failure were reported with `alert()` — three of them, one behind a
 * `setTimeout(…, 100)` so it would land after the re-render. They go through the
 * notification system now, like every other outcome in the app.
 */
export default function AccountTab({
  user,
  countries,
  onSave,
  onLogout,
}) {
  const { showNotification } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    username: user?.username ?? "",
    email: user?.email ?? "",
    country: user?.country ?? "",
    bio: user?.bio ?? "",
    picture: null,
  });

  const update = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, picture: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const data = new FormData();
    data.append("username", form.username);
    data.append("email", form.email);
    data.append("country", form.country);
    data.append("bio", form.bio);
    if (form.picture instanceof File) {
      data.append("profile_picture", form.picture);
    }

    try {
      await onSave(data);
      setIsEditing(false);
      showNotification({
        type: "success",
        title: "Profile updated",
        message: "Your changes have been saved.",
      });
    } catch (error) {
      showNotification({
        type: "error",
        title: "Could not save",
        message: error.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-5">
        <div className="flex items-end gap-4">
          {(preview || user?.profile_picture) && (
            <img
              src={preview || user.profile_picture}
              alt=""
              className="size-16 rounded-room border border-rule object-cover"
            />
          )}
          <Field label="Profile picture" className="flex-1">
            {(props) => (
              <input
                {...props}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="text-body-s text-ink-muted file:mr-3 file:rounded-hair file:border file:border-rule-strong file:bg-transparent file:px-3 file:py-1.5 file:text-body-s file:text-ink hover:file:border-beam"
              />
            )}
          </Field>
        </div>

        <Field label="Display name">
          {(props) => (
            <Input
              {...props}
              value={form.username}
              onChange={update("username")}
            />
          )}
        </Field>

        <Field label="Email">
          {(props) => (
            <Input
              {...props}
              type="email"
              value={form.email}
              onChange={update("email")}
            />
          )}
        </Field>

        <Field label="Country">
          {(props) => (
            <Select
              {...props}
              value={form.country}
              onChange={update("country")}
            >
              <option value="">Not set</option>
              {countries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Bio" hint="Up to 150 characters.">
          {(props) => (
            <textarea
              {...props}
              rows={3}
              maxLength={150}
              value={form.bio}
              onChange={update("bio")}
              className="w-full resize-none rounded-hair border border-rule bg-surface px-3 py-2 text-body text-ink placeholder:text-ink-faint focus:border-beam focus:outline-none"
            />
          )}
        </Field>

        <div className="flex gap-3">
          <Button type="submit" busy={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="max-w-xl">
      <dl className="flex flex-col">
        <Row label="Display name">{user?.username || "Not set"}</Row>
        <Row label="Email">{user?.email}</Row>
        <Row label="Country">
          <span className="flex items-center gap-2">
            {user?.country_flag && (
              <img
                src={user.country_flag}
                alt=""
                className="h-3 w-auto"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            {user?.country_name || "Not set"}
          </span>
        </Row>
        <Row label="Bio">{user?.bio || "Not set"}</Row>
        <Row label="Member since">
          {user?.date_joined
            ? new Date(user.date_joined).toLocaleDateString()
            : "Unknown"}
        </Row>
      </dl>

      <div className="mt-8 flex gap-3">
        <Button onClick={() => setIsEditing(true)}>Edit profile</Button>
        <Button variant="secondary" onClick={onLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
