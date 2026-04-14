import { Chip } from '@overline-zebar/ui';
import { AudioLines, Headphones, MonitorSpeaker } from 'lucide-react';
import * as zebar from 'zebar';

// Local machine system endpoints discovered from Windows MMDevices.
// The chip stays hidden only for these internal outputs.
const SYSTEM_ENDPOINT_GUIDS = new Set([
  '{151222f8-ee5c-4797-97da-2fbceb8d1efb}',
  '{163ef4af-7ae3-4314-b870-d22b901f2900}',
  '{311e0942-4dcc-476f-b107-42d398307722}',
  '{67e0c422-3e83-4f79-954c-ca83bda7c2ec}',
  '{c10b6527-1524-45dd-8300-139405b0e387}',
]);

function getEndpointGuid(deviceId: string) {
  const match = deviceId.match(/\{[0-9a-f-]+\}$/i);
  return match?.[0] ?? null;
}

function getOutputIcon(deviceName: string) {
  const loweredName = deviceName.toLowerCase();

  if (
    loweredName.includes('headphone') ||
    loweredName.includes('buds') ||
    loweredName.includes('hands-free')
  ) {
    return <Headphones className="h-3.5 w-3.5 text-icon" strokeWidth={3} />;
  }

  if (
    loweredName.includes('display') ||
    loweredName.includes('monitor') ||
    loweredName.includes('hdmi')
  ) {
    return (
      <MonitorSpeaker className="h-3.5 w-3.5 text-icon" strokeWidth={3} />
    );
  }

  return <AudioLines className="h-3.5 w-3.5 text-icon" strokeWidth={3} />;
}

export default function AudioOutputChip({
  audio,
}: {
  audio: zebar.AudioOutput | null;
}) {
  const playbackDevice = audio?.defaultPlaybackDevice ?? null;

  if (!playbackDevice) return null;

  const endpointGuid = getEndpointGuid(playbackDevice.deviceId);
  if (!endpointGuid) return null;
  if (SYSTEM_ENDPOINT_GUIDS.has(endpointGuid)) return null;

  return (
    <Chip className="max-w-[220px] gap-1.5 px-3">
      {getOutputIcon(playbackDevice.name)}
      <span className="max-w-[170px] truncate text-xs text-text">
        {playbackDevice.name}
      </span>
    </Chip>
  );
}
