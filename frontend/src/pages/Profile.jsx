import { motion } from "framer-motion";
import { User, Mail, LogOut, Edit3, Save, MapPin, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useUserProfile } from "../context/UserProfileContext";

export default function Profile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { profile: sysProfile, updateProfile } = useUserProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState({});

  useEffect(() => {
    if (sysProfile) {
      setLocalProfile({
        age: sysProfile.age || "",
        gender: sysProfile.gender || "Male",
        country: sysProfile.country || "",
        homeCity: sysProfile.homeCity || "",
        allergies: sysProfile.allergies || "",
        conditions: sysProfile.conditions?.join(", ") || "",
      });
    }
  }, [sysProfile]);

  const handleInput = (e) => {
    setLocalProfile({
      ...localProfile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      // Sync to Context (which seamlessly PUTs to MongoDB)
      await updateProfile({
        age: Number(localProfile.age) || null,
        gender: localProfile.gender,
        country: localProfile.country,
        homeCity: localProfile.homeCity,
        allergies: localProfile.allergies,
        // Convert comma-separated string back to array if modified
        conditions: typeof localProfile.conditions === 'string' 
            ? localProfile.conditions.split(",").map(c => c.trim()).filter(Boolean) 
            : localProfile.conditions
      });
      toast.success("Profile synced to Database successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  if (!isLoaded) {
    return (
      <div className="pt-28 px-8 pb-20 min-h-screen bg-zinc-950 flex justify-center items-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="pt-28 px-8 pb-20 min-h-screen bg-zinc-950 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-zinc-900 rounded-xl shadow-lg border border-white/10 p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-zinc-800">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white">
                {sysProfile.fullName || `${user.firstName} ${user.lastName}`}
              </h1>
              <p className="text-zinc-400">Manage your comprehensive health profile</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
          className={`flex items-center gap-2 px-5 py-2 mb-6 text-white rounded-lg transition ${
            isEditing ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isEditing ? <Save size={18} /> : <Edit3 size={18} />}
          {isEditing ? "Save to Database" : "Edit Profile"}
        </button>

        {/* Profile Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* EMAIL */}
          <div className="md:col-span-2">
            <label className="font-medium text-zinc-300">Email</label>
            <div className="flex items-center gap-2 mt-1 px-4 py-2 bg-zinc-800/50 border border-zinc-800 rounded-lg">
              <Mail className="text-zinc-500" size={18} />
              <input
                type="email"
                disabled
                value={user.primaryEmailAddress?.emailAddress}
                className="w-full bg-transparent text-zinc-400 focus:outline-none"
              />
            </div>
          </div>

          {/* AGE */}
          <div>
            <label className="font-medium text-zinc-300">Age</label>
            <input
              type="number"
              name="age"
              disabled={!isEditing}
              value={localProfile.age || ""}
              onChange={handleInput}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg mt-1 text-white disabled:opacity-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              placeholder="e.g. 34"
            />
          </div>

          {/* GENDER */}
          <div>
            <label className="font-medium text-zinc-300">Gender</label>
            <select
              name="gender"
              disabled={!isEditing}
              value={localProfile.gender || "Male"}
              onChange={handleInput}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg mt-1 text-white disabled:opacity-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          {/* COUNTRY */}
          <div>
            <label className="font-medium text-zinc-300 flex items-center gap-2">
              <Globe size={16} className="text-zinc-500" /> Country
            </label>
            <input
              type="text"
              name="country"
              disabled={!isEditing}
              value={localProfile.country || ""}
              onChange={handleInput}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg mt-1 text-white disabled:opacity-50 focus:border-blue-500 transition-all outline-none"
              placeholder="e.g. United States"
            />
          </div>

          {/* HOME CITY */}
          <div>
            <label className="font-medium text-zinc-300 flex items-center gap-2">
              <MapPin size={16} className="text-zinc-500" /> Home City
            </label>
            <input
              type="text"
              name="homeCity"
              disabled={!isEditing}
              value={localProfile.homeCity || ""}
              onChange={handleInput}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg mt-1 text-white disabled:opacity-50 focus:border-blue-500 transition-all outline-none"
              placeholder="e.g. New York City"
            />
          </div>

          {/* CONDITIONS */}
          <div className="md:col-span-2 mt-2">
            <label className="font-medium text-zinc-300">Existing Conditions</label>
            <textarea
              name="conditions"
              disabled={!isEditing}
              value={localProfile.conditions || ""}
              onChange={handleInput}
              rows={2}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg mt-1 text-white disabled:opacity-50 focus:border-blue-500 transition-all outline-none"
              placeholder="e.g. Hypertension, Diabetes"
            />
          </div>

          {/* ALLERGIES */}
          <div className="md:col-span-2">
            <label className="font-medium text-zinc-300">Allergies</label>
            <textarea
              name="allergies"
              disabled={!isEditing}
              value={localProfile.allergies || ""}
              onChange={handleInput}
              rows={2}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg mt-1 text-white disabled:opacity-50 focus:border-blue-500 transition-all outline-none"
              placeholder="e.g. Peanuts, Penicillin"
            />
          </div>

        </div>
      </motion.div>
    </div>
  );
}
