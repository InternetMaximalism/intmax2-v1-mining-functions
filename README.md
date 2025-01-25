# intmax2-v1-mining-functions

This document provides instructions for setting up, running, building with Docker, and deploying the intmax2-v1-mining-functions project.

## Installing Dependencies

First, install the project dependencies, build the project, and set up the environment.

```bash
# install
yarn

# build:shared
yarn build:shared

# build
yarn build

# setup
cp .env.example .env
```

## Running the Project

To start the development mode for each workspace, use the following commands:

**API**

```bash
yarn workspace <package-name> dev

# ex.
yarn workspace v1-mining-gateway dev
```

**JOB**

```bash
yarn workspace <package-name> dev

# ex.
yarn workspace v1-withdraw-observer dev
```

## Packages Structure

```sh
packages
├── aml
├── shared
├── v1-mining-allocation
├── v1-mining-analyzer
├── v1-mining-gateway
├── v1-mining-merkle-commitment
├── v1-mining-register
└── v1-withdraw-observer
```
