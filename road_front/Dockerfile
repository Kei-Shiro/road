# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste des fichiers
COPY . .

# Build de l'application
RUN npm run build

# Production stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Supprimer le contenu par défaut de nginx
RUN rm -rf ./*

# Copier les fichiers buildés
COPY --from=build /app/dist .

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port
EXPOSE 5173

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]

