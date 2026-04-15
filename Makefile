.PHONY: setup venv check-python test lint ci bootstrap
.PHONY: db-up db-down db-reset db-verify

VENV ?= .venv
PYTHON_BASE ?= python3.12
PYENV_OK := $(shell command -v pyenv >/dev/null 2>&1 && echo yes)
PYTHON_BASE_OK := $(shell command -v $(PYTHON_BASE) >/dev/null 2>&1 && echo yes)
PYTHON_FALLBACK := $(if $(filter yes,$(PYTHON_BASE_OK)),$(PYTHON_BASE),$(if $(filter yes,$(PYENV_OK)),pyenv exec python,python3))
PYTHON := $(if $(wildcard $(VENV)/bin/python),$(VENV)/bin/python,$(PYTHON_FALLBACK))

setup:
	$(MAKE) venv

check-python:
	@if [ -x "$(VENV)/bin/python" ]; then exit 0; fi; \
	if [ "$(PYTHON_BASE_OK)" = "yes" ]; then exit 0; fi; \
	if [ "$(PYENV_OK)" = "yes" ]; then exit 0; fi; \
	echo "Missing $(PYTHON_BASE) (and pyenv not found). Install Python 3.12 (see .tool-versions), then run: make setup"; exit 1

venv: check-python
	$(PYTHON_FALLBACK) -m venv $(VENV)
	$(VENV)/bin/python -m pip install --upgrade pip
	$(VENV)/bin/python -m pip install -r backend/requirements.txt

test: check-python
	$(PYTHON) -m pytest -q

lint: check-python
	$(PYTHON) -m py_compile scripts/bootstrap_workspace.py

ci: lint test

bootstrap: check-python
	$(PYTHON) scripts/bootstrap_workspace.py \
		--org diana-org \
		--repo diana \
		--env-name dev \
		--app-name diana-web \
		--app-type web \
		--stack-preset react-fastapi \
		--language ts \
		--internet-after-setup off \
		--features auth,inventory,weekly-plan

db-up:
	docker-compose up -d postgres

db-down:
	docker-compose down

db-reset:
	docker-compose down -v

db-verify:
	docker exec diana-postgres psql -U diana -d diana -c "SELECT NOW() AS now;"
