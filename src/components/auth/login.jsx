import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../clients/supabaseClient";

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
  
        if (error) {
          alert("Login failed: " + error.message);
        } else {
          alert("Login successful!");
          navigate("/");
        }
      } else {
        const { data: allowedEmails, error: allowedEmailsError } = await supabase
          .from("allowed_emails")
          .select("email")
          .eq("email", email);
  
        if (allowedEmailsError) {
          console.error("Error checking allowed emails:", allowedEmailsError.message);
          alert("An unexpected error occurred. Please try again.");
          return;
        }
  
        if (allowedEmails.length === 0) {
          alert("Your email is not authorized to create an account.");
          return;
        }
  
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
  
        if (signUpError) {
          alert("Sign-up failed: " + signUpError.message);
          return;
        }
  
        const { data: userData, error: userError } = await supabase.auth.getUser();
  
        if (userError || !userData?.user) {
          alert("User creation failed. Please try again.");
          console.error("Error fetching user:", userError?.message);
          return;
        }
  
        const { user } = userData;
        const username = email.split("@")[0];
  
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              auth_user_id: user.id,
              user_id: user.id,
              username,
            },
          ]);
  
        if (profileError) {
          console.error(`Failed to save profile: ${profileError.message}`);
          alert("Failed to save profile. Please contact support.");
        } else {
          alert("Sign-up successful! Continue now to login.");
          setIsLogin(true);
        }
      }
    } catch (err) {
      console.error("Error during authentication:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md">
        <div className="bg-secondary border border-gray-800 rounded-lg p-8">
          <div className="flex justify-center mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bruriah_avatar-5LG8j5le2df7WxCyNELNGwS4D7FPi8.png"
              alt="Bruriah AI Assistant"
              className="w-24 h-24 object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-center mb-8 text-accent">
            {isLogin ? "Login to Bruriah" : "Create Account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg p-3 font-semibold"
              disabled={loading}
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-400 hover:text-primary text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
