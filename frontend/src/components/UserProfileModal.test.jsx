import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext";

const showNotification = vi.fn();
const sendFriendRequest = vi.fn();
const openChat = vi.fn();
const getUserStats = vi.fn();
let social;

vi.mock("../context/NotificationContext", () => ({
  useNotifications: () => ({ showNotification }),
}));
vi.mock("../context/SocialContext", () => ({
  useSocial: () => social,
}));
vi.mock("../api/profile.jsx", () => ({
  profileAPI: { getUserStats: (...args) => getUserStats(...args) },
}));

const { default: UserProfileModal } = await import("./UserProfileModal.jsx");

const OTHER = { id: 7, username: "ada", country_name: "France", bio: "Hello." };

function renderModal(props = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={{ user: { id: 1 }, token: "t" }}>
        <MemoryRouter>
          <UserProfileModal
            isOpen
            onClose={() => {}}
            user={OTHER}
            {...props}
          />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  social = {
    sendFriendRequest,
    friends: [],
    openChat,
    onlineFriends: [],
  };
  getUserStats.mockResolvedValue({
    success: true,
    data: { level: 12, total_games: 340, global_rank: 58 },
  });
});

describe("UserProfileModal", () => {
  it("is a dialog named for the user, not an anonymous overlay", async () => {
    renderModal();

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("ada");
  });

  it("shows the fetched stats rather than the caller's stale copy", async () => {
    renderModal({ user: { ...OTHER, level: 1, games_played: 0 } });

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("340")).toBeInTheDocument();
    expect(screen.getByText("#58")).toBeInTheDocument();
  });

  it("keys the stats request on the user, so reopening does not refetch", async () => {
    const { unmount } = renderModal();
    await screen.findByText("12");
    unmount();

    expect(getUserStats).toHaveBeenCalledTimes(1);
    expect(getUserStats).toHaveBeenCalledWith(7, "t");
  });

  it("offers Message to a friend and Add friend to a stranger", async () => {
    const { unmount } = renderModal();
    expect(await screen.findByRole("button", { name: "Add friend" })).toBeInTheDocument();
    unmount();

    social = { ...social, friends: [{ id: 7 }] };
    renderModal();
    expect(await screen.findByRole("button", { name: "Message" })).toBeInTheDocument();
  });

  it("shows only the profile link when it is your own profile", async () => {
    renderModal({ user: { ...OTHER, id: 1 } });

    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: "View full profile" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add friend" })).toBeNull();
  });

  it("states online status in text, not only as a coloured dot", async () => {
    social = { ...social, onlineFriends: [{ id: 7 }] };
    renderModal();

    expect(await screen.findByLabelText("Online")).toBeInTheDocument();
  });

  it("does not send a second friend request while the first is in flight", async () => {
    sendFriendRequest.mockReturnValue(new Promise(() => {}));
    renderModal();

    const button = await screen.findByRole("button", { name: "Add friend" });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(sendFriendRequest).toHaveBeenCalledTimes(1);
  });
});
