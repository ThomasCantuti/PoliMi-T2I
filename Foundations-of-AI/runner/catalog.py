"""Load problem files into JSON-able dicts, and validate them.

    python3 runner/catalog.py [problems/<topic> ...]   # validate + run every SOLUTION against its tests
"""
import glob
import json
import os
import subprocess
import sys
import tempfile

RUNNER = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(RUNNER)
PROBLEMS = os.path.join(ROOT, 'problems')
sys.path.insert(0, RUNNER)

from harness import load_module  # noqa: E402

REQUIRED = {'code': ['TITLE', 'STATEMENT', 'STARTER', 'SOLUTION', 'TESTS', 'HINTS'],
            'quiz': ['TITLE', 'QUESTIONS'],
            'trace': ['TITLE', 'STATEMENT', 'VIZ', 'CONFIG']}


def problem_files(dirs=None):
    files = []
    for d in dirs or [PROBLEMS]:
        files += glob.glob(os.path.join(d, '**', '*.py'), recursive=True) if os.path.isdir(d) else [d]
    return sorted(f for f in files if not os.path.basename(f).startswith('_'))


def load(path):
    rel = os.path.relpath(path, PROBLEMS)[:-3]
    m = load_module(path, 'problem_' + rel.replace('/', '_'))
    kind = getattr(m, 'KIND', 'code')
    missing = [k for k in REQUIRED[kind] if not hasattr(m, k)]
    if missing:
        raise ValueError(f'{rel}: missing {missing}')
    p = {'id': rel, 'topic': rel.split('/')[0], 'kind': kind, 'title': m.TITLE,
         'difficulty': getattr(m, 'DIFFICULTY', 'easy'), 'tags': getattr(m, 'TAGS', []),
         'statement': getattr(m, 'STATEMENT', ''), 'hints': getattr(m, 'HINTS', []),
         'explanation': getattr(m, 'EXPLANATION', '')}
    if kind == 'code':
        p.update(starter=m.STARTER, solution=m.SOLUTION,
                 tests=[{'name': t.name, 'input': t.show} for t in m.TESTS])
    elif kind == 'quiz':
        p['questions'] = m.QUESTIONS
    else:
        p.update(viz=m.VIZ, config=m.CONFIG)
    json.dumps(p)  # must be serializable
    return p


def catalog():
    out, errors = [], []
    for f in problem_files():
        try:
            out.append(load(f))
        except Exception as e:
            errors.append(f'{os.path.relpath(f, ROOT)}: {type(e).__name__}: {e}')
    return out, errors


def run_tests(problem_path, code, solution=False, timeout=30):
    problem_path = os.path.abspath(problem_path)
    with tempfile.TemporaryDirectory() as tmp:
        user = os.path.join(tmp, 'solution.py')
        with open(user, 'w') as f:
            f.write(code)
        cmd = [sys.executable, '-I', os.path.join(RUNNER, 'harness.py'), problem_path, user]
        try:
            p = subprocess.run(cmd + (['--solution'] if solution else []), cwd=tmp,
                               capture_output=True, text=True, timeout=timeout)
        except subprocess.TimeoutExpired:
            return {'ok': False, 'error': f'Global time limit exceeded ({timeout}s).', 'results': []}
        if '@@RESULT@@' not in p.stdout:
            return {'ok': False, 'error': (p.stderr or p.stdout)[-3000:] or 'runner crashed', 'results': []}
        return json.loads(p.stdout.rsplit('@@RESULT@@', 1)[1])


if __name__ == '__main__':
    bad = 0
    for f in problem_files(sys.argv[1:] or None):
        rel = os.path.relpath(f, ROOT)
        try:
            p = load(f)
        except Exception as e:
            print(f'FAIL {rel}: {type(e).__name__}: {e}')
            bad += 1
            continue
        if p['kind'] != 'code':
            print(f'ok   {rel} ({p["kind"]})')
            continue
        r = run_tests(f, '', solution=True)
        fails = [x for x in r['results'] if not x['ok']]
        if r['ok']:
            s = run_tests(f, p['starter'])
            note = '' if not s['ok'] else '  (warning: STARTER already passes)'
            print(f'ok   {rel} ({len(r["results"])} tests){note}')
        else:
            bad += 1
            print(f'FAIL {rel}: {r.get("error", "")}')
            for x in fails:
                print('     -', x['name'], '|', x.get('error') or f"got {x.get('got')} expected {x.get('expected')} {x.get('message', '')}")
    print('\nall good' if not bad else f'\n{bad} problem(s) failing')
    sys.exit(1 if bad else 0)
