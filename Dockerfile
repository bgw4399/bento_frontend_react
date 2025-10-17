FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_PUBLIC_API_URL
ENV VITE_PUBLIC_API_URL=$VITE_PUBLIC_API_URL

RUN npm run build

FROM node:22 AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
RUN npm install serve
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]