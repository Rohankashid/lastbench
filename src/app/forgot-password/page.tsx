'use client';

import React ,{useState} from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import {auth} from '@/lib/firebase';
import Link from 'next/link';

export default function ForgotPasswordPage(){
    const [email,setEmail] = useState('');
    const [error , setError] = useState('');
    const [message , setMessage] = useState('');
    const [loading,setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent)=>{
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        
        try{
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset email sent! Please check your inbox.');
        } catch (err: unknown) {
            type FirebaseError = { code: string };
            let errorCode = '';
            if (err && typeof err === 'object' && 'code' in err && typeof (err as FirebaseError).code === 'string') {
                errorCode = (err as FirebaseError).code;
            }
            let friendlyMessage = 'Failed to send password reset email.';
            switch (errorCode) {
                case 'auth/user-not-found':
                    friendlyMessage = 'No account found with this email.';
                    break;
                case 'auth/invalid-email':
                    friendlyMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/too-many-requests':
                    friendlyMessage = 'Too many requests. Please try again later.';
                    break;
                default:
                    if (errorCode) {
                        friendlyMessage = 'Something went wrong. Please try again.';
                    }
            }
            setError(friendlyMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block mb-1 font-medium">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded"
                        disabled={loading}
                    />
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                {message && <div className="text-green-600 text-sm">{message}</div>}
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Sending...' : 'Send Reset Email'}
                </button>
            </form>
            <div className="mt-4 text-center">
                <Link href="/login" className="text-blue-600 hover:underline">Back to Login</Link>
            </div>
        </div>
    );
}