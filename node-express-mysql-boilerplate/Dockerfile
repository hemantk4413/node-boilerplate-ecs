FROM node:18 as base

WORKDIR /app

COPY package.json .
COPY .env-example .
RUN npm set progress=false && npm config set depth 0

RUN npm install

# copy production node_modules aside
RUN cp -R node_modules prod_node_modules

# ---- Release ----
FROM node:18-alpine AS release

WORKDIR /app

RUN apk --no-cache add dumb-init

# Remove package manager
RUN rm -rf /sbin/apk /etc/apk /lib/apk /usr/share/apk /var/lib/apk

# # copy production node_modules
COPY --from=base /app/prod_node_modules ./node_modules
COPY --from=base /app/.env .

# copy app sources
COPY --chown=node:node . .

# expose port and define CMD
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -fs http://localhost:3000/health || exit 1

CMD ["dumb-init", "node", "index.js"]
