import { createContext, useContext, useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";

const UserProfileContext = createContext(null);

const STORAGE_KEY = "healtrip_user_profile";
const ONBOARDING_KEY = "healtrip_onboarding_complete";

const defaultProfile = {
  fullName: "",
  age: "",
  gender: "",
  country: "",
  homeCity: "",
  bloodGroup: "",
  allergies: "",
  conditions: [],
  symptoms: [],
  onboardingComplete: false,
};

export function UserProfileProvider({ children }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);

  // Load from database on mount
  useEffect(() => {
    if (!isLoaded || !user) return;
    
    let isMounted = true;

    const fetchDBProfile = async () => {
      try {
        const token = await getToken();
        // Fallback to local storage quickly while fetching
        const key = `${STORAGE_KEY}_${user.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          try { setProfile(JSON.parse(stored)); } catch (e) {}
        }

        const res = await fetch('http://localhost:5000/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok && isMounted) {
          const json = await res.json();
          const dbProfile = json.data;
          
          if (dbProfile) {
            setProfile(prev => {
              const updated = {
                ...prev,
                fullName: `${dbProfile.firstName || ""} ${dbProfile.lastName || ""}`.trim() || prev.fullName,
                age: dbProfile.age || prev.age,
                gender: dbProfile.gender || prev.gender,
                country: dbProfile.country || prev.country,
                homeCity: dbProfile.homeCity || prev.homeCity,
                bloodGroup: dbProfile.bloodGroup || prev.bloodGroup,
                allergies: dbProfile.allergies?.join(", ") || prev.allergies,
                conditions: dbProfile.conditions || prev.conditions,
                symptoms: dbProfile.symptoms || prev.symptoms,
              };
              localStorage.setItem(key, JSON.stringify(updated));
              return updated;
            });
          }
        } else if (!stored) {
          // No DB profile and no stored profile, pre-fill from Clerk
          setProfile(prev => ({
            ...prev,
            fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          }));
        }

      } catch (err) {
        console.warn("Failed to fetch profile from DB", err);
      }
    };

    fetchDBProfile();
    
    return () => { isMounted = false; };
  }, [isLoaded, user, getToken]);

  const updateProfile = async (updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      if (user) {
        const key = `${STORAGE_KEY}_${user.id}`;
        localStorage.setItem(key, JSON.stringify(next));
      }
      return next;
    });

    // Sync seamlessly to backend
    if (user) {
      try {
        const token = await getToken();
        // Transform full name nicely
        const nameParts = (updates.fullName || profile.fullName || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        // Transform allergies string back to array if needed
        const allergiesArray = (updates.allergies || profile.allergies || "").split(",").map(a => a.trim()).filter(a => a);
        
        const payload = {
          ...updates,
          firstName: updates.firstName || firstName,
          lastName: updates.lastName || lastName,
          allergies: allergiesArray,
        };

        fetch('http://localhost:5000/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ...profile, ...payload })
        }).catch(err => console.warn("Background DB sync failed", err));
      } catch (e) {
        console.warn("Failed to get token for sync", e);
      }
    }
  };

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "true");
    }
    updateProfile({ onboardingComplete: true });
  };

  const isOnboardingComplete = () => {
    if (!user) return false;
    return localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`) === "true";
  };

  const resetProfile = () => {
    if (user) {
      localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
      localStorage.removeItem(`${ONBOARDING_KEY}_${user.id}`);
    }
    setProfile(defaultProfile);
  };

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        updateProfile,
        completeOnboarding,
        isOnboardingComplete,
        resetProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}
