import moment from "moment";

export const formatDateTime = dateTime =>
  moment(dateTime).format("MMMM Do YYYY, h:mm:ss a");

export const formatDate = date => moment(date).format("MMMM Do YYYY");
