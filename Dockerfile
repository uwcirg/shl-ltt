FROM node:18 as build-deps

ARG VITE_APP_VERSION_STRING
ENV VITE_APP_VERSION_STRING=$VITE_APP_VERSION_STRING

EXPOSE 3000

# ENV DIRPATH /opt/app
ENV NODE_ENV production

WORKDIR /opt/app

COPY . .
RUN npm clean-install --include=dev

COPY ./fix-popper.sh .
RUN sed -i '/2\.11\.6/a \ \ "type": "module",' node_modules/@popperjs/core/package.json

RUN npm run build

RUN cp build/404.html build/index.html

CMD ["sh", "-c", "npm run build && cp build/404.html build/index.html && npm run start"]
