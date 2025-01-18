import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save } from "lucide-react";
import { UserMenu } from "../user-menu";
import { supabase } from "../../clients/supabaseClient";

export function Profile() {
  const [avatar, setAvatar] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check if the user is authenticated and load their profile
  useEffect(() => {
    const fetchUserProfile = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
            console.error("User not authenticated:", error?.message || "No user session.");
            navigate("/login");
            return;
        }

      const user = session.user;
      setUser(user);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError.message);
        return;
      }

      setAvatar(profile.avatar_url);
      setSchoolName(profile.school || "");
      setSchoolCity(profile.city || "");
      setGradeLevel(profile.grade || "");
    };

    fetchUserProfile();
  }, [navigate]);

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result); // Show preview
      reader.readAsDataURL(file);
    }
  };

  // Handle profile updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        console.error("User not authenticated.");
        navigate("/login");
        return;
      }

      let avatarUrl = avatar;

      // Upload new avatar if a file was selected
      if (previewFile) {
        const fileName = `${user.id}-${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, previewFile);

        if (uploadError) {
          console.error("Error uploading avatar:", uploadError.message);
          alert("Failed to upload avatar. Please try again.");
          setLoading(false);
          return;
        }

        // Get the public URL of the uploaded avatar
        const { data: publicUrlData, error: publicUrlError } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        if (publicUrlError || !publicUrlData) {
          console.error("Error generating public URL:", publicUrlError?.message);
          alert("Failed to generate public URL for avatar. Please try again.");
          setLoading(false);
          return;
        }

        avatarUrl = publicUrlData.publicUrl;
      }

      // Update the user's profile in the database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          school: schoolName,
          city: schoolCity,
          grade: gradeLevel,
        })
        .eq("auth_user_id", user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError.message);
        alert("Failed to save profile. Please try again.");
        setLoading(false);
        return;
      }

      setAvatar(avatarUrl);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Unexpected error during profile update:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-gray-800 p-4 flex items-center justify-between">
        <h1 className="text-5xl font-bold">Bruriah</h1>
        <UserMenu user={user} onLogout={() => supabase.auth.signOut()} />
      </header>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-accent mb-8">Profile Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Profile Picture</label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={avatar || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-2 border-primary"
                />
                <label className="absolute bottom-0 right-0 p-2 bg-primary hover:bg-primary/90 rounded-full cursor-pointer">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    id="avatar"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <div className="text-sm text-gray-400">
                Click the camera icon to upload a new profile picture
              </div>
            </div>
          </div>

          {/* School Information */}
          <div className="space-y-4">
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-300 mb-2">
                School Name
              </label>
              <input
                id="schoolName"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
                placeholder="Enter your school name"
              />
            </div>

            <div>
              <label htmlFor="schoolCity" className="block text-sm font-medium text-gray-300 mb-2">
                School City
              </label>
              <input
                id="schoolCity"
                type="text"
                value={schoolCity}
                onChange={(e) => setSchoolCity(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
                placeholder="Enter your school's city"
              />
            </div>

            <div>
              <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-300 mb-2">
                Grade Level
              </label>
              <input
                id="gradeLevel"
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
                placeholder="Enter your grade level"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg p-3 font-semibold flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
