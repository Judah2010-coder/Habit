import { UserProfile, UserHabit, UserThreat } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import PilotAvatarSection from './PilotAvatarSection';

interface ArenaViewProps {
  user: UserProfile;
  habits: UserHabit[];
  threats: UserThreat[];
  onCompleteHabit: (habitId: string) => Promise<void>;
  onClaimDefeatReward: (threatId: string) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  loadingAction: string | null;
}

export default function ArenaView({
  user,
  habits,
  threats,
  onCompleteHabit,
  onClaimDefeatReward,
  onNotify,
  loadingAction,
}: ArenaViewProps) {
  // Active enrolled threat
  const activeThreat = threats.find((t) => !t.defeated && t.unlocked) || threats[0];
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // Voice Logging states
  const [voiceInputText, setVoiceInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [voiceAnalysisExplanation, setVoiceAnalysisExplanation] = useState<string | null>(null);

  // Gratitude Mood Triage modal states
  const [openGratitudeModal, setOpenGratitudeModal] = useState(false);
  const [journalContent, setJournalContent] = useState('');
  const [isAnalyzingMood, setIsAnalyzingMood] = useState(false);
  const [moodResult, setMoodResult] = useState<{
    sentiment: string;
    explanation: string;
    suggestHabit: boolean;
    suggestedHabitId: string;
  } | null>(null);

  // Video Form Correction states
  const [selectedExercise, setSelectedExercise] = useState<'squat' | 'pushup' | 'sport'>('squat');
  const [videoFileBase64, setVideoFileBase64] = useState<string>('');
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [videoAnalysisResult, setVideoAnalysisResult] = useState<{
    exerciseDetected: string;
    score: number;
    verified: boolean;
    tips: string[];
    jointAngles: {
      kneeFlexion: string;
      spineAlignment: string;
      hipJoint: string;
    };
    explanation: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Helper YMD string for comparison to check if completed today
  const todayYMD = new Date().toISOString().split('T')[0];

  const handlePresetSelect = (presetType: string) => {
    setVideoAnalysisResult(null);
    if (presetType === 'perfect_squat') {
      setVideoFileName('Simulated_Space_Squat_Perfect.mp4');
      setSelectedExercise('squat');
      // Set a valid minimal base64 block so is valid to send to endpoint
      setVideoFileBase64('data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wZDJhdmMxAAADp2ZyZWU='); 
    } else if (presetType === 'bad_squat') {
      setVideoFileName('Simulated_Space_Squat_TiltSpine.mp4');
      setSelectedExercise('squat');
      setVideoFileBase64('data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wZDJhdmMxAAADp2ZyZWU=');
    } else if (presetType === 'perfect_pushup') {
      setVideoFileName('Simulated_Space_Pushup_Neutral.mp4');
      setSelectedExercise('pushup');
      setVideoFileBase64('data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wZDJhdmMxAAADp2ZyZWU=');
    } else if (presetType === 'bad_pushup') {
      setVideoFileName('Simulated_Space_Pushup_HipDroop.mp4');
      setSelectedExercise('pushup');
      setVideoFileBase64('data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wZDJhdmMxAAADp2ZyZWU=');
    }
    onNotify('Simulated cockpit video telemetry loaded. Ready to uplink transmission.', 'info');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      onNotify('Transmission file size exceeds ship limits of 20MB.', 'error');
      return;
    }
    setVideoFileName(file.name);
    setVideoAnalysisResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideoFileBase64(event.target.result as string);
        onNotify(`Video recording "${file.name}" loaded successfully into memory. Ready to analyze.`, 'success');
      }
    };
    reader.onerror = () => {
      onNotify('Failed to read cockpit recording transmission.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleTriggerVideoAnalysis = async () => {
    if (!videoFileBase64 || isAnalyzingVideo) return;
    setIsAnalyzingVideo(true);
    setVideoAnalysisResult(null);

    try {
      const response = await fetch('/api/ai/video-form-correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoData: videoFileBase64,
          mimeType: videoFileName.endsWith('.mov') ? 'video/quicktime' : 'video/mp4',
          exerciseName: selectedExercise
        })
      });

      if (!response.ok) {
        throw new Error('Spaceship kinematics analyzer reported an orbital telemetry exception.');
      }

      const data = await response.json();
      setVideoAnalysisResult(data);

      if (data.score >= 55 || data.verified) {
        onNotify(`Kinematic assessment approved! Form Score: ${data.score}/100. Verifying active workout...`, 'success');
        
        // Find unfinished health habits: "daily_workout", "exercise", "walk_15_mins"
        const fitnessHabits = habits.filter(h => h.category === 'health');
        const unfinished = fitnessHabits.find(h => h.lastCompletedYMD !== todayYMD);

        if (unfinished) {
          onNotify(`AI verified workout! Automatically completing: "${unfinished.name}" (+XP)`, 'success');
          await onCompleteHabit(unfinished.id);
        } else if (fitnessHabits.length > 0) {
          onNotify(`Workout verified with high performance form score! All active health registers were already green during this cycle.`, 'success');
        } else {
          onNotify(`Workout verified with score: ${data.score}! Keep it up.`, 'success');
        }
      } else {
        onNotify(`Kinematic review flagged safety anomalies. Form Score: ${data.score}/100. Review recommended corrections.`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      onNotify('Failed to transmit kinematics data to space matrix. Re-routing signals...', 'error');
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  const handleToggle = async (habit: UserHabit) => {
    if (loadingAction) return;

    const completedToday = habit.lastCompletedYMD === todayYMD;
    if (completedToday) {
      onNotify('Operations for this cycle have already been successfully complete!', 'info');
      return;
    }

    // Intercept Gratitude Log to enforce neural mood analysis journaling
    if (habit.id === 'gratitude_log') {
      setJournalContent('');
      setMoodResult(null);
      setOpenGratitudeModal(true);
      return;
    }

    setCheckingId(habit.id);
    try {
      await onCompleteHabit(habit.id);
    } catch (error) {
      console.error(error);
      onNotify('System failed to process completed habit logic.', 'error');
    } finally {
      setCheckingId(null);
    }
  };

  const handleClaimReward = async () => {
    if (!activeThreat || loadingAction) return;
    try {
      await onClaimDefeatReward(activeThreat.id);
    } catch (e) {
      onNotify('System error while claiming salvage credits.', 'error');
    }
  };

  // Web Speech recognition function for tactical voice typing
  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onNotify("Your vessel's display matrix does not support voice recognition. Please manually log report.", "info");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      onNotify("Vocal cockpit uplink online. Recording report...", "info");
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setVoiceInputText(text);
      onNotify(`Uplink captured: "${text}"`, "success");
    };

    recognition.onerror = (event: any) => {
      console.error(event);
      setIsListening(false);
      onNotify("Vocal telemetry disrupted. Please try again or recheck visor coordinates.", "error");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Submit report to server-side Gemini parsing endpoint
  const handleTransmitVoiceReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceInputText.trim() || isAnalyzingVoice) return;

    setIsAnalyzingVoice(true);
    setVoiceAnalysisExplanation(null);

    // Filter out already completed habits from candidate matches to keep it clean, but pass valid candidates
    const validHabits = habits.map(h => ({
      id: h.id,
      name: h.name,
      category: h.category,
      difficulty: h.difficulty
    }));

    try {
      const response = await fetch('/api/ai/voice-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speech: voiceInputText,
          habits: validHabits
        })
      });

      if (!response.ok) {
        throw new Error('Spaceship telemetry parser returned an invalid response code.');
      }

      const data = await response.json();
      if (data.matchedHabitId) {
        // Resolve matching habit
        const matchedHabit = habits.find(h => h.id === data.matchedHabitId);
        if (matchedHabit) {
          const completedToday = matchedHabit.lastCompletedYMD === todayYMD;
          if (completedToday) {
            setVoiceAnalysisExplanation(`Mainframe matched your verbal report to [${matchedHabit.name}], but this protocol has already been initialized and executed for this cycle.`);
            onNotify(`Report resolved to [${matchedHabit.name}]: Already completed.`, 'info');
          } else {
            // Trigger completion
            setVoiceAnalysisExplanation(`Mainframe logs: ${data.explanation || 'Protocol parsed successfully.'}`);
            onNotify(`Tactical voice logging successful: completed '${matchedHabit.name}'!`, 'success');
            await onCompleteHabit(matchedHabit.id);
            setVoiceInputText('');
          }
        }
      } else {
        setVoiceAnalysisExplanation("Mainframe Error: Could not correlate report to any active spaceship protocol. Please formulate parameters again clearly (e.g. 'did a raw squat exercise set', 'walked 15 mins around space station', 'researched skill maps').");
        onNotify("Voice parse failed: No correlation found.", "error");
      }
    } catch (err: any) {
      console.error(err);
      onNotify("Neural telemetry uplink lost.", "error");
      setVoiceAnalysisExplanation("Error compiling vocal interface feed.");
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  // Submit Journal Entry to Mood Triage endpoint
  const handleAnalyzeMoodJournal = async () => {
    if (!journalContent.trim() || isAnalyzingMood) return;

    setIsAnalyzingMood(true);
    try {
      const response = await fetch('/api/ai/mood-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journalEntry: journalContent })
      });

      if (!response.ok) {
        throw new Error('Mood analyzer query failed.');
      }

      const data = await response.json();
      setMoodResult(data);
      onNotify("Neural triage diagnostic scan complete.", "success");
    } catch (e) {
      console.error(e);
      onNotify("Error accessing neural scanners.", "error");
    } finally {
      setIsAnalyzingMood(false);
    }
  };

  // Complete the gratitude journal protocol
  const handleCompleteGratitudeProtocol = async () => {
    try {
      await onCompleteHabit('gratitude_log');
      setOpenGratitudeModal(false);
    } catch (e) {
      onNotify("Error storing diagnostic profile logs.", "error");
    }
  };

  // Auto execute recommended mental sync mindfulness block
  const handleTriggerMindfulnessOverride = async () => {
    if (!moodResult?.suggestedHabitId) return;
    const target = habits.find(h => h.id === moodResult.suggestedHabitId);
    if (target) {
      if (target.lastCompletedYMD === todayYMD) {
        onNotify("Mental Sync protocol has already been operational in this orbital rotation cycle.", "info");
        return;
      }
      try {
        await onCompleteHabit(target.id);
        onNotify("Tactical backup mindfulness override initialized. Sector shields buffered!", "success");
      } catch (e) {
        onNotify("Failed to engage backups.", "error");
      }
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Pilot Avatar Section */}
      <PilotAvatarSection user={user} />

      {/* Active Threat Container */}
      <section className="relative">
        {activeThreat ? (
          <div className="glass-card rounded-2xl overflow-hidden p-4 border border-primary/20 shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-error font-semibold tracking-wider uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                ACTIVE THREAT: {activeThreat.defeated ? 'ELIMINATED' : 'DETECTED'}
              </span>
              <span className="font-mono text-xs text-on-surface-variant/80">LVL 0{activeThreat.level}</span>
            </div>

            {/* Cinematic visual of the boss */}
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#0d0e11] flex items-center justify-center group border border-outline-variant/20">
              <img
                alt={activeThreat.name}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  activeThreat.defeated ? 'grayscale opacity-25 brightness-50' : 'opacity-80 group-hover:scale-105'
                }`}
                src={
                  activeThreat.id === 'scavenger_swarm'
                    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMlioMhSagnAnVoNK_u7FPC5KpaphHFdxL41swON-3vkrbb26jLfGMN9ZD9aJuMtwaeni9XR8PTI1qgv6dPKAxro69lpPLfDS8CNLy3_O5GXmMAK3QvZ9lOjiGasjoPledudHfX0FAoqjiQ3i25lyhlicoU5NrUhuGhWH9GlbJNlcbEA25D9MngjSUXd3uMe1D090gC6Oy8AcQxaxZ2tmCwOf2lD8VU0diRnb3pPqdr6LaIVlJYTlGNQ_Nk5ciuOMmKrzsfpsP6_I'
                    : activeThreat.id === 'void_stalker'
                    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl-hvxfiHF_mQxYvEJqZ_KT1QshSiC0c_NU-s9tBNg_StA4dO4TLUdjrde3j52tvS8IvU6Pv5CsFUDYJT6NcZ60fEnCvIvtHEUR8eGyYx_eo3nCHrtTluPy03pqQKlGOlrIVwqyXAPV--Td5UkAFbGVIpfApz6i_OhsV_Ljhe6dG_nCXopEpfCJeYf4uYdYows8GXWrr6pa7bROUuyiKnwCKcz1wTJM6rdyKaIPMHypH2owb92NKQpnhPJVVygEBb_pDKaBXecRVg'
                    : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUPhQ4If1FdAS_stNEQk2LLZpSVPTtgKJ41M6oi3FJSz5G0T4ZoDSaPAPYLjOmBDrHlIX7i8b7wmEHf2sYsJoZkjwnrMOfr2H3yyRAUT4zgpY3ajTLEc9_R8J7Snm0UgBkMlVHdoHhIawZsT2u6Y-tXfKWKWkOac5KqZwtGk-DZo17nSOebybPH690xnam0pmMEgOuWy5O5BodqraBgctAJX4C2n5bqpORQhCYDK3-XIuq2kTFXGmWdEeE16x_TtubZjluIPUsYaQ'
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e11] via-transparent to-transparent"></div>

              {/* Holographic scanner bars */}
              {!activeThreat.defeated && <div className="absolute inset-0 xp-bar-scanner opacity-10"></div>}

              <div className="absolute bottom-4 left-4 right-4 text-center">
                <h2 className="font-display text-xl font-bold text-on-surface tracking-wide uppercase">
                  {activeThreat.name}
                </h2>
                {activeThreat.defeated && (
                  <span className="inline-block mt-1 bg-green-500/20 text-green-300 font-mono text-[10px] px-3 py-0.5 rounded-full border border-green-500/40 animate-pulse">
                    THREAT DEACTIVATED
                  </span>
                )}
              </div>
            </div>

            {/* Integrity Status */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-[10px] text-on-surface-variant px-1">
                <span>STRUCTURAL INTEGRITY</span>
                <span className={activeThreat.defeated ? 'text-green-400' : 'text-error'}>
                  {activeThreat.integrity} / {activeThreat.maxIntegrity} HP
                </span>
              </div>
              <div className="h-3 w-full bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant/30">
                <div
                  className={`h-full transition-all duration-300 rounded-full relative ${
                    activeThreat.defeated ? 'bg-green-500/40' : 'bg-gradient-to-r from-error/60 to-error'
                  }`}
                  style={{ width: `${(activeThreat.integrity / activeThreat.maxIntegrity) * 100}%` }}
                >
                  {!activeThreat.defeated && <div className="xp-bar-scanner absolute inset-0 opacity-40"></div>}
                </div>
              </div>
            </div>

            {/* Post Defeat salvage button */}
            {activeThreat.defeated && (
              <button
                onClick={handleClaimReward}
                disabled={!!loadingAction}
                className="w-full mt-2 bg-green-500/10 cursor-pointer border border-green-500/35 py-3 rounded-xl font-display font-bold text-xs text-green-300 uppercase tracking-widest hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm animate-bounce">military_tech</span>
                CLAIM SCRAP METAL &amp; SALVAGE (+15 Crystals)
              </button>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 text-center border border-outline-variant/20">
            <p className="font-mono text-xs text-on-surface-variant">Scanning for anomalous mechanical signals...</p>
          </div>
        )}
      </section>

      {/* AI Voice Uplink Transmitter Console */}
      <section className="glass-card rounded-2xl p-4 border border-secondary/30 bg-secondary/[0.04] space-y-4">
        <div className="flex justify-between items-center border-b border-secondary/15 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary animate-pulse text-lg">radio</span>
            <span className="font-mono text-[10px] text-secondary font-bold uppercase tracking-wider">
              COCKPIT VOCAL REPORT LINK
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#adc6ff]/50">AI PARSER ACTIVE</span>
        </div>

        <form onSubmit={handleTransmitVoiceReport} className="space-y-3">
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Talk or type report (e.g. 'ran for 20 mins', 'eating chicken salad')"
                value={voiceInputText}
                onChange={(e) => setVoiceInputText(e.target.value)}
                className="w-full bg-surface-container-lowest text-xs text-on-surface placeholder:text-on-surface-variant/40 rounded-xl px-4 py-3 border border-outline-variant/30 tracking-wide focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={startVoiceRecording}
                className={`absolute right-2 top-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-error/20 text-error animate-pulse'
                    : 'bg-surface-container-high text-secondary hover:bg-secondary/15'
                }`}
                title="Speak to record text"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: `"${isListening ? 'FILL' : 'wght'}" ${isListening ? '1' : '300'}` }}>
                  mic
                </span>
              </button>
            </div>
            <button
              type="submit"
              disabled={isAnalyzingVoice || !voiceInputText.trim()}
              className="px-4 bg-secondary text-surface font-display text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzingVoice ? (
                <div className="w-4 h-4 rounded-full border-2 border-surface border-t-transparent animate-spin"></div>
              ) : (
                <>
                  <span>UPLINK</span>
                  <span className="material-symbols-outlined text-xs">rocket_launch</span>
                </>
              )}
            </button>
          </div>
        </form>

        {voiceAnalysisExplanation && (
          <div className="p-3 bg-surface-container-lowest text-[10px] rounded-lg border border-outline-variant/20 font-mono tracking-wide leading-relaxed text-secondary-container select-text">
            <span className="text-secondary font-bold uppercase mr-1.5">📡 TRANSMISSION DECODED:</span>
            <span>{voiceAnalysisExplanation}</span>
          </div>
        )}
      </section>

      {/* AI Kinematics & Exercise Video Form Corrector */}
      <section className="glass-card rounded-2xl p-4 border border-primary/20 bg-primary/[0.03] space-y-4">
        <div className="flex justify-between items-center border-b border-primary/15 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary animate-pulse text-lg">videocam_sensor</span>
            <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider">
              AI KINEMATICS SCANNER &amp; FITNESS MATRIX
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#adc6ff]/50">3D GYROSCOPIC CORE</span>
        </div>

        <p className="text-[11px] text-on-surface-variant font-sans leading-relaxed">
          Uplink a 10-second exercise video (squats, pushups, or sports movements) or select simulated physical cockpit telemetry to evaluate joint alignment crease vectors, secure automated workout verification, and unlock sector shield buffers.
        </p>

        {/* Exercise Type Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/25">
          {(['squat', 'pushup', 'sport'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSelectedExercise(type);
                setVideoAnalysisResult(null);
              }}
              className={`py-1.5 rounded-lg font-mono text-[10px] text-center uppercase tracking-wider font-semibold cursor-pointer transition-all ${
                selectedExercise === type
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {type === 'squat' ? '🧎‍♂️ SQUAT' : type === 'pushup' ? '🤸‍♂️ PUSHUP' : '⚽ SPORT'}
            </button>
          ))}
        </div>

        {/* Preset Simulators Area */}
        <div className="space-y-2">
          <span className="font-mono text-[9px] text-on-surface-variant/80 uppercase tracking-widest block">
            🌌 TEST PRESETS (SIMULATED COCKPIT RECORDFILE)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handlePresetSelect('perfect_squat')}
              className={`p-2.5 rounded-xl text-left bg-[#0d0e11] border transition-all hover:bg-surface-container-high cursor-pointer flex flex-col gap-1 ${
                videoFileName === 'Simulated_Space_Squat_Perfect.mp4' ? 'border-green-500/55 bg-green-950/5' : 'border-outline-variant/30'
              }`}
            >
              <span className="font-mono text-[10px] text-green-400 font-bold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                Perfect Squat
              </span>
              <span className="text-[9px] text-on-surface-variant">95 Score, verified deep flexion angle</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('bad_squat')}
              className={`p-2.5 rounded-xl text-left bg-[#0d0e11] border transition-all hover:bg-surface-container-high cursor-pointer flex flex-col gap-1 ${
                videoFileName === 'Simulated_Space_Squat_TiltSpine.mp4' ? 'border-error/45 bg-error-container/5' : 'border-outline-variant/30'
              }`}
            >
              <span className="font-mono text-[10px] text-rose-300 font-bold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                Spastic Squat
              </span>
              <span className="text-[9px] text-on-surface-variant">42 Score, severe spine tilt alert</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('perfect_pushup')}
              className={`p-2.5 rounded-xl text-left bg-[#0d0e11] border transition-all hover:bg-surface-container-high cursor-pointer flex flex-col gap-1 ${
                videoFileName === 'Simulated_Space_Pushup_Neutral.mp4' ? 'border-green-500/55 bg-green-950/5' : 'border-outline-variant/30'
              }`}
            >
              <span className="font-mono text-[10px] text-green-400 font-bold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                Neutral Pushup
              </span>
              <span className="text-[9px] text-on-surface-variant">88 Score, calibrated pushup stroke</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('bad_pushup')}
              className={`p-2.5 rounded-xl text-left bg-[#0d0e11] border transition-all hover:bg-surface-container-high cursor-pointer flex flex-col gap-1 ${
                videoFileName === 'Simulated_Space_Pushup_HipDroop.mp4' ? 'border-error/45 bg-error-container/5' : 'border-outline-variant/30'
              }`}
            >
              <span className="font-mono text-[10px] text-rose-300 font-bold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                Hip Droop Pushup
              </span>
              <span className="text-[9px] text-on-surface-variant">35 Score, sagging lumbar support</span>
            </button>
          </div>
        </div>

        {/* Real file drag drop or upload */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center transition-all ${
            dragOver ? 'border-primary bg-primary/10' : 'border-outline-variant/40 bg-surface-container-lowest'
          }`}
        >
          <span className="material-symbols-outlined text-[#adc6ff] text-2xl animate-bounce mb-1">
            cloud_upload
          </span>
          <span className="font-mono text-[10px] text-on-surface font-semibold uppercase tracking-wider">
            DRAG &amp; DROP REAL WORKOUT VIDEO
          </span>
          <span className="text-[9px] text-on-surface-variant text-center mt-0.5 mb-2 select-text">
            Supports MP4, MOV, or any recording clip under 20MB.
          </span>

          <label className="py-1 px-3 bg-surface-container text-primary font-mono text-[9px] font-bold uppercase tracking-wider border border-primary/20 rounded-lg hover:bg-primary/10 transition-all cursor-pointer">
            CHOOSE RECORDING
            <input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Selected file info badge */}
        {videoFileName && (
          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-sm shrink-0">movie</span>
              <span className="font-mono text-[10px] text-on-surface truncate tracking-wide font-medium">
                {videoFileName}
              </span>
            </div>
            <button
              onClick={() => {
                setVideoFileName('');
                setVideoFileBase64('');
                setVideoAnalysisResult(null);
              }}
              className="text-[9px] font-mono hover:text-error text-on-surface-variant uppercase tracking-wider hover:underline"
            >
              CLEAR
            </button>
          </div>
        )}

        {/* Primary Uplink Trigger */}
        <button
          onClick={handleTriggerVideoAnalysis}
          disabled={!videoFileBase64 || isAnalyzingVideo}
          className="w-full h-11 bg-primary text-surface font-display text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isAnalyzingVideo ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-surface border-t-transparent animate-spin"></div>
              <span>SCANNING SPATIAL GEOMETRY...</span>
            </>
          ) : (
            <>
              <span>TRANSMIT KINEMATICS STREAM</span>
              <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
            </>
          )}
        </button>

        {/* Analysis outcome panels */}
        {videoAnalysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 border-t border-primary/15 pt-4"
          >
            {/* Form score header */}
            <div className="flex gap-4 items-center p-3.5 rounded-2xl bg-surface-container border border-[#adc6ff]/25">
              {/* Radial circle presentation */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    className="stroke-[#0d0e11]"
                    strokeWidth="4.5"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    className={videoAnalysisResult.score >= 60 ? 'stroke-green-400' : 'stroke-error'}
                    strokeWidth="4.5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - videoAnalysisResult.score / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-x-0 text-center flex flex-col leading-none">
                  <span className="font-display font-black text-sm select-text text-on-surface">{videoAnalysisResult.score}</span>
                  <span className="text-[7px] text-on-surface-variant font-mono">CORE</span>
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[9px] font-bold text-primary uppercase tracking-widest border border-primary/25 px-1.5 py-0.5 rounded bg-primary/5">
                    {videoAnalysisResult.exerciseDetected || selectedExercise.toUpperCase()}
                  </span>
                  {videoAnalysisResult.score >= 55 ? (
                    <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-300 font-mono text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]">shield_with_heart</span>
                      APPROVED
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-error/15 text-rose-300 font-mono text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]">warning</span>
                      DANGER LEVEL STRESS
                    </span>
                  )}
                </div>
                <p className="font-mono text-[9.5px] text-on-surface-variant leading-relaxed select-text">
                  {videoAnalysisResult.explanation}
                </p>
              </div>
            </div>

            {/* Joint angle calibration gauges */}
            <div className="space-y-2">
              <span className="font-mono text-[9px] text-on-surface-variant/80 uppercase tracking-widest block font-bold">
                🦾 GYROSCOPIC JOINT-CREASE TELEMETRY
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-[#0d0e11] border border-outline-variant/30 rounded-xl space-y-1">
                  <span className="font-mono text-[8px] text-on-surface-variant uppercase block">Knee/Elbow Flex</span>
                  <p className="font-mono text-[10px] text-on-surface font-semibold truncate select-text">
                    {videoAnalysisResult.jointAngles?.kneeFlexion || '90 deg'}
                  </p>
                </div>
                <div className="p-2 bg-[#0d0e11] border border-outline-variant/30 rounded-xl space-y-1">
                  <span className="font-mono text-[8px] text-on-surface-variant uppercase block">Spine Align</span>
                  <p className="font-mono text-[10px] text-on-surface font-semibold truncate select-text">
                    {videoAnalysisResult.jointAngles?.spineAlignment || 'Neutral'}
                  </p>
                </div>
                <div className="p-2 bg-[#0d0e11] border border-outline-variant/30 rounded-xl space-y-1">
                  <span className="font-mono text-[8px] text-on-surface-variant uppercase block">Hip Socket Depth</span>
                  <p className="font-mono text-[10px] text-on-surface font-semibold truncate select-text">
                    {videoAnalysisResult.jointAngles?.hipJoint || 'Passing line'}
                  </p>
                </div>
              </div>
            </div>

            {/* micro tips mapping */}
            {videoAnalysisResult.tips && videoAnalysisResult.tips.length > 0 && (
              <div className="p-3 bg-secondary/[0.03] border border-secondary/25 rounded-xl space-y-2">
                <span className="font-mono text-[9px] text-secondary font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">build</span>
                  Micro-Calibration Tips
                </span>
                <ul className="space-y-1.5 list-none pl-0">
                  {videoAnalysisResult.tips.map((tip: string, i: number) => (
                    <li key={i} className="text-[9.5px] font-sans leading-relaxed text-[#adc6ff] flex gap-1.5 select-text">
                      <span className="text-secondary select-none">[{i+1}]</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* Habit Checklist parameters */}
      <section className="space-y-3">
        <h3 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
          MISSION PARAMETERS / SECTOR HABITS
        </h3>

        <div className="space-y-3">
          {habits.map((habit) => {
            const completedToday = habit.lastCompletedYMD === todayYMD;
            const isMind = habit.category === 'mind';
            const isSkill = habit.category === 'skill';
            const colorClass = isMind ? '#adc6ff' : isSkill ? '#d9bbf1' : '#ffb597';

            // Calculate dynamic combat damage for presentation
            const baseDmg = habit.difficulty === 'easy' ? 15 : habit.difficulty === 'medium' ? 30 : 50;
            const streakBonus = (habit.streak || 0) * 3;
            let multiplier = 1.0;
            if (user.purchasedItems?.includes('quantum_warp_drive')) {
              multiplier += 0.25;
            }
            if (user.purchasedItems?.includes('deep_space_skin')) {
              multiplier += 0.15;
            }
            if (user.purchasedItems?.includes('atmospheric_shielding')) {
              multiplier += 0.10;
            }
            const calculatedDmg = Math.floor((baseDmg + streakBonus) * multiplier);

            return (
              <div
                key={habit.id}
                className={`glass-card rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 border ${
                  completedToday
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'hover:border-primary/20 hover:bg-primary-container/[0.04]'
                }`}
              >
                {/* Tactical Hexagon check indicator button */}
                <button
                  disabled={!!loadingAction || completedToday}
                  onClick={() => handleToggle(habit)}
                  className={`w-11 h-11 pointer-events-auto hexagon-shape border flex items-center justify-center transition-all duration-100 ease-in-out cursor-pointer ${
                    completedToday
                      ? 'bg-green-500/20 border-green-400/50 text-green-400 glow-accent'
                      : 'bg-surface-container border-primary/40 text-primary hover:bg-primary/10 active:scale-90'
                  }`}
                  style={{
                    boxShadow: completedToday ? '0 0 10px rgba(74, 222, 128, 0.2)' : 'none',
                  }}
                >
                  {checkingId === habit.id ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  ) : completedToday ? (
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  ) : (
                    <span className="material-symbols-outlined text-xs scale-0 transition-transform hover:scale-100 group-hover:scale-100 text-primary/40">
                      check
                    </span>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-widest font-semibold"
                      style={{ color: colorClass, borderColor: `${colorClass}20` }}
                    >
                      {habit.category}
                    </span>
                    <span className="font-mono text-[9px] text-on-surface-variant/60 uppercase">
                      {habit.difficulty}
                    </span>
                  </div>
                  <h4
                    className={`text-xs font-semibold tracking-wide truncate ${
                      completedToday ? 'text-on-surface/50 line-through' : 'text-on-surface'
                    }`}
                  >
                    {habit.name}
                  </h4>
                  {/* Combat Damage Badge */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-error/10 text-error border border-error/20 flex items-center gap-0.5 font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                      <span>{calculatedDmg} DMG</span>
                    </span>
                    {streakBonus > 0 && (
                      <span className="font-mono text-[8px] text-green-400 uppercase tracking-wider font-semibold">
                        +{streakBonus} Streak Bonus
                      </span>
                    )}
                    {multiplier > 1.0 && (
                      <span className="font-mono text-[8px] text-primary uppercase tracking-wider font-semibold">
                        +{Math.round((multiplier - 1) * 100)}% Ship Overdrive
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-xs text-primary font-bold">
                    +{habit.difficulty === 'easy' ? 5 : habit.difficulty === 'medium' ? 10 : 15} XP
                  </div>
                  <div className="flex items-center justify-end gap-1 text-secondary opacity-60">
                    <span
                      className="material-symbols-outlined text-[13px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      local_fire_department
                    </span>
                    <span className="font-mono text-[10px]">{habit.streak}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gratitude & Mood Analyzer Neural Diagnostics modal */}
      <AnimatePresence>
        {openGratitudeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur element */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0d0e11]/80 backdrop-blur-md"
              onClick={() => setOpenGratitudeModal(false)}
            />

            {/* Modal layout component */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-sm glass-card border border-[#adc6ff]/30 rounded-2xl p-5 shadow-2xl space-y-4 overflow-hidden"
            >
              <div className="absolute inset-y-0 right-0 w-24 border-r border-[#adc6ff]/5 pointer-events-none filter blur-sm"></div>

              {/* Spectral scanner loop indicator */}
              {isAnalyzingMood && <div className="absolute inset-x-0 top-0 h-1 bg-[#adc6ff] xp-bar-scanner"></div>}

              {/* Title parameters */}
              <div className="flex justify-between items-center border-b border-[#adc6ff]/15 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#adc6ff]">psychology</span>
                  <span className="font-mono text-[11px] font-bold text-[#adc6ff] uppercase tracking-wider">
                    NEURAL LINK DIAGNOSTIC JOURNAL
                  </span>
                </div>
                <button
                  onClick={() => setOpenGratitudeModal(false)}
                  className="w-6 h-6 rounded-full bg-[#adc6ff]/10 text-[#adc6ff] hover:bg-[#adc6ff]/20 text-xs flex items-center justify-center transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5">
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Log a journal entry (about 3 sentences recommended) detailing objects, people, or events you feel grateful for today. Systems scan entries for emotional diagnostics.
                </p>

                <textarea
                  disabled={isAnalyzingMood || !!moodResult}
                  rows={4}
                  placeholder={`Example: Today, I am deeply thankful for the stable sub-light engines protecting our sector. I am glad my cockpit has hot food. The stellar sights outside the viewport were incredibly serene.`}
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  className="w-full bg-[#0d0e11] text-xs font-sans p-3 rounded-xl border border-[#adc6ff]/25 focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] outline-none text-on-surface leading-normal resize-none placeholder:text-on-surface-variant/30"
                />

                {!moodResult && (
                  <button
                    onClick={handleAnalyzeMoodJournal}
                    disabled={isAnalyzingMood || !journalContent.trim()}
                    className="w-full h-11 bg-[#adc6ff] text-surface font-display text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#adc6ff]/90 cursor-pointer disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isAnalyzingMood ? (
                      <div className="w-4 h-4 rounded-full border-2 border-surface border-t-transparent animate-spin"></div>
                    ) : (
                      <>
                        <span>TRANSMIT LOG SCAN</span>
                        <span className="material-symbols-outlined text-sm">settings_input_antenna</span>
                      </>
                    )}
                  </button>
                )}

                {moodResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 border-t border-[#adc6ff]/10 pt-3"
                  >
                    <div className="p-3 rounded-xl border flex gap-3 bg-[#0d0e11] text-xs"
                         style={{
                           borderColor: moodResult.suggestHabit ? 'rgba(239, 68, 68, 0.3)' : 'rgba(74, 222, 128, 0.3)',
                           color: moodResult.suggestHabit ? '#fda4af' : '#a7f3d0'
                         }}
                    >
                      <span className="material-symbols-outlined text-lg shrink-0">
                        {moodResult.suggestHabit ? 'warning' : 'verified'}
                      </span>
                      <div className="space-y-1 font-mono text-[10px]">
                        <div className="font-bold uppercase tracking-wider">
                          HEURISTIC REPORT: {moodResult.sentiment.toUpperCase()}
                        </div>
                        <p className="leading-relaxed leading-normal mb-1.5">{moodResult.explanation}</p>
                      </div>
                    </div>

                    {/* Stress suggestions overlay */}
                    {moodResult.suggestHabit && (
                      <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl space-y-2.5">
                        <p className="font-mono text-[9px] text-rose-300 leading-normal font-semibold">
                          ⚠️ SYSTEM DISCORD DETECTED: Elevated mental fatigue logged inside ship cabin telemetry. Core shields compromised. Recommend engaging defensive countermeasures.
                        </p>
                        <button
                          onClick={handleTriggerMindfulnessOverride}
                          className="w-full py-2 bg-gradient-to-r from-red-500/10 to-red-500/25 border border-red-500/45 rounded-lg text-rose-200 text-[10px] font-mono font-bold uppercase tracking-widest hover:from-red-500/20 hover:to-red-500/35 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>self_improvement</span>
                          INITIALIZE MENTAL SYNC SECRETER OVERRIDE
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handleCompleteGratitudeProtocol}
                      className="w-full h-11 bg-green-500 text-surface font-display text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-green-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>CONFIRM DIARY SEAL (+5 XP)</span>
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
