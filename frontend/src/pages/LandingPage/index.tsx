import { useState } from 'react';
import { useIntl } from 'react-intl';
import axios from 'axios';
import {
  Box,
  Button,
  Input,
  VStack,
  Fieldset,
  Stack,
  Text,
  chakra,
} from '@chakra-ui/react';
import { CheckedState } from '@zag-js/checkbox';
import { v4 as uuidv4 } from 'uuid';
import { Field, Checkbox } from '@chakra-ui/react';
import { useUtmParams } from '../../hooks/useUtmParams';
import { submitEvent } from '../../services/event';
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
} from '../../services/token';
import { saveInLocalStorage } from '../../services/local-storage';
import { messages } from './messages';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState<CheckedState>(false);
  const [errors, setErrors] = useState({ email: '', consent: '' });
  const [isLoading, setIsLoading] = useState(false);
  const utms = useUtmParams();
  const intl = useIntl();

  const saveSubmissionData = () => {
    const submissionData = {
      email,
      consent,
      utms,
      timestamp: new Date().toISOString(),
    };
    // Making an assumption that the submission data in the localStorage should be overwritten on each submission.
    // The requirement does not explicitly specify if we
    // should keep track of whoever submitted the form on a client browser.
    saveInLocalStorage('submission', JSON.stringify(submissionData));
  };

  const buildEventPayload = () => ({
    event_id: uuidv4(),
    user_id: email,
    event_name: 'lead',
    event_time: new Date().toISOString(),
    value: 0,
    campaign_id: utms.utm_campaign || 'unknown',
    source: utms.utm_source || 'unknown',
    click_id: utms.click_id || 'unknown',
  });

  const sendEventToApi = async () => {
    const token = getAuthToken();
    if (!token) {
      alert(intl.formatMessage(messages.tokenNotFoundAlert));
      return;
    }
    await submitEvent(buildEventPayload(), token);
  };

  const handleApiError = async (error: unknown) => {
    const isUnauthorized =
      axios.isAxiosError(error) && error.response?.status === 401;
    if (!isUnauthorized) {
      alert(intl.formatMessage(messages.subscriptionFailedAlert));
      return;
    }

    try {
      removeAuthToken();
      await setAuthToken('marketing-dashboard');
      await sendEventToApi();
      alert(intl.formatMessage(messages.subscriptionSuccessAlert));
    } catch (finalError) {
      alert(intl.formatMessage(messages.subscriptionFailedAlert));
    }
  };

  const validateForm = () => {
    const newErrors = { email: '', consent: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = intl.formatMessage(messages.emailRequiredError);
      isValid = false;
    }
    if (!consent) {
      newErrors.consent = intl.formatMessage(messages.consentRequiredError);
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    saveSubmissionData();
    try {
      await sendEventToApi();
      alert(intl.formatMessage(messages.subscriptionSuccessAlert));
    } catch (error) {
      await handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={8} maxWidth="500px" mx="auto">
      <VStack as="div" gap={4}>
        <Fieldset.Root>
          <Stack>
            <chakra.legend fontSize="2xl" fontWeight="bold">
              {intl.formatMessage(messages.pageTitle)}
            </chakra.legend>
          </Stack>

          <Fieldset.Content>
            <Field.Root invalid={!!errors.email}>
              <chakra.label htmlFor="email-input">
                {intl.formatMessage(messages.emailLabel)}
              </chakra.label>
              <Input
                id="email-input"
                placeholder={intl.formatMessage(messages.emailPlaceholder)}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <Text color="red.500" fontSize="sm">
                  {errors.email}
                </Text>
              )}
            </Field.Root>

            <Field.Root invalid={!!errors.consent}>
              <Checkbox.Root
                checked={consent}
                onCheckedChange={setConsent}
                id="consent-checkbox"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <chakra.label htmlFor="consent-checkbox" ml={2}>
                  {intl.formatMessage(messages.consentLabel)}
                </chakra.label>
              </Checkbox.Root>
              {errors.consent && (
                <Text color="red.500" fontSize="sm">
                  {errors.consent}
                </Text>
              )}
            </Field.Root>
          </Fieldset.Content>

          <Button
            disabled={isLoading}
            loading={isLoading}
            onClick={handleSubmit}
            colorScheme="blue"
            width="full"
            mt={4}
          >
            {intl.formatMessage(messages.subscribeButton)}
          </Button>
        </Fieldset.Root>
      </VStack>
    </Box>
  );
};

export default LandingPage;
