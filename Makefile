.PHONY: setup venv check-python test lint ci bootstrap

VENV ?= .venv
PYTHON_BASE ?= python3.12
PYTHON_BASE_OK := $(shell command -v $(PYTHON_BASE) >/dev/null 2>&1 && echo yes)
PYTHON := $(if $(wildcard $(VENV)/bin/python),$(VENV)/bin/python,$(PYTHON_BASE))

setup:
	$(MAKE) venv

check-python:
	@if [ -x "$(VENV)/bin/python" ]; then exit 0; fi; \
	if [ "$(PYTHON_BASE_OK)" != "yes" ]; then echo "Missing $(PYTHON_BASE). Install Python 3.12 (see .tool-versions), then run: make setup"; exit 1; fi

venv: check-python
	$(PYTHON_BASE) -m venv $(VENV)
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
