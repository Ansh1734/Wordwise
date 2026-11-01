import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzePronunciationAudio } from "@/lib/gemini";

describe("pronunciation API key errors", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("explains how to replace a key rejected by Google without retrying other models", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "configured-test-key");
    const audio = new Blob(["audio"], { type: "audio/webm" });
    Object.defineProperty(audio, "arrayBuffer", {
      value: async () => new Uint8Array([1, 2, 3]).buffer,
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { message: "API key not valid. Please pass a valid API key." } }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      analyzePronunciationAudio("hello", audio)
    ).rejects.toThrow(/Google rejected the Gemini API key.*restart the development server/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("asks for configuration when no key is set", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");

    await expect(
      analyzePronunciationAudio("hello", new Blob(["audio"], { type: "audio/webm" }))
    ).rejects.toThrow(/Add VITE_GEMINI_API_KEY.*restart the development server/);
  });
});
