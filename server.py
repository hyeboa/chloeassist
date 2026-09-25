from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA_FILE = Path('/Users/leehyunhye/Documents/chloeassist/data/chloeassist-data.json')

STORE_KEYS = [
    'tasks',
    'notes',
    'goals',
    'milestones',
    'projectTasks',
    'features',
    'issues',
    'routines',
    'routineLogs',
    'launchChecklists',
    'sitemapSections',
    'sitemapScreens',
    'sitemapComponents',
    'weeklyReviews',
    'monthlyReviews',
    'uiSettings',
]

STORE_DEFAULTS = {
    'tasks': [],
    'notes': [],
    'goals': [],
    'milestones': [],
    'projectTasks': [],
    'features': [],
    'issues': [],
    'routines': [],
    'routineLogs': {},
    'launchChecklists': [],
    'sitemapSections': [],
    'sitemapScreens': [],
    'sitemapComponents': [],
    'weeklyReviews': {},
    'monthlyReviews': {},
    'uiSettings': {},
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def empty_store() -> dict:
    return {key: ({} if isinstance(default, dict) else []) for key, default in STORE_DEFAULTS.items()}


def normalize_value(name: str, value):
    default = STORE_DEFAULTS[name]
    if isinstance(default, dict):
        return value if isinstance(value, dict) and not isinstance(value, list) else {}
    return value if isinstance(value, list) else []


def normalize_snapshot(payload) -> dict:
    source = payload
    if isinstance(payload, dict) and isinstance(payload.get('data'), dict):
        source = payload['data']

    data = empty_store()
    if isinstance(source, dict):
        for key in STORE_KEYS:
            data[key] = normalize_value(key, source.get(key, data[key]))

    version = 1
    updated_at = now_iso()
    if isinstance(payload, dict):
        raw_version = payload.get('version', version)
        version = raw_version if isinstance(raw_version, int) else version
        updated_at = payload.get('updatedAt') or updated_at

    return {
        'version': version,
        'updatedAt': updated_at,
        'data': data,
    }


def load_snapshot() -> dict:
    if not DATA_FILE.exists():
        return normalize_snapshot({'data': empty_store()})
    try:
        with DATA_FILE.open('r', encoding='utf-8') as f:
            payload = json.load(f)
        return normalize_snapshot(payload)
    except Exception:
        return normalize_snapshot({'data': empty_store()})


def save_snapshot(payload) -> dict:
    snapshot = normalize_snapshot(payload)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=DATA_FILE.parent, delete=False, suffix='.tmp') as tmp:
        json.dump(snapshot, tmp, ensure_ascii=False, indent=2)
        tmp.write('\n')
        tmp_path = Path(tmp.name)

    os.replace(tmp_path, DATA_FILE)
    return snapshot


def read_json_body(handler):
    length = int(handler.headers.get('Content-Length') or '0')
    if length <= 0:
        return {}
    raw = handler.rfile.read(length)
    if not raw:
        return {}
    return json.loads(raw.decode('utf-8'))


class ChloeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        # Keep the console readable; requests still show status codes when needed.
        print(f'[{self.log_date_time_string()}] {self.address_string()} {format % args}')

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def _send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_store(self):
        if self.command == 'GET':
            self._send_json(load_snapshot())
            return True

        if self.command in {'PUT', 'POST', 'PATCH'}:
            payload = read_json_body(self)
            snapshot = save_snapshot(payload)
            self._send_json(snapshot)
            return True

        if self.command == 'DELETE':
            snapshot = save_snapshot({'data': empty_store()})
            self._send_json(snapshot)
            return True

        self.send_error(405, 'Method Not Allowed')
        return True

    def do_GET(self):
        if urlparse(self.path).path == '/api/store':
            self._handle_store()
            return
        super().do_GET()

    def do_PUT(self):
        if urlparse(self.path).path == '/api/store':
            self._handle_store()
            return
        self.send_error(404)

    def do_POST(self):
        if urlparse(self.path).path == '/api/store':
            self._handle_store()
            return
        self.send_error(404)

    def do_PATCH(self):
        if urlparse(self.path).path == '/api/store':
            self._handle_store()
            return
        self.send_error(404)

    def do_DELETE(self):
        if urlparse(self.path).path == '/api/store':
            self._handle_store()
            return
        self.send_error(404)


def main():
    host = '127.0.0.1'
    port = 8000
    server = ThreadingHTTPServer((host, port), ChloeHandler)
    print(f'Chloe Assist server listening on http://{host}:{port}')
    print(f'Data file: {DATA_FILE}')
    server.serve_forever()


if __name__ == '__main__':
    main()
