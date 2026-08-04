import Avatar from "../../ui/Avatar.jsx";
import Button from "../../ui/Button.jsx";

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

function RequestRow({ person, createdAt, actions }) {
  const name = person.display_name || person.username || "Unknown";
  return (
    <li className="flex items-center gap-3 border-b border-rule py-3 last:border-b-0">
      <Avatar
        name={name}
        src={person.profile_picture || person.profile_pic_url}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-s text-lit">{name}</p>
        <p data-figure className="text-body-s text-ink-faint">
          {formatTime(createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">{actions}</div>
    </li>
  );
}

export default function RequestsPanel({
  friendRequests,
  sentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
}) {
  return (
    <div className="flex flex-col gap-8 p-4">
      <section aria-labelledby="requests-received">
        <h3
          id="requests-received"
          className="font-label text-label text-ink-faint"
        >
          Received
        </h3>
        {friendRequests.length === 0 ? (
          <p className="mt-3 text-body-s text-ink-faint">
            No requests waiting on you.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {friendRequests.map((request) => (
              <RequestRow
                key={request.id}
                person={request.requester}
                createdAt={request.created_at}
                actions={
                  <>
                    <Button
                      size="sm"
                      onClick={() => acceptFriendRequest(request.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => rejectFriendRequest(request.id)}
                    >
                      Decline
                    </Button>
                  </>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="requests-sent">
        <h3 id="requests-sent" className="font-label text-label text-ink-faint">
          Sent
        </h3>
        {sentFriendRequests.length === 0 ? (
          <p className="mt-3 text-body-s text-ink-faint">
            You have no requests out.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {sentFriendRequests.map((request) => (
              <RequestRow
                key={request.id}
                person={request.receiver}
                createdAt={request.created_at}
                actions={
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelFriendRequest(request.id)}
                  >
                    Cancel
                  </Button>
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
