import { useState, useEffect } from "react";
import { Plus, Send } from "lucide-react";
import { UserMenu } from "./user-menu";
import { supabase } from "../clients/supabaseClient";

export function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: session, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error.message);
        return;
      }
      setUser(session?.user || null);
    };

    fetchUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setUser(session?.user || null);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

    useEffect(() => {
      const fetchProfile = async () => {
        if (!user) return;
  
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();
  
        if (error) {
          console.error("Error fetching profile:", error.message);
        } else {
          setProfile(profileData);
        }
      };
  
      fetchProfile();
    }, [user]);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
  
      const profileId = await fetchProfileId();
      if (!profileId) return;
  
      const { data: chatsData, error } = await supabase
        .from("chats")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });
  
      if (error) {
        console.error("Error fetching chats:", error.message);
      } else {
        setChats(chatsData);
      }
    };
  
    fetchChats();
  }, [user]);  

  const createNewChat = async () => {
    if (!user) {
      console.error("No user is logged in. Cannot create a new chat.");
      return;
    }
  
    const profileId = await fetchProfileId();
    if (!profileId) {
      console.error("No profile ID found. Cannot create a new chat.");
      return;
    }
  
    const { data: chat, error } = await supabase
      .from("chats")
      .insert({ profile_id: profileId, title: "New Chat" })
      .select("*")
      .single();
  
    if (error) {
      console.error("Error creating chat:", error.message);
    } else {
      setChats([chat, ...chats]);
      setActiveChat(chat);
      setMessages([]);
    }
  };
  

  const sendMessage = async () => {
    if (!activeChat) {
      console.error("No active chat to send a message to.");
      return;
    }
  
    if (!inputValue.trim()) {
      console.error("Message cannot be empty.");
      return;
    }
  
    const userMessageId = Date.now().toString();
    const assistantMessageId = (Date.now() + 1).toString();
  
    try {
      const newUserMessage = {
        id: userMessageId,
        chat_id: activeChat.id,
        role: "user",
        content: inputValue.trim(),
      };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setInputValue(""); 
  
      await supabase.from("messages").insert({
        chat_id: activeChat.id,
        role: "user",
        content: inputValue.trim(),
      });
  
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: assistantMessageId, chat_id: activeChat.id, role: "assistant", content: "" },
      ]);
  
      const maxContextMessages = 10; // Limit the number of context messages
      const context = messages.slice(-maxContextMessages).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
  
      const response = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_REF}.functions.supabase.co/openai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ prompt: inputValue.trim(), context }),
        }
      );
  
      if (!response.ok) {
        throw new Error(`Error generating assistant response: ${response.statusText}`);
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialMessage = "";
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
  
        partialMessage += decoder.decode(value, { stream: true });
  
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: partialMessage }
              : msg
          )
        );
      }
  
      await supabase.from("messages").insert({
        chat_id: activeChat.id,
        role: "assistant",
        content: partialMessage,
      });
    } catch (error) {
      console.error("Error during message handling:", error.message);
  
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 2).toString(),
          chat_id: activeChat.id,
          role: "assistant",
          content: "Oops! Something went wrong. Please try again.",
        },
      ]);
    }
  };  

  const fetchProfileId = async () => {
    if (!user) return null;
  
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
  
    if (error) {
      console.error("Error fetching profile ID:", error.message);
      return null;
    }
  
    return profile.id;
  };

  const saveChatTitle = async (chat) => {
    try {
      const { error } = await supabase
        .from("chats")
        .update({ title: chat.title })
        .eq("id", chat.id);
  
      if (error) {
        console.error("Error updating chat title:", error.message);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const loadChatHistory = async (chat) => {
    try {
      setActiveChat(chat);
  
      const { data: chatMessages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });
  
      if (error) {
        console.error("Error fetching chat history:", error.message);
        return;
      }
  
      setMessages(chatMessages);
    } catch (err) {
      console.error("Unexpected error loading chat history:", err);
    }
  };
  
  
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-secondary border-r border-gray-800">
        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg p-3 flex items-center gap-2"
          >
            <Plus size={16} />
            New chat
          </button>
        </div>
  
        <div className="px-3 py-2">
          <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase">Chats</h2>
          <div className="mt-2 space-y-1">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <div key={chat.id} className="flex items-center gap-2">
                  {activeChat?.id === chat.id ? (
                    <input
                      type="text"
                      value={chat.title}
                      onChange={(e) => {
                        const updatedChats = chats.map((c) =>
                          c.id === chat.id ? { ...c, title: e.target.value } : c
                        );
                        setChats(updatedChats);
                      }}
                      onBlur={() => saveChatTitle(chat)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveChatTitle(chat);
                        }
                      }}
                      className="w-full px-2 py-1 bg-secondary text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <button
                      onClick={() => loadChatHistory(chat)}
                      className={`w-full text-left px-3 py-2 text-sm ${
                        activeChat?.id === chat.id ? "bg-primary text-white" : "text-gray-300"
                      } hover:bg-primary/20 rounded-lg`}
                    >
                      {chat.title}
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 px-3">No chats yet.</p>
            )}
          </div>
        </div>
      </div>
  
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-800 p-4 flex items-center justify-between">
          <h1 className="text-5xl font-bold">Bruriah</h1>
          <UserMenu user={user} onLogout={() => supabase.auth.signOut()} />
        </header>
  
        {/* Messages area */}
        <div className="flex-1 overflow-auto p-4">
          {!activeChat ? (
            <div className="flex flex-col items-center justify-center mt-20">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bruriah_avatar-5LG8j5le2df7WxCyNELNGwS4D7FPi8.png"
                alt="Bruriah AI Assistant"
                className="w-32 h-32 object-contain mb-6"
              />
              <h2 className="intro text-4xl font-bold text-primary mb-4">Welcome to Bruriah</h2>
              <p className="text-gray-400">What do you want to study today?</p>
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
                  {/* Avatar */}
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-4">
                      <img
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bruriah_avatar-5LG8j5le2df7WxCyNELNGwS4D7FPi8.png"
                        alt="Bruriah Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* Message Bubble */}
                  <div
                    className={`max-w-3/4 p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {message.content || (
                      <span className="animate-pulse text-gray-500">
                        Generating response...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

  
        {/* Input area */}
        {activeChat && (
          <div className="border-t border-gray-800 p-4">
            <div className="max-w-3xl mx-auto relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage(); 
                  }
                }}
                placeholder="Message Bruriah..."
                className="w-full bg-secondary border border-gray-700 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:border-primary"
              />
              <button
                onClick={sendMessage}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );  
}
