import React from 'react';

const Client = ({ username }) => {
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .slice(0, 2);
    };

    return (
        <div className="client">
            <div className="userAvatar">
                {getInitials(username)}
            </div>
            <span className="userName">{username}</span>
        </div>
    );
};

export default Client;