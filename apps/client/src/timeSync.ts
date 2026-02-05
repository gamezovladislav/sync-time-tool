export type OffsetSample = {
  t0: number;
  t1: number;
  t2: number;
  offset: number;
  rtt: number;
};

export const estimateOffset = (t0: number, t1: number, t2: number) => {
  return t1 - (t0 + t2) / 2;
};

export const createSample = (t0: number, t1: number, t2: number): OffsetSample => {
  const rtt = t2 - t0;
  return {
    t0,
    t1,
    t2,
    rtt,
    offset: estimateOffset(t0, t1, t2)
  };
};

export const selectBestSample = (samples: OffsetSample[]) => {
  if (samples.length === 0) {
    return null;
  }
  return samples.reduce((best, current) => (current.rtt < best.rtt ? current : best));
};
