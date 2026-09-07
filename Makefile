ROOT_DIR := $(shell pwd)
LOGS_DIR := $(ROOT_DIR)/logs

.PHONY: all run stop status dev backend frontend docker-run docker-stop logs help

all: run

help:
	@echo "Available commands:"
	@echo "  make run         - Run both Backend & Frontend in background"
	@echo "  make stop        - Stop running Backend and Frontend"
	@echo "  make status      - Check if services are running"
	@echo "  make dev         - Run both services concurrently in foreground"
	@echo "  make backend     - Run backend only"
	@echo "  make frontend    - Run frontend only"
	@echo "  make logs        - Tail server logs"
	@echo "  make docker-run  - Run with Docker Compose"
	@echo "  make docker-stop - Stop Docker Compose"

run:
	@mkdir -p $(LOGS_DIR)
	@echo "Stopping existing instances..."
	@$(MAKE) stop > /dev/null 2>&1 || true
	@echo "Starting Backend (Go Fiber on :8080)..."
	@cd $(ROOT_DIR)/backend && (nohup go run cmd/server/main.go > $(LOGS_DIR)/backend.log 2>&1 & echo $$! > $(LOGS_DIR)/backend.pid)
	@echo "Starting Frontend (Next.js on :3000)..."
	@cd $(ROOT_DIR)/frontend && (nohup npm run dev > $(LOGS_DIR)/frontend.log 2>&1 & echo $$! > $(LOGS_DIR)/frontend.pid)
	@sleep 3
	@$(MAKE) status

stop:
	@echo "Stopping KKP services..."
	@-if [ -f $(LOGS_DIR)/backend.pid ]; then kill -9 `cat $(LOGS_DIR)/backend.pid` 2>/dev/null || true; rm -f $(LOGS_DIR)/backend.pid; fi
	@-if [ -f $(LOGS_DIR)/frontend.pid ]; then kill -9 `cat $(LOGS_DIR)/frontend.pid` 2>/dev/null || true; rm -f $(LOGS_DIR)/frontend.pid; fi
	@-lsof -ti :8080 | xargs kill -9 2>/dev/null || true
	@-lsof -ti :3000 | xargs kill -9 2>/dev/null || true
	@echo "All services stopped."

status:
	@echo "--- Service Status ---"
	@if lsof -i :8080 > /dev/null 2>&1; then \
		echo "  [Backend]  Running on http://localhost:8080"; \
	else \
		echo "  [Backend]  Stopped"; \
	fi
	@if lsof -i :3000 > /dev/null 2>&1; then \
		echo "  [Frontend] Running on http://localhost:3000"; \
	else \
		echo "  [Frontend] Stopped"; \
	fi
	@echo "----------------------"

logs:
	@tail -n 30 -f $(LOGS_DIR)/backend.log $(LOGS_DIR)/frontend.log

backend:
	cd $(ROOT_DIR)/backend && go run cmd/server/main.go

frontend:
	cd $(ROOT_DIR)/frontend && npm run dev

docker-run:
	docker-compose up -d --build

docker-stop:
	docker-compose down
