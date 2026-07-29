import React, { useState, useEffect, useRef } from "react";
import "./Styles/CreativeSearch.css";

const CreativeSearch = ({
  isOpen,
  onClose,
  searchUsers,
  sendFriendRequest,
  onNavigateToProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchTimeoutRef = useRef(null);
  const resultsRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query) => {
    const updated = [query, ...recentSearches.filter((q) => q !== query)].slice(
      0,
      5
    );
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchMessage("");
      setIsSearching(false);
      setSelectedIndex(-1);
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && searchResults[selectedIndex]) {
            handleUserSelect(searchResults[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, searchResults]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length === 0) {
      setSearchResults([]);
      setSearchMessage("");
      return;
    }

    if (value.trim().length < 2) {
      setSearchMessage("Type at least 2 characters to search");
      return;
    }

    // Set searching state
    setIsSearching(true);
    setSearchMessage("Searching...");

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(value.trim());
        setSearchResults(results);
        setIsSearching(false);

        if (results.length === 0) {
          setSearchMessage("No users found");
        } else {
          setSearchMessage("");
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setSearchMessage("Error searching users");
        setIsSearching(false);
      }
    }, 300);
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    saveRecentSearch(user.display_name);
    onNavigateToProfile(user);
    onClose();
  };

  // Handle send friend request
  const handleSendFriendRequest = async (user, e) => {
    e.stopPropagation();
    try {
      const result = await sendFriendRequest(user.display_name);
      if (result.success) {
        // Update the user in search results to show request sent
        setSearchResults((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, friendRequestSent: true } : u
          )
        );
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
    handleSearchChange({ target: { value: query } });
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="creative-search-overlay" onClick={onClose}>
      <div
        className="creative-search-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-header">
          <div className="search-title">
            <h2>🔍 Find Friends</h2>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="search-input-container">
            <div className="search-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for users by name or email..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="creative-search-input"
              />
              <div className="search-icon">🔍</div>
            </div>

            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery("")}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="search-body">
          {!searchQuery && recentSearches.length > 0 && (
            <div className="recent-searches">
              <h3>Recent Searches</h3>
              <div className="recent-items">
                {recentSearches.map((query, index) => (
                  <button
                    key={index}
                    className="recent-item"
                    onClick={() => handleRecentSearchClick(query)}
                  >
                    🕐 {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchMessage && (
            <div
              className={`search-status ${
                isSearching ? "searching" : "message"
              }`}
            >
              {isSearching && <div className="search-spinner"></div>}
              {searchMessage}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="search-results" ref={resultsRef}>
              <div className="results-header">
                <h3>Search Results ({searchResults.length})</h3>
              </div>

              <div className="results-grid">
                {searchResults.map((user, index) => (
                  <div
                    key={user.id}
                    className={`user-card ${
                      selectedIndex === index ? "selected" : ""
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="user-avatar">
                      {user.profile_pic_url ? (
                        <img
                          src={user.profile_pic_url}
                          alt={user.display_name}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="user-status-dot"></div>
                    </div>

                    <div className="user-details">
                      <div className="user-name">{user.display_name}</div>
                      <div className="user-email">{user.email}</div>
                      {user.bio && <div className="user-bio">{user.bio}</div>}
                    </div>

                    <div className="user-actions">
                      <button
                        className="view-profile-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserSelect(user);
                        }}
                      >
                        👤 View Profile
                      </button>

                      <button
                        className={`add-friend-btn ${
                          user.friendRequestSent ? "sent" : ""
                        }`}
                        onClick={(e) => handleSendFriendRequest(user, e)}
                        disabled={user.friendRequestSent}
                      >
                        {user.friendRequestSent ? "✓ Sent" : "👥 Add Friend"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searchQuery && !recentSearches.length && (
            <div className="search-empty">
              <div className="empty-icon">🔍</div>
              <h3>Discover New Friends</h3>
              <p>Start typing to search for users by name or email address</p>
              <div className="search-tips">
                <h4>Pro Tips:</h4>
                <ul>
                  <li>Use arrow keys to navigate results</li>
                  <li>Press Enter to select a user</li>
                  <li>Press Escape to close</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeSearch;
