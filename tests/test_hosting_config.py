import json
import tomllib
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def test_vercel_has_spa_and_api_rewrites():
    config = json.loads((REPO_ROOT / 'vercel.json').read_text())
    rewrites = config.get('rewrites', [])
    assert any(r.get('source') == '/api/(.*)' and r.get('destination') == '/api/$1' for r in rewrites)
    assert any(r.get('source') == '/(.*)' and r.get('destination') == '/index.html' for r in rewrites)


def test_netlify_includes_identity_passthrough_and_spa_redirect():
    config = tomllib.loads((REPO_ROOT / 'netlify.toml').read_text())
    redirects = config.get('redirects', [])

    assert any(
        r.get('from') == '/.netlify/identity/*'
        and r.get('to') == '/.netlify/identity/:splat'
        and r.get('status') == 200
        for r in redirects
    )
    assert any(
        r.get('from') == '/*' and r.get('to') == '/index.html' and r.get('status') == 200
        for r in redirects
    )
