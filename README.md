[![Build Status](https://img.shields.io/github/actions/workflow/status/jonakoudijs/kavorites/deploy.yml)](https://github.com/jonakoudijs/kavorites/actions)
[![Image Size](https://img.shields.io/docker/image-size/jonakoudijs/kavorites/latest.svg)](https://hub.docker.com/r/jonakoudijs/kavorites)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

# Kavorites - Kubernetes Ingress Viewer

A simple and elegant web application that retrieves Ingress objects from a Kubernetes cluster and displays their URLs in a clean, modern interface.

## Features

- 🔍 **Automatic Discovery**: Automatically discovers all ingress objects across all namespaces
- 🌐 **URL Overview**: Clean display of all ingress URLs with service information
- 📊 **Real-time Stats**: Live statistics showing total ingresses, URLs, and namespaces
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- 🔄 **Auto-refresh**: Manual refresh capability with keyboard shortcuts (Ctrl+R)
- 📋 **Copy URLs**: One-click URL copying functionality
- 🔐 **Flexible Auth**: Works both in-cluster (service account) and locally (kubeconfig)
- 📱 **Responsive**: Works perfectly on desktop and mobile devices

## Screenshots

The application provides a clean overview of your Kubernetes ingress objects with:
- Status indicators (Ready/Pending/Unknown)
- Namespace grouping
- URL details with service information
- Labels and annotations display
- Copy-to-clipboard functionality

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Ensure you have kubectl configured**:
   ```bash
   kubectl cluster-info
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Open your browser**:
   Navigate to `http://localhost:8080`

### Docker Deployment

1. **Build the image**:
   ```bash
   docker build -t kavorites-ingress-viewer .
   ```

2. **Run locally with Docker**:
   ```bash
   docker run -p 8080:8080 --rm kavorites-ingress-viewer
   ```

### Kubernetes Deployment

1. **Build and push the image** (adjust registry as needed):
   ```bash
   docker build -t your-registry/kavorites-ingress-viewer .
   docker push your-registry/kavorites-ingress-viewer
   ```

2. **Update the image in deployment.yaml**:
   ```yaml
   image: your-registry/kavorites-ingress-viewer:latest
   ```

3. **Deploy to Kubernetes**:
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

4. **Optional: Deploy ingress for external access**:
   ```bash
   # Update the host in k8s/ingress.yaml first
   kubectl apply -f k8s/ingress.yaml
   ```

5. **Access the application**:
   ```bash
   # Port forward for local access
   kubectl port-forward svc/kavorites-ingress-viewer 8080:80
   ```

## Configuration

### Environment Variables

- `PORT`: Port to run the application on (default: 8080)
- `HOST`: Host to bind to (default: 0.0.0.0)

### Kubernetes RBAC

The application requires the following permissions:
- List and get namespaces
- List and get ingresses across all namespaces

These are automatically configured via the provided RBAC manifests.

## Architecture

### Backend (Python/Flask)
- **KubernetesClient**: Handles all K8s API interactions
- **Auto-configuration**: Automatically detects in-cluster vs local configuration
- **Error handling**: Graceful handling of API errors and connection issues
- **Health checks**: Built-in health endpoint for monitoring

### Frontend (JavaScript/HTML)
- **Modern UI**: Built with Tailwind CSS for a clean, professional look
- **Real-time updates**: Dynamic loading and refresh capabilities
- **Responsive design**: Works on all device sizes
- **Interactive features**: Modal dialogs, copy functionality, keyboard shortcuts

## API Endpoints

- `GET /`: Main application interface
- `GET /api/ingresses`: Returns all ingress objects and their URLs
- `GET /api/health`: Health check endpoint

## Development

### Project Structure
```
kavorites/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── Dockerfile            # Container configuration
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   └── js/
│       └── app.js        # Frontend JavaScript
├── k8s/
│   ├── deployment.yaml   # Kubernetes deployment
│   └── ingress.yaml      # Optional ingress configuration
└── README.md             # This file
```

### Adding Features

1. **New API endpoints**: Add routes to `app.py`
2. **UI improvements**: Modify `templates/index.html` and `static/js/app.js`
3. **K8s integration**: Extend the `KubernetesClient` class

## Troubleshooting

### Common Issues

1. **"Kubernetes client not available"**
   - Ensure kubectl is configured correctly
   - Check if running in-cluster with proper service account

2. **"No ingress objects found"**
   - Verify you have ingress objects in your cluster
   - Check RBAC permissions

3. **Connection issues**
   - Verify cluster connectivity
   - Check firewall/proxy settings

### Debug Mode

For debugging, you can enable Flask debug mode:
```bash
export FLASK_ENV=development
python app.py
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Flask and the Kubernetes Python client
- UI powered by Tailwind CSS and Font Awesome
- Designed for simplicity and ease of use
