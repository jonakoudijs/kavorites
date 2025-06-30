// Kubernetes Ingress Viewer - Frontend JavaScript

class IngressViewer {
    constructor() {
        this.ingresses = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
        this.startHealthCheck();
    }

    bindEvents() {
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData();
        });

        // Modal close button
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal();
        });

        // Close modal when clicking outside
        document.getElementById('urlModal').addEventListener('click', (e) => {
            if (e.target.id === 'urlModal') {
                this.hideModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
            if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.loadData();
            }
        });
    }

    async loadData() {
        this.showLoading();
        this.hideError();
        this.hideEmpty();

        try {
            const response = await fetch('/api/ingresses');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load ingress data');
            }

            this.ingresses = data.ingresses || [];
            this.updateUI();
            this.updateStatusIndicator(true);

        } catch (error) {
            console.error('Error loading data:', error);
            this.showError(error.message);
            this.updateStatusIndicator(false);
        } finally {
            this.hideLoading();
        }
    }

    async startHealthCheck() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (data.k8s_client_available) {
                this.updateStatusIndicator(true);
            } else {
                this.updateStatusIndicator(false);
            }
        } catch (error) {
            this.updateStatusIndicator(false);
        }
    }

    updateUI() {
        this.renderIngressList();
    }

    renderIngressList() {
        const container = document.getElementById('ingressList');
        
        if (this.ingresses.length === 0) {
            this.showEmpty();
            return;
        }

        const html = this.ingresses.map((ingress, index) => this.renderIngressBlock(ingress, index)).join('');
        container.innerHTML = html;
        container.classList.add('fade-in');

        // Add event listeners to the new elements
        this.ingresses.forEach((ingress, index) => {
            const block = document.getElementById(`ingressBlock-${index}`);
            if (block) {
                block.addEventListener('click', () => {
                    if (ingress.urls && ingress.urls.length > 0 && ingress.urls[0].url) {
                        window.open(ingress.urls[0].url, '_blank');
                    }
                });
            }
        });
    }

    renderIngressBlock(ingress, index) {
        // Check for image and title annotations
        const imageUrl = ingress.annotations && ingress.annotations['kavorites.koudijs.app/image-url'];
        const imageB64 = ingress.annotations && ingress.annotations['kavorites.koudijs.app/image-b64'];
        const customTitle = ingress.annotations && ingress.annotations['kavorites.koudijs.app/title'];
        let imageTag = '';
        if (imageB64) {
            imageTag = `<img src=\"data:image/png;base64,${imageB64}\" alt=\"${ingress.name}\" class=\"object-contain w-full h-full rounded-2xl group-hover:scale-105 transition\" style=\"object-fit:contain;\" />`;
        } else if (imageUrl) {
            imageTag = `<img src=\"${imageUrl}\" alt=\"${ingress.name}\" class=\"object-contain w-full h-full rounded-2xl group-hover:scale-105 transition\" style=\"object-fit:contain;\" />`;
        }
        const displayTitle = customTitle || ingress.name;
        // If image is present, show the label below the block
        if (imageTag) {
            return `
                <div class=\"flex flex-col items-center h-full\">\n                    <div id=\"ingressBlock-${index}\" class=\"cursor-pointer flex flex-col items-center justify-center bg-white rounded-2xl shadow border border-gray-200 hover:shadow-lg transition group w-full aspect-square\">\n                        <img src=\"${imageB64 ? `data:image/png;base64,${imageB64}` : imageUrl}\" alt=\"${ingress.name}\" class=\"object-contain w-full h-full rounded-2xl group-hover:scale-105 transition\" style=\"object-fit:contain;\" />\n                    </div>\n                    <span class=\"mt-2 mb-4 text-base font-medium text-gray-800 text-center break-all\">${displayTitle}</span>\n                </div>\n            `;
        }
        // If no image, show the label inside the block as before
        return `
            <div id=\"ingressBlock-${index}\" class=\"cursor-pointer flex flex-col items-center justify-center bg-white rounded-2xl shadow border border-gray-200 hover:shadow-lg transition group w-full h-full\">
                <span class=\"text-lg font-semibold text-gray-800 text-center break-all\">${displayTitle}</span>
            </div>
        `;
    }

    renderLabels(labels) {
        if (!labels || Object.keys(labels).length === 0) return '';
        
        const labelHtml = Object.entries(labels)
            .map(([key, value]) => `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1">${key}=${value}</span>`)
            .join('');
        
        return `
            <div class="mt-3">
                <span class="text-gray-600 text-sm">Labels:</span>
                <div class="mt-1">${labelHtml}</div>
            </div>
        `;
    }

    renderAnnotations(annotations) {
        if (!annotations || Object.keys(annotations).length === 0) return '';
        
        const annotationHtml = Object.entries(annotations)
            .map(([key, value]) => `<span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2 mb-1">${key}=${value}</span>`)
            .join('');
        
        return `
            <div class="mt-3">
                <span class="text-gray-600 text-sm">Annotations:</span>
                <div class="mt-1">${annotationHtml}</div>
            </div>
        `;
    }

    showUrlsModal(ingress) {
        const modal = document.getElementById('urlModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');

        modalTitle.textContent = `URLs for ${ingress.name} (${ingress.namespace})`;
        
        const urlsHtml = ingress.urls.map(url => `
            <div class="url-card bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <i class="fas fa-link text-blue-600"></i>
                            <a href="${url.url}" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium break-all">
                                ${url.url}
                            </a>
                        </div>
                        ${url.service_name ? `
                            <div class="text-sm text-gray-600">
                                <span class="font-medium">Service:</span> ${url.service_name}
                                ${url.service_port ? `:${url.service_port}` : ''}
                            </div>
                        ` : ''}
                        <div class="text-sm text-gray-500">
                            <span class="font-medium">Path:</span> ${url.path}
                        </div>
                    </div>
                    <button 
                        class="copy-btn ml-3 p-2 text-gray-500 hover:text-gray-700 rounded-lg border border-gray-300"
                        onclick="navigator.clipboard.writeText('${url.url}')"
                        title="Copy URL"
                    >
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `).join('');

        modalContent.innerHTML = urlsHtml;
        modal.classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('urlModal').classList.add('hidden');
    }

    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'ready':
                return 'status-ready';
            case 'pending':
                return 'status-pending';
            default:
                return 'status-unknown';
        }
    }

    getStatusIcon(status) {
        switch (status.toLowerCase()) {
            case 'ready':
                return '<i class="fas fa-check-circle text-green-600"></i>';
            case 'pending':
                return '<i class="fas fa-clock text-yellow-600"></i>';
            default:
                return '<i class="fas fa-question-circle text-gray-600"></i>';
        }
    }

    updateStatusIndicator(isConnected) {
        const indicator = document.getElementById('statusIndicator');
        const dot = indicator.querySelector('div');
        const text = indicator.querySelector('span');

        if (isConnected) {
            dot.className = 'w-2 h-2 bg-green-500 rounded-full';
            text.textContent = 'Connected';
            text.className = 'text-sm text-green-600';
        } else {
            dot.className = 'w-2 h-2 bg-red-500 rounded-full';
            text.textContent = 'Disconnected';
            text.className = 'text-sm text-red-600';
        }
    }

    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorState').classList.remove('hidden');
    }

    hideError() {
        document.getElementById('errorState').classList.add('hidden');
    }

    showEmpty() {
        document.getElementById('emptyState').classList.remove('hidden');
    }

    hideEmpty() {
        document.getElementById('emptyState').classList.add('hidden');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IngressViewer();
}); 