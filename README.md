# Chat3D - AI-Powered 3D CAD Modeling

A modern 3D CAD modeling interface that allows users to create 3D models through natural language using AI-powered chat interface. Built with React, Vite, and AWS Amplify.

## Features

- **3D Environment**: Interactive 3D interface using Three.js
- **AI Integration**: Supports multiple AI providers (OpenAI, Bedrock, Ollama)
- **Real-time Chat**: Real-time messaging with semantic UI components
- **Analytics**: Mixpanel integration for user analytics
- **Authentication**: Secure user authentication with AWS Cognito
- **Backend**: AWS Amplify backend services
- **Routing**: React Router for navigation
- **Type Safety**: TypeScript with Zod validation
- **Logging**: Winston logging system
- **Storage**: AWS S3 integration

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- AWS CLI configured with appropriate credentials
- AWS Amplify CLI installed

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/kreuzhofer/chat3d-react-amplify.git
cd chat3d-react-amplify
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
- Copy `.env.template` to `.env`
- Update environment variables with your AWS credentials and configuration

4. Start a local development environment with Amplify:
```bash
npx dotenvx run npx ampx sandbox
```

This command will:
- Create an AWS Amplify Sandbox environment
- Apply your local .env configuration
- Set up the necessary backend services

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
├── src/                 # Source code
├── public/              # Static assets
├── amplify/             # Amplify backend configuration
├── .env.template        # Environment variables template
└── package.json         # Project dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

The project uses `.env` for configuration. Copy `.env.template` to `.env` and update the following variables:
- AWS credentials
- AI provider configuration (OpenAI, Bedrock, Ollama)
- Mixpanel token (for analytics)
- Other service configurations

## Deployment

To deploy the application:

1. Initialize Amplify:
```bash
amplify init
```

2. Push to AWS:
```bash
amplify push
```

## Security

The project follows security best practices:
- Environment variables for sensitive data
- Secure authentication flow
- Input validation using Zod
- Secure API endpoints

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

## Local development

To start a local webserver to run the app, you still need an AWS Amplify Sandbox environment.
To deploy your sandbox to AWS, run the following command in the terminal

```code
npx dotenvx run npx ampx sandbox
```

running dotenvx ensures your local .env file will be applied to the sandbox environment to set environment variables for the backend and frontend code