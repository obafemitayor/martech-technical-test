import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '../../theme';
import LandingPage from './';
import * as api from '../../services/event';
import * as tokenService from '../../services/token';
import { messages } from './messages';

jest.mock('../../services/event');
jest.mock('../../services/token');

const TestWrapper = ({
  children,
  queryStringParams = ['/'],
}: {
  children: React.ReactNode;
  queryStringParams?: string[];
}) => (
  <IntlProvider locale="en" defaultLocale="en">
    <ChakraProvider value={system}>
      <MemoryRouter initialEntries={queryStringParams}>
        <Routes>
          <Route path="/" element={children} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  </IntlProvider>
);

describe('LandingPage', () => {
  const mockSubmitEvent = api.submitEvent as jest.Mock;
  const mockGetAuthToken = tokenService.getAuthToken as jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the landing page form', () => {
    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>,
    );

    expect(
      screen.getByText(messages.pageTitle.defaultMessage),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(messages.emailLabel.defaultMessage),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: messages.consentLabel.defaultMessage,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: messages.subscribeButton.defaultMessage,
      }),
    ).toBeInTheDocument();
  });

  it('shows validation errors if fields are empty', async () => {
    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>,
    );

    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', {
        name: messages.subscribeButton.defaultMessage,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(messages.emailRequiredError.defaultMessage),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText(messages.consentRequiredError.defaultMessage),
      ).toBeInTheDocument();
    });
  });

  it('submits the form successfully', async () => {
    mockGetAuthToken.mockReturnValue('test-token');
    mockSubmitEvent.mockResolvedValue({ success: true });

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>,
    );

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(messages.emailLabel.defaultMessage),
      'test@example.com',
    );
    await user.click(
      screen.getByRole('checkbox', {
        name: messages.consentLabel.defaultMessage,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: messages.subscribeButton.defaultMessage,
      }),
    );

    await waitFor(() => {
      expect(mockSubmitEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test@example.com',
          campaign_id: 'unknown',
        }),
        'test-token',
      );
    });

    const submission = JSON.parse(localStorage.getItem('submission') || '{}');
    expect(submission.email).toBe('test@example.com');
    expect(window.alert).toHaveBeenCalledWith(
      messages.subscriptionSuccessAlert.defaultMessage,
    );
    expect(localStorage.getItem('submission')).not.toBeNull();
  });

  it('sends UTM parameters and click_id when present in URL', async () => {
    mockGetAuthToken.mockReturnValue('test-token');
    mockSubmitEvent.mockResolvedValue({ success: true });

    const utmSource = 'google';
    const utmCampaign = 'summer_sale';
    const clickId = 'xyz123';

    render(
      <TestWrapper
        queryStringParams={[
          `/?utm_source=${utmSource}&utm_campaign=${utmCampaign}&click_id=${clickId}`,
        ]}
      >
        <LandingPage />
      </TestWrapper>,
    );

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(messages.emailLabel.defaultMessage),
      'test@example.com',
    );
    await user.click(
      screen.getByRole('checkbox', {
        name: messages.consentLabel.defaultMessage,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: messages.subscribeButton.defaultMessage,
      }),
    );

    await waitFor(() => {
      expect(mockSubmitEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          campaign_id: utmCampaign,
          source: utmSource,
          click_id: clickId,
        }),
        'test-token',
      );
    });
  });

  it('displays error message on submission failure', async () => {
    const user = userEvent.setup();
    mockGetAuthToken.mockReturnValue('test-token');
    mockSubmitEvent.mockRejectedValue(new Error('Network Error'));

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>,
    );

    await user.type(
      screen.getByLabelText(messages.emailLabel.defaultMessage),
      'test@example.com',
    );
    await user.click(
      screen.getByRole('checkbox', {
        name: messages.consentLabel.defaultMessage,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: messages.subscribeButton.defaultMessage,
      }),
    );

    await waitFor(() => {
      expect(mockSubmitEvent).toHaveBeenCalled();
    });

    const submission = JSON.parse(localStorage.getItem('submission') || '{}');
    expect(submission.email).toBe('test@example.com');
    expect(window.alert).toHaveBeenCalledWith(
      messages.subscriptionFailedAlert.defaultMessage,
    );
    expect(localStorage.getItem('submission')).not.toBeNull();
  });

  it('retries event data submission when auth token expires', async () => {
    const user = userEvent.setup();
    const mockSetAuthToken = tokenService.setAuthToken as jest.Mock;
    mockGetAuthToken
      .mockReturnValueOnce('expired-test-token')
      .mockReturnValueOnce('new-test-token');
    mockSubmitEvent
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } })
      .mockResolvedValueOnce({ success: true });

    render(
      <TestWrapper>
        <LandingPage />
      </TestWrapper>,
    );

    await user.type(
      screen.getByLabelText(messages.emailLabel.defaultMessage),
      'test@example.com',
    );
    await user.click(
      screen.getByRole('checkbox', {
        name: messages.consentLabel.defaultMessage,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: messages.subscribeButton.defaultMessage,
      }),
    );

    await waitFor(() => {
      expect(mockSetAuthToken).toHaveBeenCalledWith('marketing-dashboard');
    });

    await waitFor(() => {
      expect(mockSubmitEvent).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        messages.subscriptionSuccessAlert.defaultMessage,
      );
    });

    const submission = JSON.parse(localStorage.getItem('submission') || '{}');
    expect(submission.email).toBe('test@example.com');
  });
});
