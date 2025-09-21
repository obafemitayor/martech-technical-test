import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  pageTitle: {
    id: 'landingPage.pageTitle',
    defaultMessage: 'Join Our Newsletter',
  },
  emailLabel: {
    id: 'landingPage.emailLabel',
    defaultMessage: 'Email',
  },
  emailPlaceholder: {
    id: 'landingPage.emailPlaceholder',
    defaultMessage: 'me@example.com',
  },
  consentLabel: {
    id: 'landingPage.consentLabel',
    defaultMessage: 'I agree to the terms and conditions',
  },
  subscribeButton: {
    id: 'landingPage.subscribeButton',
    defaultMessage: 'Subscribe',
  },
  consentRequiredAlert: {
    id: 'landingPage.consentRequiredAlert',
    defaultMessage: 'Consent and email are required.',
  },
  tokenNotFoundAlert: {
    id: 'landingPage.tokenNotFoundAlert',
    defaultMessage: 'Authentication token not found. Please reload the page.',
  },
  subscriptionSuccessAlert: {
    id: 'landingPage.subscriptionSuccessAlert',
    defaultMessage: 'Subscription successful!',
  },
  subscriptionFailedAlert: {
    id: 'landingPage.subscriptionFailedAlert',
    defaultMessage: 'Subscription failed. Please try again.',
  },
  emailRequiredError: {
    id: 'landingPage.emailRequiredError',
    defaultMessage: 'Email is required.',
  },
  consentRequiredError: {
    id: 'landingPage.consentRequiredError',
    defaultMessage: 'You must agree to the terms.',
  },
});
