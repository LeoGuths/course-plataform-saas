import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/plyr/theme.css';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import {
  PlyrLayout,
  plyrLayoutIcons,
} from '@vidstack/react/player/layouts/plyr';

type VideoPlayerProps = {
  videoId: string;
  autoPlay: boolean;
  onEnd?: () => void;
};

const VideoPlayer = ({ videoId, autoPlay, onEnd }: VideoPlayerProps) => {
  const userAlreadyInteracted = navigator.userActivation.hasBeenActive;

  return (
    <MediaPlayer
      title="Vídeo da Aula"
      src={`youtube/${videoId}`}
      onEnd={onEnd}
      autoPlay={autoPlay && userAlreadyInteracted}
    >
      <MediaProvider />
      <PlyrLayout icons={plyrLayoutIcons} />
    </MediaPlayer>
  );
};

export default VideoPlayer;
