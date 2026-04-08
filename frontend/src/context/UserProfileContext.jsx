import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

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
  const [profile, setProfile] = useState(defaultProfile);

  // Load from localStorage on mount
  useEffect(() => {
    if (!isLoaded || !user) return;
    const key = `${STORAGE_KEY}_${user.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
      } catch (e) {
        console.warn("Failed to parse stored profile:", e);
      }
    } else {
      // Pre-fill name from Clerk
      setProfile((prev) => ({
        ...prev,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      }));
    }
  }, [isLoaded, user]);

  const updateProfile = (updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      if (user) {
        const key = `${STORAGE_KEY}_${user.id}`;
        localStorage.setItem(key, JSON.stringify(next));
      }
      return next;
    });
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
