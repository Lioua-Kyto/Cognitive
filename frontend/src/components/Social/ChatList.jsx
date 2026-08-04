import Avatar from "../../ui/Avatar.jsx";

function preview(messages) {
  const last = messages?.[messages.length - 1];
  if (!last) return null;
  return last.content.length > 40
    ? `${last.content.slice(0, 40)}…`
    : last.content;
}

function ChatRow({ name, src, status, unread, active, subtitle, onOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors duration-hair ${
          active
            ? "border-beam bg-surface-raised"
            : "border-transparent hover:bg-surface-raised"
        }`}
      >
        <Avatar name={name} src={src} status={status} />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-body-s ${
              active ? "text-beam" : "text-lit"
            }`}
          >
            {name}
          </span>
          <span className="block truncate text-body-s text-ink-faint">
            {subtitle}
          </span>
        </span>
        {unread > 0 && (
          <span
            data-figure
            className="rounded-hair bg-beam px-1.5 text-body-s text-poche"
          >
            {unread}
            <span className="sr-only"> unread</span>
          </span>
        )}
      </button>
    </li>
  );
}

export default function ChatList({
  friends,
  currentChat,
  openChat,
  globalChatMessages,
  globalUnreadCount,
  chatMessages,
  unreadCounts,
}) {
  return (
    <ul className="flex flex-col">
      <ChatRow
        name="Global chat"
        active={currentChat === "global"}
        unread={globalUnreadCount}
        subtitle={preview(globalChatMessages) ?? "No messages yet"}
        onOpen={() => openChat("global")}
      />
      {friends.map((friend) => {
        const name = friend.display_name || friend.username;
        return (
          <ChatRow
            key={friend.id}
            name={name}
            src={friend.profile_picture || friend.profile_pic_url}
            status={friend.status || "offline"}
            active={currentChat === friend.id}
            unread={unreadCounts[friend.id]}
            subtitle={preview(chatMessages[friend.id]) ?? "No messages yet"}
            onOpen={() => openChat(friend.id)}
          />
        );
      })}
    </ul>
  );
}
