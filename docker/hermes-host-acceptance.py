"""Opt-in installed-runtime acceptance fixture, not a Hermes installation or gateway service."""
import argparse
import asyncio
import contextlib
import io
import json
import logging
import os
from pathlib import Path
import secrets
import site
import socket
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--source', required=True)
parser.add_argument('--home', required=True)
parser.add_argument('--port', type=int, default=0)
parser.add_argument('--use-configured-minimax', action='store_true')
args = parser.parse_args()
if not args.use_configured_minimax:
    parser.error('Explicit --use-configured-minimax is required for the paid provider journey.')

source, home = Path(args.source).resolve(), Path(args.home).resolve()
if home == source.parent or home in source.parents or source in home.parents:
    raise SystemExit('isolated_home_required')
home.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(source))
from pm.environments import selected_venv, site_packages
site.addsitedir(str(site_packages(selected_venv(source))))
logging.disable(logging.CRITICAL)

def report(value):
    sys.__stdout__.write(json.dumps(value) + '\n')
    sys.__stdout__.flush()

async def run():
    # Resolve through Hermes itself. No source credential value crosses process stdout or Docker.
    import gateway.run as native
    original_config = native._load_gateway_config()
    model = native._resolve_gateway_model(original_config)
    runtime = native._resolve_runtime_agent_kwargs()
    if runtime.get('provider') not in {'minimax', 'minimax-cn'} or not runtime.get('api_key'):
        raise RuntimeError('configured_minimax_required')
    os.environ['HERMES_HOME'] = str(home)
    os.chdir(home)
    import hermes_constants
    hermes_constants.pin_process_hermes_home(home)
    native._hermes_home = home
    minimal = {'model': {'default': model, 'provider': runtime['provider']},
               'agent': {'max_turns': 1}, 'checkpoints': {'enabled': False}}
    native._load_gateway_config = lambda *a, **kw: minimal
    native._resolve_runtime_agent_kwargs = lambda: dict(runtime)
    native._resolve_gateway_model = lambda *a, **kw: model
    native._current_max_iterations = lambda: 1
    native.GatewayRunner._load_fallback_model = staticmethod(lambda: None)
    import run_agent
    real_agent = run_agent.AIAgent

    class IsolatedAcceptanceAgent(real_agent):
        def __init__(self, **kwargs):
            kwargs.update(enabled_toolsets=[], max_tokens=512, max_iterations=1,
                          skip_context_files=True, skip_memory=True, skip_background_review=True,
                          load_soul_identity=False, reasoning_config={'enabled': False},
                          ephemeral_system_prompt='This is an isolated integration test. Reply in English. Do not use tools.')
            super().__init__(**kwargs)
    run_agent.AIAgent = IsolatedAcceptanceAgent
    from gateway.config import PlatformConfig
    from gateway.platforms.api_server import APIServerAdapter
    key_file = home / 'service-key'
    if not key_file.exists():
        key_file.write_text(secrets.token_hex(32))
    key = key_file.read_text().strip()
    port = args.port
    if not port:
        with socket.socket() as available:
            available.bind(('127.0.0.1', 0))
            port = available.getsockname()[1]
    stop_file = home / 'stop'
    stop_file.unlink(missing_ok=True)
    adapter = APIServerAdapter(PlatformConfig(enabled=True, extra={
        'host': '127.0.0.1', 'port': port, 'key': key, 'model_name': model}))
    try:
        if not await adapter.connect():
            raise RuntimeError('api_start_failed')
        metadata = {'state': 'listening', 'port': port, 'provider': runtime['provider'],
                    'model': model, 'enabledToolsets': 0, 'personalContextDisabled': True}
        (home / 'metadata.json').write_text(json.dumps(metadata))
        report(metadata)
        for _ in range(6000):
            if stop_file.exists():
                break
            await asyncio.sleep(0.1)
    finally:
        await adapter.disconnect()
        report({'state': 'stopped', 'serviceKeyRetainedForExplicitRestart': True})

try:
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        asyncio.run(run())
except BaseException as error:
    report({'state': 'acceptance_failed', 'type': type(error).__name__})
    raise SystemExit(1)
