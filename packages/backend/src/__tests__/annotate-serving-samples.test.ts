/**
 * Reading #63's gateway samples back into a serving condition (issue #71).
 *
 * The batch has no run row, so its 2,524 judge calls are matched to samples by
 * time alone. Two things can go quietly wrong there — collapsing the per-member
 * lines into one reading, and picking the sample nearest a call — and a silent
 * error would write a condition the pool was never in, which is worse than
 * leaving the rows unknown.
 */
import { describe, it, expect } from "vitest";
import { parseGatewaySamples, sampleAt } from "../../scripts/annotate-serving-provenance.js";

/** Three lines per timestamp, as `gateway-poll.py` writes them. */
const TSV = [
  "2026-09-06T19:13:05+00:00\tdgx-spark-04\tTrue\t0\tcmtpeql",
  "2026-09-06T19:13:05+00:00\tdgx-spark-02\tTrue\t0\tcmtprzt",
  "2026-09-06T19:13:05+00:00\tdgx-spark-03\tTrue\t0\tcmtpsau",
  "2026-09-06T19:13:07+00:00\tdgx-spark-04\tTrue\t1\tcmtpeql",
  "2026-09-06T19:13:07+00:00\tdgx-spark-02\tTrue\t1\tcmtprzt",
  "2026-09-06T19:13:07+00:00\tdgx-spark-03\tTrue\t1\tcmtpsau",
  "2026-09-06T19:13:09+00:00\tdgx-spark-04\tTrue\t2\tcmtpeql",
  "2026-09-06T19:13:09+00:00\tdgx-spark-02\tFalse\t0\tcmtprzt",
  "2026-09-06T19:13:09+00:00\tdgx-spark-03\tTrue\t1\tcmtpsau",
].join("\n");

const at = (iso: string) => Date.parse(iso);

describe("parseGatewaySamples", () => {
  it("collapses the per-member lines into one reading per timestamp", () => {
    const samples = parseGatewaySamples(TSV);

    expect(samples).toEqual([
      { at: at("2026-09-06T19:13:05Z"), servingCount: 3, maxInflight: 0 },
      { at: at("2026-09-06T19:13:07Z"), servingCount: 3, maxInflight: 1 },
      // spark-02 stopped serving: two replicas, and one of them holds two
      // requests — the 09-07 event's shape exactly.
      { at: at("2026-09-06T19:13:09Z"), servingCount: 2, maxInflight: 2 },
    ]);
  });

  it("skips the poller's error lines rather than reading them as zero replicas", () => {
    const samples = parseGatewaySamples(
      "2026-09-06T19:13:05+00:00\tERROR\ttimed out\n" + TSV,
    );
    expect(samples).toHaveLength(3);
    expect(samples[0].servingCount).toBe(3);
  });

  it("returns the samples in time order whatever the file's order", () => {
    const reversed = TSV.split("\n").reverse().join("\n");
    const samples = parseGatewaySamples(reversed);
    expect(samples.map((s) => s.at)).toEqual([...samples.map((s) => s.at)].sort((a, b) => a - b));
  });
});

describe("sampleAt", () => {
  const samples = parseGatewaySamples(TSV);

  it("picks the nearest sample on either side", () => {
    // 19:13:06 sits between the 05 and 07 samples; 06.5 is nearer 07.
    expect(sampleAt(samples, at("2026-09-06T19:13:06Z"))!.maxInflight).toBe(0);
    expect(sampleAt(samples, at("2026-09-06T19:13:06.500Z"))!.maxInflight).toBe(1);
    expect(sampleAt(samples, at("2026-09-06T19:13:09Z"))!.servingCount).toBe(2);
  });

  it("leaves a call outside the sampled window unknown rather than guessing", () => {
    // The poller was not running; there is no condition to write.
    expect(sampleAt(samples, at("2026-09-06T18:00:00Z"))).toBeNull();
    expect(sampleAt(samples, at("2026-09-07T07:10:44Z"))).toBeNull();
  });

  it("has nothing to say with no samples", () => {
    expect(sampleAt([], at("2026-09-06T19:13:06Z"))).toBeNull();
  });
});
