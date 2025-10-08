# Make copy of assets
cp dist/assets/index-*.js dist/assets/index.js
cp dist/assets/index-*.css dist/assets/index.css

# Copy assets to backend static folder
cp -r dist/assets/index.js ../backend/static/js
cp -r dist/assets/index.css ../backend/static/css
