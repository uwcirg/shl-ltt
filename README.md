# SHL Sharing for Let's Talk Tech

## Setup

Install the project libraries

```bash
npm install
```
(or `pnpm install` or `yarn`)

### Environment

Copy the `.env` file default:

```bash
cp default.env .env
```

Modify any `.env` files as necessary. Non-comment variables are required, commented lines are optional.

## Docker

Starting the docker container

```bash
docker-compose build && docker-compose up --detach
```

### Docker development

Update the `.env` file to use the development compose file

```bash
COMPOSE_FILE=docker-compose.yaml:docker-compose.dev.yaml
```
(On windows, separate compose files with `;` instead of `:`.)

The docker image will reflect any local changes to the `/lib` and `/static` folders.

## Local Development

Start a local development server with

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Debugging
To debug in VS Code, create a launch.json file with the following configuration:
```bash
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Launch Chrome against localhost",
            "url": "http://localhost:3000",
            "webRoot": "${workspaceFolder}"
        }
    ]
}
```
With the development server running, start the debugger.

## Building

To build a production version:

```bash
npm run build
```

You can also preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
