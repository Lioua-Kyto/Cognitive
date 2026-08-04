import { useState } from "react";
import Avatar from "../../ui/Avatar.jsx";
import Button from "../../ui/Button.jsx";
import Field, { Input } from "../../ui/Field.jsx";

/**
 * The friends list.
 *
 * Each card used to hide Message / Visit profile / Remove behind a "⋮" toggle
 * that had no aria-expanded, no Escape handler and no click-outside — the one
 * outside-click listener on the page only watched the emoji picker, so opening
 * one menu and clicking elsewhere left it open. Three actions fit on the row, so
 * there is no menu now.
 */
export default function FriendsPanel({
  friends,
  onOpenChat,
  onVisitProfile,
  onRemoveFriend,
  onAddFriend,
}) {
  const [query, setQuery] = useState("");

  const filtered = friends.filter((friend) =>
    (friend.username || friend.display_name || "")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex items-end gap-3">
        <Field label="Search friends" className="flex-1">
          {(props) => (
            <Input
              {...props}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name"
            />
          )}
        </Field>
        <Button onClick={onAddFriend}>Add</Button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-storey-half text-center text-body-s text-ink-faint">
          {query
            ? "No friends match that name."
            : "No friends yet. Add someone to train alongside."}
        </p>
      ) : (
        <ul className="mt-5 flex flex-col">
          {filtered.map((friend) => {
            const name = friend.display_name || friend.username;
            return (
              <li
                key={friend.id}
                className="flex items-center gap-3 border-b border-rule py-3 last:border-b-0"
              >
                <Avatar
                  name={name}
                  src={friend.profile_picture || friend.profile_pic_url}
                  status={friend.status || "offline"}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-s text-lit">{name}</p>
                  <p className="text-body-s text-ink-faint">
                    {friend.status || "offline"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenChat(friend.id)}
                  >
                    Message
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onVisitProfile(friend)}
                  >
                    Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove ${name}`}
                    onClick={() => onRemoveFriend(friend)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
