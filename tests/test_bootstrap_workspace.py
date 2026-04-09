from pathlib import Path

from scripts.bootstrap_workspace import (
    BootstrapParams,
    generate_codex_artifacts,
    scaffold_app,
)


def test_generate_codex_artifacts_creates_required_files(tmp_path: Path):
    params = BootstrapParams(
        org="acme",
        repo="diana",
        env_name="preview",
        app_name="meal-planner",
        app_type="web",
        stack_preset="react-fastapi",
        language="ts",
        internet_after_setup="off",
    )

    generated = generate_codex_artifacts(tmp_path, params, features=["auth", "inventory"])

    expected = {
        "00-params.json",
        "01-bootstrap-checklist.md",
        "02-architecture.md",
        "03-test-strategy.md",
        "04-feature-traceability.csv",
        "05-env-vars-matrix.csv",
        "06-runbook.md",
        "07-final-report.md",
    }
    assert {p.name for p in generated} == expected
    assert (tmp_path / "00-params.json").read_text().find('"org": "acme"') != -1


def test_scaffold_app_creates_expected_structure(tmp_path: Path):
    target = tmp_path / "apps"
    created = scaffold_app(target, app_name="meal-planner", app_type="web", language="ts")

    created_paths = {p.relative_to(tmp_path).as_posix() for p in created}
    assert "apps/meal-planner/README.md" in created_paths
    assert "apps/meal-planner/src/main.ts" in created_paths
