<p align="center">
<img src="https://raw.githubusercontent.com/Nexirift/media-kit/main/cosmos/banner.png" width="600" alt="Cosmos Logo" />
</p>

# Cosmos

Cosmos is the official authentication server for Nexirift, providing secure user verification and access control by utilising the better-auth library.

## Getting Started (Development)

### Prerequisites

- Node.js v22.13.0 or greater
- Bun v1.2.2 or greater
- Read the [contributing guide](https://github.com/Nexirift/.github/blob/main/contributing/README.md)

#### For Database

- Docker v27.5.1 or greater
- Docker Compose v2.32.4 or greater

*These prerequisites are based on the versions that we are using.*

### Notice

There is currently two problems in better-auth that need to be fixed in order for Cosmos to function properly. We have created patches for these issues and you ***must*** apply them using the `bun apply-patches` command (after running `bun install`).

Related pull requests: [better-auth/pr#1661](https://github.com/better-auth/better-auth/pull/1661) and [better-auth/pr#1747](https://github.com/better-auth/better-auth/pull/1747)

### Installation

For now, our email repository must be cloned and set up by following the instructions [here](https://github.com/Nexirift/emails). Ensure that it is in the parent directory of this repository and has been built using `bun run build`.

1. Clone the repository: `git clone https://github.com/Nexirift/cosmos.git`
2. Install dependencies with `bun install`
3. Start the database using `bun db:start`
4. Migrate the database using `bun db:all`
5. Start the server with `bun dev`

## Disclaimer

This software is currently in development and should not be used in production until the official Nexirift public release. By deploying this software in a production environment, you acknowledge and accept all associated risks. Please wait for production-ready status before implementation.

## License

Nexirift's internal projects are licensed under the [GNU Affero General Public License v3.0](LICENSE).
