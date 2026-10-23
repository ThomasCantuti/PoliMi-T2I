"""Run a problem's tests against a solution file and print one JSON object.

    python3 -I runner/harness.py problems/<topic>/<file>.py solution.py [--solution]

--solution ignores solution.py and checks the problem's own SOLUTION (used by check_all.py).

Problem files declare tests with Test(...):
    Test(name, args=(...), expected=...)                 # ENTRY(*args) == expected
    Test(name, args=(...), check=lambda got, *args: ...)  # custom: bool or (bool, message)
    Test(name, call=lambda sol: ..., expected=...)        # sol = the solution module
"""
import contextlib
import copy
import io
import json
import math
import os
import signal
import sys
import time
import traceback
import types

RUNNER = os.path.dirname(os.path.abspath(__file__))
if RUNNER not in sys.path:
    sys.path.insert(0, RUNNER)


class Test:
    def __init__(self, name, args=(), expected=None, check=None, call=None,
                 show=None, timeout=5.0):
        self.name, self.args, self.expected = name, tuple(args), expected
        self.check, self.call, self.timeout = check, call, timeout
        self.show = show if show is not None else (
            '' if call else short(', '.join(map(repr, self.args))))


def short(s, n=400):
    s = str(s)
    return s if len(s) <= n else s[:n] + ' …'


def same(a, b):
    """Equality that tolerates float rounding and list/tuple differences."""
    if isinstance(a, bool) or isinstance(b, bool):
        return a is b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return math.isclose(a, b, rel_tol=1e-6, abs_tol=1e-9)
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(same(a[k], b[k]) for k in a)
    try:
        return bool(a == b)
    except Exception:
        return False


class Timeout(Exception):
    pass


def _alarm(signum, frame):
    raise Timeout()


def load_module(path, name):
    mod = types.ModuleType(name)
    mod.__file__ = path
    sys.modules[name] = mod
    with open(path) as f:
        exec(compile(f.read(), path, 'exec'), mod.__dict__)
    return mod


def user_traceback(user_file):
    """Only the frames that belong to the user's code, plus the error line."""
    etype, err, tb = sys.exc_info()
    frames = [f for f in traceback.extract_tb(tb) if f.filename == user_file]
    lines = [f'  line {f.lineno}, in {f.name}\n    {f.line}' for f in frames]
    return '\n'.join(lines + [f'{etype.__name__}: {err}'])


def run(problem_path, user_file, use_solution=False):
    problem = load_module(problem_path, 'problem')
    if use_solution:
        with open(user_file, 'w') as f:
            f.write(problem.SOLUTION)
    out = io.StringIO()
    try:
        with contextlib.redirect_stdout(out):
            sol = load_module(user_file, 'solution')
    except SyntaxError as e:
        return {'ok': False, 'error': f'SyntaxError: {e.msg} (line {e.lineno})\n    {(e.text or "").rstrip()}',
                'results': []}
    except BaseException:
        return {'ok': False, 'error': user_traceback(user_file), 'stdout': out.getvalue(), 'results': []}

    entry = getattr(problem, 'ENTRY', None)
    results = []
    signal.signal(signal.SIGALRM, _alarm)
    timed_out = False
    for t in problem.TESTS:
        r = {'name': t.name, 'input': t.show, 'ok': False}
        if timed_out:
            r['error'] = 'Skipped: a previous test hit the time limit.'
            results.append(r)
            continue
        buf = io.StringIO()
        args = copy.deepcopy(t.args)
        t0 = time.perf_counter()
        try:
            signal.setitimer(signal.ITIMER_REAL, t.timeout)
            with contextlib.redirect_stdout(buf):
                if t.call:
                    got = t.call(sol)
                else:
                    fn = getattr(sol, entry, None)
                    if fn is None:
                        raise NameError(f"you must define a function named '{entry}'")
                    got = fn(*args)
            signal.setitimer(signal.ITIMER_REAL, 0)
            r['got'] = short(repr(got))
            if t.check:
                res = t.check(got, *args)
                ok, msg = res if isinstance(res, tuple) else (res, '')
                r['ok'] = bool(ok)
                if msg:
                    r['message'] = str(msg)
            else:
                r['ok'] = same(got, t.expected)
            if not t.check or t.expected is not None:
                r['expected'] = short(repr(t.expected))
        except Timeout:
            timed_out = True
            r['error'] = f'Time limit exceeded ({t.timeout:g}s): infinite loop or exponential blow-up?'
        except RecursionError:
            signal.setitimer(signal.ITIMER_REAL, 0)
            r['error'] = 'RecursionError: maximum recursion depth exceeded (missing base case or cycle check?)'
        except BaseException:
            signal.setitimer(signal.ITIMER_REAL, 0)
            r['error'] = user_traceback(user_file)
        r['ms'] = round((time.perf_counter() - t0) * 1000, 1)
        r['stdout'] = short(buf.getvalue(), 2000)
        results.append(r)
    return {'ok': bool(results) and all(r['ok'] for r in results),
            'results': results, 'stdout': short(out.getvalue(), 2000)}


if __name__ == '__main__':
    sys.setrecursionlimit(5000)
    problem_path, user_file = sys.argv[1], sys.argv[2]
    report = run(problem_path, user_file, '--solution' in sys.argv)
    sys.__stdout__.write('\n@@RESULT@@' + json.dumps(report))
