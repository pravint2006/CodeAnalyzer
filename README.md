# AI Dashboard

This project provides a vulnerability dashboard to monitor and manage security risks efficiently.

## Getting Started

Follow these steps to set up and run the dashboard:

### 1. Clone the Repository

```sh
git clone <repository-url>
cd <project-directory>
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Run the Development Server

```sh
npm run dev
```

The dashboard will be accessible at:

```
http://localhost:3000
```

or your deployed URL.

## Dashboard Preview

![Dashboard Screenshot](assets/dashboard.png)

*The dashboard will be running on localhost or a deployed environment.*

## Deployment

For production deployment, follow your hosting provider's guidelines or use:

```sh
npm run build
npm start
```

## Note on Model Usage

Currently, this prototype relies on an OpenAI API key for functionality. In future updates, it will be transitioned to an on-premises setup using LLaMA models or other open-weight LLMs, enhancing the security and privacy of sensitive data.
