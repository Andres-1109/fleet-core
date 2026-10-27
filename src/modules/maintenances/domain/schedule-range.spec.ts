import { InvalidScheduleException } from './invalid-schedule.exception';
import { ScheduleRange } from './schedule-range';

const at = (time: string): Date => new Date(`2026-11-10T${time}:00Z`);
const range = (start: string, end: string): ScheduleRange =>
  ScheduleRange.create(at(start), at(end));

describe('ScheduleRange', () => {
  describe('create', () => {
    it('accepts an end after the start', () => {
      expect(range('10:00', '12:00').start).toEqual(at('10:00'));
    });

    it.each([
      ['equal to', '10:00'],
      ['before', '09:00'],
    ])('rejects an end %s the start', (_label, end) => {
      expect(() => range('10:00', end)).toThrow(InvalidScheduleException);
    });
  });

  describe('overlaps (existing booking 10:00-12:00)', () => {
    const existing = range('10:00', '12:00');

    it.each([
      ['starts inside', '11:00', '13:00'],
      ['ends inside', '09:00', '10:30'],
      ['fully inside', '10:30', '11:30'],
      ['fully encloses', '09:00', '13:00'],
      ['is identical', '10:00', '12:00'],
    ])('overlaps when the new range %s', (_label, start, end) => {
      expect(range(start, end).overlaps(existing)).toBe(true);
      // Overlap is symmetric.
      expect(existing.overlaps(range(start, end))).toBe(true);
    });

    it.each([
      ['starts exactly when it ends', '12:00', '14:00'],
      ['ends exactly when it starts', '08:00', '10:00'],
      ['is entirely before', '06:00', '08:00'],
      ['is entirely after', '13:00', '15:00'],
    ])('does not overlap when the new range %s', (_label, start, end) => {
      expect(range(start, end).overlaps(existing)).toBe(false);
      expect(existing.overlaps(range(start, end))).toBe(false);
    });
  });
});
