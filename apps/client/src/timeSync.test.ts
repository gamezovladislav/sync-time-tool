import { describe, expect, it } from "vitest";
import { createSample, estimateOffset, selectBestSample } from "./timeSync";

describe("time sync math", () => {
  it("calculates offset from sample", () => {
    const offset = estimateOffset(100, 130, 160);
    expect(offset).toBe(0);
  });

  it("selects lowest RTT sample", () => {
    const samples = [
      createSample(0, 10, 20),
      createSample(0, 8, 12),
      createSample(0, 20, 50)
    ];
    const best = selectBestSample(samples);
    expect(best?.rtt).toBe(12);
  });
});
