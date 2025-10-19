.PHONY: up migrate test seed

up: ## Build and run containers
	docker-compose up -d --build

migrate: ## Run migrations
	docker-compose exec backend python manage.py migrate

test: ## Run tests
	docker-compose exec backend python -m pytest

seed: ## Create seed data
	docker-compose exec backend python manage.py seed_data