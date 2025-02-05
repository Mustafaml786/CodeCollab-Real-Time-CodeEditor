import React, {useState} from 'react';
import {v4 as uuidV4} from 'uuid';
import toast from 'react-hot-toast';
import {useNavigate} from 'react-router-dom';
import Logo from '../components/Logo';

const Home = () => {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('New room created! 🎉');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('Room ID & username are required');
            return;
        }

        navigate(`/editor/${roomId}`, {
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <Logo />
                <div className="inputGroup">
                    <label className="inputLabel">ROOM ID</label>
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="Enter room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        onKeyUp={handleInputEnter}
                    />
                </div>
                <div className="inputGroup">
                    <label className="inputLabel">USERNAME</label>
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyUp={handleInputEnter}
                    />
                </div>
                <button className="btn primaryBtn" onClick={joinRoom}>
                    Join Room
                </button>
                <div className="createInfo">
                    <button 
                        className="btn secondaryBtn" 
                        onClick={createNewRoom}
                    >
                        Create New Room
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;