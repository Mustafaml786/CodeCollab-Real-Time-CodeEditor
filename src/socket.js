import {io} from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: 3,
        timeout: 10000,
        transports: ['websocket'],
    };

    try {
        const socket = io(process.env.REACT_APP_BACKEND_URL, options);
        return socket;
    } catch (error) {
        console.error('Socket initialization failed:', error);
        throw new Error('Failed to connect to server');
    }
};