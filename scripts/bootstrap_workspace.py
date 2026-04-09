from __future__ import annotations

import argparse
import csv
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, List


@dataclass(frozen=True)
class BootstrapParams:
    org: str
    repo: str
    env_name: str
    app_name: str
    app_type: str
    stack_preset: str
    language: str
    internet_after_setup: str


def _write_text(path: Path, content: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    return path


def generate_codex_artifacts(base_dir: Path, params: BootstrapParams, features: Iterable[str]) -> List[Path]:
    base_dir.mkdir(parents=True, exist_ok=True)
    features = [f for f in features if f]

    files: List[Path] = []
    files.append(_write_text(base_dir / "00-params.json", json.dumps(asdict(params), indent=2) + "\n"))

    files.append(
        _write_text(
            base_dir / "01-bootstrap-checklist.md",
            "\n".join(
                [
                    "# Bootstrap Checklist",
                    "- [ ] Toolchain pinned (.tool-versions / language pin files)",
                    "- [ ] Lockfiles committed and dependency install reproducible",
                    "- [ ] CI checks configured (lint, typecheck, test, build)",
                    "- [ ] Security scans configured (secrets + dependency audit)",
                    "- [ ] Offline mode enabled after initial setup",
                    "",
                ]
            ),
        )
    )

    files.append(
        _write_text(
            base_dir / "02-architecture.md",
            f"# Architecture\n\n- app: {params.app_name}\n- type: {params.app_type}\n- preset: {params.stack_preset}\n- language: {params.language}\n",
        )
    )

    files.append(
        _write_text(
            base_dir / "03-test-strategy.md",
            "# Test Strategy\n\n- Unit tests for domain rules\n- Integration tests for API contracts\n- End-to-end smoke checks for critical flows\n- TDD loop: red -> green -> refactor\n",
        )
    )

    ft_path = base_dir / "04-feature-traceability.csv"
    with ft_path.open("w", newline="") as fp:
        writer = csv.writer(fp)
        writer.writerow(["feature", "acceptance_test", "unit_tests", "status"])
        for feature in features:
            writer.writerow([feature, f"test_acceptance_{feature}", f"test_unit_{feature}", "planned"])
    files.append(ft_path)

    env_path = base_dir / "05-env-vars-matrix.csv"
    with env_path.open("w", newline="") as fp:
        writer = csv.writer(fp)
        writer.writerow(["name", "scope", "required", "sensitivity", "owner"])
        writer.writerow(["DATABASE_URL", "local|preview|production", "yes", "high", params.org])
        writer.writerow(["OPENAI_API_KEY", "preview|production", "yes", "high", params.org])
        writer.writerow(["APP_ENV", "local|preview|production", "yes", "low", params.org])
    files.append(env_path)

    files.append(
        _write_text(
            base_dir / "06-runbook.md",
            "# Runbook\n\n1. Setup: install locked dependencies\n2. Validate: run lint/typecheck/test\n3. Deploy: promote artifact to target env\n4. Rollback: redeploy last known good revision\n",
        )
    )

    files.append(
        _write_text(
            base_dir / "07-final-report.md",
            "# Final Report\n\n- Bootstrap status: pending\n- Test status: pending\n- Deployment status: pending\n- Risks: pending review\n",
        )
    )

    return files


def scaffold_app(base_dir: Path, app_name: str, app_type: str, language: str) -> List[Path]:
    app_root = base_dir / app_name
    src_dir = app_root / "src"
    extension = {"ts": "ts", "js": "js", "py": "py", "go": "go"}.get(language, "txt")

    created = [
        _write_text(
            app_root / "README.md",
            f"# {app_name}\n\nScaffolded {app_type} app with language `{language}`.\n",
        ),
        _write_text(src_dir / f"main.{extension}", "// entrypoint\n" if extension in {"ts", "js"} else "# entrypoint\n"),
    ]
    return created


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Deterministic workspace bootstrap helper")
    parser.add_argument("--org", required=True)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--env-name", required=True)
    parser.add_argument("--app-name", required=True)
    parser.add_argument("--app-type", required=True)
    parser.add_argument("--stack-preset", required=True)
    parser.add_argument("--language", required=True)
    parser.add_argument("--internet-after-setup", default="off")
    parser.add_argument("--features", default="")
    parser.add_argument("--codex-dir", default="/workspace/_codex")
    parser.add_argument("--scaffold-dir", default="apps")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    params = BootstrapParams(
        org=args.org,
        repo=args.repo,
        env_name=args.env_name,
        app_name=args.app_name,
        app_type=args.app_type,
        stack_preset=args.stack_preset,
        language=args.language,
        internet_after_setup=args.internet_after_setup,
    )
    feature_list = [item.strip() for item in args.features.split(",") if item.strip()]

    generate_codex_artifacts(Path(args.codex_dir), params, features=feature_list)
    scaffold_app(Path(args.scaffold_dir), app_name=args.app_name, app_type=args.app_type, language=args.language)


if __name__ == "__main__":
    main()
