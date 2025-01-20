import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../clients/supabaseClient";
import ReactMarkdown from "react-markdown";

export function AdminChatInterface() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate(); 

  useEffect(() => {
    const checkAdminPrivileges = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
  
        console.log("Session response from Supabase:", data);
        
        if (sessionError || !data || !data.session) {
          console.error("User not logged in or session invalid:", sessionError?.message || "No session or user found");
          navigate("/");
          return;
        }
  
        const { session } = data;
        const { user } = session;
  
        if (!user) {
          console.error("No user found in session");
          navigate("/");
          return;
        }
  
        setUser(user);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("auth_user_id", session.user.id)
          .single();

        if (profileError || !profile?.is_admin) {
          console.error("User is not an admin:", profileError?.message || "No admin privileges");
          navigate("/");
          return;
        }
      } catch (error) {
        console.error("Error checking admin privileges:", error.message);
        navigate("/");
      }
    };

    checkAdminPrivileges();
  }, [navigate]);
  
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(
          `https://${import.meta.env.VITE_SUPABASE_PROJECT_REF}.functions.supabase.co/admin-view`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching chats: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error("Error fetching chats:", error.message);
      }
    };

    fetchChats();
  }, []);

  const loadChatHistory = async (chat) => {
    try {
      setActiveChat(chat);

      const response = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_REF}.functions.supabase.co/admin-retrieve-chats?chat_id=${chat.id}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching chat history: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error("Error loading chat history:", error.message);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-secondary border-r border-gray-800 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-white">Admin Chat View</h2>
        </div>
        <div className="px-3 py-2">
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.userId}>
                <h3 className="text-sm font-bold text-primary uppercase">
                  {user.username || "Unknown User"}
                </h3>
                <ul className="space-y-1">
                  {user.chats.map((chat) => (
                    <li key={chat.id}>
                      <button
                        onClick={() => loadChatHistory(chat)}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          activeChat?.id === chat.id
                            ? "bg-primary text-white"
                            : "text-gray-300"
                        } hover:bg-primary/20 rounded-lg`}
                      >
                        {chat.title || "Untitled Chat"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-800 p-4">
          <h1 className="text-3xl font-bold text-white">Chat Details</h1>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-auto p-4">
          {!activeChat ? (
            <div className="flex flex-col items-center justify-center mt-20">
              <p className="text-gray-400">Select a chat to view its details</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`max-w-3/4 p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        img: ({ node, ...props }) => (
                          <img
                            {...props}
                            style={{
                              maxWidth: "350px",
                              maxHeight: "350px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                            alt="Uploaded"
                          />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
