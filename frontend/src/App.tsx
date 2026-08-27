import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { AthleteDashboard } from './components/athlete/AthleteDashboard';
import { TrainLibraryView } from './components/exercise/TrainLibraryView';
import { ProgressView } from './components/athlete/ProgressView';
import { LiveCameraStudio } from './components/camera/LiveCameraStudio';
import { VideoUploadStudio } from './components/video/VideoUploadStudio';
import { CoachDashboard } from './components/coach/CoachDashboard';
import { ProfileView } from './components/profile/ProfileView';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AthleteRoute } from './components/auth/AthleteRoute';
import { CoachRoute } from './components/auth/CoachRoute';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  // Default to train tab for new unauthenticated visitors so they see what they can train immediately
  const [currentTab, setCurrentTab] = useState<string>('train');
  const [activeExerciseSlug, setActiveExerciseSlug] = useState<string>('squat');

  const handleStartLiveCamera = (exerciseSlug: string = 'squat') => {
    setActiveExerciseSlug(exerciseSlug);
    setCurrentTab('live-camera');
  };

  const handleStartVideoUpload = () => {
    setCurrentTab('video-upload');
  };

  const isCameraStudioActive = currentTab === 'live-camera';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-brand-500 selection:text-black">
      
      {/* Top Desktop & Mobile Header (Hidden in Live Camera Studio for maximum viewport) */}
      {!isCameraStudioActive && (
        <Navbar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* Main View Router */}
      <main className={`flex-1 ${!isCameraStudioActive ? 'pb-20 md:pb-8' : ''}`}>
        
        {/* Train Tab (Publicly accessible muscle selector & exercise library) */}
        {currentTab === 'train' && (
          <TrainLibraryView
            onStartLiveCamera={handleStartLiveCamera}
            onStartVideoUpload={handleStartVideoUpload}
          />
        )}

        {/* Home Tab (Dashboard for logged in athletes) */}
        {currentTab === 'home' && (
          <ProtectedRoute>
            <AthleteDashboard
              onStartLiveCamera={handleStartLiveCamera}
              onStartVideoUpload={handleStartVideoUpload}
            />
          </ProtectedRoute>
        )}

        {/* Live Camera Studio (Direct real-time technique analysis) */}
        {currentTab === 'live-camera' && (
          <LiveCameraStudio
            initialExerciseSlug={activeExerciseSlug}
            onBack={() => setCurrentTab('train')}
            onSessionComplete={() => {
              if (isAuthenticated) {
                setCurrentTab('progress');
              } else {
                setCurrentTab('train');
              }
            }}
          />
        )}

        {/* Video Upload Studio */}
        {currentTab === 'video-upload' && (
          <ProtectedRoute>
            <VideoUploadStudio
              onBack={() => setCurrentTab('train')}
            />
          </ProtectedRoute>
        )}

        {/* Progress & History Tab */}
        {currentTab === 'progress' && (
          <AthleteRoute>
            <ProgressView />
          </AthleteRoute>
        )}

        {/* Coach Hub */}
        {currentTab === 'coach' && (
          <CoachRoute>
            <CoachDashboard />
          </CoachRoute>
        )}

        {/* Profile & Settings Tab */}
        {currentTab === 'profile' && (
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
        <footer className="hidden md:block border-t border-zinc-800 bg-zinc-950 py-5 px-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
            <p>© 2026 SportX AI Biomechanical Platform. Engineered for young athletes & coaches.</p>
            <p className="text-[11px] text-zinc-500">
              <span className="text-brand-400 font-semibold">Principle:</span> Objective kinematic technique analysis without medical injury diagnoses.
            </p>
          </div>
        </footer>
      )}

    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
