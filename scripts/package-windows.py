"""Build the offline Windows x64 runtime ZIP from an installed project.

Before running, provide runtime/node.exe and runtime/NODE-LICENSE.txt, and
install dependencies with npm ci. The receiver only needs the packaged CMD.
"""
from pathlib import Path
import os
import struct
import zipfile

root = Path(__file__).resolve().parent.parent
node = root / 'runtime/node.exe'
license_file = root / 'runtime/NODE-LICENSE.txt'
assert node.is_file() and license_file.is_file(), 'Missing Node runtime or license'
assert (root / 'node_modules/vinext/dist/cli.js').is_file(), 'Run npm ci first'
with node.open('rb') as f:
    assert f.read(2) == b'MZ', 'Invalid Windows executable'
    f.seek(0x3C)
    offset = struct.unpack('<I', f.read(4))[0]
    f.seek(offset)
    assert f.read(4) == b'PE\0\0'
    assert struct.unpack('<H', f.read(2))[0] == 0x8664, 'Node must be Windows x64'

destination = root.parent / '校园活动管理系统V2.0_Windows64运行版.zip'
prefix = '校园活动管理系统V2.0_Windows64运行版'
root_excludes = {'.git', 'docs', 'tests', 'test-results', 'playwright-report',
                 'dist', '.wrangler', '.vinext', '.next', 'portable'}
cache_excludes = {'.vite', '.vite-temp', '.cache', '__pycache__'}
with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for base, dirs, names in os.walk(root):
        base_path = Path(base)
        excludes = root_excludes | cache_excludes if base_path == root else cache_excludes
        dirs[:] = [d for d in dirs if d not in excludes]
        for name in names:
            if name.endswith('.tsbuildinfo') or name.startswith('.env'):
                continue
            if base_path == root and name.startswith('playwright.'):
                continue
            if base_path == root / 'scripts' and name != 'start-windows.mjs':
                continue
            p = base_path / name
            z.write(p, f'{prefix}/{p.relative_to(root).as_posix()}')
with zipfile.ZipFile(destination) as z:
    assert z.testzip() is None, 'Archive CRC check failed'
    for required in ['启动系统.cmd', 'runtime/node.exe', 'runtime/NODE-LICENSE.txt',
                     'scripts/start-windows.mjs', 'node_modules/vinext/dist/cli.js']:
        assert f'{prefix}/{required}' in z.namelist(), required
print(f'Windows x64 ZIP verified: {destination} ({destination.stat().st_size} bytes)')
