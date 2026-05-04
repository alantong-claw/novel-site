from pathlib import Path
import os
import sys

ROOT = Path('/home/alantong/ai-work')
WORK_TMP = ROOT / 'work_tmp' / 'tasks'


def output_path(task_name: str, filename: str, env_var: str) -> Path:
    override = os.environ.get(env_var)
    if override:
        out = Path(override)
    else:
        out = WORK_TMP / task_name / filename
    out.parent.mkdir(parents=True, exist_ok=True)
    return out


if __name__ == '__main__':
    if len(sys.argv) != 4:
        print('usage: office_output_path.py <task_name> <filename> <env_var>')
        sys.exit(1)
    print(output_path(sys.argv[1], sys.argv[2], sys.argv[3]))
