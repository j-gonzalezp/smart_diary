"use client";
import React, { useState, FormEvent } from 'react';
import { createAccount, verifySecret } from '@/lib/actions/user.actions';
import { useRouter } from 'next/navigation';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState(''); 
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setIsLoading(true);
    setError(null);
    setAccountId(null); 
    if (!email || !fullName) {
        setError("Both Full Name and Email are required.");
        setIsLoading(false);
        return;
    }
    try {
      const result = await createAccount({ email, fullName });
      if (result?.accountId) {
        setAccountId(result.accountId);
        setShowOtpInput(true); 
        setError(null); 
      } else {
         setError('Failed to initiate OTP process. Please try again.');
         console.error("Unexpected result from createAccount:", result);
      }
    } catch (err: any) {
      console.error("Error submitting email/name:", err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setShowOtpInput(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault(); 
      setIsLoading(true);
      setError(null);
      if (!accountId) {
          setError("Account ID is missing. Please go back and enter your email again.");
          setIsLoading(false);
          setShowOtpInput(false);
          return;
      }
       if (!otp) {
          setError("OTP is required.");
          setIsLoading(false);
          return;
      }
      try {
          const sessionResult = await verifySecret({ accountId, password: otp });
          if (sessionResult?.sessionId) {
              console.log("Authentication successful!");
              router.push('/dashboard');
          } else {
               setError('Failed to verify OTP. Please check the code and try again.');
               console.error("Unexpected result from verifySecret:", sessionResult);
          }
      } catch (err: any) {
          console.error("Error verifying OTP:", err);
          setError(err.message || 'Invalid OTP or verification failed. Please try again.');
          setOtp('');
      } finally {
          setIsLoading(false);
      }
  };

  const handleSubmit = showOtpInput ? handleOtpSubmit : handleEmailSubmit;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>{showOtpInput ? 'Enter Verification Code' : 'Sign In / Sign Up'}</h2>
      {error && <p style={styles.error}>{error}</p>}
      {!showOtpInput && (
        <>
          <div style={styles.inputGroup}>
            <label htmlFor="fullName" style={styles.label}>Full Name:</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              style={styles.input}
            />
          </div>
        </>
      )}
      {showOtpInput && (
        <div style={styles.inputGroup}>
           <p style={{fontSize: '0.9em', marginBottom: '10px'}}>An OTP has been sent to {email}. Please enter it below.</p>
          <label htmlFor="otp" style={styles.label}>OTP Code:</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            disabled={isLoading}
            style={styles.input}
          />
        </div>
      )}
      <button type="submit" disabled={isLoading} style={styles.button}>
        {isLoading ? 'Processing...' : (showOtpInput ? 'Verify Code' : 'Continue')}
      </button>
     {showOtpInput && !isLoading && (
         <button
            type="button"
            onClick={() => {
                setShowOtpInput(false);
                setError(null);
                setOtp('');
                setAccountId(null);
            }}
            style={styles.backButton}
            >
            Back
         </button>
     )}
    </form>
  );
};

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '15px',
    maxWidth: '400px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '5px',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '0.9em',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1em',
  },
  button: {
    padding: '12px',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1em',
    cursor: 'pointer',
    opacity: 1,
  },
  backButton: {
    padding: '10px',
    backgroundColor: '#eee',
    color: '#333',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.9em',
    cursor: 'pointer',
    marginTop: '5px'
  },
  error: {
    color: 'red',
    fontSize: '0.9em',
    border: '1px solid red',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#ffebee'
  },
};

export default AuthForm;