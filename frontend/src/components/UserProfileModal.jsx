import { API_ORIGIN } from "../api/config.js";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useNotifications } from "../context/NotificationContext";
import { useSocial } from "../context/SocialContext";
import { AuthContext } from "../context/AuthContext";
import { profileAPI } from "../api/profile.jsx";
import { queryKeys } from "../queries/keys.js";
import Button from "../ui/Button.jsx";
import Dialog from "../ui/Dialog.jsx";

const ensureAbsoluteUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const COUNTRY_CODES = {
  algeria: "dz",
  "united states": "us",
  "united kingdom": "gb",
  france: "fr",
  germany: "de",
  spain: "es",
  italy: "it",
  canada: "ca",
  australia: "au",
};

const flagUrl = (countryName) => {
  const name = countryName.toLowerCase();
  return `${API_ORIGIN}/static/flags/${COUNTRY_CODES[name] ?? name.slice(0, 2)}.svg`;
};

function Stat({ label, value }) {
  return (
    <div className="bg-surface p-4 text-center">
      <div data-figure className="text-figure text-lit">
        {value}
      </div>
      <div className="font-label mt-1 text-label text-ink-faint">{label}</div>
    </div>
  );
}

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const { user: currentUser, token } = useContext(AuthContext);
  const { showNotification } = useNotifications();
  const { sendFriendRequest, friends, openChat, onlineFriends } = useSocial();
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);

  const isOwnProfile = currentUser && user && currentUser.id === user.id;
  const isFriend = Boolean(user && friends?.some((f) => f.id === user.id));

  /*
   * This used to be an effect that refetched on every render of the parent: its
   * dependency array held `onlineFriends` and `showNotification`, both fresh
   * identities each time the social context updated. react-query keys the
   * request on the user id instead, so opening the same profile twice is free.
   */
  const statsQuery = useQuery({
    queryKey: queryKeys.user.stats(user?.id),
    queryFn: () => profileAPI.getUserStats(user.id, token),
    enabled: Boolean(isOpen && user?.id && token),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (statsQuery.error) {
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to load profile data",
      });
    }
  }, [statsQuery.error, showNotification]);

  if (!isOpen || !user) return null;

  const stats = statsQuery.data?.success ? statsQuery.data.data : null;
  const isOnline =
    onlineFriends?.some((f) => f.id === user.id) ||
    user.status === "online" ||
    user.is_online === true;

  const name = user.username || user.display_name || "Unknown user";
  const picture = user.profile_picture || user.profile_pic_url;
  const countryName = user.country_name || user.country;
  const bio = user.bio || user.description;
  const joined = user.date_joined || user.created_at || user.join_date;

  const level = stats?.level ?? user.level ?? 1;
  const gamesPlayed = stats?.total_games ?? user.games_played ?? 0;
  const globalRank = stats?.global_rank ?? user.global_rank;

  const handleAddFriend = async () => {
    setIsSending(true);
    try {
      const result = await sendFriendRequest(name);
      if (result.success) {
        showNotification({
          type: "success",
          title: "Friend request sent",
          message: `Friend request sent to ${name}`,
        });
        onClose();
      }
    } catch {
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to send friend request",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMessage = () => {
    const friend = friends.find((f) => f.id === user.id);
    if (friend) {
      openChat(friend.id);
      onClose();
    }
  };

  const handleViewFullProfile = () => {
    navigate(isOwnProfile ? "/profile" : `/profile/${user.id}`);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title={name}>
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {picture ? (
            <img
              src={ensureAbsoluteUrl(picture)}
              alt=""
              className="size-16 rounded-room border border-rule object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-room border border-rule bg-surface text-heading-s text-ink-muted">
              {name[0].toUpperCase()}
            </div>
          )}
          <span
            className={`absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-surface-raised ${
              isOnline ? "bg-positive" : "bg-shadow"
            }`}
            // The dot alone carried the whole online/offline distinction.
            role="img"
            aria-label={isOnline ? "Online" : "Offline"}
          />
        </div>

        <div className="min-w-0 flex-1">
          {countryName && (
            <p className="flex items-center gap-2 text-body-s text-ink-muted">
              <img
                src={flagUrl(countryName)}
                alt=""
                className="h-3 w-auto"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              {countryName}
            </p>
          )}
          {bio && <p className="mt-2 text-body-s text-ink">{bio}</p>}
          {joined && (
            <p className="mt-2 text-body-s text-ink-faint">
              Member since {new Date(joined).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {statsQuery.isLoading ? (
        <p className="mt-6 text-body-s text-ink-muted">Loading stats…</p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-room bg-rule">
          <Stat label="Level" value={level} />
          <Stat label="Sessions" value={gamesPlayed} />
          <Stat label="Global rank" value={globalRank ? `#${globalRank}` : "—"} />
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button
          variant={isOwnProfile ? "primary" : "secondary"}
          className="flex-1"
          onClick={handleViewFullProfile}
        >
          View full profile
        </Button>
        {!isOwnProfile &&
          (isFriend ? (
            <Button className="flex-1" onClick={handleMessage}>
              Message
            </Button>
          ) : (
            <Button className="flex-1" busy={isSending} onClick={handleAddFriend}>
              {isSending ? "Sending…" : "Add friend"}
            </Button>
          ))}
      </div>
    </Dialog>
  );
};

export default UserProfileModal;
