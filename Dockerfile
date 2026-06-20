# ── Stage 1: install & compile native dependencies ──────────────────────────
FROM node:20-alpine AS builder

# build tools required by bcrypt (native addon)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# copy package manifest
COPY package.json ./

# copy all local file: packages so npm ci can resolve them
COPY core/        ./core/
COPY messages/    ./messages/
COPY middlewares/ ./middlewares/
COPY mock-models/ ./mock-models/
COPY models/      ./models/
COPY notification/ ./notification/
COPY repository/  ./repository/
COPY services/    ./services/
COPY workers/     ./workers/

# HUSKY=0 prevents the prepare script from running husky (a devDependency) during install
RUN HUSKY=0 npm install --omit=dev


# ── Stage 2: lean production image ───────────────────────────────────────────
FROM node:20-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

# compiled node_modules from builder (includes bcrypt binaries)
COPY --from=builder /app/node_modules ./node_modules

# local file: packages (required at runtime by the module resolver)
COPY core/        ./core/
COPY messages/    ./messages/
COPY middlewares/ ./middlewares/
COPY mock-models/ ./mock-models/
COPY models/      ./models/
COPY notification/ ./notification/
COPY repository/  ./repository/
COPY services/    ./services/
COPY workers/     ./workers/

# application source
COPY app.js bootstrap.js package.json ./
COPY endpoints/ ./endpoints/
COPY specs/     ./specs/

# default port (Back4app overrides this with the PORT env var at runtime)
EXPOSE 8811

CMD ["node", "bootstrap.js"]
