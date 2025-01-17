# Bruriah AI Chat Interface

<div style="display: flex; align-items: center; justify-content: space-between;">
<div>

Bruriah is an AI-powered chat interface designed to provide a supportive and engaging learning experience for children. Using OpenAI's language model, Bruriah acts as a kind and intelligent tutor, answering questions and explaining concepts in an age-appropriate and encouraging way.

</div>
<div>
    <img src="public/bruriah_avatar.png" alt="Bruriah Avatar" width="200" height="200">
</div>
</div>

## Features

- **User Authentication**: Secure user sign-up, login, and logout using Supabase Auth.
- **Persistent Chat History**: Each user can create and manage multiple chats, with chat histories stored in Supabase.
- **Real-time AI Responses**: Powered by OpenAI's GPT-4 model, providing conversational and educational support.
- **Dynamic Profile Avatars**: Supports user-uploaded avatars or default initials.
- **Customizable Chat Titles**: Rename chats directly from the sidebar.
- **Fortnite-Inspired Design**: A modern UI styled with the Bangers font and responsive Tailwind CSS.

## Tech Stack

- **Frontend**: React.js with Tailwind CSS for styling.
- **Backend**: Supabase for authentication, database, and serverless Edge Functions.
- **AI**: OpenAI API for generating AI-powered responses.
- **Deployment**: Hosted via Supabase Functions for Edge API and your preferred frontend host.

## Setup Instructions

### Prerequisites
- Node.js
- Supabase project setup with database and API keys
- OpenAI API key

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/hummusonrails/bruriah.git
   cd bruriah-chat
   ```

2. **Install Dependencies**:
   ```bash
    npm install
    ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add the following environment variables:
   ```bash
    VITE_SUPABASE_PROJECT_REF=your-supabase-ref
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    VITE_SUPABASE_URL=https://your-supabase-url
    OPENAI_API_KEY=your-openai-api-key
   ```

4. **Start the Development Server**:
   ```bash
    npm run dev
    ```

5. **Access the Application**:
   Open `http://localhost:5173` in your browser to view the application.

### Database Schema

#### Profiles Table

| Column | Type | Description |
| --- | --- | --- |
| id | int8 | Primary key |
| auth_user_id | uuid | Foreign key to auth.users |
| username | text | Unique username for the user |
| avatar_url | text | URL to the user's profile avatar |

#### Chats Table

| Column | Type | Description |
| --- | --- | --- |
| id | int8 | Primary key |
| profile_id | int8 | Foreign key to profiles |
| title | text | Title of the chat |
| status | text | Status of the chat: archived or active |

#### Messages Table

| Column | Type | Description |
| --- | --- | --- |
| id | int8 | Primary key |
| chat_id | int8 | Foreign key to chats |
| role | varchar | Role of the message sender: user or assistant |
| content | text | Content of the message |

#### Supabase Edge Function

Deploy the following Edge Function for OpenAI API interaction:

1. Navigate to your Supabase dashboard and create a new Edge Function named openai.
2. Copy the code from `supabase-functions/openai.js` into the Edge Function editor.
3. Deploy the function.

### Deployment

Build the project for production:

```bash
npm run build
```

## Usage

1. **Sign Up**: Create a new account or log in with an existing account.
2. **Create Chat**: Click the "+" button to create a new chat with a custom title.
3. **Chat with Bruriah**: Start chatting with Bruriah and receive AI-powered responses.
4. **Rename Chat**: Click the chat title to rename the chat.
5. **View Chat History**: Access previous messages and responses in the chat history.

## Contributing

Contributions are welcome! Please refer to the [Contributing Guidelines](CONTRIBUTING.md) for detailed instructions.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.


