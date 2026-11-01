import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SearchAndPronounce from "@/components/speaking/SearchAndPronounce";
import { searchWord } from "@/lib/dictionary";
import { pronunciationApi } from "@/services/api";

vi.mock("@/lib/dictionary", () => ({
  searchWord: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  pronunciationApi: { analyzePronunciation: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable?: (event: { data: Blob }) => void;
  onerror?: () => void;
  onstop?: () => void;

  constructor(_stream: MediaStream) {}

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob([new Uint8Array(2000)], { type: this.mimeType }) });
    this.onstop?.();
  }
}

describe("Search & Pronounce", () => {
  const stopTrack = vi.fn();

  beforeEach(() => {
    stopTrack.mockClear();
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) },
    });
    vi.mocked(searchWord).mockResolvedValue({
      word: "hello",
      phonetic: "/həˈloʊ/",
      audioUrl: "",
      partOfSpeech: "interjection",
      definition: "Used as a greeting.",
      example: "",
      synonyms: [],
      antonyms: [],
      meanings: [],
    });
    vi.mocked(pronunciationApi.analyzePronunciation).mockResolvedValue({
      score: 95,
      transcript: "hello",
      feedback: "Clear pronunciation.",
      problemAreas: [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  async function loadPracticeWord() {
    render(<SearchAndPronounce />);
    fireEvent.change(screen.getByPlaceholderText("Search any English word..."), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Practice this word");
  }

  async function startRecording() {
    await loadPracticeWord();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start pronunciation recording" }));
      await Promise.resolve();
    });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });
  }

  it("sends recorded microphone audio to the Whisper pronunciation backend", async () => {
    await startRecording();
    fireEvent.click(screen.getByRole("button", { name: "Stop pronunciation recording" }));

    expect(await screen.findByText("95%")).toBeInTheDocument();
    expect(screen.getByText(/"hello"/)).toBeInTheDocument();
    expect(pronunciationApi.analyzePronunciation).toHaveBeenCalledWith(
      "hello",
      expect.any(Blob),
      "practice.webm"
    );
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it("reports microphone permission errors and remains ready to retry", async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
      new DOMException("Permission denied", "NotAllowedError")
    );
    await loadPracticeWord();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start pronunciation recording" }));
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: "Start pronunciation recording" })).toBeEnabled();
    expect(pronunciationApi.analyzePronunciation).not.toHaveBeenCalled();
  });

  it("does not display fabricated results when the analysis backend is unavailable", async () => {
    vi.mocked(pronunciationApi.analyzePronunciation).mockRejectedValue(
      new Error("Cannot reach the speech-analysis backend.")
    );
    await startRecording();
    fireEvent.click(screen.getByRole("button", { name: "Stop pronunciation recording" }));

    expect(await screen.findByRole("button", { name: "Start pronunciation recording" })).toBeEnabled();
    expect(screen.queryByText("89%")).not.toBeInTheDocument();
  });

  it("shows a zero score and retry guidance when the recording contains no speech", async () => {
    vi.mocked(pronunciationApi.analyzePronunciation).mockResolvedValue({
      score: 0,
      transcript: "",
      feedback: "No speech was detected. Check your selected microphone and try again.",
      problemAreas: ["hello"],
    });
    await startRecording();
    fireEvent.click(screen.getByRole("button", { name: "Stop pronunciation recording" }));

    expect(await screen.findByText("0%")).toBeInTheDocument();
    expect(screen.getByText('"No speech detected"')).toBeInTheDocument();
    expect(screen.getByText(/Check your selected microphone/)).toBeInTheDocument();
  });
});
