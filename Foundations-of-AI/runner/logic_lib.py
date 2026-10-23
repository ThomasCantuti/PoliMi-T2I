"""Helpers for Logical Agents & Propositional Logic (AIMA ch. 7, §7.4-7.6).

    from logic_lib import parse, show, clause, show_clause, neg, symbols, pl_true, equivalent
    from logic_lib import to_cnf, pl_resolve, definite, row, pure_literals, unit_literals   # course algorithms
    from logic_lib import check_proof, check_dpll, check_formulas, check_cnf, dpll_table  # exam-answer checkers

Formulas are nested tuples (a tiny syntax tree):
    'P'                    a proposition symbol (letters, digits, _; starts with a letter)
    ('~', A)               not A                ¬A
    ('&', A, B, ...)       A and B and ...      A ∧ B ∧ ...   (two or more arguments)
    ('|', A, B, ...)       A or B or ...        A ∨ B ∨ ...
    ('=>', A, B)           A implies B          A ⇒ B
    ('<=>', A, B)          A iff B              A ⇔ B
parse() reads them from text with the usual precedence  ¬ > ∧ > ∨ > ⇒ > ⇔  (⇒ is right-associative);
ASCII (~ & | => <=>) and Unicode (¬ ∧ ∨ → ⇒ ↔ ⇔) both work:
    parse('(P & Q) => R') == ('=>', ('&', 'P', 'Q'), 'R')
    parse('¬P ∨ Q')        == ('|', ('~', 'P'), 'Q')

A literal is a string 'P' or '~P'; a clause is a frozenset of literals; frozenset() is the empty clause ⊥.
    clause('A | ~B') == frozenset({'A', '~B'})        clause('⊥') == frozenset()

The algorithms below are the course versions: use them in later problems once you have written your own
in the earlier ones.
"""
import itertools
import re

# ---------------------------------------------------------------- syntax

_TOKEN = re.compile(r'\s*(<=>|<->|⇔|↔|=>|->|⇒|→|[~¬!]|[&∧]|[|∨]|\(|\)|[A-Za-z][A-Za-z0-9_]*)')
_CANON = {'<->': '<=>', '⇔': '<=>', '↔': '<=>', '->': '=>', '⇒': '=>', '→': '=>',
          '¬': '~', '!': '~', '∧': '&', '∨': '|'}


def _tokens(text):
    out, pos, text = [], 0, text.strip()
    while pos < len(text):
        m = _TOKEN.match(text, pos)
        if not m:
            raise ValueError(f'cannot read {text[pos:]!r} in {text!r}')
        out.append(_CANON.get(m.group(1), m.group(1)))
        pos = m.end()
    return out


def parse(text):
    """Text -> formula (nested tuples). A formula (tuple or symbol) is returned unchanged."""
    if not isinstance(text, str):
        return text
    toks, i = _tokens(text), 0

    def peek():
        return toks[i] if i < len(toks) else None

    def take(expected=None):
        nonlocal i
        t = peek()
        if t is None or (expected and t != expected):
            raise ValueError(f'expected {expected or "more input"} in {text!r}')
        i += 1
        return t

    def iff():
        left = impl()
        while peek() == '<=>':
            take()
            left = ('<=>', left, impl())
        return left

    def impl():
        left = disj()
        if peek() == '=>':
            take()
            return ('=>', left, impl())
        return left

    def nary(op, sub):
        def rule():
            args = [sub()]
            while peek() == op:
                take()
                args.append(sub())
            if len(args) == 1:
                return args[0]
            flat = []
            for a in args:
                flat += list(a[1:]) if isinstance(a, tuple) and a[0] == op else [a]
            return (op, *flat)
        return rule

    def unary():
        t = peek()
        if t == '~':
            take()
            return ('~', unary())
        if t == '(':
            take()
            f = iff()
            take(')')
            return f
        if t is None or not t[0].isalpha():
            raise ValueError(f'unexpected {t!r} in {text!r}')
        return take()

    conj = nary('&', unary)
    disj = nary('|', conj)
    f = iff()
    if peek() is not None:
        raise ValueError(f'unexpected {peek()!r} in {text!r}')
    return f


_PREC = {'<=>': 0, '=>': 1, '|': 2, '&': 3, '~': 4}
_SHOW = {'<=>': ' ⇔ ', '=>': ' ⇒ ', '|': ' ∨ ', '&': ' ∧ '}


def show(f):
    """Formula -> readable Unicode text with the fewest parentheses."""
    f = parse(f)
    if isinstance(f, str):
        return f
    op = f[0]
    if op == '~':
        s = show(f[1])
        return '¬' + (s if isinstance(f[1], str) or f[1][0] == '~' else f'({s})')

    def wrap(g, strict):
        s = show(g)
        p = 5 if isinstance(g, str) else _PREC[g[0]]
        return f'({s})' if (p <= _PREC[op] if strict else p < _PREC[op]) else s

    if op in ('=>', '<=>'):          # (P ∧ Q) ⇒ R, as the exams write it
        side = [show(g) if isinstance(g, str) or g[0] == '~' else f'({show(g)})' for g in f[1:]]
        return _SHOW[op].join(side)
    return _SHOW[op].join(wrap(g, True) for g in f[1:])


def symbols(*formulas):
    """Sorted list of the proposition symbols in the formulas."""
    out = set()

    def walk(f):
        if isinstance(f, str):
            out.add(f)
        else:
            for g in f[1:]:
                walk(g)
    for f in formulas:
        walk(parse(f))
    return sorted(out)


def neg(literal):
    """'P' -> '~P', '~P' -> 'P'."""
    return literal[1:] if literal.startswith('~') else '~' + literal


def clause(c):
    """'A | ~B' (or 'A ∨ ¬B', or an iterable of literals) -> frozenset({'A', '~B'}). '⊥', '' or '{}' -> frozenset()."""
    if isinstance(c, (frozenset, set, list, tuple)):
        return frozenset(c)
    if c.strip() in ('', '⊥', '{}', 'False', '[]'):
        return frozenset()
    f = parse(c)
    lits = list(f[1:]) if isinstance(f, tuple) and f[0] == '|' else [f]
    out = set()
    for lit in lits:
        if isinstance(lit, str):
            out.add(lit)
        elif lit[0] == '~' and isinstance(lit[1], str):
            out.add('~' + lit[1])
        else:
            raise ValueError(f'{c!r} is not a clause (a disjunction of literals)')
    return frozenset(out)


def _lit_key(lit):
    return (lit.lstrip('~'), lit.startswith('~'))


def show_clause(c):
    """frozenset({'A', '~B'}) -> 'A ∨ ¬B'; the empty clause -> '⊥'."""
    c = clause(c)
    if not c:
        return '⊥'
    return ' ∨ '.join(('¬' + l[1:]) if l.startswith('~') else l for l in sorted(c, key=_lit_key))


def clause_formula(c):
    """A clause as a formula (for pl_true / equivalent). The empty clause becomes P ∧ ¬P."""
    c = sorted(clause(c), key=_lit_key)
    if not c:
        return ('&', 'P', ('~', 'P'))
    lits = [('~', l[1:]) if l.startswith('~') else l for l in c]
    return lits[0] if len(lits) == 1 else ('|', *lits)


# ---------------------------------------------------------------- semantics

def pl_true(f, model):
    """Truth value of formula f in a complete model {symbol: bool}."""
    f = parse(f)
    if isinstance(f, str):
        return model[f]
    op, args = f[0], f[1:]
    if op == '~':
        return not pl_true(args[0], model)
    if op == '&':
        return all(pl_true(a, model) for a in args)
    if op == '|':
        return any(pl_true(a, model) for a in args)
    if op == '=>':
        return (not pl_true(args[0], model)) or pl_true(args[1], model)
    if op == '<=>':
        return pl_true(args[0], model) == pl_true(args[1], model)
    raise ValueError(f'unknown operator {op!r}')


def all_models(syms):
    """Every complete model over the symbols, as dicts (2^n of them)."""
    for values in itertools.product([True, False], repeat=len(syms)):
        yield dict(zip(syms, values))


def tt_entails(kb, alpha):
    """Truth-table entailment (AIMA §7.4.4): kb is a list of formulas (their conjunction)."""
    kb = [parse(f) for f in kb]
    syms = symbols(*kb, alpha)
    return all(pl_true(alpha, m) for m in all_models(syms) if all(pl_true(f, m) for f in kb))


def equivalent(f, g):
    """Same truth value in every model."""
    syms = symbols(f, g)
    return all(pl_true(f, m) == pl_true(g, m) for m in all_models(syms))


def satisfiable(formulas):
    syms = symbols(*formulas)
    return any(all(pl_true(f, m) for f in formulas) for m in all_models(syms))


def counter_model(f, g):
    """A model where f and g have different truth values (None if they are equivalent)."""
    syms = symbols(f, g)
    return next((m for m in all_models(syms) if pl_true(f, m) != pl_true(g, m)), None)


def _show_model(m):
    return '{' + ', '.join(s if v else '¬' + s for s, v in sorted(m.items())) + '}'


# ---------------------------------------------------------------- CNF and resolution (AIMA §7.5.2)

def _nnf(f, negate=False):
    """Eliminate ⇔ and ⇒ and move ¬ inwards (steps 1-3 of the CNF conversion)."""
    if isinstance(f, str):
        return ('~', f) if negate else f
    op, args = f[0], f[1:]
    if op == '~':
        return _nnf(args[0], not negate)
    if op == '<=>':
        a, b = args
        return _nnf(('&', ('=>', a, b), ('=>', b, a)), negate)
    if op == '=>':
        return _nnf(('|', ('~', args[0]), args[1]), negate)
    new_op = {'&': '|', '|': '&'}[op] if negate else op
    return (new_op, *[_nnf(a, negate) for a in args])


def _distribute(f):
    """NNF formula -> list of clauses (step 4: distribute ∨ over ∧)."""
    if isinstance(f, str):
        return [frozenset([f])]
    if f[0] == '~':
        return [frozenset(['~' + f[1]])]
    if f[0] == '&':
        return [c for a in f[1:] for c in _distribute(a)]
    result = [frozenset()]
    for a in f[1:]:
        result = [c | d for c in result for d in _distribute(a)]
    return result


def is_tautology(c):
    return any(neg(l) in c for l in c)


def to_cnf(f):
    """Formula -> set of clauses (frozensets). Repeated literals and clauses are merged and tautological
    clauses (containing P and ¬P) are dropped; nothing else is simplified."""
    return {c for c in _distribute(_nnf(parse(f))) if not is_tautology(c)}


def pl_resolve(ci, cj):
    """All the resolvents of two clauses: resolve on ONE complementary pair at a time."""
    ci, cj = clause(ci), clause(cj)
    return {(ci - {l}) | (cj - {neg(l)}) for l in ci if neg(l) in cj}


def definite(text):
    """'A & B => L' -> (('A', 'B'), 'L');  'A' -> ((), 'A').  ValueError if not a definite clause."""
    f = parse(text)
    if isinstance(f, str):
        return (), f
    if f[0] == '=>' and isinstance(f[2], str):
        prem = f[1]
        if isinstance(prem, str):
            return (prem,), f[2]
        if prem[0] == '&' and all(isinstance(p, str) for p in prem[1:]):
            return tuple(prem[1:]), f[2]
    raise ValueError(f'{text!r} is not a definite clause (premise = conjunction of symbols ⇒ one symbol)')


# ---------------------------------------------------------------- DPLL building blocks (AIMA §7.6.1)

def status(c, model):
    """True if the clause is satisfied by the partial model, else the frozenset of its literals that
    are still unassigned (empty = all literals false = ⊥)."""
    if any(l.lstrip('~') in model and model[l.lstrip('~')] != l.startswith('~') for l in c):
        return True
    return frozenset(l for l in c if l.lstrip('~') not in model)


def row(clauses, model):
    """One row of the exam's DPLL table: each clause -> True (satisfied) or its remaining literals."""
    return [status(clause(c), model) for c in clauses]


def pure_literals(clauses, model):
    """Literals whose symbol is unassigned and appears with one sign only in the clauses not yet satisfied."""
    seen = set()
    for st in row(clauses, model):
        if st is not True:
            seen |= st
    return {l for l in seen if neg(l) not in seen}


def unit_literals(clauses, model):
    """The single remaining literal of every clause not yet satisfied whose other literals are all false."""
    return {next(iter(st)) for st in row(clauses, model) if st is not True and len(st) == 1}


def _show_lit(l):
    return '¬' + l[1:] if l.startswith('~') else l


def _show_status(st):
    return 'true' if st is True else show_clause(st)


def dpll_table(clauses, steps):
    """Text table of a DPLL trace in the exam format (one row per assignment)."""
    clauses = [clause(c) for c in clauses]
    model, stack, lines = {}, [], ['   '.join(show_clause(c) for c in clauses)]
    for s in steps:
        kind, lit = _parse_step(s)
        if kind == 'backtrack':
            lines.append('backtrack')
            continue
        if kind == 'split':
            first = [k for k, (_, l) in enumerate(stack) if l == neg(lit)]
            if first:                                   # second branch of an earlier split
                model = dict(stack[first[-1]][0])
                del stack[first[-1]:]
            else:
                stack.append((dict(model), lit))
        model[lit.lstrip('~')] = not lit.startswith('~')
        lines.append('   '.join(_show_status(st) for st in row(clauses, model)) + f'   {kind} {_show_lit(lit)}')
    return '\n'.join(lines)


# ---------------------------------------------------------------- checkers for exam-style answers

def _parse_step(s):
    parts = s.replace('¬', '~').split()
    if not parts:
        raise ValueError('empty step')
    kind = parts[0].lower()
    if kind == 'backtrack':
        return 'backtrack', None
    if kind not in ('split', 'unit', 'pure') or len(parts) < 2:
        raise ValueError(f'cannot read the step {s!r}: use "split L", "unit L", "pure L" or "backtrack"')
    lit = parts[-1]
    if not re.fullmatch(r'~?[A-Za-z][A-Za-z0-9_]*', lit):
        raise ValueError(f'cannot read the literal in the step {s!r}')
    return kind, lit


def check_dpll(clauses, steps, answer=None, pure=True, unit=True, complete=True):
    """Check a hand-written DPLL trace, step by step.

    steps: list of strings 'pure L', 'unit L', 'split L', 'backtrack' (L = 'A' or '~A'; '¬A' is fine).
    Rules (the course's DPLL, AIMA §7.6.1):
      - if an enabled heuristic applies (a pure literal, a unit clause) the step must use one of them
        (any of them: the course does not fix their order); otherwise the step is a split on any
        unassigned symbol, with either value first;
      - early termination: as soon as every clause is true the trace ends (answer 'SAT'); as soon as a
        clause is false, the next steps are 'backtrack' and 'split ¬L' for the most recent split L whose
        other branch is untried; with no such split left the trace ends (answer 'UNSAT').
    complete=False checks only the steps given (a prefix of the run).
    Returns (True, '') or (False, message)."""
    clauses = [clause(c) for c in clauses]
    syms = {l.lstrip('~') for c in clauses for l in c}
    model = {}
    stack = []           # one entry per open split: [model before the split, literal tried first, flipped?]
    state = 'open'       # 'open' | 'conflict' | 'backtracked' | 'sat' | 'unsat'
    if not isinstance(steps, (list, tuple)):
        return False, 'Return a list of steps such as ["split A", "unit ~D", "backtrack", ...].'
    for k, s in enumerate(steps, 1):
        try:
            kind, lit = _parse_step(s)
        except (ValueError, AttributeError) as e:
            return False, f'step {k}: {e}'
        where = f'step {k} ({s!r})'
        if state == 'sat':
            return False, f'{where}: every clause is already true after step {k - 1}: DPLL stops (early termination).'
        if state == 'unsat':
            return False, f'{where}: no split is left to backtrack to: DPLL has already answered UNSAT.'
        if state == 'conflict':
            if kind != 'backtrack':
                return False, (f'{where}: after step {k - 1} a clause is false (⊥): DPLL must backtrack '
                               '(write "backtrack" and then the other branch of the last split).')
            state = 'backtracked'
            continue
        if kind == 'backtrack':
            return False, f'{where}: nothing to backtrack from: no clause is false.'
        if state == 'backtracked':
            other = neg(stack[-1][1])
            if kind != 'split' or lit != other:
                return False, f'{where}: after backtracking, the next step is the other branch: "split {_show_lit(other)}".'
            model = dict(stack[-1][0])
            stack[-1][2] = True
        else:
            sym = lit.lstrip('~')
            if sym not in syms:
                return False, f'{where}: {sym} is not a symbol of the formula.'
            if sym in model:
                return False, f'{where}: {sym} is already assigned.'
            P = pure_literals(clauses, model) if pure else set()
            U = unit_literals(clauses, model) if unit else set()
            options = ', '.join(sorted({f'pure {_show_lit(l)}' for l in P} | {f'unit {_show_lit(l)}' for l in U}))
            if kind == 'pure' and not pure:
                return False, f'{where}: the pure-symbol heuristic is switched off in this question.'
            if kind == 'unit' and not unit:
                return False, f'{where}: the unit-clause heuristic is switched off in this question.'
            if kind == 'pure' and lit not in P:
                return False, (f'{where}: {_show_lit(lit)} is not a pure literal here'
                               + (f' (possible steps: {options}).' if options else ' (no heuristic applies: split).'))
            if kind == 'unit' and lit not in U:
                return False, (f'{where}: there is no unit clause {_show_lit(lit)} here'
                               + (f' (possible steps: {options}).' if options else ' (no heuristic applies: split).'))
            if kind == 'split' and (P or U):
                return False, f'{where}: no split while a heuristic applies (possible steps: {options}).'
            if kind == 'split':
                stack.append([dict(model), lit, False])
        model[lit.lstrip('~')] = not lit.startswith('~')
        sts = row(clauses, model)
        if any(st is not True and not st for st in sts):
            while stack and stack[-1][2]:      # splits whose two branches both failed
                stack.pop()
            state = 'conflict' if stack else 'unsat'
        elif all(st is True for st in sts):
            state = 'sat'
        else:
            state = 'open'
    if not complete:
        return True, ''
    if state in ('open', 'backtracked'):
        return False, 'The trace stops too early: no answer yet (every clause true, or no split left to try).'
    if state == 'conflict':
        return False, 'The trace stops at a false clause, but there is still a split to backtrack to.'
    expected = 'SAT' if state == 'sat' else 'UNSAT'
    if answer is not None and str(answer).upper() != expected:
        return False, f'The steps are right, but they end with the answer {expected}, not {answer!r}.'
    return True, ''


def check_formulas(got, expected, allowed=None, clauses=False):
    """Check a list of formulas written as text, statement by statement: same number of items, each one
    equivalent to the expected formula, only the allowed symbols; clauses=True: each item must be a clause.
    Returns (True, '') or (False, message)."""
    if not isinstance(got, (list, tuple)) or len(got) != len(expected):
        return False, f'Return a list of {len(expected)} formulas (strings), one per statement.'
    for k, (g, e) in enumerate(zip(got, expected), 1):
        try:
            f = clause_formula(clause(g)) if clauses else parse(g)
        except (ValueError, AttributeError, TypeError) as err:
            return False, f'item {k}: {err}' + (' (a clause is a disjunction of literals)' if clauses else '')
        extra = set(symbols(f)) - set(allowed or symbols(f))
        if extra:
            return False, f'item {k} ({show(f)}): unknown symbols {sorted(extra)}; use only {sorted(allowed)}.'
        m = counter_model(f, e)
        if m is not None:
            return False, (f'item {k}: {show(f)} is not equivalent to the intended meaning: in the model '
                           f'{_show_model(m)} it is {pl_true(f, m)}, but it should be {pl_true(e, m)}.')
    return True, ''


def check_cnf(got, formulas):
    """got: list of clauses (text) whose conjunction must be equivalent to the conjunction of the formulas."""
    if not isinstance(got, (list, tuple)) or not got:
        return False, 'Return a non-empty list of clauses (strings such as "~A | B").'
    try:
        cls = [clause(c) for c in got]
    except (ValueError, AttributeError, TypeError) as err:
        return False, f'{err} (each item must be one clause: a disjunction of literals)'
    conj = ('&', *[clause_formula(c) for c in cls]) if len(cls) > 1 else clause_formula(cls[0])
    target = ('&', *[parse(f) for f in formulas]) if len(formulas) > 1 else parse(formulas[0])
    m = counter_model(conj, target)
    if m is not None:
        return False, (f'your clauses are not equivalent to the KB: in the model {_show_model(m)} the clauses are '
                       f'{pl_true(conj, m)} and the KB is {pl_true(target, m)}.')
    return True, ''


def check_proof(given, steps, strategy=None):
    """Check a numbered resolution refutation, written as in the exam.

    given: the starting clauses, numbered 1..n (KB in CNF + the negated query).
    steps: list of (clause, i, j): the new clause n+1, n+2, ... is a resolvent of clauses i and j.
    strategy: None, 'unit' (clause i or j has one literal) or 'input' (clause i or j is one of the given ones).
    The last step must be the empty clause ('⊥'). Returns (True, '') or (False, message)."""
    clauses = [clause(c) for c in given]
    n = len(clauses)
    if not isinstance(steps, (list, tuple)) or not steps:
        return False, 'Return a non-empty list of steps (clause, i, j).'
    for k, step in enumerate(steps, n + 1):
        try:
            text, i, j = step
            c = clause(text)
        except (TypeError, ValueError) as e:
            return False, f'clause {k}: cannot read {step!r} ({e})'
        if not all(isinstance(x, int) and 1 <= x < k for x in (i, j)) or i == j:
            return False, f'clause {k}: the parents must be two different earlier clauses (1..{k - 1}), got {i}, {j}.'
        ci, cj = clauses[i - 1], clauses[j - 1]
        res = pl_resolve(ci, cj)
        if c not in res:
            opts = ', '.join(show_clause(r) for r in sorted(res, key=lambda r: sorted(r))) or 'none: no complementary pair'
            return False, (f'clause {k} = {show_clause(c)} is not a resolvent of {i} ({show_clause(ci)}) and '
                           f'{j} ({show_clause(cj)}). Their resolvents: {opts}.')
        if strategy == 'unit' and len(ci) != 1 and len(cj) != 1:
            return False, f'clause {k}: unit resolution needs a unit clause among the parents {i} and {j}.'
        if strategy == 'input' and i > n and j > n:
            return False, f'clause {k}: input resolution needs one parent among the given clauses 1..{n}.'
        clauses.append(c)
    if clauses[-1]:
        return False, f'The last clause ({show_clause(clauses[-1])}) is not the empty clause ⊥: the refutation is not finished.'
    return True, ''
