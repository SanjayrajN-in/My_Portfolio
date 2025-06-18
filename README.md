# Sanjayraj N - Portfolio Website

A full-stack portfolio website showcasing electrical & electronics engineering projects and skills.

## 🚀 Project Structure

```
My portfolio/
├── 📁 Frontend (Static Files)
│   ├── index.html              # Main landing page
│   ├── 📁 pages/              # HTML pages
│   │   ├── about.html
│   │   ├── projects.html
│   │   ├── skills.html
│   │   ├── contact.html
│   │   └── ...
│   ├── 📁 css/               # Stylesheets
│   │   ├── styles.css
│   │   ├── critical.css
│   │   └── ...
│   ├── 📁 js/                # Client-side JavaScript
│   │   ├── script.js
│   │   ├── navigation.js
│   │   └── ...
│   ├── 📁 images/            # Static images
│   └── 📁 audio/             # Audio files
│
├── 📁 Backend (Serverless API)
│   └── 📁 api/               # Vercel serverless functions
│       ├── 📁 auth/          # Authentication endpoints
│       │   ├── login.js
│       │   └── register.js
│       ├── 📁 contact/       # Contact form handler
│       │   └── submit.js
│       ├── 📁 users/         # User management
│       │   └── update-game-stats.js
│       ├── 📁 models/        # Database models
│       │   ├── User.js
│       │   └── Contact.js
│       └── 📁 config/        # Configuration
│           └── database.js
│
├── 📁 Configuration
│   ├── package.json          # Dependencies & scripts
│   ├── vercel.json          # Vercel deployment config
│   └── .gitignore           # Git ignore rules
│
└── 📁 Deployment Scripts
    ├── deploy-commands.txt
    └── *.ps1 files          # PowerShell automation scripts
```

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **Vanilla JavaScript** - Interactive functionality
- **Font Awesome** - Icons
- **Responsive Design** - Mobile-first approach

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework (for API routes)
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Nodemailer** - Email functionality
- **bcryptjs** - Password hashing

### Deployment
- **Vercel** - Hosting platform
- **Serverless Functions** - API endpoints
- **Static Site Generation** - Frontend delivery

## 🚀 Deployment Instructions

### Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Create a Vercel account
3. Set up MongoDB database
4. Configure environment variables

### Environment Variables
Create these environment variables in Vercel dashboard:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email_for_contact_form
EMAIL_PASS=your_email_password
```

### Deploy to Vercel
1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Or use the deploy script:**
   ```bash
   npm run deploy
   ```

### Local Development
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Access locally:**
   - Frontend: `http://localhost:3000`
   - API: `http://localhost:3000/api/*`

## 📁 Key Features

- **Portfolio Showcase** - Projects, skills, and experience
- **Interactive Games** - Built-in games with score tracking
- **Contact Form** - Direct email integration
- **User Authentication** - Login/register system
- **Responsive Design** - Works on all devices
- **3D Effects** - Modern visual interactions
- **Music Keyboard** - Interactive musical instrument

## 🔧 API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/contact/submit` - Contact form submission
- `POST /api/users/update-game-stats` - Update game statistics

## 📝 Notes

- All API routes are serverless functions optimized for Vercel
- Frontend assets are served statically for optimal performance
- Database connections are handled efficiently for serverless environment
- CORS is configured for cross-origin requests

## 👨‍💻 Author

**Sanjayraj N**  
Electrical & Electronics Engineer  
Portfolio: [Your Vercel URL]