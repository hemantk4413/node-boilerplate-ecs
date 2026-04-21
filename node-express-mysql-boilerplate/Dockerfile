FROM node:18 AS base

WORKDIR /app

COPY package.json .
RUN npm set progress=false && npm config set depth 0

# Install all deps (including dev) for build stage
RUN npm install

# Copy only production node_modules aside
RUN cp -R node_modules prod_node_modules

# ---- Release ----
FROM node:18-alpine AS release

WORKDIR /app

# Install dumb-init and wget (needed for healthcheck) then clean up apk
RUN apk --no-cache add dumb-init wget && \
    rm -rf /sbin/apk /etc/apk /lib/apk /usr/share/apk /var/lib/apk

# Copy production node_modules from base
COPY --from=base /app/prod_node_modules ./node_modules

# Copy app sources (env vars come from ECS task definition / Secrets Manager at runtime)
COPY --chown=node:node . .

USER node

EXPOSE 3000

# Health check — uses wget (available in alpine) instead of curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["dumb-init", "node", "index.js"]
