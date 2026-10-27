import { InvalidScheduleException } from './invalid-schedule.exception';

/**
 * Half-open time interval [start, end). Used to detect mechanic schedule
 * conflicts: two ranges overlap when each one starts before the other ends.
 * Touching ranges (one ends exactly when the other starts) do NOT overlap.
 */
export class ScheduleRange {
  private constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {}

  static create(start: Date, end: Date): ScheduleRange {
    if (end.getTime() <= start.getTime()) {
      throw new InvalidScheduleException();
    }
    return new ScheduleRange(start, end);
  }

  /** Overlap condition: thisStart < otherEnd AND thisEnd > otherStart. */
  overlaps(other: ScheduleRange): boolean {
    return (
      this.start.getTime() < other.end.getTime() &&
      this.end.getTime() > other.start.getTime()
    );
  }
}
