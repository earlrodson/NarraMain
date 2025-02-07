"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  AgentState,
  TrackReferenceOrPlaceholder,
} from "@livekit/components-react";

interface VisualizerProps {
  state: AgentState;
  trackRef: TrackReferenceOrPlaceholder | undefined;
  isAnimating: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({
  state,
  trackRef,
  isAnimating,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const track = trackRef?.publication?.track;
    if (!track || track.kind !== "audio") {
      console.warn("Visualizer only works with audio tracks.");
      return;
    }
    const initializeAnalyser = () => {
      const audioContext = new (window.AudioContext || window.AudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(
        new MediaStream([track.mediaStreamTrack])
      );
      source.connect(analyser);

      return { audioContext, analyser };
    };

    // Main visualizer drawing logic
    const drawVisualizer = (
      ctx: CanvasRenderingContext2D,
      analyser: AnalyserNode,
      canvas: HTMLCanvasElement,
      dataArray: Uint8Array<ArrayBuffer>
    ) => {
      const draw = () => {
        if (!analyser || !ctx || !canvas) return;

        // Get frequency data
        analyser.getByteFrequencyData(dataArray);

        // Calculate dynamic scale based on frequency amplitude
        const maxFrequency = Math.max(...Array.from(dataArray));
        const newScaleFactor = (maxFrequency / 450) * 0.5 + 1;
        setScaleFactor(newScaleFactor);

        // Adjust canvas size dynamically
        const newSize = Math.min(200 * scaleFactor);
        canvas.width = newSize;
        canvas.height = newSize;

        // Clear canvas and draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Continue animation
        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    };

    // Initialization
    const { audioContext, analyser } = initializeAnalyser();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    if (ctx && canvas) {
      analyserRef.current = analyser;
      drawVisualizer(ctx, analyser, canvas, dataArray);
    }

    // Cleanup resources
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContext) audioContext.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackRef]);

  const getCircumference = (radius: number) => 2 * Math.PI * radius;

  return (
    <div className="h-full w-full relative flex items-center justify-center z-0">
      {/* Outer Circle3 */}
      <svg
        width="350"
        height="350"
        className="transform rotate-[90deg] absolute"
      >
        <circle
          cx="175"
          cy="175"
          r={isAnimating ? 165 : 155}
          stroke={"#FCF5F0"}
          strokeWidth="17"
          fill="none"
          strokeDasharray={getCircumference(isAnimating ? 165 : 155)}
          strokeDashoffset={
            isAnimating ? "0" : getCircumference(isAnimating ? 165 : 155) / 2
          }
          className="transition-all duration-[1300ms] ease-in-out"
        />
      </svg>

      {/* Outer Circle2 */}
      <svg
        width="350"
        height="350"
        className="transform rotate-[120deg] absolute"
      >
        <circle
          cx="175"
          cy="175"
          r={isAnimating ? 135 : 125}
          stroke={scaleFactor > 1.2 && isAnimating ? "#A7E7B9" : "#FCF5F0"}
          strokeWidth="17"
          fill="none"
          strokeDasharray={getCircumference(isAnimating ? 135 : 125)}
          strokeDashoffset={
            isAnimating ? "0" : getCircumference(isAnimating ? 135 : 125) / 2
          }
          className="transition-all duration-[1200ms] ease-in-out"
        />
      </svg>

      {/* Outer Circle */}
      <svg
        width="350"
        height="350"
        className="transform rotate-[110deg] absolute"
      >
        <circle
          cx="175"
          cy="175"
          r={isAnimating ? 105 : 95}
          stroke={scaleFactor > 1.2 && isAnimating ? "#A7E7B9" : "#FCF5F0"}
          strokeWidth="17"
          fill="none"
          strokeDasharray={getCircumference(isAnimating ? 105 : 95)}
          strokeDashoffset={
            isAnimating ? "0" : getCircumference(isAnimating ? 105 : 95) / 2
          }
          className="transition-all duration-[1100ms] ease-in-out"
        />
      </svg>

      {/* Inner Circle */}
      <svg
        width="350"
        height="350"
        className="transform rotate-[90deg] relative"
      >
        <circle
          cx="175"
          cy="175"
          r={isAnimating ? 75 : 65}
          stroke={scaleFactor > 1.2 && isAnimating ? "#A7E7B9" : "#FCF5F0"}
          strokeWidth="17"
          fill="none"
          strokeDasharray={getCircumference(isAnimating ? 75 : 65)}
          strokeDashoffset={
            isAnimating ? "0" : getCircumference(isAnimating ? 75 : 65) / 2
          }
          className="transition-all duration-[1000ms] ease-in-out"
        />
      </svg>

      {/* Core */}
      <div
        className={`flex flex-col justify-center rounded-full ${
          scaleFactor === 1 && "transition-all duration-1000 delay-300"
        } ${
          state === "listening" && "animate-heartbeat"
        } absolute z-10 bg-gradient-to-t from-[#16A34A] max-h-[105px] max-w-[105px] via-[#A7E7B9] to-[#FCF5F0]`}
        style={{
          width: `${isAnimating ? 80 * scaleFactor : "0"}px`,
          height: `${isAnimating ? 80 * scaleFactor : "0"}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={80 * scaleFactor}
          height={80 * scaleFactor}
          style={{
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
  );
};

export default Visualizer;
