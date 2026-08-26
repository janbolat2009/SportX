import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { AthleteDashboard } from './components/athlete/AthleteDashboard';
import { ProgressView } from './components/athlete/ProgressView';
import { LiveCameraStudio } from './components/camera/LiveCameraStudio';
import { VideoUploadStudio } from './components/video/VideoUploadStudio';
import { CoachDashboard } from './components/coach/CoachDashboard';
import { ResearchLaboratory } from './components/research/ResearchLaboratory';
import { ProfileView } from './components/profile/ProfileView';

const MainAppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
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
    <div className="min-h-screen bg-surface-bg text-zinc-100 flex flex-col font-sans selection:bg-brand-500 selection:text-black">
      
      {/* Top Desktop & Mobile Header (Hidden in Live Camera Studio for maximum viewport) */}
      {!isCameraStudioActive && (
        <Navbar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* Main View Router */}
      <main className={`flex-1 ${!isCameraStudioActive ? 'pb-20 md:pb-8' : ''}`}>
        
        {/* Home Tab */}
        {currentTab === 'home' && (
          <AthleteDashboard
            onStartLiveCamera={handleStartLiveCamera}
            onStartVideoUpload={handleStartVideoUpload}
          />
        )}

        {/* Train Tab (Direct Exercise Studio Selector) */}
        {currentTab === 'train' && (
          <AthleteDashboard
            onStartLiveCamera={handleStartLiveCamera}
            onStartVideoUpload={handleStartVideoUpload}
          />
        )}

        {/* Live Camera Studio */}
        {currentTab === 'live-camera' && (
          <LiveCameraStudio
            initialExerciseSlug={activeExerciseSlug}
            onBack={() => setCurrentTab('home')}
            onSessionComplete={() => setCurrentTab('progress')}
          />
        )}

        {/* Video Upload Studio */}
        {currentTab === 'video-upload' && (
          <VideoUploadStudio
            onBack={() => setCurrentTab('home')}
          />
        )}

        {/* Progress & History Tab */}
        {currentTab === 'progress' && (
          <ProgressView />
        )}

        {/* Coach Hub */}
        {currentTab === 'coach' && (
          <CoachDashboard />
        )}

        {/* Research Laboratory Tab */}
        {currentTab === 'research' && (
          <ResearchLaboratory />
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
          userRole={user?.role}
        />
      )}

      {/* Minimal Footer */}
      {!isCameraStudioActive && (
        <footer className="hidden md:block border-t border-surface-border bg-surface-card/60 py-5 px-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
            <p>© 2026 SportX Biomechanical AI Platform. Engineered for young athletes & remote coaches.</p>
            <p className="text-[11px] text-zinc-500">
              <span className="text-brand-400 font-semibold">Objective Principle:</span> Analyzes kinematic movement patterns without medical injury diagnoses.
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
