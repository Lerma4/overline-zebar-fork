import React from 'react';
import { MediaOutput } from 'zebar';
import { SkipBack, SkipForward } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ConditionalPanel } from '../common/ConditionalPanel';
import { ProgressBar } from './components/ProgressBar';
import { Status } from './components/Status';
import { TitleDetails } from './components/TitleDetails';
import { Chip } from '@overline-zebar/ui';

export const TitleDetailsMemo = React.memo(TitleDetails);

type MediaProps = {
  media: MediaOutput | null;
};
// To allow cycling of Media sessions with Alt+Click we have to handle our own current session
// This is why there are two current sessions defined here:
// zebarCurrentSession: The actual session given from the Media provider.
// currentSession: Our own local state of Zebar session.
// This is not ideal and hopefully future Zebar releases will provide a way to change sessions internally.
export default function Media({ media }: MediaProps) {
  if (!media) return;
  const {
    allSessions,
    togglePlayPause,
    next,
    previous,
    currentSession: zebarCurrentSession,
  } = media;
  const zebarCurrentSessionIdx = allSessions.findIndex(
    (s) => s.sessionId === zebarCurrentSession?.sessionId
  );
  const [currentSessionIdx, setCurrentSessionIdx] = React.useState<number>(
    zebarCurrentSessionIdx === -1 ? 0 : zebarCurrentSessionIdx
  );
  const currentSession = allSessions[currentSessionIdx];

  const handlePlayPause = (e: React.MouseEvent, currentSessionIdx: number) => {
    const currentSession = allSessions[currentSessionIdx];

    if (e.shiftKey) {
      previous({ sessionId: currentSession?.sessionId });
      return;
    }

    if (e.ctrlKey) {
      next({ sessionId: currentSession?.sessionId });
      return;
    }

    if (e.altKey) {
      if (currentSessionIdx < allSessions.length - 1) {
        setCurrentSessionIdx((prev) => prev + 1);
      } else {
        setCurrentSessionIdx(0);
      }
      return;
    }

    if (currentSession) {
      togglePlayPause({ sessionId: currentSession.sessionId });
    }
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    previous({ sessionId: currentSession?.sessionId });
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    next({ sessionId: currentSession?.sessionId });
  };

  return (
    <ConditionalPanel sessionActive={!!currentSession}>
      <div className="flex items-center gap-1 h-full select-none">
        <button
          type="button"
          aria-label="Previous track"
          onClick={handlePrevious}
          className={cn(
            'flex items-center justify-center h-full w-7 rounded-2xl',
            'bg-background-deeper border border-border drop-shadow-sm',
            'hover:border-button-border active:bg-background-deeper/90',
            'transition-colors ease-in-out duration-200 cursor-pointer outline-none'
          )}
        >
          <SkipBack className="text-icon h-3 w-3" strokeWidth={3} />
        </button>

        <button
          type="button"
          aria-label="Play/pause"
          onClick={(e) => handlePlayPause(e, currentSessionIdx)}
          className="flex gap-2 cursor-pointer outline-none relative h-full"
        >
          <Chip
            className={cn(
              'relative flex gap-2 select-none cursor-pointer overflow-clip group',
              'active:bg-background-deeper/90'
            )}
          >
            <Status isPlaying={currentSession?.isPlaying ?? false} />
            <TitleDetails
              title={currentSession?.title}
              artist={currentSession?.artist}
            />

            <ProgressBar currentSession={currentSession} />
          </Chip>
        </button>

        <button
          type="button"
          aria-label="Next track"
          onClick={handleNext}
          className={cn(
            'flex items-center justify-center h-full w-7 rounded-2xl',
            'bg-background-deeper border border-border drop-shadow-sm',
            'hover:border-button-border active:bg-background-deeper/90',
            'transition-colors ease-in-out duration-200 cursor-pointer outline-none'
          )}
        >
          <SkipForward className="text-icon h-3 w-3" strokeWidth={3} />
        </button>
      </div>
    </ConditionalPanel>
  );
}
