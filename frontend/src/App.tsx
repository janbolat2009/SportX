import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { AthleteDashboard } from './components/athlete/AthleteDashboard';
import { LiveCameraStudio } from './components/camera/LiveCameraStudio';
import { VideoUploadStudio } from './components/video/VideoUploadStudio';
import { CoachDashboard } from './components/coach/CoachDashboard';
import { ResearchLaboratory } from './components/research/ResearchLaboratory';

const MainAppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('athlete-dashboard');
  const [activeExerciseSlug, setActiveExerciseSlug] = useState<string>('squat');

  const handleStartLiveCamera = (exerciseSlug: string = 'squat') => {
    setActiveExerciseSlug(exerciseSlug);
    setCurrentTab('live-camera');
  };

  const handleStartVideoUpload = () => {
    setCurrentTab('video-upload');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      <main className="flex-1 pb-16">
        {currentTab === 'athlete-dashboard' && (
          <AthleteDashboard
            onStartLiveCamera={handleStartLiveCamera}
            onStartVideoUpload={handleStartVideoUpload}
          />
        )}

        {currentTab === 'live-camera' && (
          <LiveCameraStudio
            initialExerciseSlug={activeExerciseSlug}
            onBack={() => setCurrentTab('athlete-dashboard')}
            onSessionComplete={(session) => {
              setCurrentTab('athlete-dashboard');
            }}
          />
        )}

        {currentTab === 'video-upload' && (
          <VideoUploadStudio
            onBack={() => setCurrentTab('athlete-dashboard')}
          />
        )}

        {currentTab === 'coach-dashboard' && (
          <CoachDashboard />
        )}

        {currentTab === 'research-lab' && (
          <ResearchLaboratory />
        )}
      </main>

      {/* Modern Footer with Disclaimer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SportX Biomechanical AI Research Platform. Designed for young athletes and remote coaches.</p>
          <p className="max-w-md text-right text-[11px] text-slate-500">
            <span className="text-amber-400 font-semibold">Important Principle:</span> SportX provides kinematic movement deviation analysis and does not perform medical injury diagnoses.
          </p>
        </div>
      </footer>
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
