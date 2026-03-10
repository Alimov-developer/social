import React, { useState } from "react";

const chatsMock = [
  { _id: "69a70e0818a989b3b24444bb", title: "React8A" },
  { _id: "69a7b12d463143975e9d5fae", title: "something" },
  { _id: "69a7b200463143975e9d6094", title: "something2" },
];

function ChatList({ chats, onSelect }) {
  return (
    <div className="chat-list">
      <button className="new-chat-btn">+</button>
      {chats.map((chat) => (
        <div key={chat._id} className="chat-item" onClick={() => onSelect(chat)}>
          <div className="chat-icon">{chat.title.charAt(0)}</div>
          <div>
            <div className="chat-title">{chat.title}</div>
            <div className="chat-id">ID: {chat._id}</div>
          </div>
        </div>
      ))}
      <div className="profile-section">+ Profile</div>
    </div>
  );
}

function ChatDetail({ chat }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);

  function handleSend(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setMessages([...messages, { id: Date.now(), text: draft }]);
    setDraft("");
  }

  return (
    <div className="chat-detail">
      <div className="chat-header">Chat ID: {chat?._id || ""}</div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <p>{msg.text}</p>
            <span className="message-time">{new Date(msg.id).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="chat-form">
        <input
          type="text"
          placeholder="Message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default function ChatApp() {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="container">
      <ChatList chats={chatsMock} onSelect={setSelectedChat} />
      <ChatDetail chat={selectedChat} />
    </div>
  );
}