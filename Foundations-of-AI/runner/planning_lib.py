"""Helpers for the Classical Planning problems (AIMA §11.1-11.2, SATPlan §7.7.4).

    from planning_lib import atoms, Action, Schema, ground, applicable, result
    from planning_lib import forward_bfs, relevant, consistent, regress, backward_bfs   # course algorithms
    from planning_lib import fluents, satplan_sentences, satisfiable, equivalent, show   # SATPlan

Notation
    ground atom    a string without spaces: 'On(A,B)', 'Handempty', 'at-robot(Storage)'
    state          frozenset of the ground atoms that are TRUE; every other atom is false
                   (closed-world assumption)
    goal           frozenset of ground atoms that must be true (a partial description of a state)
    ground action  Action(name, pre, add, delete, neg):
                       name    'Move(B1,T1,T2)'
                       pre     atoms that must be true            (positive preconditions)
                       add     atoms made true                    (add list)
                       delete  atoms made false                   (delete list)
                       neg     atoms that must be FALSE           (negative preconditions, PDDL only)
    action schema  Schema('Move(b,x,y)', pre='On(b,x), Clear(b), Clear(y), b≠y',
                                         eff='On(b,y), Clear(x), ¬On(b,x), ¬Clear(y)')
                   '¬' marks a negative literal, 'x≠y' an inequality; '∧' may replace the commas.

SATPlan formulas are nested tuples over string symbols 'At(R1)^0' (= the course's AtR1^0):
    ('not', f)   ('and', f, g, ...)   ('or', f, g, ...)   ('implies', f, g)   ('iff', f, g)
"""
import itertools
from collections import deque
from typing import NamedTuple


class Action(NamedTuple):
    name: str
    pre: frozenset
    add: frozenset
    delete: frozenset
    neg: frozenset = frozenset()

    def __repr__(self):
        return self.name


# ---------------------------------------------------------------- parsing and grounding

def split_atom(atom):
    "'On(A,B)' -> ('On', ('A', 'B'));  'Handempty' -> ('Handempty', ())"
    atom = atom.replace(' ', '')
    if '(' not in atom:
        return atom, ()
    name, args = atom[:-1].split('(', 1)
    return name, tuple(a for a in args.split(',') if a)


def items(text):
    "Split 'A(x,y) ∧ ¬B(x), x≠y' at the top-level commas: ['A(x,y)', '¬B(x)', 'x≠y']."
    out, cur, depth = [], '', 0
    for ch in text.replace('∧', ','):
        if ch == ',' and depth == 0:
            out.append(cur)
            cur = ''
        else:
            depth += (ch == '(') - (ch == ')')
            cur += ch
    out.append(cur)
    return [s.replace(' ', '') for s in out if s.strip()]


def atoms(text):
    "'On(A,B), Clear(C)' -> frozenset({'On(A,B)', 'Clear(C)'})"
    return frozenset(items(text))


def subst(atom, theta):
    "Replace the variables of an atom: subst('On(x,y)', {'x': 'A'}) -> 'On(A,y)'."
    name, args = split_atom(atom)
    return name + ('({})'.format(','.join(theta.get(a, a) for a in args)) if args else '')


class Schema:
    def __init__(self, signature, pre='', eff=''):
        self.signature = signature.replace(' ', '')
        self.name, self.params = split_atom(signature)
        self.pre, self.eff = items(pre), items(eff)

    def __repr__(self):
        return 'Schema({})'.format(self.signature)


def ground(schema, objects):
    """All ground actions of a schema, parameters substituted in every possible way (in order).
    objects: a list of constants (every parameter ranges over it) or a dict {parameter: constants}
    (typed parameters; a name missing from the dict is a constant, e.g. Axle in PutOn(t,Axle)).
    Inequalities x≠y are checked here and do not appear in the action."""
    domains = [objects.get(p, [p]) if isinstance(objects, dict) else objects for p in schema.params]
    out = []
    for values in itertools.product(*domains):
        th = dict(zip(schema.params, values))
        pre, neg, add, delete, ok = set(), set(), set(), set(), True
        for lit in schema.pre:
            if '≠' in lit:
                a, b = lit.split('≠')
                ok = ok and th.get(a, a) != th.get(b, b)
            elif lit.startswith('¬'):
                neg.add(subst(lit[1:], th))
            else:
                pre.add(subst(lit, th))
        for lit in schema.eff:
            (delete if lit.startswith('¬') else add).add(subst(lit.lstrip('¬'), th))
        if ok:
            out.append(Action(subst(schema.signature, th), frozenset(pre), frozenset(add),
                              frozenset(delete), frozenset(neg)))
    return out


def ground_all(schemas, objects):
    "Ground every schema, in order."
    return [a for s in schemas for a in ground(s, objects)]


def possible(actions, init):
    """Drop the ground actions whose STATIC preconditions (atoms that no action changes, e.g.
    Block(x), Connected(x,y)) are false in the initial state: they can never be applied.
    Pass ALL the ground actions of the problem: "static" means that none of them changes the atom."""
    fl = set(fluents(actions))
    return [a for a in actions if (a.pre - fl) <= init and not ((a.neg - fl) & init)]


# ---------------------------------------------------------------- semantics (AIMA §11.1)

def applicable(state, a):
    "Every positive precondition is true and every negative one is false (closed world)."
    return a.pre <= state and not (a.neg & state)


def result(state, a):
    "RESULT(s, a) = (s - DEL(a)) ∪ ADD(a)"
    return (state - a.delete) | a.add


def applicable_actions(state, actions):
    return [a for a in actions if applicable(state, a)]


def is_plan(init, goal, actions, plan):
    "Is the list of action names executable from init, reaching a state that satisfies goal?"
    by_name = {a.name: a for a in actions}
    s = init
    for name in plan:
        a = by_name.get(name)
        if a is None or not applicable(s, a):
            return False
        s = result(s, a)
    return goal <= s


# ---------------------------------------------------------------- forward / backward search

def forward_bfs(init, goal, actions):
    """Progression planning: breadth-first GRAPH search, actions tried in the given order, goal
    test when a node is generated. Returns the plan (list of action names) or None."""
    if goal <= init:
        return []
    frontier, reached = deque([(init, [])]), {init}
    while frontier:
        s, plan = frontier.popleft()
        for a in actions:
            if applicable(s, a):
                s1 = result(s, a)
                if goal <= s1:
                    return plan + [a.name]
                if s1 not in reached:
                    reached.add(s1)
                    frontier.append((s1, plan + [a.name]))
    return None


def relevant(goal, a):
    "a achieves at least one literal of the goal."
    return bool(a.add & goal)


def consistent(goal, a):
    "a does not undo (delete) any literal of the goal."
    return not (a.delete & goal)


def regress(goal, a):
    "R[G, a] = (G - ADD(a)) ∪ PRE(a)  (positive goals; negative preconditions are ignored)."
    return (goal - a.add) | a.pre


def backward_bfs(init, goal, actions):
    """Regression planning: breadth-first graph search over goals, through relevant and consistent
    actions; stops when a generated goal is satisfied by init. Returns the plan in EXECUTION order."""
    if goal <= init:
        return []
    frontier, reached = deque([(goal, [])]), {goal}
    while frontier:
        g, plan = frontier.popleft()
        for a in actions:
            if relevant(g, a) and consistent(g, a):
                g1 = regress(g, a)
                if g1 <= init:
                    return [a.name] + plan
                if g1 not in reached:
                    reached.add(g1)
                    frontier.append((g1, [a.name] + plan))
    return None


# ---------------------------------------------------------------- SATPlan (AIMA §7.7.4, §11.2)

def fluents(actions):
    "The ground atoms that some action adds or deletes (time-dependent), sorted."
    return sorted(set().union(*(a.add | a.delete for a in actions)))


def sym(x, t):
    "sym('At(R1)', 0) -> 'At(R1)^0'"
    return '{}^{}'.format(x, t)


def satplan_sentences(init, goal, actions, L):
    """The SATPlan encoding for plans of length L, as lists of formulas:
    {'init', 'goal', 'precondition', 'fluent', 'exclusion'}. Only the actions whose static
    preconditions hold are reified; static atoms get no symbol."""
    acts = possible(actions, init)
    fl = fluents(acts)
    out = {'init': [sym(f, 0) if f in init else ('not', sym(f, 0)) for f in fl],
           'goal': [sym(g, L) for g in sorted(goal)],
           'precondition': [], 'fluent': [], 'exclusion': []}
    for t in range(L):
        for a in acts:
            lits = [sym(p, t) for p in sorted(a.pre) if p in fl] + \
                   [('not', sym(p, t)) for p in sorted(a.neg) if p in fl]
            if lits:
                out['precondition'].append(('implies', sym(a.name, t), ('and', *lits)))
        for f in fl:
            adders = [sym(a.name, t) for a in acts if f in a.add]
            deleters = [sym(a.name, t) for a in acts if f in a.delete and f not in a.add]
            stays = ('and', sym(f, t), ('not', ('or', *deleters))) if deleters else sym(f, t)
            out['fluent'].append(('iff', sym(f, t + 1), ('or', *adders, stays)))
        out['exclusion'] += [('or', ('not', sym(a.name, t)), ('not', sym(b.name, t)))
                             for a, b in itertools.combinations(acts, 2)]
    return out


def symbols(f):
    if isinstance(f, str):
        return {f}
    if isinstance(f, bool):
        return set()
    return set().union(set(), *(symbols(g) for g in f[1:]))


def evaluate(f, model):
    """Truth value of f in a (possibly partial) model {symbol: bool}: True, False, or None when
    the symbols assigned so far do not decide it."""
    if isinstance(f, bool):
        return f
    if isinstance(f, str):
        return model.get(f)
    op, args = f[0], f[1:]
    if op == 'implies':
        return evaluate(('or', ('not', args[0]), args[1]), model)
    vals = [evaluate(g, model) for g in args]
    if op == 'not':
        return None if vals[0] is None else not vals[0]
    if op == 'and':
        return False if False in vals else None if None in vals else True
    if op == 'or':
        return True if True in vals else None if None in vals else False
    if op == 'iff':
        return None if None in vals else vals[0] == vals[1]
    raise ValueError('unknown connective {!r}'.format(op))


def satisfiable(sentences):
    """A model {symbol: bool} of the list of sentences, or None (backtracking search that
    prunes a branch as soon as one sentence is false)."""
    syms = sorted(set().union(set(), *(symbols(s) for s in sentences)),
                  key=lambda s: (int(s.rsplit('^', 1)[1]) if '^' in s else 0, s))

    def search(i, model):
        if any(evaluate(s, model) is False for s in sentences):
            return None
        if i == len(syms):
            return dict(model)
        for v in (True, False):
            model[syms[i]] = v
            found = search(i + 1, model)
            if found:
                return found
        del model[syms[i]]
        return None

    return search(0, {})


def count_models(sentences):
    "Number of models over the symbols of the sentences (brute force: keep it small)."
    syms = sorted(set().union(set(), *(symbols(s) for s in sentences)))
    return sum(all(evaluate(s, dict(zip(syms, vals))) for s in sentences)
               for vals in itertools.product((True, False), repeat=len(syms)))


def equivalent(f, g):
    "Do f and g have the same truth value in every model of their symbols?"
    syms = sorted(symbols(f) | symbols(g))
    return all(evaluate(f, m) == evaluate(g, m)
               for vals in itertools.product((True, False), repeat=len(syms))
               for m in [dict(zip(syms, vals))])


def show(f):
    "Pretty-print a formula: show(('iff', 'A^1', ('or', 'a1^0', 'A^0'))) -> 'A^1 ⇔ a1^0 ∨ A^0'"
    def go(f, top=False):
        if isinstance(f, (str, bool)):
            return str(f)
        op, args = f[0], f[1:]
        if op == 'not':
            return '¬' + go(args[0])
        if not args:
            return 'True' if op == 'and' else 'False'
        sep = {'and': ' ∧ ', 'or': ' ∨ ', 'implies': ' ⇒ ', 'iff': ' ⇔ '}[op]
        s = sep.join(go(g, top and op in ('implies', 'iff')) for g in args)
        return s if top or len(args) == 1 else '(' + s + ')'
    return go(f, True)


# ---------------------------------------------------------------- instances (each returns init, goal, ground actions)

def air_cargo():
    "AIMA Fig. 11.1 (we add from≠to to Fly). Only the type-correct ground actions."
    schemas = [Schema('Load(c,p,a)', 'At(c,a), At(p,a), Cargo(c), Plane(p), Airport(a)', '¬At(c,a), In(c,p)'),
               Schema('Unload(c,p,a)', 'In(c,p), At(p,a), Cargo(c), Plane(p), Airport(a)', 'At(c,a), ¬In(c,p)'),
               Schema('Fly(p,from,to)', 'At(p,from), Plane(p), Airport(from), Airport(to), from≠to',
                      '¬At(p,from), At(p,to)')]
    init = atoms('At(C1,SFO), At(C2,JFK), At(P1,SFO), At(P2,JFK), Cargo(C1), Cargo(C2), Plane(P1), Plane(P2), '
                 'Airport(JFK), Airport(SFO)')
    return init, atoms('At(C1,JFK), At(C2,SFO)'), possible(ground_all(schemas, ['C1', 'C2', 'P1', 'P2', 'JFK', 'SFO']), init)


def spare_tire():
    "AIMA Fig. 11.2 (PDDL: PutOn has negative preconditions)."
    schemas = [Schema('Remove(obj,loc)', 'At(obj,loc)', '¬At(obj,loc), At(obj,Ground)'),
               Schema('PutOn(t,Axle)', 'Tire(t), At(t,Ground), ¬At(Flat,Axle), ¬At(Spare,Axle)', '¬At(t,Ground), At(t,Axle)'),
               Schema('LeaveOvernight', '', '¬At(Spare,Ground), ¬At(Spare,Axle), ¬At(Spare,Trunk), '
                                            '¬At(Flat,Ground), ¬At(Flat,Axle), ¬At(Flat,Trunk)')]
    objects = {'obj': ['Flat', 'Spare'], 'loc': ['Axle', 'Trunk', 'Ground'], 't': ['Flat', 'Spare']}
    return atoms('Tire(Flat), Tire(Spare), At(Flat,Axle), At(Spare,Trunk)'), atoms('At(Spare,Axle)'), \
        ground_all(schemas, objects)


def blocks_hand(init='On(A,TABLE), On(B,TABLE), On(C,A), Clear(B), Clear(C)', goal='On(A,B), On(B,C)', blocks='ABC'):
    "The course blocks world with a hand (exam 17 Feb 2022); default instance = the Sussman anomaly."
    schemas = [Schema('Unstack(x,y)', 'Handempty, Block(x), Block(y), Clear(x), On(x,y)',
                      '¬Handempty, ¬Clear(x), ¬On(x,y), Holding(x), Clear(y)'),
               Schema('Stack(x,y)', 'Holding(x), Block(x), Block(y), Clear(y)',
                      '¬Holding(x), ¬Clear(y), On(x,y), Clear(x), Handempty'),
               Schema('Pickup(x)', 'Handempty, Block(x), Clear(x), On(x,TABLE)',
                      '¬Handempty, ¬Clear(x), ¬On(x,TABLE), Holding(x)'),
               Schema('Putdown(x)', 'Holding(x), Block(x)', '¬Holding(x), On(x,TABLE), Clear(x), Handempty')]
    s0 = atoms(init) | {'Block({})'.format(b) for b in blocks} | {'Handempty'}
    return frozenset(s0), atoms(goal), possible(ground_all(schemas, list(blocks)), frozenset(s0))


def hanoi(n=3):
    "Tower of Hanoi as in exam 20 Jun 2024: discs d1 (largest) .. dn (smallest), pegs peg1..peg3."
    discs, pegs = ['d{}'.format(i) for i in range(1, n + 1)], ['peg1', 'peg2', 'peg3']
    smaller = {'smaller({},{})'.format(a, b) for i, a in enumerate(discs) for b in discs[:i]} | \
              {'smaller({},{})'.format(d, p) for d in discs for p in pegs}
    stack = ['peg1'] + discs
    init = frozenset(smaller | {'on({},{})'.format(stack[i + 1], stack[i]) for i in range(n)} |
                     {'clear({})'.format(discs[-1]), 'clear(peg2)', 'clear(peg3)'})
    goal = frozenset('on({},{})'.format(x, y) for x, y in zip(discs, ['peg3'] + discs))
    move = Schema('Move(x,y,z)', 'on(x,y), clear(x), clear(z), smaller(x,z)', '¬on(x,y), clear(y), on(x,z), ¬clear(z)')
    return init, goal, possible(ground(move, discs + pegs), init)
