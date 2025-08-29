import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://e8591e6cfdfaee9608dd7142e6891045@o4509895087423488.ingest.de.sentry.io/4509895089324112', // Replace with your actual DSN from Sentry
  tracesSampleRate: 1.0, // Adjust for performance monitoring
});

export default Sentry;
