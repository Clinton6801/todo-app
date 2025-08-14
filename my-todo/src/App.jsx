import React, { useState, useEffect } from 'react';

// Main App Component
export default function App() {
  // Authentication state to hold the JWT, user information, and a derived username
  const [auth, setAuth] = useState({ token: null, userId: null, username: null });
  const [isRegistering, setIsRegistering] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  
  // State for filtering tasks
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'
  
  // State for in-line editing
  const [editingTask, setEditingTask] = useState(null);
  const [editedText, setEditedText] = useState('');

  // State for toast notifications
  const [toastMessage, setToastMessage] = useState(null);

  // The base URL of your backend server
  const BACKEND_URL = 'https://todo-app-vbvl.onrender.com';

  // Function to show a toast message
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000); // Hide toast after 3 seconds
  };

  // Check for an existing token in localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    if (token && userId) {
      setAuth({ token, userId, username });
      fetchTasks(token);
    }
  }, []);

  // Function to fetch tasks from the backend
  const fetchTasks = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`, // Include the JWT in the header
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch tasks. Please log in again.', 'error');
      setAuth({ token: null, userId: null, username: null }); // Clear auth on failure
      localStorage.clear();
    }
  };

  // Handle user registration
  const handleRegister = async (userData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message);
        setIsRegistering(false); // Switch to login form
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('An error occurred during registration.', 'error');
    }
  };

  // Handle user login
  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        const username = data.username;
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', username);
        setAuth({ token: data.token, userId: data.userId, username });
        fetchTasks(data.token); // Fetch tasks immediately after login
        showToast(data.message);
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('An error occurred during login.', 'error');
    }
  };

  // Handle user logout
  const handleLogout = () => {
    setAuth({ token: null, userId: null, username: null });
    localStorage.clear();
    setTasks([]);
    showToast('Logged out successfully.');
  };

  // Handle adding a new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTask.trim() === '') return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ text: newTask }),
      });
      if (response.ok) {
        const newTaskData = await response.json();
        setTasks([newTaskData, ...tasks]);
        setNewTask('');
        showToast('Task added successfully.');
      } else {
        throw new Error('Failed to add task');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to add task.', 'error');
    }
  };

  // Handle toggling the completion status of a task
  const handleToggleComplete = async (id, completed) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ completed: !completed }),
      });
      if (response.ok) {
        setTasks(
          tasks.map((task) =>
            task._id === id ? { ...task, completed: !task.completed } : task
          )
        );
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to update task.', 'error');
    }
  };

  // Handle deleting a task from the list
  const handleDeleteTask = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      if (response.ok) {
        setTasks(tasks.filter((task) => task._id !== id));
        showToast('Task deleted successfully.');
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to delete task.', 'error');
    }
  };

  // Function to start editing a task
  const handleStartEditing = (task) => {
    setEditingTask(task._id);
    setEditedText(task.text);
  };

  // Function to handle the actual edit and save to backend
  const handleEditTask = async (id) => {
    if (editedText.trim() === '') {
      showToast('Task text cannot be empty.', 'error');
      setEditingTask(null);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ text: editedText }),
      });
      if (response.ok) {
        setTasks(
          tasks.map((task) =>
            task._id === id ? { ...task, text: editedText } : task
          )
        );
        setEditingTask(null);
        showToast('Task updated successfully.');
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to update task.', 'error');
      setEditingTask(null);
    }
  };

  // Filter tasks based on the current filter state
  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') {
      return !task.completed;
    } else if (filter === 'completed') {
      return task.completed;
    }
    return true; // 'all' filter
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 text-slate-100 font-sans antialiased flex flex-col items-center w-full overflow-x-hidden">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          .font-sans {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>
      
      {/* Toast Notification Container */}
      {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} />}

      {/* Conditionally render based on authentication status */}
      {!auth.token ? (
        <AuthScreen
          isRegistering={isRegistering}
          setIsRegistering={setIsRegistering}
          onLogin={handleLogin}
          onRegister={handleRegister}
          showToast={showToast}
        />
      ) : (
        <>
          <Header onLogout={handleLogout} username={auth.username} />
          <main className="container mx-auto max-w-xl flex-grow px-4 md:px-0">
            {/* Form to add a new task */}
            <form onSubmit={handleAddTask} className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 md:p-6 mb-8 flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                className="flex-grow w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md w-full sm:w-auto"
              >
                Add
              </button>
            </form>

            {/* Task Filter Buttons */}
            <div className="flex justify-center gap-2 md:gap-4 mb-8">
              <button
                onClick={() => setFilter('all')}
                className={`py-2 px-3 md:px-4 rounded-lg font-bold transition-colors duration-200 text-sm md:text-base ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`py-2 px-3 md:px-4 rounded-lg font-bold transition-colors duration-200 text-sm md:text-base ${
                  filter === 'active'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`py-2 px-3 md:px-4 rounded-lg font-bold transition-colors duration-200 text-sm md:text-base ${
                  filter === 'completed'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Task list section */}
            <section className="space-y-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 flex items-center justify-between transition-all duration-300 ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-grow">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleComplete(task._id, task.completed)}
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded-full border-gray-400 focus:ring-indigo-500 transition-all"
                      />
                      {editingTask === task._id ? (
                        <input
                          type="text"
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          onBlur={() => handleEditTask(task._id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditTask(task._id);
                            }
                            if (e.key === 'Escape') {
                              setEditingTask(null);
                            }
                          }}
                          className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          autoFocus
                        />
                      ) : (
                        <p
                          className={`text-slate-200 text-lg flex-grow cursor-pointer ${task.completed ? 'line-through' : ''}`}
                          onClick={() => handleStartEditing(task)}
                        >
                          {task.text}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold h-8 w-8 flex items-center justify-center rounded-full transition-colors duration-200 shadow-md"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 text-xl py-12">
                  You have no tasks in this view.
                </div>
              )}
            </section>
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}

// Authentication Screen Component with Login and Registration forms
function AuthScreen({ isRegistering, setIsRegistering, onLogin, onRegister, showToast }) {
  // Common login/register fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // New registration fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [username, setUsername] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');

  // Form validation for the register button
  const isRegisterFormValid =
    email.trim() !== '' &&
    password.trim() !== '' &&
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    dob.trim() !== '' &&
    gender.trim() !== '' &&
    username.trim() !== '' &&
    (purpose.trim() !== '' || customPurpose.trim() !== '');

  // Form validation for the login button
  const isLoginFormValid = email.trim() !== '' && password.trim() !== '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      const finalPurpose = purpose === 'Other' ? customPurpose : purpose;
      const userData = {
        email,
        password,
        firstName,
        lastName,
        dob,
        gender,
        username,
        purpose: finalPurpose,
      };
      onRegister(userData);
    } else {
      onLogin(email, password);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-8 w-full max-w-sm">
        <h2 className="text-3xl font-extrabold text-center text-white mb-6">
          {isRegistering ? 'Register' : 'Login'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
          {isRegistering && (
            <>
              <input
                type="date"
                placeholder="Date of Birth"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
              <select
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  if (e.target.value !== 'Other') setCustomPurpose('');
                }}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              >
                <option value="" disabled>Select To-Do List Purpose</option>
                <option value="Business">Business</option>
                <option value="Fitness">Fitness</option>
                <option value="Chores">Chores</option>
                <option value="Other">Other (Specify)</option>
              </select>
              {purpose === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom purpose"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              )}
            </>
          )}
          <button
            type="submit"
            disabled={isRegistering ? !isRegisterFormValid : !isLoginFormValid}
            className={`w-full font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md ${
              (isRegistering ? isRegisterFormValid : isLoginFormValid) ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-slate-400">
          {isRegistering ? 'Already have an account?' : 'Don\'t have an account?'}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-indigo-400 hover:underline ml-1"
          >
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}

// Header component with Logout button and user info
function Header({ onLogout, username }) {
  // Get the first letter of the username for the avatar
  const firstInitial = username ? username.charAt(0).toUpperCase() : '';

  return (
    <header className="py-8 mb-4 w-full max-w-xl flex flex-col md:flex-row justify-between items-center px-4 md:px-0 text-center md:text-left">
      <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-0">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white font-bold text-xl shadow-lg">
          {firstInitial}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Welcome, {username}!
        </h1>
      </div>
      <button
        onClick={onLogout}
        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
      >
        Logout
      </button>
    </header>
  );
}

// Footer component
function Footer() {
  return (
    <footer className="w-full py-6 text-center text-slate-500 text-sm mt-12">
      <p>&copy; {new Date().getFullYear()} To-Do App. All rights reserved.</p>
    </footer>
  );
}

// Toast Notification component
function Toast({ message, type }) {
  const bgColor = type === 'error' ? 'bg-red-600' : 'bg-green-600';
  const icon = type === 'error' ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-xl text-white shadow-xl ${bgColor} transition-all duration-300 transform`}>
      {icon}
      <p>{message}</p>
    </div>
  );
}
