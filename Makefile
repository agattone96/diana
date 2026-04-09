.PHONY: setup test lint ci bootstrap

setup:
	pip install -r backend/requirements.txt

test:
	pytest -q

lint:
	python -m py_compile scripts/bootstrap_workspace.py

ci: lint test

bootstrap:
	python scripts/bootstrap_workspace.py \
		--org diana-org \
		--repo diana \
		--env-name dev \
		--app-name diana-web \
		--app-type web \
		--stack-preset react-fastapi \
		--language ts \
		--internet-after-setup off \
		--features auth,inventory,weekly-plan
