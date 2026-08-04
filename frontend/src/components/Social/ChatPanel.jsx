import { useEffect, useRef, useState } from "react";
import Avatar from "../../ui/Avatar.jsx";
import Button from "../../ui/Button.jsx";

const EMOJI = ["😀", "😂", "😍", "🤔", "😊", "👍", "👎", "❤️", "🎉", "🔥"];

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

/** Consecutive messages from one sender inside five minutes read as one turn. */
function groupMessages(messages) {
  const groups = [];

  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const continues =
      previous &&
      previous.sender.id === message.sender.id &&
      new Date(message.timestamp) - new Date(previous.timestamp) < 300_000;

    if (continues) {
      groups[groups.length - 1].messages.push(message);
    } else {
      groups.push({
        sender: message.sender,
        timestamp: message.timestamp,
        messages: [message],
      });
    }
  });

  return groups;
}

function EmojiPicker({ onSelect }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <Button
        ref={toggleRef}
        variant="ghost"
        aria-expanded={open}
        aria-label="Insert emoji"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">☺</span>
      </Button>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 flex w-56 flex-wrap gap-1 rounded-room border border-rule bg-surface-raised p-2 shadow-2xl">
          {EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`Insert ${emoji}`}
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
                toggleRef.current?.focus();
              }}
              className="flex size-8 items-center justify-center rounded-hair hover:bg-surface"
            >
              <span aria-hidden="true">{emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatPanel({
  currentChat,
  title,
  messages,
  isConnected,
  onSend,
  onClose,
  onSelectUser,
}) {
  const [input, setInput] = useState("");
  const [showJump, setShowJump] = useState(false);
  const scrollRef = useRef(null);

  const groups = groupMessages(messages);

  const scrollToEnd = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Only follow the conversation if the reader was already at the end of it.
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (nearBottom) scrollToEnd();
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowJump(!atBottom && messages.length > 0);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
    requestAnimationFrame(scrollToEnd);
  };

  if (!currentChat) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="font-display text-heading-s text-lit">
          No conversation open
        </p>
        <p className="mt-2 max-w-[36ch] text-body-s text-ink-muted">
          Pick global chat or a friend from the list to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
        <h2 className="truncate font-display text-heading-s text-lit">
          {title}
        </h2>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-label={`${title} messages`}
          className="h-full overflow-y-auto px-5 py-4"
        >
          {groups.length === 0 ? (
            <p className="text-body-s text-ink-faint">No messages yet.</p>
          ) : (
            <ol className="flex flex-col gap-5">
              {groups.map((group, index) => {
                const name =
                  group.sender.username || group.sender.display_name || "User";
                return (
                  <li key={index} className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectUser(group.sender)}
                      aria-label={`View ${name}'s profile`}
                    >
                      <Avatar
                        name={name}
                        src={
                          group.sender.profile_picture ||
                          group.sender.profile_pic_url
                        }
                        size="sm"
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectUser(group.sender)}
                          className="truncate text-body-s text-lit hover:text-beam"
                        >
                          {name}
                        </button>
                        <time
                          data-figure
                          dateTime={group.timestamp}
                          className="text-body-s text-ink-faint"
                        >
                          {formatTime(group.timestamp)}
                        </time>
                      </p>
                      {group.messages.map((message, i) => (
                        <p
                          key={i}
                          className="mt-1 text-body-s break-words text-ink"
                        >
                          {message.content}
                        </p>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {showJump && (
          <Button
            size="sm"
            className="absolute inset-x-0 bottom-3 mx-auto w-fit shadow-2xl"
            onClick={scrollToEnd}
          >
            Jump to newest
          </Button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-rule p-4"
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!isConnected}
          aria-label={`Message ${title}`}
          placeholder={isConnected ? "Write a message" : "Disconnected"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-hair border border-rule bg-surface px-3 py-2 text-body text-ink placeholder:text-ink-faint focus:border-beam focus:outline-none disabled:opacity-45"
        />
        <EmojiPicker onSelect={(emoji) => setInput((prev) => prev + emoji)} />
        <Button type="submit" disabled={!isConnected || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
