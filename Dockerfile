FROM node:18 as build-deps

EXPOSE 3000

ENV NODE_ENV production

WORKDIR /opt/app

COPY . .
RUN npm clean-install --include=dev

RUN sed -i '/2\.11\.6/a \ \ "type": "module",' node_modules/@popperjs/core/package.json

RUN npm run build

CMD ["sh", "-c", "npm run build && cp build/404.html build/index.html && npm run start"]