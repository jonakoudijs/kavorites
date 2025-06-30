.PHONY: help install run build docker-run docker-build k8s-deploy k8s-delete clean

# Default target
help:
	@echo "Available commands:"
	@echo "  install      - Install Python dependencies"
	@echo "  run          - Run the application locally"
	@echo "  build        - Build Docker image"
	@echo "  docker-run   - Run with Docker"
	@echo "  k8s-deploy   - Deploy to Kubernetes"
	@echo "  k8s-delete   - Delete from Kubernetes"
	@echo "  clean        - Clean up generated files"

# Install Python dependencies
install:
	pip install -r requirements.txt

# Run the application locally
run:
	python app.py

# Build Docker image
build:
	docker build -t kavorites-ingress-viewer .

# Run with Docker
docker-run: build
	docker run -p 8080:8080 --rm kavorites-ingress-viewer

# Deploy to Kubernetes
k8s-deploy:
	kubectl apply -f k8s/deployment.yaml

# Deploy with ingress
k8s-deploy-ingress:
	kubectl apply -f k8s/deployment.yaml
	kubectl apply -f k8s/ingress.yaml

# Delete from Kubernetes
k8s-delete:
	kubectl delete -f k8s/deployment.yaml
	kubectl delete -f k8s/ingress.yaml --ignore-not-found=true

# Port forward to access the service
k8s-port-forward:
	kubectl port-forward svc/kavorites-ingress-viewer 8080:80

# Clean up generated files
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 