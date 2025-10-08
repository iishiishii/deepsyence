#!/bin/bash
set -e

# Create a config.js file with runtime environment variables
# as for local development, we can use Vite's env variables at build time,
# but when deployed using terraform, we need to inject newly generated load balancer URL at runtime
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
  VITE_API_URL: '${VITE_API_URL:-}'
};
EOF

# Start nginx
exec nginx -g 'daemon off;'
