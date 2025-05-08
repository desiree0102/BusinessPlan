# Firebase Authentication Project

This project implements user sign-in functionality using Firebase Authentication. It provides a simple user interface for users to log in using their email or Google account.

## Project Structure

```
firebase-auth-project
├── src
│   ├── index.html        # HTML structure for the user interface
│   ├── main.js           # Main JavaScript file for Firebase initialization and authentication
│   └── styles.css        # CSS styles for the application
├── config
│   └── firebaseConfig.js  # Firebase configuration file (not publicly accessible)
├── .gitignore            # Specifies files and directories to be ignored by Git
├── package.json          # npm configuration file with dependencies and scripts
└── README.md             # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd firebase-auth-project
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Configure Firebase:**
   - Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
   - Obtain your Firebase configuration details (API keys, project ID, etc.) and add them to `config/firebaseConfig.js`.

4. **Run the application:**
   - You can use a local server to serve the `src/index.html` file. For example, you can use the `live-server` package:
   ```
   npx live-server src
   ```

## Usage

- Open your browser and navigate to the local server URL.
- Use the provided authentication options to sign in.
- After signing in, you will be redirected to the main application interface.

## Contributing

Feel free to submit issues or pull requests if you have suggestions or improvements for the project.