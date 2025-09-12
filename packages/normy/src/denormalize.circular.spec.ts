import { denormalize } from './denormalize';

describe('denormalize - circular references', () => {
  it('should handle simple circular references without infinite loops', () => {
    const normalizedData = {
      '@@user1': {
        id: 'user1',
        name: 'Alice',
        createdProjects: ['@@project1'],
      },
      '@@project1': {
        id: 'project1',
        name: 'Test Project',
        createdBy: '@@user1', // Circular reference back to user
      },
    };

    const data = '@@user1';
    const result = denormalize(data, normalizedData, {}, '');

    expect(result).toEqual({
      id: 'user1',
      name: 'Alice',
      createdProjects: [
        {
          id: 'project1',
          name: 'Test Project',
          createdBy: '@@user1', // Reference string returned to prevent infinite loop
        },
      ],
    });
  });

  it('should handle self-referencing entities', () => {
    const normalizedData = {
      '@@node1': {
        id: 'node1',
        name: 'Root Node',
        parent: '@@node1', // Self-reference
      },
    };

    const data = '@@node1';
    const result = denormalize(data, normalizedData, {}, '');

    expect(result).toEqual({
      id: 'node1',
      name: 'Root Node',
      parent: '@@node1', // Reference string returned instead of infinite recursion
    });
  });

  it('should handle complex circular reference chains', () => {
    const normalizedData = {
      '@@a': {
        id: 'a',
        next: '@@b',
      },
      '@@b': {
        id: 'b',
        next: '@@c',
      },
      '@@c': {
        id: 'c',
        next: '@@a', // Circular reference back to a
      },
    };

    const data = '@@a';
    const result = denormalize(data, normalizedData, {}, '');

    expect(result).toEqual({
      id: 'a',
      next: {
        id: 'b',
        next: {
          id: 'c',
          next: '@@a', // Reference string returned to break the cycle
        },
      },
    });
  });

  it('should handle circular references in arrays', () => {
    const normalizedData = {
      '@@user1': {
        id: 'user1',
        name: 'User 1',
        friends: ['@@user2', '@@user3'],
      },
      '@@user2': {
        id: 'user2',
        name: 'User 2',
        friends: ['@@user1', '@@user3'], // Circular reference back to user1
      },
      '@@user3': {
        id: 'user3',
        name: 'User 3',
        friends: ['@@user1', '@@user2'], // References to both
      },
    };

    const data = '@@user1';
    const result = denormalize(data, normalizedData, {}, '');

    expect(result).toEqual({
      id: 'user1',
      name: 'User 1',
      friends: [
        {
          id: 'user2',
          name: 'User 2',
          friends: ['@@user1', '@@user3'], // Circular references prevented
        },
        {
          id: 'user3',
          name: 'User 3',
          friends: ['@@user1', '@@user2'], // Circular references prevented
        },
      ],
    });
  });

  it('should allow the same reference at different paths', () => {
    const normalizedData = {
      '@@user1': {
        id: 'user1',
        name: 'Alice',
      },
      '@@project1': {
        id: 'project1',
        owner: '@@user1',
        lastModifiedBy: '@@user1', // Same reference but different path
      },
    };

    const data = '@@project1';
    const result = denormalize(data, normalizedData, {}, '');

    // Both references should be denormalized since they're at different paths
    expect(result).toEqual({
      id: 'project1',
      owner: {
        id: 'user1',
        name: 'Alice',
      },
      lastModifiedBy: {
        id: 'user1',
        name: 'Alice',
      },
    });
  });

  it('should handle deeply nested circular references', () => {
    const normalizedData = {
      '@@parent': {
        id: 'parent',
        child: {
          nested: {
            deep: {
              reference: '@@parent', // Circular reference from deep nesting
            },
          },
        },
      },
    };

    const data = '@@parent';
    const result = denormalize(data, normalizedData, {}, '');

    expect(result).toEqual({
      id: 'parent',
      child: {
        nested: {
          deep: {
            reference: '@@parent', // Reference string returned
          },
        },
      },
    });
  });
});