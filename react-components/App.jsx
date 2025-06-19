import React from 'react';
import GoogleAuth from './GoogleSignIn';

// Example React App using Google Sign-In
function App() {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>🔐 React Google Sign-In Demo</h1>
        <p>Clean Google Sign-In implementation with React</p>
      </header>

      <main style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <GoogleAuth clientId="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" />
        </div>
      </main>

      <footer style={{ 
        marginTop: '40px', 
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#666'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>🚀 Usage Instructions:</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li>Replace <code>YOUR_GOOGLE_CLIENT_ID</code> with your actual Google Client ID</li>
          <li>Make sure your backend API is running on the same domain or configure CORS</li>
          <li>Ensure your domain is added to Google Cloud Console authorized origins</li>
          <li>Test the sign-in flow and verify user data is stored correctly</li>
        </ol>
        
        <h4 style={{ color: '#333', marginTop: '20px' }}>📦 Required Dependencies:</h4>
        <pre style={{ 
          background: '#f1f3f4', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto'
        }}>
npm install react react-dom
        </pre>
      </footer>
    </div>
  );
}

export default App;