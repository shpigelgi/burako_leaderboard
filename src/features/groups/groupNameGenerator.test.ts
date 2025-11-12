import { describe, it, expect } from 'vitest';
import { generateGroupName, isGroupNameDuplicate } from './groupNameGenerator';
import type { Player } from '../../types';

describe('generateGroupName', () => {
  const mockPlayers: Player[] = [
    { id: 'p1', name: 'Maayan' },
    { id: 'p2', name: 'Nevo' },
    { id: 'p3', name: 'Assaf' },
    { id: 'p4', name: 'Gilad' },
  ];

  it('returns empty string for empty player list', () => {
    expect(generateGroupName([], mockPlayers)).toBe('');
  });

  it('returns single player name', () => {
    expect(generateGroupName(['p1'], mockPlayers)).toBe('Maayan');
  });

  it('formats two players with ampersand', () => {
    expect(generateGroupName(['p1', 'p2'], mockPlayers)).toBe('Maayan & Nevo');
  });

  it('formats three players correctly', () => {
    expect(generateGroupName(['p1', 'p2', 'p3'], mockPlayers)).toBe('Maayan, Nevo & Assaf');
  });

  it('formats four players correctly', () => {
    expect(generateGroupName(['p1', 'p2', 'p3', 'p4'], mockPlayers)).toBe(
      'Maayan, Nevo, Assaf & Gilad'
    );
  });

  it('handles newly created player not yet in allPlayers', () => {
    expect(generateGroupName(['p1', 'p2', 'p3', 'new-id'], mockPlayers, 'NewPlayer')).toBe(
      'Maayan, Nevo, Assaf & NewPlayer'
    );
  });

  it('filters out players not found', () => {
    expect(generateGroupName(['p1', 'unknown', 'p2'], mockPlayers)).toBe('Maayan & Nevo');
  });

  it('returns empty string if no valid players found', () => {
    expect(generateGroupName(['unknown1', 'unknown2'], mockPlayers)).toBe('');
  });
});

describe('isGroupNameDuplicate', () => {
  const existingGroups = [
    { id: 'g1', name: 'Group One' },
    { id: 'g2', name: 'Group Two' },
    { id: 'g3', name: 'Group Three' },
  ];

  it('returns true for exact duplicate name', () => {
    expect(isGroupNameDuplicate('Group One', existingGroups)).toBe(true);
  });

  it('returns true for case-insensitive duplicate', () => {
    expect(isGroupNameDuplicate('group one', existingGroups)).toBe(true);
    expect(isGroupNameDuplicate('GROUP TWO', existingGroups)).toBe(true);
  });

  it('returns false for unique name', () => {
    expect(isGroupNameDuplicate('New Group', existingGroups)).toBe(false);
  });

  it('returns false for name with extra whitespace', () => {
    expect(isGroupNameDuplicate('  Group One  ', existingGroups)).toBe(true);
  });

  it('excludes specified group ID from check', () => {
    expect(isGroupNameDuplicate('Group One', existingGroups, 'g1')).toBe(false);
  });

  it('returns true if duplicate exists even with exclusion', () => {
    expect(isGroupNameDuplicate('Group Two', existingGroups, 'g1')).toBe(true);
  });

  it('handles empty group list', () => {
    expect(isGroupNameDuplicate('Any Name', [])).toBe(false);
  });
});
