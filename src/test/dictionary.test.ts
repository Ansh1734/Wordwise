import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decomposeWord } from "@/lib/dictionary";

describe("offline word decomposition", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const word = new URL(String(input)).pathname.split("/").pop() ?? "";
        return new Response(
          JSON.stringify([{
            word,
            phonetic: "",
            phonetics: [],
            meanings: [{
              partOfSpeech: "noun",
              definitions: [{ definition: `Definition of ${word}.`, example: `Use ${word} in a sentence.` }],
            }],
          }]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      })
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("decomposes the compound word comeback", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "configured-test-key");
    const result = await decomposeWord("comeback");

    expect(result.prefix.present).toBe(false);
    expect(result.root.label).toBe("come + back");
    expect(result.suffix.present).toBe(false);
    expect(result.etymology).toContain("come");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("restores the spelling of a root before a suffix", async () => {
    const result = await decomposeWord("unbelievable");

    expect(result.prefix.label).toBe("un-");
    expect(result.root.label).toBe("believe");
    expect(result.suffix.label).toBe("-able");
  });

  it("decomposes a word with both a prefix and suffix", async () => {
    const result = await decomposeWord("international");

    expect(result.prefix.label).toBe("inter-");
    expect(result.root.label).toBe("nation");
    expect(result.suffix.label).toBe("-al");
  });

  it("treats the spelling change in happiness as an inflectional root", async () => {
    const result = await decomposeWord("happiness");

    expect(result.root.label).toBe("happy");
    expect(result.suffix.label).toBe("-ness");
  });

  it("rejects phrases and non-word input", async () => {
    await expect(decomposeWord("not a word")).rejects.toThrow("single English word");
    await expect(decomposeWord("word123")).rejects.toThrow("single English word");
  });
});
