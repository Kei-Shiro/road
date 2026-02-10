# Dockerfile pour le frontend React/Vite
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers
COPY . .

# Exposer le port Vite
EXPOSE 5173

# Démarrer Vite en mode développement avec host 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
