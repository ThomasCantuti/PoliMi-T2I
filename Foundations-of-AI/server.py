"""AlgoDojo local server: serves the web app and runs your code against the tests.

    python3 server.py [port]      -> http://127.0.0.1:8765
"""
import json
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, 'runner'))
import catalog  # noqa: E402

WEB = os.path.join(ROOT, 'web', 'dist')  # built by `cd web && npm run build`
STATE = os.path.join(os.path.expanduser('~'), '.algodojo', 'state.json')  # progress, drafts, chats, settings
STATE_LOCK = threading.Lock()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=WEB, **kw)

    def translate_path(self, path):
        if path.startswith('/content/'):
            rel = os.path.normpath(path.split('?')[0][len('/content/'):]).lstrip('./')
            return os.path.join(ROOT, 'content', rel)
        return super().translate_path(path)

    def end_headers(self):
        # hashed build assets can be cached forever; everything else is always fresh
        immutable = self.path.startswith('/assets/')
        self.send_header('Cache-Control', 'public, max-age=31536000, immutable' if immutable else 'no-store')
        super().end_headers()

    def send_json(self, obj, status=200):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/api/catalog':
            with open(os.path.join(ROOT, 'content', 'topics.json')) as f:
                topics = json.load(f)
            problems, errors = catalog.catalog()
            return self.send_json({'topics': topics, 'problems': problems, 'errors': errors})
        if self.path == '/api/state':
            if not os.path.isfile(STATE):
                return self.send_json(None)
            with open(STATE) as f:
                return self.send_json(json.load(f))
        return super().do_GET()

    def do_PUT(self):
        if self.path != '/api/state':
            return self.send_json({'error': 'not found'}, 404)
        body = self.rfile.read(int(self.headers['Content-Length']))
        try:
            ok = isinstance(json.loads(body), dict)
        except ValueError:
            ok = False
        if not ok:
            return self.send_json({'error': 'expected a JSON object'}, 400)
        with STATE_LOCK:  # write a temp file, then swap it in: a crash mid-write can't corrupt the saved state
            os.makedirs(os.path.dirname(STATE), exist_ok=True)
            with open(STATE + '.tmp', 'wb') as f:
                f.write(body)
                f.flush()
                os.fsync(f.fileno())
            os.replace(STATE + '.tmp', STATE)
        self.send_json({'ok': True})

    def do_POST(self):
        if self.path != '/api/run':
            return self.send_json({'error': 'not found'}, 404)
        req = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        path = os.path.normpath(os.path.join(catalog.PROBLEMS, req['id'] + '.py'))
        if not path.startswith(catalog.PROBLEMS + os.sep) or not os.path.isfile(path):
            return self.send_json({'error': 'unknown problem'}, 404)
        self.send_json(catalog.run_tests(path, req['code']))

    def log_message(self, fmt, *args):
        line = str(args[0] if args else '')
        if '/api/' in line and '/api/state' not in line:  # state is saved on every change: too noisy
            super().log_message(fmt, *args)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    if not os.path.isfile(os.path.join(WEB, 'index.html')):
        print('web/dist is missing: build the app first with  cd web && npm install && npm run build')
    print(f'AlgoDojo running at http://127.0.0.1:{port}  (Ctrl+C to stop)')
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
