import { Router, Route } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin" component={Admin} />
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;