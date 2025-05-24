FROM node:20

WORKDIR /app

# copy packages files and isntall dependencies 
COPY package*.json ./
RUN npm ci

# copy the rest of the application code 
COPY . . 

# Ensure sound files directory exists and copy alarm_clock.mp3 to it
RUN mkdir -p /app/public/sounds && \
    cp -f /app/alarm_clock.mp3 /app/public/sounds/alarm_clock.mp3 || true

# Build the application 
RUN npm run build

# EXPOSE the application port 
EXPOSE 5000 

# Set environment variable for production 
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Start the application
CMD ["node", "dist/index.js"]