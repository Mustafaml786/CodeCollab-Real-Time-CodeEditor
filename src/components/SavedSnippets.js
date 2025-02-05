import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

const SavedSnippets = ({ currentCode, language, onLoadCode }) => {
    const [snippets, setSnippets] = useState([]);
    const [loading, setLoading] = useState(false);
    const { roomId } = useParams();

    // Fetch saved snippets
    const fetchSnippets = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/get-saved-codes/${roomId}`);
            setSnippets(response.data);
        } catch (error) {
            console.error('Error fetching snippets:', error);
            toast.error('Failed to fetch saved codes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSnippets();
    }, [roomId]);

    const saveSnippet = async () => {
        try {
            if (!currentCode) {
                toast.error('No code to save!');
                return;
            }

            const title = prompt('Enter a title for this code snippet:');
            if (!title) return;

            const response = await axios.post('http://localhost:5000/api/save-code', {
                title,
                code: currentCode,
                language,
                roomId
            });

            setSnippets([response.data, ...snippets]);
            toast.success('Code saved successfully!');
        } catch (error) {
            console.error('Error saving snippet:', error);
            toast.error('Failed to save code');
        }
    };

    const loadSnippet = (code) => {
        if (onLoadCode) {
            onLoadCode(code);
            toast.success('Code loaded successfully!');
        }
    };

    const deleteSnippet = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/save-code/${id}`);
            setSnippets(snippets.filter(snippet => snippet._id !== id));
            toast.success('Snippet deleted');
        } catch (error) {
            console.error('Error deleting snippet:', error);
            toast.error('Failed to delete snippet');
        }
    };

    return (
        <div className="snippets-container">
            <button className="btn saveBtn" onClick={saveSnippet}>
                Save Current Code
            </button>
            
            {loading ? (
                <div className="loading">Loading saved codes...</div>
            ) : (
                <div className="snippets-list">
                    {snippets.map((snippet) => (
                        <div key={snippet._id} className="snippet-item">
                            <div className="snippet-header">
                                <h4>{snippet.title}</h4>
                                <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="snippet-preview">
                                {snippet.code.slice(0, 50)}...
                            </div>
                            <div className="snippet-actions">
                                <button 
                                    className="btn loadBtn"
                                    onClick={() => loadSnippet(snippet.code)}
                                >
                                    Load
                                </button>
                                <button 
                                    className="btn deleteBtn"
                                    onClick={() => deleteSnippet(snippet._id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedSnippets; 