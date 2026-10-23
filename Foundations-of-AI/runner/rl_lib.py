"""Helpers for the reinforcement-learning problems.

    from rl_lib import GridWorld, goal_reward, action_penalty, EXAM_AUG_2022

GridWorld: a deterministic grid like the ones of the exams. Cells are (row, col), 1-based, (1, 1) top-left.
           '#' obstacle, 'S' start, 'G' goal (terminal), 'g' grey cell (free, but entering it may cost more),
           '.' free cell. Moving toward an obstacle or outside the grid is NOT an available action
           (exam convention: "the agent is not allowed to move toward an obstacle or outside").
Reward functions take (state, action, next_state) and return r_{t+1}.
"""

ACTIONS = ['N', 'E', 'S', 'W']  # north (up), east (right), south (down), west (left)
DELTA = {'N': (-1, 0), 'E': (0, 1), 'S': (1, 0), 'W': (0, -1)}


class GridWorld:
    def __init__(self, rows):
        self.rows = [r.replace(' ', '') for r in rows]
        self.cells = {}
        for i, row in enumerate(self.rows, 1):
            for j, ch in enumerate(row, 1):
                if ch != '#':
                    self.cells[(i, j)] = ch
        self.start = next((c for c, ch in self.cells.items() if ch == 'S'), None)
        self.goal = next(c for c, ch in self.cells.items() if ch == 'G')

    @property
    def states(self):
        """All free cells, goal included, in row-major order."""
        return sorted(self.cells)

    def is_terminal(self, s):
        return s == self.goal

    def is_grey(self, s):
        return self.cells.get(s) == 'g'

    def actions(self, s):
        """Available actions in s (none in the terminal goal), in the order N, E, S, W."""
        if self.is_terminal(s):
            return []
        return [a for a in ACTIONS if self.result(s, a) is not None]

    def result(self, s, a):
        """Next cell, or None if the move hits an obstacle or leaves the grid."""
        n = (s[0] + DELTA[a][0], s[1] + DELTA[a][1])
        return n if n in self.cells else None

    def __repr__(self):
        return 'GridWorld({})'.format(self.rows)


def goal_reward(s, a, s2, world):
    """Goal-reward representation: 1 when the goal is reached, 0 otherwise."""
    return 1 if world.is_terminal(s2) else 0


def action_penalty(s, a, s2, world):
    """Action-penalty representation: 0 when the goal is reached, -1 otherwise."""
    return 0 if world.is_terminal(s2) else -1


def grey_penalty(s, a, s2, world):
    """Exam of 8 July 2026: 0 entering the goal, -2 entering a grey cell, -1 entering a white cell."""
    if world.is_terminal(s2):
        return 0
    return -2 if world.is_grey(s2) else -1


# The 3x3 grid of the exams of 30 August 2022 and 18 January 2023 (obstacle in the centre).
EXAM_AUG_2022 = ['S..',
                 '.#.',
                 '..G']
# The 2x3 maze of the exam of 11 June 2026 (black cell below the middle of the first row).
EXAM_JUN_2026 = ['...',
                 '.#G']
# The 2x3 maze of the exam of 8 July 2026 (the same cell is grey instead of black).
EXAM_JUL_2026 = ['...',
                 '.gG']
# "maze1 10x10" of the slides (RL p. 50-52), without the outer wall.
SLIDES_MAZE1 = ['S.....#...',
                '......#...',
                '......##..',
                '#####.....',
                '....#.....',
                '..........',
                '.....#####',
                '.....#....',
                '..........',
                '.........G']


def shortest_path_length(world, start=None):
    """Number of moves of a shortest path from start (default world.start) to the goal (BFS)."""
    from collections import deque
    start = start or world.start
    dist, frontier = {start: 0}, deque([start])
    while frontier:
        s = frontier.popleft()
        if world.is_terminal(s):
            return dist[s]
        for a in world.actions(s):
            s2 = world.result(s, a)
            if s2 not in dist:
                dist[s2] = dist[s] + 1
                frontier.append(s2)
    return None
