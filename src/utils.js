import moment from 'moment';

export const formatDateTime = dateTime =>
  moment
    .utc(dateTime)
    .local()
    .format('MMMM Do YYYY, h:mm:ss a');

export const formatDate = date =>
  moment
    .utc(date)
    .local()
    .format('MMMM Do YYYY');
