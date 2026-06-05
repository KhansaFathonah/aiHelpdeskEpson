# AI Helpdesk Epson - Frontend

The frontend application for AI Helpdesk Epson, built using modern web technologies to provide an interactive and responsive user interface for both users and administrators.

## 🚀 Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing**: [Vue Router](https://router.vuejs.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Icons**: [Font Awesome](https://fontawesome.com/)
- **Styling**: Vanilla CSS

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/KhansaFathonah/aiHelpdeskEpson.git
   ```

2. **Navigate to the frontend directory**
   ```bash
   cd aiHelpdeskEpson/frontend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Environment Setup**
   Create a `.env` file in the root of the `frontend` directory and add the backend API URL:
   ```env
   VITE_API_URL=http://localhost:4000/api
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   The application will be accessible at [http://localhost:5173](http://localhost:5173).

## 💡 Notes

- Ensure that the **Backend Server** is up and running before testing the frontend to prevent API request failures.
- By default, the Backend API is expected to run on port `4000`.
- The `.env` file contains environment-specific configurations and should **not** be committed to version control.
