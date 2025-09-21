import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { ChakraProvider } from '@chakra-ui/react';
import LandingPage from './pages/LandingPage';
import { system } from './theme';
import { setAuthToken } from './services/token';

function App() {
  useEffect(() => {
    const SetToken = async () => {
      try {
        await setAuthToken('marketing-dashboard');
      } catch (error) {
        console.error('Failed to set auth token:', error);
      }
    };

    SetToken();
  }, []);

  return (
    <IntlProvider locale="en" defaultLocale="en">
      <ChakraProvider value={system}>
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      </ChakraProvider>
    </IntlProvider>
  );
}

export default App;
