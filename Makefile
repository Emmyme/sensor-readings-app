.PHONY: up migrate test

up: ## Build and run containers
	docker-compose up -d --build

migrate: ## Run migrations
	docker-compose exec backend python manage.py migrate

test: ## Run tests
	docker-compose exec backend python -m pytest