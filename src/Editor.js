import { debounce } from 'lodash';

const debouncedCodeChange = debounce((code) => {
    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
        roomId,
        code,
    });
}, 100); 