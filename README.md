# 🌀 Laravel + React + Inertia Starter

A modern full-stack web application boilerplate using **Laravel (backend)**, **React (frontend)**, and **Inertia.js** for seamless single-page app experience — no APIs required!

This project is perfect for beginners and teams who want to collaborate on a unified Laravel–React setup.

---

## 🚀 Features

- ⚡ Full-stack setup using **Laravel 11**, **React 18**, and **Vite**
- 🪄 Inertia.js integration for SPA-like routing
- 🔐 Authentication via **Laravel Breeze (React + Inertia preset)**
- 🎨 Tailwind CSS styling
- 🧩 Component-based frontend
- 🛠️ Ready for collaboration with `.env.example`, migrations, and version control setup

---

## 🧱 Project Structure

laravel-react-inertia/
├── app/ # Laravel backend (controllers, models, etc.)
├── bootstrap/
├── config/
├── database/
│ ├── migrations/ # Database structure
│ ├── seeders/ # Initial data for testing
├── public/ # Public assets (served by Laravel)
├── resources/
│ ├── js/
│ │ ├── Pages/ # React pages (Inertia)
│ │ ├── Components/ # Reusable React components
│ │ ├── app.jsx # Entry point
│ └── views/ # Inertia root blade
├── routes/
│ ├── web.php # Web routes (Inertia endpoints)
├── storage/
├── tests/
├── vite.config.js # Vite bundler config
├── package.json
├── composer.json
└── .env.example


---

## 🧰 Requirements

Make sure these are installed on your machine:

- PHP **>= 8.2**
- Composer
- Node.js **>= 18**
- npm, pnpm, or yarn
- MySQL or PostgreSQL (or any DB supported by Laravel)

---

## ⚙️ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

2️⃣ Install Backend Dependencies

composer install

3️⃣ Install Frontend Dependencies

npm install
# or
pnpm install

4️⃣ Setup Environment File

Copy .env.example and configure it:

cp .env.example .env

Update the following in .env:

APP_NAME="Laravel React Inertia"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

5️⃣ Generate App Key

php artisan key:generate

6️⃣ Run Migrations

php artisan migrate

(Optional) Seed test data:

php artisan db:seed

7️⃣ Start the Development Servers

Run Laravel backend:

php artisan serve

Run React frontend:

npm run dev
# or
pnpm dev

Now visit http://localhost:8000

🎉
🧑‍🤝‍🧑 Collaboration Guide
🪶 Branching

Follow this simple convention:

    main — stable, deploy-ready branch

    dev — active development

    feature branches:

    feature/<feature-name>
    fix/<bug-name>
    ui/<component-name>

🔁 Workflow

    Pull latest changes

git pull origin dev

Create a new branch

git checkout -b feature/login-page

Commit your work

git add .
git commit -m "Add login page component with form validation"

Push and open a PR

    git push origin feature/login-page

🧑‍💻 Common Commands
Task	Command
Start backend	php artisan serve
Start frontend	npm run dev
Run migrations	php artisan migrate
Reset database	php artisan migrate:fresh --seed
Compile production build	npm run build
Clear cache	php artisan optimize:clear
🧩 Troubleshooting

    React not updating?
    Run npm run dev and check your browser console.

    CSS not loading?
    Ensure Vite is running and your .env has correct APP_URL.

    Database error?
    Double-check .env DB credentials and rerun php artisan migrate.

🪪 License

This project is open-source under the MIT License

.
