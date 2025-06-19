// This file is used by Vercel to serve static files
// It's not actually executed, but its presence helps Vercel understand the project structure

export default function handler(req, res) {
  // This function will never be called
  // Vercel will serve static files from the public directory
  res.status(200).send('This route should not be called directly');
}