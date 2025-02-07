"use client";

import { CloseIcon } from "@/components/CloseIcon";
import { NoAgentNotification } from "@/components/NoAgentNotification";
import Visualizer from "@/components/Visualizer";
import {
  AgentState,
  DisconnectButton,
  LiveKitRoom,
  RoomAudioRenderer,
  TrackReference,
  TrackReferenceOrPlaceholder,
  VoiceAssistantControlBar,
  useChat,
  useLocalParticipant,
  useTrackTranscription,
  useVoiceAssistant,
} from "@livekit/components-react";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import { AnimatePresence, motion } from "framer-motion";
import { LocalParticipant, MediaDeviceFailure, Participant, Track, TranscriptionSegment } from "livekit-client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConnectionDetails } from "./api/connection-details/route";

export type ChatMessageType = {
  name: string;
  message: string;
  isSelf: boolean;
  timestamp: number;
};

export default function Page() {
  const [connectionDetails, updateConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined);
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [isAnimating, setIsAnimating] = useState(false);

  const onConnectButtonClicked = useCallback(async () => {
    // Generate room connection details, including:
    //   - A random Room name
    //   - A random Participant name
    //   - An Access Token to permit the participant to join the room
    //   - The URL of the LiveKit server to connect to
    //
    // In real-world application, you would likely allow the user to specify their
    // own participant name, and possibly to choose from existing rooms to join.

    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ??
      "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData = await response.json();
    updateConnectionDetails(connectionDetailsData);
  }, []);


  const voiceAssistantComponentProps = {
    agentState,
    setAgentState,
    onConnectButtonClicked,
    isAnimating,
    setIsAnimating
  }

  return (
    <main
      data-lk-theme="default"
      className="h-full grid content-center bg-white"
    >
      <LiveKitRoom
        token={connectionDetails?.participantToken}
        serverUrl={connectionDetails?.serverUrl}
        connect={connectionDetails !== undefined}
        audio={true}
        video={false}
        onMediaDeviceFailure={onDeviceFailure}
        onDisconnected={() => {
          updateConnectionDetails(undefined);
          setIsAnimating(false);
        }}
        className="grid grid-rows-[2fr_1fr] items-center bg-white"
      >
        <VoiceAssistantComponents {...voiceAssistantComponentProps} />
      </LiveKitRoom>
    </main>
  );
}

function SimpleVoiceAssistant(props: {
  onStateChange: (state: AgentState) => void,
  state: AgentState,
  audioTrack: TrackReference | undefined,
  isAnimating: boolean;
}) {
  const { state, audioTrack } = props;
  useEffect(() => {
    props.onStateChange(state);
  }, [props, state]);
  return (
    <div className=" mx-auto relative h-full">
      <Visualizer
        state={state}
        trackRef={audioTrack}
        isAnimating={props.isAnimating}
      />
    </div>
  );
}

function ControlBar(props: {
  onConnectButtonClicked: () => void;
  agentState: AgentState;
  roomTranscript: ChatMessageType[];
  setIsAnimating: (isAnimating: boolean) => void;
}) {
  const [, setLoading] = useState(false);

  const storeTranscript = useCallback(async (roomTranscript: ChatMessageType[]) => {
    try {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('.')[0];
      const response = await fetch('http://localhost:8000/transcript/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "userRoomId": "room123",
          "chapterId": 1,
          "transcript": JSON.stringify(roomTranscript),
          "accountId": 42,
          "timestamp": formattedDate
        }),
      });


      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Handle the story as needed
    } catch (error) {
      console.error('Error generating story:', error);
      setLoading(false);
    }
  }, []);

  const handleStartAConversationClicked = () => {
    props.onConnectButtonClicked();
    props.setIsAnimating(true);
  };


  /**
   * Use Krisp background noise reduction when available.
   * Note: This is only available on Scale plan, see {@link https://livekit.io/pricing | LiveKit Pricing} for more details.
   */
  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp.setNoiseFilterEnabled(true);
  }, [krisp]);

  return (
    <div className="relative h-[100px]">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="uppercase absolute left-1/2 -translate-x-1/2 px-4 py-2 mt-20 bg-black text-white rounded-md"
            onClick={() => handleStartAConversationClicked()}
          >
            Start a conversation
          </motion.button>
        )}
      </AnimatePresence>

      {/* Generate story button hidden for now */}
      {/* <AnimatePresence>
        {props.agentState === "disconnected" && props.roomTranscript.length > 1 && (
          <motion.button
            initial={{ opacity: 0, top: 50 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="bg-black uppercase absolute mt-[140px] left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-white "
            onClick={() => generateStory(props.roomTranscript)}
          >
            Generate Story 
						{loading && (
							<div className="spinner absolute left-1/2 -translate-x-1/2 top-20">
								<svg
									className="animate-spin h-5 w-5 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
									></path>
								</svg>
							</div>
						)}
          </motion.button>
        )} 
      </AnimatePresence> */}
      <AnimatePresence>
        {props.agentState !== "disconnected" &&
          props.agentState !== "connecting" && (
            <motion.div
              initial={{ opacity: 0, top: "10px" }}
              animate={{ opacity: 1, top: 0 }}
              exit={{ opacity: 0, top: "-10px" }}
              transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
              className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
              onClick={() => storeTranscript(props.roomTranscript)}
            >
              <VoiceAssistantControlBar controls={{ leave: false }} />
              <DisconnectButton>
                <CloseIcon />
              </DisconnectButton>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}


function VoiceAssistantComponents(props: {
  agentState: AgentState,
  setAgentState: (state: AgentState) => void,
  onConnectButtonClicked: () => void,
  isAnimating: boolean;
  setIsAnimating: (isAnimating: boolean) => void;
}) {
  const { setAgentState, onConnectButtonClicked, agentState, isAnimating } = props;
  const [roomTranscript, setRoomTranscript] = useState<ChatMessageType[]>([]); // State for messages

  const { state, audioTrack } = useVoiceAssistant();
  const simpleVideoAssistantProps = {
    onStateChange: setAgentState,
    state,
    audioTrack,
    isAnimating,
  }

  const chatTileContent = useMemo(() => {
    if (audioTrack) {
      return (
        <TranscriptionTile
          agentAudioTrack={audioTrack}
          setRoomTranscript={setRoomTranscript}
        />
      );
    }
    return null;
  }, [audioTrack]);

  return (
    <>
      <SimpleVoiceAssistant {...simpleVideoAssistantProps} />
      <ControlBar
        onConnectButtonClicked={onConnectButtonClicked}
        agentState={agentState}
        roomTranscript={roomTranscript}
        setIsAnimating={props.setIsAnimating}
      />
      <RoomAudioRenderer />
      <NoAgentNotification state={agentState} />
      {chatTileContent}
    </>
  )
}

function TranscriptionTile({
  agentAudioTrack,
  setRoomTranscript,
}: {
  agentAudioTrack: TrackReferenceOrPlaceholder;
  setRoomTranscript: (transcript: ChatMessageType[]) => void,
}) {
  const agentMessages = useTrackTranscription(agentAudioTrack);
  const localParticipant = useLocalParticipant();
  const localMessages = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  });

  const [transcripts, ] = useState<Map<string, ChatMessageType>>(
    new Map()
  );
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const { chatMessages, } = useChat();

  // store transcripts
  useEffect(() => {
    agentMessages.segments.forEach((s) =>
      transcripts.set(
        s.id,
        segmentToChatMessage(
          s,
          transcripts.get(s.id),
          agentAudioTrack.participant
        )
      )
    );
    localMessages.segments.forEach((s) =>
      transcripts.set(
        s.id,
        segmentToChatMessage(
          s,
          transcripts.get(s.id),
          localParticipant.localParticipant
        )
      )
    );

    const allMessages = Array.from(transcripts.values());

    for (const msg of chatMessages) {
      const isAgent =
        msg.from?.identity === agentAudioTrack.participant?.identity;
      const isSelf =
        msg.from?.identity === localParticipant.localParticipant.identity;
      let name = msg.from?.name;
      if (!name) {
        if (isAgent) {
          name = "Agent";
        } else if (isSelf) {
          name = "You";
        } else {
          name = "Unknown";
        }
      }
      allMessages.push({
        name,
        message: msg.message,
        timestamp: msg.timestamp,
        isSelf: isSelf,
      });
    }
    allMessages.sort((a, b) => a.timestamp - b.timestamp);
    setMessages(allMessages);
  }, [
    transcripts,
    chatMessages,
    localParticipant.localParticipant,
    agentAudioTrack.participant,
    agentMessages.segments,
    localMessages.segments,
  ]);

  useEffect(() => {
    // Assuming setRoomTranscript is passed from the parent
    setRoomTranscript(messages);
  }, [messages, setRoomTranscript]);
  const styles = {
    container: {
      position: 'relative' as const,
      height: '200px',
      color: 'black',
      overflow: 'scroll' as const,
      backgroundColor: 'rgb(241 241 241)',
      padding: '10px',
    },
  };

  return (
    <>
      <div style={styles.container}>
        {messages.map((message, index) => (
          <div key={index}>
            {message.name === 'Agent' ? 'Narra' : message.name} - {message.message}
          </div>
        ))}
      </div>
    </>
  );
}

function segmentToChatMessage(
  s: TranscriptionSegment,
  existingMessage: ChatMessageType | undefined,
  participant: Participant
): ChatMessageType {
  const msg: ChatMessageType = {
    message: s.final ? s.text : `${s.text} ...`,
    name: participant instanceof LocalParticipant ? "You" : "Agent",
    isSelf: participant instanceof LocalParticipant,
    timestamp: existingMessage?.timestamp ?? Date.now(),
  };
  return msg;
}