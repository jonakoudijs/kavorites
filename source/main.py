#!/usr/bin/env python3
"""
Kubernetes Ingress Viewer - A simple web application to view and manage ingress URLs
"""

import os
import logging
from typing import List, Dict, Any, Optional
from flask import Flask, render_template, jsonify, request
from kubernetes import client, config
from kubernetes.client.rest import ApiException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class KubernetesClient:
    """Handles Kubernetes API interactions"""
    
    def __init__(self):
        self.core_v1 = None
        self.networking_v1 = None
        self.default_enabled = os.environ.get('KAVORITES_DEFAULT_ENABLED', 'true').lower() == 'true'
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Kubernetes client with appropriate configuration"""
        try:
            # Try to load in-cluster config first (when running in a pod)
            config.load_incluster_config()
            logger.info("Using in-cluster Kubernetes configuration")
        except config.ConfigException:
            try:
                # Fallback to kubeconfig (for local development)
                config.load_kube_config()
                logger.info("Using local kubeconfig configuration")
            except config.ConfigException as e:
                logger.error(f"Failed to load Kubernetes configuration: {e}")
                raise
        
        # Initialize API clients
        self.core_v1 = client.CoreV1Api()
        self.networking_v1 = client.NetworkingV1Api()
    
    def get_ingress_objects(self) -> List[Dict[str, Any]]:
        """Retrieve all ingress objects from the cluster, filtered by enabled annotation and default setting"""
        try:
            # Get all namespaces
            namespaces = self.core_v1.list_namespace()
            
            all_ingresses = []
            
            for namespace in namespaces.items:
                namespace_name = namespace.metadata.name
                
                try:
                    # Get ingresses for each namespace
                    ingresses = self.networking_v1.list_namespaced_ingress(namespace_name)
                    
                    for ingress in ingresses.items:
                        ingress_data = self._parse_ingress(ingress, namespace_name)
                        if ingress_data and self._is_enabled(ingress_data):
                            all_ingresses.append(ingress_data)
                            
                except ApiException as e:
                    logger.warning(f"Could not retrieve ingresses from namespace {namespace_name}: {e}")
                    continue
            
            return all_ingresses
            
        except ApiException as e:
            logger.error(f"Failed to retrieve ingress objects: {e}")
            return []
    
    def _parse_ingress(self, ingress, namespace: str) -> Optional[Dict[str, Any]]:
        """Parse an ingress object and extract relevant information"""
        try:
            ingress_data = {
                'name': ingress.metadata.name,
                'namespace': namespace,
                'creation_timestamp': ingress.metadata.creation_timestamp.isoformat() if ingress.metadata.creation_timestamp else None,
                'urls': [],
                'annotations': dict(ingress.metadata.annotations) if ingress.metadata.annotations else {},
                'labels': dict(ingress.metadata.labels) if ingress.metadata.labels else {},
                'status': 'Unknown'
            }
            
            # Extract URLs from ingress rules
            if ingress.spec and ingress.spec.rules:
                for rule in ingress.spec.rules:
                    if rule.host:
                        protocol = 'https' if self._has_tls(ingress, rule.host) else 'http'
                        url = f"{protocol}://{rule.host}"
                        
                        # Add path information if available
                        if rule.http and rule.http.paths:
                            for path in rule.http.paths:
                                path_value = path.path if path.path else '/'
                                full_url = f"{url}{path_value}"
                                ingress_data['urls'].append({
                                    'url': full_url,
                                    'path': path_value,
                                    'service_name': path.backend.service.name if path.backend and path.backend.service else None,
                                    'service_port': path.backend.service.port.number if path.backend and path.backend.service and path.backend.service.port else None
                                })
                        else:
                            ingress_data['urls'].append({
                                'url': url,
                                'path': '/',
                                'service_name': None,
                                'service_port': None
                            })
            
            # Determine status
            if ingress.status and ingress.status.load_balancer and ingress.status.load_balancer.ingress:
                ingress_data['status'] = 'Ready'
            else:
                ingress_data['status'] = 'Pending'
            
            return ingress_data
            
        except Exception as e:
            logger.error(f"Error parsing ingress {ingress.metadata.name}: {e}")
            return None
    
    def _has_tls(self, ingress, host: str) -> bool:
        """Check if the ingress has TLS configuration for the given host"""
        if ingress.spec and ingress.spec.tls:
            for tls in ingress.spec.tls:
                if tls.hosts and host in tls.hosts:
                    return True
        return False

    def _is_enabled(self, ingress_data: Dict[str, Any]) -> bool:
        """Determine if the ingress should be included based on the enabled annotation and default setting"""
        annotations = ingress_data.get('annotations', {})
        enabled = annotations.get('kavorites.koudijs.app/enabled')
        if enabled is not None:
            enabled = enabled.strip().lower()
            if enabled == 'false':
                return False
            if enabled == 'true':
                return True
        return self.default_enabled

# Initialize Kubernetes client
try:
    k8s_client = KubernetesClient()
except Exception as e:
    logger.error(f"Failed to initialize Kubernetes client: {e}")
    k8s_client = None

@app.route('/')
def index():
    """Main page showing ingress overview"""
    return render_template('index.html')

@app.route('/api/ingresses')
def get_ingresses():
    """API endpoint to retrieve ingress data"""
    if not k8s_client:
        return jsonify({'error': 'Kubernetes client not available'}), 500
    
    try:
        ingresses = k8s_client.get_ingress_objects()
        return jsonify({
            'ingresses': ingresses,
            'count': len(ingresses)
        })
    except Exception as e:
        logger.error(f"Error retrieving ingresses: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'k8s_client_available': k8s_client is not None
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"Starting Kubernetes Ingress Viewer on {host}:{port}")
    app.run(host=host, port=port, debug=False) 