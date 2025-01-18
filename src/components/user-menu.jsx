import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Home } from 'lucide-react';
import { supabase } from "../clients/supabaseClient";

export function UserMenu() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    };

    checkSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setUser(session?.user);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    return (
      <button
        onClick={() => navigate("/login")}
        className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 text-sm"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url || "/placeholder.png"}
            alt="Profile Avatar"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          (profile?.username?.[0] || "U").toUpperCase()
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-secondary border border-gray-800 rounded-lg shadow-lg py-1">
          <div className="px-4 py-2 border-b border-gray-800">
            <div className="text-sm font-medium text-white">
              {profile?.username || "Unknown User"}
            </div>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate("/");
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary/20 flex items-center gap-2"
          >
            <Home size={16} />
            Home
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate("/profile");
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary/20 flex items-center gap-2"
          >
            <User size={16} />
            Profile
          </button>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary/20 flex items-center gap-2"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

