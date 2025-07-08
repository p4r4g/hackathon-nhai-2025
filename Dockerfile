# Use Nginx to serve the built app
FROM nginx:alpine

# Copy built static files from local build context
COPY dist/spa /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
