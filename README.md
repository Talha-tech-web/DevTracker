# DevTracker 🚀

DevTracker is a smart, fully client-side developer roadmap and course tracking application. It empowers developers and students to stay organized by isolating roadmaps across different disciplines, visualizing progress via Kanban boards, and generating intelligent learning paths directly from PDF and DOCX files using the Groq API.

## ✨ Features

- **Isolated Roadmaps**: Manage multiple independent roadmaps (e.g., Web Development, Graphic Design, AI) simultaneously without losing your history or overwriting tasks.
- **AI-Powered Generation**: Upload a course syllabus or project outline (PDF, DOCX, TXT), and the system will intelligently parse the structure and use the Groq API (`llama-3.3-70b-versatile`) to instantly construct a categorized roadmap.
- **Dynamic Kanban Board**: Contextually mapped Developer Tracker with Drag & Drop functionality to move tasks from *To Do* to *Done*.
- **Course Progress Module**: Instantly track your milestone percentages, phase completion, and unlock badges for your work.
- **WhatsApp Integration**: Optionally set up a WhatsApp number to receive an instant message alert whenever you complete a task.
- **Dynamic Contextual UI**: The tech stack footer and sidebar categories dynamically update depending on which roadmap you are currently viewing.
- **Zero-Backend Required**: Fully functional client-side application. Uses `localStorage` for robust, persistent offline storage.

---

## 💻 How to Run Locally

Since this is a lightweight frontend application with no required database installation, running it locally is incredibly simple.

### Option 1: Direct Browser Run
1. Download or clone this repository to your local machine.
2. Navigate to the project folder.
3. Simply **double-click** the `index.html` file. It will open in your default browser and work immediately.

### Option 2: Using VS Code Live Server (Recommended)
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension by *Ritwick Dey*.
3. Right-click on the `index.html` file and select **Open with Live Server**.
4. The application will launch at `http://127.0.0.1:5500`, providing you with hot-reloading as you make changes to the code.

### Initial Setup (Important)
Once you have the app open in your browser:
1. Navigate to the **Settings** tab via the left sidebar.
2. Under the **Groq API Key** section, paste your valid Groq API Key (which starts with `gsk_`).
3. Click **Save Key**. This allows the "Import roadmap" AI feature to function.

---

## 🌐 How to Deploy

You can deploy this application for free in just a few minutes using static hosting services like **GitHub Pages**, **Vercel**, or **Netlify**. 

### Deploying on Netlify (Fastest Method)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Simply **drag and drop** the entire project folder (containing `index.html`, `app.js`, `style.css`) into the designated box on their website.
3. Netlify will instantly generate a live, shareable URL for your application!

### Deploying on Vercel
1. Upload this folder to a new **GitHub repository**.
2. Create a free account on [Vercel](https://vercel.com/).
3. Click **Add New** > **Project** and import your newly created GitHub repository.
4. Leave the Framework Preset as "Other" and click **Deploy**. Vercel will host it instantly and provide you with a permanent URL.

### Deploying on GitHub Pages
1. Push this folder to a GitHub repository named `<your-username>.github.io` (or any custom repo name).
2. Go to your repository **Settings** > **Pages**.
3. Under "Build and deployment", set the Source to **Deploy from a branch** and select your `main` branch.
4. Click **Save**. Your site will be live at `https://<your-username>.github.io/<repo-name>`.

---

## 🛠️ Built With
- **HTML5 & CSS3** for structure and styling.
- **Vanilla JavaScript** for core logic, state management, and Groq API integration.
- **PDF.js & Mammoth.js** for client-side document extraction and formatting.
- **Tabler Icons** for beautiful UI iconography.
