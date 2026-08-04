import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../../context/NotificationContext";
import Avatar from "../../ui/Avatar.jsx";
import Button from "../../ui/Button.jsx";
import Dialog from "../../ui/Dialog.jsx";
import Field, { Input } from "../../ui/Field.jsx";

/**
 * Mounted only while open, so a fresh search starts from a fresh state. The
 * version this replaces stayed mounted and reset five state variables from an
 * effect keyed on `isOpen` — a cascading render to undo work it need not have
 * kept.
 */
export default function AddFriendDialog({
  onClose,
  searchUsers,
  sendFriendRequest,
  onUserSelect,
  friends = [],
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [state, setState] = useState("idle");
  const timeoutRef = useRef(null);
  const { showNotification } = useNotifications();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(timeoutRef.current);

    if (value.trim().length === 0) {
      setResults([]);
      setState("idle");
      return;
    }

    setState("searching");
    timeoutRef.current = setTimeout(async () => {
      try {
        const found = await searchUsers(value.trim());
        setResults(found);
        setState(found.length === 0 ? "empty" : "done");
      } catch {
        setResults([]);
        setState("error");
      }
    }, 300);
  };

  const isAlreadyFriend = (user) =>
    friends.some((f) => f.id === user.id || f.username === user.username);

  const handleSendFriendRequest = async (username) => {
    const result = await sendFriendRequest(username);
    if (result?.success) {
      showNotification({
        type: "success",
        title: "Friend request sent",
        message: `Friend request sent to ${username}`,
      });
      onClose();
    }
  };

  const message = {
    searching: "Searching…",
    empty: "No one found by that name.",
    error: "Search failed. Try again.",
  }[state];

  return (
    <Dialog open onClose={onClose} title="Add a friend">
      <Field label="Search by name or email">
        {(props) => (
          <Input
            {...props}
            type="search"
            value={query}
            onChange={handleSearchChange}
            placeholder="e.g. ada"
            autoFocus
          />
        )}
      </Field>

      {/* The result count is what changes under the user's hands, so it is what
          gets announced — not the input they are already typing into. */}
      <div aria-live="polite" className="mt-4">
        {message && (
          <p
            className={`text-body-s ${
              state === "error" ? "text-negative" : "text-ink-muted"
            }`}
          >
            {message}
          </p>
        )}

        {results.length > 0 && (
          <ul className="flex flex-col">
            {results.map((user) => {
              const name = user.display_name || user.username || "Unknown";
              return (
                <li
                  key={user.id}
                  className="flex items-center gap-3 border-b border-rule py-3 last:border-b-0"
                >
                  <Avatar name={name} src={user.profile_pic_url} />
                  <button
                    type="button"
                    onClick={() => onUserSelect(user)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-body-s text-lit">
                      {name}
                    </span>
                    <span className="block truncate text-body-s text-ink-faint">
                      {user.email}
                    </span>
                  </button>
                  {isAlreadyFriend(user) ? (
                    <span className="font-label text-label text-ink-faint">
                      Friends
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSendFriendRequest(name)}
                    >
                      Add
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
