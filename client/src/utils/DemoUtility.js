import axios from 'axios';

/**
 * DemoUtility provides a one-click authentication mechanism for the recruiter/demo view.
 * It bypasses manual input and logs in as a pre-configured demo user based on the requested role.
 */

export const triggerDemoLogin = async (role, loginUser, navigate) => {
  const demoCredentials = {
    business: {
      email: 'rajesh@apnasaathi.com',
      password: 'business123',
    },
    rider: {
      email: 'suresh@apnasaathi.com',
      password: 'rider123',
    },
  };

  const credentials = demoCredentials[role];
  if (!credentials) return;

  try {
    // We use the existing auth API logic
    const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, credentials);
    
    // Store token and user data using the AuthContext hook
    loginUser(res.data.token, res.data.user);
    
    // Navigate to the respective dashboard
    if (role === 'business') {
      navigate('/merchant');
    } else if (role === 'rider') {
      navigate('/rider/jobs');
    }
  } catch (err) {
    console.error('Demo Login Error:', err);
    alert('Demo login failed. Please ensure the server is running and demo accounts exist.');
  }
};
