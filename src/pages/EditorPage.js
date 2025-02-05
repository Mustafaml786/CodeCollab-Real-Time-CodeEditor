import React, {useState, useRef, useEffect, useCallback} from 'react';
import toast from 'react-hot-toast';
import Client from '../components/Client';
import Editor from '../components/Editor'
import {language, cmtheme} from '../atoms';
import {useRecoilState} from 'recoil';
import ACTIONS from '../actions/Actions';
import {initSocket} from '../socket';
import {useLocation, useNavigate, Navigate, useParams} from 'react-router-dom';
import SavedSnippets from '../components/SavedSnippets';
import { debounce } from 'lodash';
import Logo from '../components/Logo';

const EditorPage = () => {
    const [lang, setLang] = useRecoilState(language);
    const [them, setThem] = useRecoilState(cmtheme);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSnippets, setShowSnippets] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [code, setCode] = useState('');

    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const {roomId} = useParams();
    const reactNavigator = useNavigate();

    const handleErrors = useCallback((e) => {
        console.error('Socket error:', e);
        setError('Connection failed');
        toast.error('Failed to connect to server. Please try again later.');
        reactNavigator('/');
    }, [reactNavigator]);

    // Create debouncedCodeChange function
    const debouncedCodeChange = useCallback(
        debounce((code) => {
            if (socketRef.current) {
                socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                    roomId,
                    code,
                });
            }
        }, 500),
        [roomId]
    );

    useEffect(() => {
        const init = async () => {
            try {
                setIsLoading(true);
            socketRef.current = await initSocket();
                
                socketRef.current.on('connect_error', handleErrors);
                socketRef.current.on('connect_failed', handleErrors);

                // Join room with username
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
                socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room`);
                        
                        // Request existing code from clients
                        socketRef.current.emit(ACTIONS.SYNC_CODE, {
                            socketId,
                            code: codeRef.current,
                        });
                    }
                    setClients(clients);
                    });

            // Listening for disconnected
                socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                    toast.success(`${username} left the room`);
                    setClients((prev) => prev.filter(client => client.socketId !== socketId));
                });

                setIsLoading(false);
            } catch (err) {
                setError('Failed to connect to server');
                toast.error('Connection failed');
                setIsLoading(false);
            }
        };

        init();

        return () => {
            socketRef.current?.disconnect();
            debouncedCodeChange.cancel();
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied to clipboard!');
        } catch (err) {
            toast.error('Failed to copy Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        try {
            socketRef.current?.emit(ACTIONS.LEAVE);
            reactNavigator('/');
        } catch (err) {
            console.error('Error leaving room:', err);
        reactNavigator('/');
        }
    }

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        debouncedCodeChange(newCode);
    };

    if (!location.state) {
        return <Navigate to="/" />;
    }

    if (isLoading) {
        return (
            <div className="loadingWrapper">
                <div className="loadingSpinner"></div>
                <p>Connecting to server...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="errorWrapper">
                <h3>Oops! Something went wrong</h3>
                <p>{error}</p>
                <button 
                    className="btn primaryBtn" 
                    onClick={() => reactNavigator('/')}
                >
                    Go Back Home
                </button>
            </div>
        );
    }

    return (
        <div className="editorContainer">
            {/* Top Navbar */}
            <nav className="navbar">
                <div className="navLeft">
                    <Logo />
                    <div className="roomInfo">
                        <span className="roomLabel">Room ID:</span>
                        <span className="roomId">{roomId}</span>
                        <button className="iconBtn" onClick={copyRoomId} title="Copy Room ID">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M8 4v12h12V4H8zm11 11H9V5h10v10z" fill="currentColor"/>
                                <path d="M4 20V8h2v10h10v2H4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="navRight">
                    <button 
                        className="settingsBtn"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <svg 
                            width="18" 
                            height="18" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        Settings
                    </button>
                </div>
            </nav>

            {/* Main Editor Area */}
            <div className="editorMain">
                {/* Code Editor */}
                <div className="editorContent">
                    <Editor
                        socketRef={socketRef}
                        roomId={roomId}
                        onCodeChange={handleCodeChange}
                    />
                </div>

                {/* Right Sidebar */}
                <div className="rightSidebar">
                    {/* Connected Users */}
                    <div className="connectedUsers">
                        <h3>Connected Users ({clients.length})</h3>
                        <div className="usersList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>

                    {/* Saved Snippets */}
                    <div className="snippetsSection">
                        <h3>Saved Snippets</h3>
                        <SavedSnippets 
                            currentCode={code}
                            language={lang}
                            onLoadCode={(loadedCode) => {
                                setCode(loadedCode);
                                socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                                    roomId,
                                    code: loadedCode,
                                });
                            }}
                        />
                    </div>

                    {/* Leave Room Button */}
                    <button className="leaveBtn" onClick={leaveRoom}>
                        Leave Room
                    </button>
                </div>

                {/* Settings Modal */}
                {showSettings && (
                    <div className="settingsModal">
                        <div className="settingsContent">
                            <div className="settingsHeader">
                                <h3>Editor Settings</h3>
                                <button 
                                    className="closeBtn" 
                                    onClick={() => setShowSettings(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="settingGroup">
                                <label className="settingLabel">
                                    Language
                                    <select 
                                        value={lang} 
                                        onChange={(e) => {
                                            setLang(e.target.value);
                                            window.location.reload();
                                        }} 
                                        className="settingSelect"
                                    >
                        <option value="clike">C / C++ / C# / Java</option>
                        <option value="css">CSS</option>
                        <option value="dart">Dart</option>
                        <option value="django">Django</option>
                        <option value="dockerfile">Dockerfile</option>
                        <option value="go">Go</option>
                        <option value="htmlmixed">HTML-mixed</option>
                        <option value="javascript">JavaScript</option>
                        <option value="jsx">JSX</option>
                        <option value="markdown">Markdown</option>
                        <option value="php">PHP</option>
                        <option value="python">Python</option>
                        <option value="r">R</option>
                        <option value="rust">Rust</option>
                        <option value="ruby">Ruby</option>
                        <option value="sass">Sass</option>
                        <option value="shell">Shell</option>
                        <option value="sql">SQL</option>
                        <option value="swift">Swift</option>
                        <option value="xml">XML</option>
                        <option value="yaml">yaml</option>
                    </select>
                </label>
                            </div>
                            <div className="settingGroup">
                                <label className="settingLabel">
                                    Theme
                                    <select 
                                        value={them} 
                                        onChange={(e) => {
                                            setThem(e.target.value);
                                            window.location.reload();
                                        }} 
                                        className="settingSelect"
                                    >
                        <option value="default">default</option>
                        <option value="3024-day">3024-day</option>
                        <option value="3024-night">3024-night</option>
                        <option value="abbott">abbott</option>
                        <option value="abcdef">abcdef</option>
                        <option value="ambiance">ambiance</option>
                        <option value="ayu-dark">ayu-dark</option>
                        <option value="ayu-mirage">ayu-mirage</option>
                        <option value="base16-dark">base16-dark</option>
                        <option value="base16-light">base16-light</option>
                        <option value="bespin">bespin</option>
                        <option value="blackboard">blackboard</option>
                        <option value="cobalt">cobalt</option>
                        <option value="colorforth">colorforth</option>
                        <option value="darcula">darcula</option>
                        <option value="duotone-dark">duotone-dark</option>
                        <option value="duotone-light">duotone-light</option>
                        <option value="eclipse">eclipse</option>
                        <option value="elegant">elegant</option>
                        <option value="erlang-dark">erlang-dark</option>
                        <option value="gruvbox-dark">gruvbox-dark</option>
                        <option value="hopscotch">hopscotch</option>
                        <option value="icecoder">icecoder</option>
                        <option value="idea">idea</option>
                        <option value="isotope">isotope</option>
                        <option value="juejin">juejin</option>
                        <option value="lesser-dark">lesser-dark</option>
                        <option value="liquibyte">liquibyte</option>
                        <option value="lucario">lucario</option>
                        <option value="material">material</option>
                        <option value="material-darker">material-darker</option>
                        <option value="material-palenight">material-palenight</option>
                        <option value="material-ocean">material-ocean</option>
                        <option value="mbo">mbo</option>
                        <option value="mdn-like">mdn-like</option>
                        <option value="midnight">midnight</option>
                        <option value="monokai">monokai</option>
                        <option value="moxer">moxer</option>
                        <option value="neat">neat</option>
                        <option value="neo">neo</option>
                        <option value="night">night</option>
                        <option value="nord">nord</option>
                        <option value="oceanic-next">oceanic-next</option>
                        <option value="panda-syntax">panda-syntax</option>
                        <option value="paraiso-dark">paraiso-dark</option>
                        <option value="paraiso-light">paraiso-light</option>
                        <option value="pastel-on-dark">pastel-on-dark</option>
                        <option value="railscasts">railscasts</option>
                        <option value="rubyblue">rubyblue</option>
                        <option value="seti">seti</option>
                        <option value="shadowfox">shadowfox</option>
                        <option value="solarized">solarized</option>
                        <option value="the-matrix">the-matrix</option>
                        <option value="tomorrow-night-bright">tomorrow-night-bright</option>
                        <option value="tomorrow-night-eighties">tomorrow-night-eighties</option>
                        <option value="ttcn">ttcn</option>
                        <option value="twilight">twilight</option>
                        <option value="vibrant-ink">vibrant-ink</option>
                        <option value="xq-dark">xq-dark</option>
                        <option value="xq-light">xq-light</option>
                        <option value="yeti">yeti</option>
                        <option value="yonce">yonce</option>
                        <option value="zenburn">zenburn</option>
                    </select>
                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="editorFooter">
                <div className="footerLeft">
                    <div className="footerInfo">
                        <span className="footerLabel">Language:</span>
                        <span className="footerValue">{lang}</span>
                    </div>
                    <div className="footerInfo">
                        <span className="footerLabel">Theme:</span>
                        <span className="footerValue">{them}</span>
                    </div>
                </div>
                <div className="footerRight">
                    <span className="footerCredit">
                        CodeCollab Team &copy; All rights reserved 2025 
                    </span>
            </div>
            </footer>
        </div>
    );
};

export default EditorPage;