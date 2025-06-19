// Direct Google Auth endpoint
import handler from '../auth';

export default async function googleAuthHandler(req, res) {
  // Add the endpoint query parameter
  req.query = {
    ...req.query,
    endpoint: 'google'
  };
  
  // Forward to the main auth handler
  return handler(req, res);
}