FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

EXPOSE 8080
CMD ["node", "server.js"]
