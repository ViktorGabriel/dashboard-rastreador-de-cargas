import { describe, it, expect } from "vitest";
import { SPLIT_PRESETS, getActiveRoutines, applyPresetSplit } from "../src/lib/preset-routines";

describe("Preset Routines & Workout Splits", () => {
  it("should define all classic splits (Upper/Lower, PPL, PPL+UL, Bro Split)", () => {
    expect(SPLIT_PRESETS.UPPER_LOWER).toBeDefined();
    expect(SPLIT_PRESETS.PPL).toBeDefined();
    expect(SPLIT_PRESETS.PPL_UPPER_LOWER).toBeDefined();
    expect(SPLIT_PRESETS.BRO_SPLIT).toBeDefined();

    expect(SPLIT_PRESETS.UPPER_LOWER.daysCount).toBe(4);
    expect(SPLIT_PRESETS.PPL.daysCount).toBe(3);
    expect(SPLIT_PRESETS.PPL_UPPER_LOWER.daysCount).toBe(5);
    expect(SPLIT_PRESETS.BRO_SPLIT.daysCount).toBe(5);
  });

  it("should have exercises configured in every preset routine", () => {
    for (const key of Object.keys(SPLIT_PRESETS)) {
      const preset = SPLIT_PRESETS[key];
      expect(preset.routines.length).toBeGreaterThan(0);
      for (const routine of preset.routines) {
        expect(routine.exercises.length).toBeGreaterThan(0);
        for (const ex of routine.exercises) {
          expect(ex.exerciseCanonical).toBeTruthy();
          expect(ex.targetSets).toBeGreaterThan(0);
          expect(ex.targetRepsMin).toBeGreaterThan(0);
          expect(ex.targetRepsMax).toBeGreaterThanOrEqual(ex.targetRepsMin);
        }
      }
    }
  });

  it("should retrieve active routines from the database", async () => {
    const routines = await getActiveRoutines();
    expect(Array.isArray(routines)).toBe(true);
    expect(routines.length).toBeGreaterThan(0);
    expect(routines[0]).toHaveProperty("name");
    expect(routines[0]).toHaveProperty("exercises");
    expect(Array.isArray(routines[0].exercises)).toBe(true);
  });

  it("should apply PPL preset without errors and update active routines", async () => {
    const pplRoutines = await applyPresetSplit("PPL");
    expect(pplRoutines.length).toBe(3);
    expect(pplRoutines[0].letter).toBe("A");
    expect(pplRoutines[0].name).toContain("Push");
    expect(pplRoutines[1].letter).toBe("B");
    expect(pplRoutines[1].name).toContain("Pull");
    expect(pplRoutines[2].letter).toBe("C");
    expect(pplRoutines[2].name).toContain("Legs");
  });
});
