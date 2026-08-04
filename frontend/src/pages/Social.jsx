import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocial } from "../context/SocialContext";
import { useNotifications } from "../context/NotificationContext";
import UserProfileModal from "../components/UserProfileModal";
import AddFriendDialog from "../components/Social/AddFriendDialog.jsx";
import ChatList from "../components/Social/ChatList.jsx";
import ChatPanel from "../components/Social/ChatPanel.jsx";
import FriendsPanel from "../components/Social/FriendsPanel.jsx";
import RequestsPanel from "../components/Social/RequestsPanel.jsx";
import Button from "../ui/Button.jsx";
import Dialog from "../ui/Dialog.jsx";
import Tabs from "../ui/Tabs.jsx";

export default function Social() {
  const {
    friends,
    friendRequests,
    sentFriendRequests,
    globalChatMessages,
    currentChat,
    openChat,
    closeChat,
    sendGlobalMessage,
    sendPrivateMessage,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    isConnected,
    chatMessages,
    globalUnreadCount,
    unreadCounts,
    searchUsers,
  } = useSocial();

  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("chat");
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);

  const messages =
    currentChat === "global"
      ? globalChatMessages
      : currentChat
        ? (chatMessages[currentChat] ?? [])
        : [];

  const currentFriend = friends.find((f) => f.id === currentChat);
  const chatTitle =
    currentChat === "global"
      ? "Global chat"
      : (currentFriend?.display_name ?? currentFriend?.username ?? "Chat");

  const confirmRemoveFriend = async () => {
    const friend = pendingRemoval;
    setPendingRemoval(null);
    try {
      await removeFriend(friend.username || friend.display_name);
      showNotification({
        type: "success",
        title: "Friend removed",
        message: `${friend.display_name || friend.username} is no longer in your friends.`,
      });
    } catch {
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to remove friend",
      });
    }
  };

  const handleSend = (text) => {
    if (currentChat === "global") sendGlobalMessage(text);
    else sendPrivateMessage(currentChat, text);
  };

  return (
    <div className="mx-auto w-full max-w-frame px-4 py-storey-half">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-display-l text-lit">Social</h1>
        <p className="flex items-center gap-2 text-body-s text-ink-muted">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${
              isConnected ? "bg-positive" : "bg-shadow"
            }`}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </p>
      </div>

      <div className="mt-8 grid h-[min(72vh,44rem)] gap-px overflow-hidden rounded-room bg-rule lg:grid-cols-[22rem_1fr]">
        <div className="flex min-h-0 flex-col bg-surface">
          <Tabs
            className="flex min-h-0 flex-1 flex-col"
            panelClassName="min-h-0 flex-1 overflow-y-auto"
            label="Social sections"
            active={activeTab}
            onChange={setActiveTab}
            tabs={[
              {
                id: "chat",
                label: "Chat",
                badge: globalUnreadCount,
                content: (
                  <ChatList
                    friends={friends}
                    currentChat={currentChat}
                    openChat={openChat}
                    globalChatMessages={globalChatMessages}
                    globalUnreadCount={globalUnreadCount}
                    chatMessages={chatMessages}
                    unreadCounts={unreadCounts}
                  />
                ),
              },
              {
                id: "friends",
                label: "Friends",
                badge: friends.length,
                content: (
                  <FriendsPanel
                    friends={friends}
                    onOpenChat={openChat}
                    onVisitProfile={(friend) =>
                      navigate(`/profile/${friend.id}`)
                    }
                    onRemoveFriend={setPendingRemoval}
                    onAddFriend={() => setIsAddFriendOpen(true)}
                  />
                ),
              },
              {
                id: "requests",
                label: "Requests",
                badge: friendRequests.length + sentFriendRequests.length,
                content: (
                  <RequestsPanel
                    friendRequests={friendRequests}
                    sentFriendRequests={sentFriendRequests}
                    acceptFriendRequest={acceptFriendRequest}
                    rejectFriendRequest={rejectFriendRequest}
                    cancelFriendRequest={cancelFriendRequest}
                  />
                ),
              },
            ]}
          />
        </div>

        <div className="min-h-0 bg-surface">
          <ChatPanel
            currentChat={currentChat}
            title={chatTitle}
            messages={messages}
            isConnected={isConnected}
            onSend={handleSend}
            onClose={closeChat}
            onSelectUser={setSelectedUser}
          />
        </div>
      </div>

      {isAddFriendOpen && (
        <AddFriendDialog
          onClose={() => setIsAddFriendOpen(false)}
          searchUsers={searchUsers}
          sendFriendRequest={sendFriendRequest}
          onUserSelect={setSelectedUser}
          friends={friends}
        />
      )}

      <UserProfileModal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />

      <Dialog
        open={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        size="sm"
        title="Remove friend"
        description={
          pendingRemoval
            ? `${pendingRemoval.display_name || pendingRemoval.username} will be removed from your friends.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingRemoval(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveFriend}>
              Remove
            </Button>
          </>
        }
      />
    </div>
  );
}
