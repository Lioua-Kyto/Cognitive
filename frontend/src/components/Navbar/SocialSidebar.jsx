import { useState } from "react";
import { useSocial } from "../../context/SocialContext";
import { useNotifications } from "../../context/NotificationContext";
import Avatar from "../../ui/Avatar.jsx";
import Button from "../../ui/Button.jsx";
import Sheet from "../../ui/Sheet.jsx";
import Tabs from "../../ui/Tabs.jsx";

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

function EmptyState({ title, body, action }) {
  return (
    <div className="py-storey-half text-center">
      <p className="text-body text-ink">{title}</p>
      <p className="mt-1 text-body-s text-ink-faint">{body}</p>
      {action}
    </div>
  );
}

const SocialSidebar = ({ isOpen, onClose, onNavigateToSocial }) => {
  const {
    friends,
    friendRequests,
    globalUnreadCount,
    unreadCounts,
    getTotalUnreadCount,
    isConnected,
    openChat,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useSocial();

  const { showNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState("notifications");

  const totalUnreadCount = getTotalUnreadCount();
  const totalRequests = friendRequests.length;

  const handleQuickMessage = (friendId) => {
    openChat(friendId);
    onNavigateToSocial();
    onClose();
  };

  const handleAcceptRequest = async (requestId) => {
    await acceptFriendRequest(requestId);
    showNotification({
      type: "success",
      title: "Friend request accepted",
      message: "You are now friends.",
    });
  };

  const handleRejectRequest = async (requestId) => {
    await rejectFriendRequest(requestId);
    showNotification({
      type: "info",
      title: "Friend request declined",
      message: "The request has been declined.",
    });
  };

  const notifications = (
    <div className="flex flex-col gap-6">
      {totalRequests > 0 && (
        <section aria-labelledby="sidebar-requests">
          <h3
            id="sidebar-requests"
            className="font-label text-label text-ink-faint"
          >
            Friend requests
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {friendRequests.slice(0, 3).map((request) => (
              <li key={request.id} className="flex gap-3">
                <Avatar name={request.requester.username} />
                <div className="min-w-0 flex-1">
                  <p className="text-body-s text-ink">
                    <span className="text-lit">
                      {request.requester.username}
                    </span>{" "}
                    sent you a friend request
                  </p>
                  <p data-figure className="mt-0.5 text-body-s text-ink-faint">
                    {formatTime(request.created_at)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {totalRequests > 3 && (
            <Button
              size="sm"
              variant="ghost"
              className="mt-3"
              onClick={onNavigateToSocial}
            >
              View all {totalRequests} requests
            </Button>
          )}
        </section>
      )}

      {totalUnreadCount > 0 && (
        <section aria-labelledby="sidebar-unread">
          <h3
            id="sidebar-unread"
            className="font-label text-label text-ink-faint"
          >
            Unread messages
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {globalUnreadCount > 0 && (
              <li className="flex items-center gap-3">
                <Avatar name="Global" />
                <p className="min-w-0 flex-1 text-body-s text-ink">
                  <span className="text-lit">Global chat</span> has{" "}
                  <span data-figure>{globalUnreadCount}</span> new messages
                </p>
                <Button size="sm" variant="ghost" onClick={onNavigateToSocial}>
                  View
                </Button>
              </li>
            )}

            {friends
              .filter((friend) => unreadCounts[friend.id] > 0)
              .slice(0, 3)
              .map((friend) => (
                <li key={friend.id} className="flex items-center gap-3">
                  <Avatar name={friend.username} src={friend.profile_picture} />
                  <p className="min-w-0 flex-1 text-body-s text-ink">
                    <span className="text-lit">{friend.username}</span> sent{" "}
                    <span data-figure>{unreadCounts[friend.id]}</span> new
                    message{unreadCounts[friend.id] > 1 ? "s" : ""}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuickMessage(friend.id)}
                  >
                    Reply
                  </Button>
                </li>
              ))}
          </ul>
        </section>
      )}

      {totalUnreadCount === 0 && totalRequests === 0 && (
        <EmptyState
          title="Nothing waiting"
          body="No new requests or unread messages."
        />
      )}
    </div>
  );

  const friendsPanel =
    friends.length === 0 ? (
      <EmptyState
        title="No friends yet"
        body="Find people to train alongside."
        action={
          <Button size="sm" className="mt-4" onClick={onNavigateToSocial}>
            Find people
          </Button>
        }
      />
    ) : (
      <>
        <ul className="flex flex-col">
          {friends.slice(0, 6).map((friend) => (
            <li
              key={friend.id}
              className="flex items-center gap-3 border-b border-rule py-3 last:border-b-0"
            >
              <Avatar
                name={friend.username}
                src={friend.profile_picture}
                status={friend.status || "offline"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-s text-lit">
                  {friend.username}
                </p>
                <p className="text-body-s text-ink-faint">
                  {friend.status || "offline"}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuickMessage(friend.id)}
              >
                Message
              </Button>
            </li>
          ))}
        </ul>
        {friends.length > 6 && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-3"
            onClick={onNavigateToSocial}
          >
            View all {friends.length} friends
          </Button>
        )}
      </>
    );

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title="Social"
      header={
        <p className="mt-1 flex items-center gap-2 text-body-s text-ink-faint">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${
              isConnected ? "bg-positive" : "bg-shadow"
            }`}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </p>
      }
      footer={
        <Button className="w-full" onClick={onNavigateToSocial}>
          Open social hub
        </Button>
      }
    >
      <Tabs
        label="Social sections"
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: "notifications",
            label: "Notifications",
            badge: totalUnreadCount + totalRequests,
            content: <div className="pt-5">{notifications}</div>,
          },
          {
            id: "friends",
            label: "Friends",
            badge: friends.length,
            content: <div className="pt-2">{friendsPanel}</div>,
          },
        ]}
      />
    </Sheet>
  );
};

export default SocialSidebar;
