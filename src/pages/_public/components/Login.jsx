// import { useEffect, useState } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { login } from '../../../services/n8n-apis/_auth/Login.api.js';
// import { useUser } from '../../../context/UserContext';
// import { Loader, User, Lock } from 'lucide-react';
// import { signup } from '../../../namespace/client';
// import { useToast } from "@/hooks/use-toast";

// export default function Login() {

//     // context
//     const { setUser, isAuthenticated, user } = useUser();
//     const navigate = useNavigate();
//     const location = useLocation();
//     // states
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const { toast } = useToast();

//     // Login security states
//     const [failedAttempts, setFailedAttempts] = useState(0);
//     const [isLocked, setIsLocked] = useState(false);
//     const [lockoutEndTime, setLockoutEndTime] = useState(null);
//     const [lockoutDuration, setLockoutDuration] = useState(5); // Initial 5 minutes
//     const [timeRemaining, setTimeRemaining] = useState(0);

//     // Check if account is locked
//     useEffect(() => {
//         if (isLocked) {
//             const timer = setInterval(() => {
//                 const now = new Date();
//                 const remainingMs = lockoutEndTime - now;

//                 if (remainingMs <= 0) {
//                     setIsLocked(false);
//                     clearInterval(timer);
//                 } else {
//                     setTimeRemaining(Math.ceil(remainingMs / 1000 / 60)); // Convert to minutes
//                 }
//             }, 1000);

//             return () => clearInterval(timer);
//         }
//     }, [isLocked, lockoutEndTime]);

//     // Handle account lockout
//     const lockAccount = () => {
//         // Increase lockout duration exponentially after each set of 5 attempts
//         const newDuration = Math.min(60, lockoutDuration * (failedAttempts >= 10 ? 2 : 1));
//         setLockoutDuration(newDuration);

//         const endTime = new Date();
//         endTime.setMinutes(endTime.getMinutes() + newDuration);

//         setLockoutEndTime(endTime);
//         setIsLocked(true);
//         setTimeRemaining(newDuration);

//         toast({
//             title: 'Account Temporarily Locked',
//             description: `Too many failed attempts. Try again in ${newDuration} minutes.`,
//             variant: "destructive"
//         });
//     };

//     async function handleLogin() {
//         // Check if account is locked
//         if (isLocked) {
//             toast({
//                 title: 'Account Locked',
//                 description: `Please wait ${timeRemaining} minutes before trying again.`,
//                 variant: "destructive"
//             });
//             return;
//         }

//         if (email.length === 0 || password.length === 0) {
//             toast({
//                 title: 'Error',
//                 description: 'Please fill all the fields',
//                 variant: "destructive"
//             });
//             return;
//         }

//         setIsLoading(true);
//         try {
//             const response = await login(email, password);

//             if (response.success) {
//                 // Reset failed attempts on successful login
//                 setFailedAttempts(0);

//                 localStorage.setItem('id', response.data.id)
//                 localStorage.setItem('email', response.data.email)

//                 setUser({
//                     id: response.data.id,
//                     email: response.data.email,
//                     isAuthenticated: true
//                 });

//                 toast({
//                     title: 'Success',
//                     description: response.message,
//                     variant: 'default'
//                 });

//                 const from = location.state?.from?.pathname || '/dashboard';
//                 navigate(from, { replace: true });
//             } else {
//                 // Increment failed attempts
//                 const newAttempts = failedAttempts + 1;
//                 setFailedAttempts(newAttempts);

//                 // Check if we should lock the account
//                 if (newAttempts >= 5 && newAttempts % 5 === 0) {
//                     lockAccount();
//                 } else {
//                     toast({
//                         title: 'Error',
//                         description: `${response.message} (${5 - (newAttempts % 5)} attempts remaining)`,
//                         variant: "destructive"
//                     });
//                 }
//             }
//         } catch (error) {
//             toast({
//                 title: 'Error',
//                 description: error.message,
//                 variant: "destructive"
//             });
//         } finally {
//             setIsLoading(false);
//         }
//     }

//     return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
//             <h1 className="text-4xl font-bold mb-6 text-white">Login</h1>
//             <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-sm">
//                 {isLocked ? (
//                     <div className="mb-6 p-4 bg-red-900/30 rounded border border-red-700 text-center">
//                         <Lock className="mx-auto mb-2 text-red-500" size={32} />
//                         <h3 className="text-red-400 font-bold text-lg">Account Temporarily Locked</h3>
//                         <p className="text-gray-300 mt-2">
//                             Too many failed login attempts. Please try again in <span className="font-bold text-red-400">{timeRemaining}</span> minutes.
//                         </p>
//                     </div>
//                 ) : (
//                     <>
//                         <div className="mb-4">
//                             <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">
//                                 Email
//                             </label>
//                             <input
//                                 type="email"
//                                 id="email"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                                 className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-800 text-gray-300 leading-tight focus:outline-none focus:shadow-outline"
//                             />
//                         </div>
//                         <div className="mb-6">
//                             <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
//                                 Password
//                             </label>
//                             <input
//                                 type="password"
//                                 id="password"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-800 text-gray-300 mb-3 leading-tight focus:outline-none focus:shadow-outline"
//                             />
//                         </div>
//                     </>
//                 )}

//                 <div className="flex items-center justify-between">
//                     <button
//                         onClick={handleLogin}
//                         disabled={isLocked}
//                         className={`${isLocked ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-800'} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
//                     >
//                         {
//                             isLoading ? (
//                                 <Loader className="animate-spin" />
//                             ) : (
//                                 'Sign In'
//                             )
//                         }
//                     </button>
//                 </div>
//                 <p className='flex gap-2 text-gray-400 font-semibold m-4'>
//                     or
//                     <Link to={signup} className="text-blue-400 hover:text-blue-600">Sign Up</Link>
//                 </p>
//             </div>
//         </div>
//     );
// }

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader, Lock, Circle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { login } from "@/services/n8n-apis/_auth/Login.api";
import { useUser } from "@/context/UserContext";

export default function Login() {
  // context
  const { setUser } = useUser();
  const navigate = useNavigate();
  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Login security states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);
  const [lockoutDuration, setLockoutDuration] = useState(5); // Initial 5 minutes
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (custom) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: custom * 0.2,
        duration: 0.8,
        ease: "easeOut",
      },
    }),
  };

  // Check if account is locked
  useEffect(() => {
    if (isLocked) {
      const timer = setInterval(() => {
        const now = new Date();
        const remainingMs = lockoutEndTime - now;

        if (remainingMs <= 0) {
          setIsLocked(false);
          clearInterval(timer);
        } else {
          setTimeRemaining(Math.ceil(remainingMs / 1000 / 60)); // Convert to minutes
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutEndTime]);

  // Handle account lockout
  const lockAccount = () => {
    // Increase lockout duration exponentially after each set of 5 attempts
    const newDuration = Math.min(
      60,
      lockoutDuration * (failedAttempts >= 10 ? 2 : 1),
    );
    setLockoutDuration(newDuration);

    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + newDuration);

    setLockoutEndTime(endTime);
    setIsLocked(true);
    setTimeRemaining(newDuration);

    toast({
      title: "Account Temporarily Locked",
      description: `Too many failed attempts. Try again in ${newDuration} minutes.`,
      variant: "destructive",
    });
  };

  async function handleLogin() {
    // Check if account is locked
    if (isLocked) {
      toast({
        title: "Account Locked",
        description: `Please wait ${timeRemaining} minutes before trying again.`,
        variant: "destructive",
      });
      return;
    }

    if (email.length === 0 || password.length === 0) {
      toast({
        title: "Error",
        description: "Please fill all the fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(email, password);

      if (response.success) {
        // Reset failed attempts on successful login
        setFailedAttempts(0);

        localStorage.setItem("id", response.data.id);
        localStorage.setItem("email", response.data.email);

        setUser({
          id: response.data.id,
          email: response.data.email,
          isAuthenticated: true,
        });

        toast({
          title: "Success",
          description: response.message,
          variant: "default",
        });

        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        // Increment failed attempts
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        // Check if we should lock the account
        if (newAttempts >= 5 && newAttempts % 5 === 0) {
          lockAccount();
        } else {
          toast({
            title: "Error",
            description: `${response.message} (${5 - (newAttempts % 5)} attempts remaining)`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950">
      {/* Left side - Login Form */}
      <motion.div
        className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Welcome Back
            </h1>
            <p className="text-slate-400 mt-2">
              Sign in to your account to continue
            </p>
          </motion.div>

          <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-slate-800">
            {isLocked ? (
              <motion.div
                className="mb-6 p-4 bg-red-900/30 rounded-lg border border-red-700 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Lock className="mx-auto mb-2 text-red-500" size={32} />
                <h3 className="text-red-400 font-bold text-lg">
                  Account Temporarily Locked
                </h3>
                <p className="text-gray-300 mt-2">
                  Too many failed login attempts. Please try again in{" "}
                  <span className="font-bold text-red-400">
                    {timeRemaining}
                  </span>{" "}
                  minutes.
                </p>
              </motion.div>
            ) : (
              <>
                <motion.div variants={itemVariants} className="mb-4">
                  <label
                    className="block text-slate-300 text-sm font-medium mb-2"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    placeholder="your@email.com"
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="mb-6">
                  <label
                    className="block text-slate-300 text-sm font-medium mb-2"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    placeholder="••••••••"
                  />
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-between mb-6"
                >
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-slate-100 focus:ring-slate-600"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-slate-400"
                    >
                      Remember me
                    </label>
                  </div>
                  <div className="text-sm">
                    <a
                      href="#"
                      className="font-medium text-blue-400 hover:text-blue-300"
                    >
                      Forgot password?
                    </a>
                  </div>
                </motion.div>
              </>
            )}

            <motion.div variants={itemVariants}>
              <Button
                onClick={handleLogin}
                disabled={isLocked || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-center text-sm text-slate-400"
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign up
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </motion.div>

      {/* Right side - Brand Visualization */}
      <motion.div
        className="hidden md:flex md:w-1/2 bg-slate-950 items-center justify-center relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black"></div>

        {/* Concentric circles */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 800">
          <motion.circle
            cx="400"
            cy="400"
            r="350"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.circle
            cx="400"
            cy="400"
            r="300"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.2, ease: "easeInOut" }}
          />
          <motion.circle
            cx="400"
            cy="400"
            r="250"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.4, ease: "easeInOut" }}
          />
          <motion.circle
            cx="400"
            cy="400"
            r="200"
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.6, ease: "easeInOut" }}
          />
          <motion.circle
            cx="400"
            cy="400"
            r="150"
            fill="none"
            stroke="rgba(255,255,255,0.11)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.8, ease: "easeInOut" }}
          />
          <motion.circle
            cx="400"
            cy="400"
            r="100"
            fill="none"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
          />
        </svg>

        {/* Center logo */}
        <motion.div
          className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full bg-slate-900/80 border border-slate-800"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 1.2 }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 1.5 }}
            />
            <motion.path
              d="M2 17L12 22L22 17"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 1.8 }}
            />
            <motion.path
              d="M2 12L12 17L22 12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 2.1 }}
            />
          </svg>
        </motion.div>

        {/* Framework elements */}
        <div className="relative z-10">
          {/* Top */}
          <motion.div
            className="absolute top-[-180px] left-1/2 transform -translate-x-1/2 text-center"
            custom={0}
            variants={circleVariants}
            initial="hidden"
            animate="visible"
          >
            <Circle className="mx-auto mb-2 text-blue-400/80" size={16} />
            <p className="text-white font-medium">ARCS</p>
          </motion.div>

          {/* Top Right */}
          <motion.div
            className="absolute top-[-120px] right-[-120px] text-center"
            custom={1}
            variants={circleVariants}
            initial="hidden"
            animate="visible"
          >
            <Circle className="mx-auto mb-2 text-emerald-400/80" size={16} />
            <p className="text-white font-medium">ARCF</p>
          </motion.div>

          {/* Right */}
          <motion.div
            className="absolute top-0 right-[-180px] text-center"
            custom={2}
            variants={circleVariants}
            initial="hidden"
            animate="visible"
          >
            <Circle className="mx-auto mb-2 text-purple-400/80" size={16} />
            <p className="text-white font-medium">Omnisynth</p>
          </motion.div>

          {/* Bottom Right */}
          <motion.div
            className="absolute bottom-[-120px] right-[-120px] text-center"
            custom={3}
            variants={circleVariants}
            initial="hidden"
            animate="visible"
          >
            <Circle className="mx-auto mb-2 text-amber-400/80" size={16} />
            <p className="text-white font-medium">V Framework 2.0</p>
          </motion.div>

          {/* Bottom */}
          <motion.div
            className="absolute bottom-[-200px] left-1/2 transform -translate-x-1/2 text-center"
            custom={4}
            variants={circleVariants}
            initial="hidden"
            animate="visible"
          >
            <Circle className="mx-auto mb-2 text-rose-400/80" size={16} />
            <p className="text-white font-medium">God Partical</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
