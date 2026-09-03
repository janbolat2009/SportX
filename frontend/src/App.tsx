import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, useTranslation } from "./i18n/LanguageContext";
import { Navbar } from "./components/layout/Navbar";
import { MobileNav } from "./components/layout/MobileNav";
import { AthleteDashboard } from "./components/athlete/AthleteDashboard";
import { TrainLibraryView } from "./components/exercise/TrainLibraryView";
import { ProgressView } from "./components/athlete/ProgressView";
import { NutritionView } from "./components/athlete/NutritionView";
import { SleepView } from "./components/athlete/SleepView";
import { AIAssistantView } from "./components/athlete/AIAssistantView";
import { LiveCameraStudio } from "./components/camera/LiveCameraStudio";
import { VideoUploadStudio } from "./components/video/VideoUploadStudio";
import { CoachDashboard } from "./components/coach/CoachDashboard";
import { ProfileView } from "./components/profile/ProfileView";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { CoachRoute } from "./components/auth/CoachRoute";
import { NightlightModal } from "./components/common/NightlightModal";

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  // Default to train tab for new unauthenticated visitors
  const [currentTab, setCurrentTab] = useState<string>("train");
  const [activeExerciseSlug, setActiveExerciseSlug] = useState<string>("squat");
  const [showNightlight, setShowNightlight] = useState(false);

  const isTrainer = user?.role === "coach" || user?.role === "trainer";

  // Automatically land trainer on coach dashboard when logging in
  useEffect(() => {
    if (isAuthenticated && isTrainer) {
      if (currentTab === "train" || currentTab === "home") {
        setCurrentTab("coach");
      }
    }
  }, [isAuthenticated, isTrainer]);

  const handleStartLiveCamera = (exerciseSlug: string = "squat") => {
    setActiveExerciseSlug(exerciseSlug);
    setCurrentTab("live-camera");
  };

  const handleStartVideoUpload = () => {
    setCurrentTab("video-upload");
  };

  const isCameraStudioActive = currentTab === "live-camera";

  return (
    <div className="min-h-screen bg-surface-bg text-surface-text flex flex-col font-sans selection:bg-brand-500 selection:text-black overflow-x-hidden transition-colors duration-200">
      
      {/* Top Desktop & Mobile Header (Hidden in Live Camera Studio for maximum viewport) */}
      {!isCameraStudioActive && (
        <Navbar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* Main View Router */}
      <main className={`flex-1 w-full max-w-full overflow-x-hidden ${!isCameraStudioActive ? "pb-20 md:pb-8" : ""}`}>
        
        {/* Train Tab (Publicly accessible muscle selector & exercise library) */}
        {currentTab === "train" && (
          <TrainLibraryView
            onStartLiveCamera={handleStartLiveCamera}
            onStartVideoUpload={handleStartVideoUpload}
          />
        )}

        {/* Home Tab (Dashboard for logged in athletes) */}
        {currentTab === "home" && (
          <ProtectedRoute>
            <AthleteDashboard
              onStartLiveCamera={handleStartLiveCamera}
              onStartVideoUpload={handleStartVideoUpload}
            />
          </ProtectedRoute>
        )}

        {/* Live Camera Studio (Direct real-time technique analysis) */}
        {currentTab === "live-camera" && (
          <LiveCameraStudio
            initialExerciseSlug={activeExerciseSlug}
            onBack={() => setCurrentTab("train")}
            onSessionComplete={() => {
              if (isAuthenticated) {
                setCurrentTab("progress");
              } else {
                setCurrentTab("train");
              }
            }}
          />
        )}

        {/* Video Upload Studio */}
        {currentTab === "video-upload" && (
          <ProtectedRoute>
            <VideoUploadStudio
              onBack={() => setCurrentTab("train")}
            />
          </ProtectedRoute>
        )}

        {/* Progress & History Tab (Available for athletes & trainers) */}
        {currentTab === "progress" && (
          <ProtectedRoute>
            <ProgressView />
          </ProtectedRoute>
        )}

        {/* Nutrition Tracking Tab */}
        {currentTab === "nutrition" && (
          <ProtectedRoute>
            <NutritionView />
          </ProtectedRoute>
        )}

        {/* Sleep Insights Tab */}
        {currentTab === "sleep" && (
          <ProtectedRoute>
            <SleepView />
          </ProtectedRoute>
        )}

        {/* AI Assistant Tab */}
        {currentTab === "assistant" && (
          <ProtectedRoute>
            <AIAssistantView />
          </ProtectedRoute>
        )}

        {/* Trainer Hub / Coach Center */}
        {currentTab === "coach" && (
          <CoachRoute>
            <CoachDashboard />
          </CoachRoute>
        )}

        {/* Profile & Settings Tab */}
        {currentTab === "profile" && (
          <ProfileView />
        )}

      </main>

      {/* Mobile Bottom Navigation (Hidden in Camera Studio) */}
      {!isCameraStudioActive && (
        <MobileNav
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* Minimal Footer */}
      {!isCameraStudioActive && (
        <footer className="hidden md:block border-t border-surface-border bg-surface-card py-6 px-4 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
            <p>{t("brand.footer")}</p>
            <p className="text-[11px] text-zinc-500">
              <span className="text-brand-400 font-semibold">{t("brand.principle")}</span>
            </p>
          </div>
        </footer>
      )}

      {/* Nightlight Notification Widget */}
      <NightlightModal
        isOpen={showNightlight}
        onClose={() => setShowNightlight(false)}
        onNavigateToSleep={() => setCurrentTab("sleep")}
      />

    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
