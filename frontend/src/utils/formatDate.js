import { format, parseISO } from 'date-fns';

export const formatDate = (date) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'PPP');
    } catch (error) {
        return date;
    }
};

export const formatDateTime = (date) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'PPP p');
    } catch (error) {
        return date;
    }
};

export const formatTime = (date) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'p');
    } catch (error) {
        return date;
    }
};

export const isEventEnded = (endTime) => {
    return new Date(endTime) < new Date();
};

export const isEventStarted = (startTime) => {
    return new Date(startTime) <= new Date();
};

export const isRegistrationOpen = (registrationEndDate) => {
    return new Date(registrationEndDate) >= new Date();
};
