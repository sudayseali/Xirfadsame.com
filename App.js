import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

// --- CONFIGURATION AASAASIGA AH ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// AMNIGA MUHIIMKA AH: Admin ID-gaaga ku beddel 'your-admin-user-id-here'
// Tani waa kaliya simulation (jilitaan) dhinaca client-ka ah.
const ADMIN_ID = 'your-admin-user-id-here';
const MIN_WITHDRAW_AMOUNT = 0.5;
const PAYMENT_OPTIONS = [
    { id: 'zaad', name: 'Zaad Service', icon: '📞', details: 'Lambarka Taleefanka Zaad' },
    { id: 'edahab', name: 'E-Dahab', icon: '💰', details: 'Lambarka Taleefanka E-Dahab' },
    { id: 'payeer', name: 'Payeer', icon: '💳', details: 'Payeer Account Number (P123...)' },
    { id: 'sotelco', name: 'Sotelco', icon: '📧', details: 'Email ama ID' }
];

// Liiska Task-yada la heli karo
const AVAILABLE_TASKS = [
    { taskId: "REG101", title: "Diiwaangeli Account Cusub", reward: 0.5, details: { 'Magaca Hore': 'Numbers', 'Magaca Dambe': '✖️', 'Email': 'otuhufunime678@gmail.com', 'Password': 'nrjXvDq6AdyQ', 'Email Soo Celinta': 'uzulukeyuru67@gmail.com' }, description: "Register account using the specified data. You must use the provided data, otherwise you will not receive the reward." },
    { taskId: "REVIEW202", title: "Samee Review 5-Star ah", reward: 0.75, details: { 'Link-ga Review-ga': 'https://review.example.com/app123', 'Qoraalka Review-ga': 'This is the best app ever! Five stars! (Copy this exact text)' }, description: "Write a 5-star review on the provided link. Copy the review text and submit proof." }
];

// --- UTILITY FUNCTIONS ---
let db = null;
let auth = null;

const getAvatarStyling = (name) => {
    const firstChar = (name || 'U').charAt(0).toUpperCase();
    const charCode = firstChar.charCodeAt(0);
    const colorIndex = charCode % 10;
    const colors = [
        'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-indigo-500',
        'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ];
    return { initial: firstChar, colorClass: colors[colorIndex] };
};

// Base64 to ArrayBuffer (for file reading utilities)
const base64ToArrayBuffer = (base64) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

// --- MAIN APP COMPONENT ---
const TaskEarningApp = () => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [balance, setBalance] = useState({ current: 0, pending: 0 });
    const [submittedTasks, setSubmittedTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('home');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    // Setting default to true for the "Best Design 2026" dark mode aesthetic
    const [isDarkMode, setIsDarkMode] = useState(true); 

    // Admin States (for simulation)
    const [pendingTasks, setPendingTasks] = useState([]);
    const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
    const isUserAdmin = userId === ADMIN_ID;

    // Xogta Telegram-ka
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
    const telegramUserId = telegramUser.id;
    const telegramFullName = `${telegramUser.first_name || 'User'} ${telegramUser.last_name || ''}`.trim() || 'Unknown User';

    // --- AUTH & INIT ---
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);

            const handleAuth = async (user) => {
                if (user) {
                    const currentId = user.uid;
                    setUserId(currentId);
                    const userRef = doc(db, `artifacts/${appId}/users/${currentId}/profile/data`);
                    const userDoc = await getDoc(userRef);

                    // Create profile if it doesn't exist
                    if (!userDoc.exists()) {
                        await setDoc(userRef, {
                            currentBalance: 0,
                            pendingBalance: 0,
                            telegramUsername: telegramUser.username || 'Unknown',
                            telegramUserId: telegramUserId || 'Unknown',
                            lastLogin: serverTimestamp()
                        });
                    }

                    // Check if Admin ID is set and prompt user to change it
                    if (currentId === ADMIN_ID) {
                        setMessage("🚨 Xusuusin Admin: Waa inaad beddeshaa 'your-admin-user-id-here' lana simataa ID-gaaga dhabta ah si aad u aragto Dashboard-ka!");
                    }
                    setIsAuthReady(true);
                } else {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken).catch(console.error);
                    } else {
                        await signInAnonymously(auth).catch(console.error);
                    }
                }
            };
            onAuthStateChanged(auth, handleAuth);
        } catch (error) {
            console.error("Cilad dhinaca Firebase Init:", error);
        }
    }, []);

    // --- DATA FETCHING (User) ---
    useEffect(() => {
        if (!isAuthReady || !userId || !db) return;

        // 1. Listener-ka Baaqiga (Balance)
        const balanceRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
        const unsubscribeBalance = onSnapshot(balanceRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setBalance({
                    current: parseFloat(data.currentBalance) || 0,
                    pending: parseFloat(data.pendingBalance) || 0
                });
            }
        }, (error) => console.error("Error fetching balance:", error));

        // 2. Listener-ka Task-yada la diray (Private view)
        const tasksColRef = collection(db, `artifacts/${appId}/public/data/submitted_tasks`);
        const submittedTasksQuery = query(tasksColRef, where("userId", "==", userId));
        const unsubscribeTasks = onSnapshot(submittedTasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                submissionDate: doc.data().submissionDate?.toDate(),
            }));
            setSubmittedTasks(fetchedTasks);
        }, (error) => console.error("Error fetching submitted tasks:", error));

        return () => {
            unsubscribeBalance();
            unsubscribeTasks();
        };
    }, [isAuthReady, userId]);

    // --- DATA FETCHING (Admin - Public Data) ---
    useEffect(() => {
        if (!isAuthReady || !isUserAdmin || !db) return;

        // 1. Task-yada Sugaya (Pending Tasks)
        const allTasksRef = collection(db, `artifacts/${appId}/public/data/submitted_tasks`);
        const pendingTasksQuery = query(allTasksRef, where("status", "==", 'PENDING'));
        const unsubscribePendingTasks = onSnapshot(pendingTasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                submissionDate: doc.data().submissionDate?.toDate(),
                reward: doc.data().reward || 0
            }));
            setPendingTasks(fetchedTasks);
        }, (error) => console.error("Error fetching pending tasks:", error));

        // 2. Codsiyada Lacag Kala Bixinta (Withdrawals)
        const withdrawalsRef = collection(db, `artifacts/${appId}/public/data/withdrawals`);
        const pendingWithdrawalsQuery = query(withdrawalsRef, where("status", "==", 'PENDING'));
        const unsubscribeWithdrawals = onSnapshot(pendingWithdrawalsQuery, (snapshot) => {
            const fetchedWithdrawals = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate(),
            }));
            setPendingWithdrawals(fetchedWithdrawals);
        }, (error) => console.error("Error fetching pending withdrawals:", error));

        return () => {
            unsubscribePendingTasks();
            unsubscribeWithdrawals();
        };
    }, [isAuthReady, isUserAdmin]);

    // --- UTILITY FUNCTIONS ---
    const handleCopy = (text, fieldName) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            setMessage(`✅ ${fieldName} waa la koobiyey: ${text}`);
        } catch (err) {
            setMessage(`Cilad baa dhacday marka la koobiyeynayo ${fieldName}.`);
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textarea);
    };

    // --- TASK SUBMISSION LOGIC ---
    const submitTask = useCallback(async (task) => {
        if (!userId || !db) return setMessage("Cilad: User-ku lama aqoonsana.");
        const fileInput = document.getElementById(`file-input-${task.taskId}`);
        const imageFile = fileInput?.files[0];

        if (!imageFile) {
            return setMessage("Fadlan soo gali sawirka cadeynta (proof).");
        }
        if (imageFile.size > 500000) { // Max 500KB - recommended for base64 storage
            setMessage("Sawirku wuu weyn yahay. Fadlan dooro sawir ka yar 500KB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            setIsSubmitting(true);
            setMessage(`Task-gaaga (${task.title}) waxaa loo dirayaa xaqiijin...`);
            try {
                // Keydinta Task-yada la diray meel Admin-ku arki karo (Public)
                const tasksColRef = collection(db, `artifacts/${appId}/public/data/submitted_tasks`);
                await addDoc(tasksColRef, {
                    userId: userId,
                    telegramUsername: telegramUser.username || 'N/A',
                    telegramUserId: telegramUserId || 'N/A',
                    taskId: task.taskId,
                    taskTitle: task.title,
                    reward: task.reward,
                    submissionDate: serverTimestamp(),
                    status: 'PENDING',
                    // Xaddid base64 si aan loo dhaaafin xadka Document Size-ka (1MB)
                    proofImageBase64: reader.result.split(',')[1].substring(0, 10000), 
                });

                // Hadana waxaan u haynaa Pending Balance si ay u arkaan user-ku
                const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
                await updateDoc(userRef, {
                    pendingBalance: (balance.pending + task.reward).toFixed(2)
                });

                setMessage(`Task-gaaga ${task.reward}$ waxaa loo diray xaqiijin. Waxay ku jiri doonaan 'Pending'.`);
                setSelectedTaskId(null);
                setActiveTab('tasks');
            } catch (error) {
                console.error("Cilad Task Submission:", error);
                setMessage("Cilad baa dhacday. Fadlan isku day mar kale.");
            } finally {
                setIsSubmitting(false);
            }
        };
        reader.readAsDataURL(imageFile);
    }, [userId, balance.pending, telegramUser, telegramUserId]);

    // --- WITHDRAWAL LOGIC ---
    const handleWithdrawal = async (paymentOption, account) => {
        if (!userId || !db) return setMessage("Cilad: User-ku lama aqoonsana.");
        if (balance.current < MIN_WITHDRAW_AMOUNT) {
            return setMessage(`Waa inaad haysataa ugu yaraan ${MIN_WITHDRAW_AMOUNT}$ si aad u kala baxdo.`);
        }
        if (!account || account.trim() === '') {
            return setMessage("Fadlan gali lambarka/cinwaanka akoonka.");
        }

        setIsSubmitting(true);
        setMessage('Codsigaaga lacag kala bixista waxaa loo dirayaa Admin...');

        try {
            const withdrawColRef = collection(db, `artifacts/${appId}/public/data/withdrawals`);
            const withdrawAmount = balance.current;

            await addDoc(withdrawColRef, {
                userId: userId,
                amount: withdrawAmount,
                method: paymentOption.name,
                account: account,
                date: serverTimestamp(),
                status: 'PENDING',
                telegramUsername: telegramUser.username || 'Unknown',
                telegramUserId: telegramUserId || 'Unknown'
            });

            // Hoos u dhig current balance si looga hortago in laba jeer la codsado
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
            await updateDoc(userRef, {
                currentBalance: 0,
                lastWithdrawalAmount: withdrawAmount,
                lastWithdrawalDate: serverTimestamp()
            });

            setMessage(`✅ Codsigaaga ${withdrawAmount.toFixed(2)}$ wuxuu u baxay xaqiijin. Waanu kugu soo xiriiri doonaa.`);
            setActiveTab('home');
        } catch (error) {
            console.error("Cilad Withdrawal:", error);
            setMessage("Cilad baa dhacday marka la dirayay codsiga.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ADMIN LOGIC ---
    const handleTaskReview = async (task, action) => {
        if (!isUserAdmin || !db) return setMessage("Ma lihid awooda Admin-ka.");
        const taskRef = doc(db, `artifacts/${appId}/public/data/submitted_tasks`, task.id);
        const userProfileRef = doc(db, `artifacts/${appId}/users/${task.userId}/profile/data`);
        setIsSubmitting(true);

        try {
            await updateDoc(taskRef, {
                status: action,
                reviewDate: serverTimestamp(),
                reviewerId: userId
            });

            if (action === 'APPROVED') {
                const userDoc = await getDoc(userProfileRef);
                const currentData = userDoc.data() || { currentBalance: 0, pendingBalance: 0 };
                await updateDoc(userProfileRef, {
                    currentBalance: (parseFloat(currentData.currentBalance) + task.reward).toFixed(2),
                    pendingBalance: (parseFloat(currentData.pendingBalance) - task.reward).toFixed(2),
                });
                setMessage(`✅ Task-ga ${task.taskId} (User: ${task.telegramUsername}) waa la ansixiyay. ${task.reward}$ waa lagu daray baaqiga.`);
            } else if (action === 'REJECTED') {
                const userDoc = await getDoc(userProfileRef);
                const currentData = userDoc.data() || { pendingBalance: 0 };
                await updateDoc(userProfileRef, {
                    pendingBalance: (parseFloat(currentData.pendingBalance) - task.reward).toFixed(2),
                });
                setMessage(`❌ Task-ga ${task.taskId} (User: ${task.telegramUsername}) waa la diiday.`);
            }
        } catch (error) {
            console.error("Cilad Task Review:", error);
            setMessage("Cilad baa dhacday marka la ansixinayo/diidayo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdrawalReview = async (withdrawal, action) => {
        if (!isUserAdmin || !db) return setMessage("Ma lihid awooda Admin-ka.");
        const withdrawalRef = doc(db, `artifacts/${appId}/public/data/withdrawals`, withdrawal.id);
        setIsSubmitting(true);

        try {
            await updateDoc(withdrawalRef, {
                status: action,
                processingDate: serverTimestamp(),
                reviewerId: userId
            });

            if (action === 'REJECTED') {
                const userProfileRef = doc(db, `artifacts/${appId}/users/${withdrawal.userId}/profile/data`);
                const userDoc = await getDoc(userProfileRef);
                const currentData = userDoc.data() || { currentBalance: 0 };
                await updateDoc(userProfileRef, {
                    currentBalance: (parseFloat(currentData.currentBalance) + withdrawal.amount).toFixed(2),
                });
                setMessage(`❌ Withdrawal (User: ${withdrawal.telegramUsername}) waa la diiday. ${withdrawal.amount}$ dib ayaa loogu celiyay baaqigii user-ka.`);
            } else if (action === 'APPROVED') {
                setMessage(`✅ Withdrawal (User: ${withdrawal.telegramUsername}) waa la ansixiyay. Waa inaad bixisaa lacagta.`);
            }
        } catch (error) {
            console.error("Cilad Withdrawal Review:", error);
            setMessage("Cilad baa dhacday marka la ansixinayo/diidayo Withdrawal-ka.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- COMPONENTS ---
    const CopyButton = ({ text, fieldName }) => (
        <button
            onClick={() => handleCopy(text, fieldName)}
            className="text-indigo-400 hover:text-indigo-200 transition duration-150 p-1 rounded-full text-sm font-semibold flex items-center"
            aria-label={`Copy ${fieldName}`}
        >
            Koobiyee
        </button>
    );

    const TaskDetailView = ({ task }) => {
        const submitted = submittedTasks.find(t => t.taskId === task.taskId);

        if (submitted) {
            return (
                <div className="p-6 bg-gray-800 rounded-3xl shadow-2xl space-y-4">
                    <h2 className="text-2xl font-black text-white border-b border-gray-700 pb-3">
                        Task-gan waa la diray!
                    </h2>
                    <p className="text-gray-300">
                        Waxa aad hore u dirtay <span className="font-bold text-indigo-400">{task.title}</span>.
                        Task-gani wuxuu ku jiraa <span className="font-bold text-yellow-400">{submitted.status}</span>.
                    </p>
                    <TaskStatus submittedTask={submitted} />
                    <button
                        onClick={() => setSelectedTaskId(null)}
                        className="mt-6 w-full bg-gray-700 text-gray-200 font-bold py-3 rounded-2xl hover:bg-gray-600 transition duration-150 shadow-inner"
                    >
                        Ku Laabo Liiska Task-yada
                    </button>
                </div>
            );
        }

        return (
            <div className="p-6 bg-gray-800 rounded-3xl shadow-2xl space-y-6">
                <h2 className="text-3xl font-black text-indigo-400 leading-tight">
                    {task.title}
                </h2>
                <div className="text-green-400 text-xl font-extrabold p-2 bg-green-900/50 rounded-xl inline-block shadow-lg">
                    ${task.reward.toFixed(2)}
                </div>

                <p className="text-gray-300 border-b border-gray-700 pb-4">
                    {task.description}
                </p>

                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    📋 Xogta WAJIBKA AH (Required Data):
                </h3>
                <ul className="space-y-3 bg-gray-900 p-4 rounded-xl shadow-inner border border-gray-700">
                    {Object.entries(task.details).map(([key, value]) => (
                        <li key={key} className="flex justify-between items-center text-gray-200 text-sm">
                            <span className="font-semibold text-indigo-300 w-1/3">{key}:</span>
                            <span className="flex-1 font-mono break-all pr-2">{value}</span>
                            <CopyButton text={value} fieldName={key} />
                        </li>
                    ))}
                </ul>

                <p className="text-sm text-red-400 font-medium">
                    🚨 Hubi in aad isticmaasho xogta saxda ah!
                </p>

                <label htmlFor={`file-input-${task.taskId}`} className="block text-white font-bold mb-2">
                    📸 Soo gali Sawirka Caddeymaha (Proof Image - Max 500KB):
                </label>
                <input
                    type="file"
                    id={`file-input-${task.taskId}`}
                    accept="image/*"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-800 dark:file:text-white dark:text-gray-400"
                />

                <button
                    onClick={() => submitTask(task)}
                    disabled={isSubmitting}
                    className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 px-4 rounded-2xl shadow-xl transition duration-150 ease-in-out transform hover:scale-[1.01] disabled:bg-gray-700 disabled:text-gray-400 disabled:shadow-none"
                >
                    {isSubmitting ? 'Dirid...' : `Waan Dhameeyay (Done) & Dir ${task.reward.toFixed(2)}$`}
                </button>
                <button
                    onClick={() => setSelectedTaskId(null)}
                    className="mt-3 w-full text-sm text-gray-400 font-medium py-2 hover:text-indigo-400 transition duration-150"
                >
                    Ku Laabo Liiska Task-yada
                </button>
            </div>
        );
    };

    const TaskStatus = ({ submittedTask }) => {
        const status = submittedTask.status;
        let statusClass = 'text-yellow-300 bg-yellow-900/50 border-yellow-700';
        let statusText = 'Sugitaanka Xaqiijinta (Pending)';
        let message = "Admin-ku wuxuu xaqiijinayaa shaqadaada. Waxay qaadan kartaa ilaa 24 saacadood.";

        if (status === 'APPROVED') {
            statusClass = 'text-green-300 bg-green-900/50 border-green-700';
            statusText = 'LA XAQIIJIYAY (Approved)';
            message = "Hambalyo! Lacagtaada waa la ansixiyay waxaana lagu daray baaqigaaga Current Balance.";
        } else if (status === 'REJECTED') {
            statusClass = 'text-red-300 bg-red-900/50 border-red-700';
            statusText = 'LA DIIDAY (Rejected)';
            message = "Nasiib darro, task-gaaga waa la diiday. Hubi inaad raacday dhammaan shuruudaha.";
        }

        const formattedDate = submittedTask.submissionDate ? submittedTask.submissionDate.toLocaleDateString('so-SO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

        return (
            <div className={`p-4 rounded-2xl border-2 ${statusClass} shadow-lg space-y-2`}>
                <p className="font-extrabold text-lg flex items-center gap-2">
                    {statusText}
                </p>
                <p className="text-sm text-gray-300">{message}</p>
                <p className="text-xs text-gray-400 mt-2">La diray: {formattedDate}</p>
            </div>
        );
    };

    const TaskListView = () => {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-black text-white border-b border-gray-700 pb-3">
                    Liiska Task-yada La Heli Karo
                </h2>

                {AVAILABLE_TASKS.map(task => {
                    const submitted = submittedTasks.find(t => t.taskId === task.taskId);
                    const status = submitted ? submitted.status : null;
                    let cardClass = 'bg-gray-800 shadow-2xl border-l-4 border-indigo-500';
                    let actionText = 'ARAG FAAHFAAINTA & DIR';
                    let actionClass = 'bg-indigo-600 hover:bg-indigo-700';

                    if (status === 'PENDING') {
                        cardClass = 'bg-gray-800 shadow-2xl border-l-4 border-yellow-500 opacity-80';
                        actionText = 'Sugitaanka Xaqiijinta...';
                        actionClass = 'bg-yellow-600 cursor-default';
                    } else if (status === 'APPROVED') {
                        cardClass = 'bg-gray-800 shadow-2xl border-l-4 border-green-500 opacity-90';
                        actionText = 'LA XAQIIJIYAY ✅';
                        actionClass = 'bg-green-600 cursor-default';
                    } else if (status === 'REJECTED') {
                        cardClass = 'bg-gray-800 shadow-2xl border-l-4 border-red-500 opacity-90';
                        actionText = 'LA DIIDAY ❌';
                        actionClass = 'bg-red-600 cursor-default';
                    }

                    return (
                        <div key={task.taskId} className={`p-4 rounded-xl transition duration-300 ${cardClass} flex justify-between items-center`} onClick={() => !submitted && setSelectedTaskId(task.taskId)}>
                            <div className="flex-1 pr-4">
                                <h3 className="text-lg font-extrabold text-white">{task.title}</h3>
                                <p className="text-green-400 font-bold">+${task.reward.toFixed(2)}</p>
                                <p className="text-sm text-gray-400 mt-1">{task.description.substring(0, 100)}...</p>
                            </div>
                            <button
                                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition duration-150 ${actionClass} shadow-md`}
                                disabled={!!submitted}
                                onClick={() => !submitted && setSelectedTaskId(task.taskId)}
                            >
                                {actionText}
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    const HomeTab = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-white border-b border-gray-700 pb-3">
                Dashboard-ka Akoonkaaga
            </h2>
            {/* Balance Display Card */}
            <div className="p-6 bg-indigo-700 rounded-3xl shadow-2xl text-white transform hover:scale-[1.01] transition duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-indigo-800 opacity-20 transform rotate-45 scale-150 rounded-xl"></div>
                <p className="text-sm font-semibold mb-1 relative z-10">Baaqiga Hada (Current Balance)</p>
                <p className="text-6xl font-black relative z-10">${balance.current.toFixed(2)}</p>
                <button
                    onClick={() => setActiveTab('withdraw')}
                    disabled={balance.current < MIN_WITHDRAW_AMOUNT}
                    className="mt-4 w-full bg-white text-indigo-800 font-bold py-3 rounded-2xl shadow-xl transition duration-150 ease-in-out disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transform hover:scale-[1.02] relative z-10"
                >
                    {balance.current < MIN_WITHDRAW_AMOUNT ? `Minimum: $${MIN_WITHDRAW_AMOUNT.toFixed(2)}` : 'CODSO LACAG BIXINTA 💸'}
                </button>
            </div>

            {/* Pending Balance Card */}
            <div className="p-5 bg-gray-800 rounded-3xl shadow-xl border border-gray-700 space-y-2">
                <p className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                    ⏳ Baaqiga Sugaya (Pending/Hold)
                </p>
                <p className="text-4xl font-black text-gray-200">${balance.pending.toFixed(2)}</p>
                <p className="text-sm text-gray-400">
                    Lacagta la sugayo xaqiijinteeda Admin-ka ka hor inta aan lagu darin Current Balance.
                </p>
            </div>
        </div>
    );

    const ProfileTab = () => {
        const { initial, colorClass } = getAvatarStyling(telegramFullName);
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-white border-b border-gray-700 pb-3">
                    Xogta Profile-ka & Settings
                </h2>

                {/* Profile Card */}
                <div className="p-6 bg-gray-800 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 border border-gray-700">
                    {/* Custom Avatar Placeholder */}
                    <div className={`w-20 h-20 ${colorClass} rounded-full flex items-center justify-center text-3xl font-black text-white shadow-lg`}>
                        {initial}
                    </div>
                    <p className="text-xl font-black text-white">{telegramFullName}</p>
                    <p className="text-sm text-indigo-400">@{telegramUser.username || 'N/A'}</p>
                    <p className="text-xs text-gray-400 break-all">ID: {userId || 'Sugitaan...'}</p>
                </div>

                {/* Dark Mode Toggle */}
                <div className="flex justify-between items-center p-4 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
                    <p className="font-semibold text-white flex items-center gap-2">{isDarkMode ? '🌙' : '☀️'} Dark Mode</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {/* Submitted Tasks History */}
                <h3 className="text-xl font-bold text-white pt-4 border-t border-gray-700">
                    Taariikhda Task-yada La Diray ({submittedTasks.length})
                </h3>
                <div className="space-y-3">
                    {submittedTasks.length > 0 ? (
                        submittedTasks
                            .sort((a, b) => b.submissionDate - a.submissionDate)
                            .map((task) => (
                                <div key={task.id} className="p-3 bg-gray-800 rounded-xl shadow-md flex justify-between items-center border-l-4 border-indigo-600">
                                    <div>
                                        <p className="font-semibold text-white">{task.taskTitle} - <span className="text-green-400">+${task.reward.toFixed(2)}</span></p>
                                        <p className="text-xs text-gray-400">Diray: {task.submissionDate.toLocaleDateString()} {task.submissionDate.toLocaleTimeString()}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${task.status === 'APPROVED' ? 'bg-green-700 text-green-100' : task.status === 'PENDING' ? 'bg-yellow-700 text-yellow-100' : 'bg-red-700 text-red-100'}`}>
                                        {task.status}
                                    </span>
                                </div>
                            ))
                    ) : (
                        <p className="text-gray-400 italic">Wali ma aadan dirin wax Task ah.</p>
                    )}
                </div>
            </div>
        );
    };

    const WithdrawalForm = () => {
        const [selectedOption, setSelectedOption] = useState(PAYMENT_OPTIONS[0]);
        const [accountNumber, setAccountNumber] = useState('');
        const isReadyToWithdraw = balance.current >= MIN_WITHDRAW_AMOUNT && accountNumber.trim() !== '' && !isSubmitting;

        return (
            <div className="p-6 bg-gray-800 rounded-3xl shadow-2xl space-y-6">
                <h2 className="text-2xl font-black text-white border-b border-gray-700 pb-3">
                    💵 Codso Lacag Kala Bixis
                </h2>

                {/* Balance Summary */}
                <div className="p-4 bg-indigo-900/50 rounded-xl shadow-inner border-l-4 border-indigo-400">
                    <p className="text-sm font-semibold text-indigo-300">Baaqigaaga Diyaar u ah Bixinta:</p>
                    <p className="text-4xl font-black text-white">${balance.current.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-2">Xadka Ugu Yar (Minimum): ${MIN_WITHDRAW_AMOUNT.toFixed(2)}</p>
                </div>

                {/* Payment Options */}
                <label className="block text-white font-bold mb-2">Doorashada Bixinta (Payment Method):</label>
                <div className="grid grid-cols-2 gap-3">
                    {PAYMENT_OPTIONS.map(option => (
                        <button
                            key={option.id}
                            onClick={() => setSelectedOption(option)}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 text-sm font-extrabold transition duration-150 shadow-lg ${
                                selectedOption.id === option.id
                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/50'
                                    : 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-700'
                            }`}
                        >
                            <span className="text-2xl mb-1">{option.icon}</span>
                            {option.name}
                        </button>
                    ))}
                </div>

                {/* Account Input */}
                <div>
                    <label htmlFor="account" className="block text-white font-bold mb-2">
                        {selectedOption.details}:
                    </label>
                    <input
                        id="account"
                        type="text"
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        placeholder="Gali lambarka taleefanka ama cinwaanka"
                        className="mt-1 block w-full px-4 py-3 border-2 border-gray-700 rounded-xl shadow-inner focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 bg-gray-900 transition duration-150"
                    />
                </div>

                <button
                    onClick={() => handleWithdrawal(selectedOption, accountNumber)}
                    disabled={!isReadyToWithdraw}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl shadow-2xl transition duration-150 ease-in-out disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                >
                    {isSubmitting ? 'Dirid...' : `Kala Bax $${balance.current.toFixed(2)}`}
                </button>
                {balance.current < MIN_WITHDRAW_AMOUNT && (
                    <p className="text-center text-red-400 text-sm">
                        Waxa u baahan tahay $<span className="font-bold">{MIN_WITHDRAW_AMOUNT.toFixed(2)}</span> in ka badan si aad u kala baxdo.
                    </p>
                )}
            </div>
        );
    };

    const AdminDashboard = () => (
        <div className="space-y-8 p-6 bg-gray-800 rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-black text-red-500 border-b-4 border-red-700 pb-3">
                🚨 ADMIN DASHBOARD (SIMULATION)
            </h2>
            <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-xl">
                **AMNIGA DIGNIIN:** Admin Dashboard-kani waa *simulated* wuxuuna ku shaqeeyaa client-ka. Si loo helo nabadgelyo dhab ah, waa in aad u wareejisaa dhammaan xaqiijinta Task/Withdrawal-ka **Backend Server** dibadda ah.
            </p>

            {/* Pending Tasks Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-extrabold text-yellow-400">
                    Sugitaan Task-yada ({pendingTasks.length})
                </h3>
                {pendingTasks.length === 0 ? (
                    <p className="text-gray-400 italic bg-gray-900 p-4 rounded-xl">Ma jiraan Task-yo sugaya xaqiijin.</p>
                ) : (
                    <div className="space-y-4">
                        {pendingTasks.map(task => {
                            const proofImageSrc = task.proofImageBase64 ? `data:image/jpeg;base64,${task.proofImageBase64}` : null;
                            return (
                                <div key={task.id} className="p-4 bg-gray-900 rounded-xl shadow-lg border-l-4 border-yellow-500 space-y-3">
                                    <p className="font-bold text-white">{task.taskTitle} <span className="text-green-400">+${task.reward.toFixed(2)}</span></p>
                                    <p className="text-sm text-gray-400">User: <span className="font-mono text-indigo-400">{task.telegramUsername}</span> (ID: {task.userId.substring(0, 8)}...)</p>
                                    <p className="text-xs text-gray-500">Submitted: {task.submissionDate?.toLocaleString()}</p>
                                    
                                    <p className="font-semibold text-gray-300 mt-2">Proof Image:</p>
                                    {proofImageSrc ? (
                                        <img
                                            src={proofImageSrc}
                                            alt="Proof"
                                            className="w-full max-h-48 object-cover rounded-lg border border-gray-700 cursor-pointer"
                                            onClick={() => window.open(proofImageSrc, '_blank')} // Allow viewing in full size
                                        />
                                    ) : (
                                        <p className="text-red-400 text-sm">No Image Data Available.</p>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleTaskReview(task, 'APPROVED')}
                                            disabled={isSubmitting}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-700"
                                        >
                                            ✅ Ansixi
                                        </button>
                                        <button
                                            onClick={() => handleTaskReview(task, 'REJECTED')}
                                            disabled={isSubmitting}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-700"
                                        >
                                            ❌ Diid
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pending Withdrawals Section */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-xl font-extrabold text-indigo-400">
                    Sugitaan Withdrawal-ka ({pendingWithdrawals.length})
                </h3>
                {pendingWithdrawals.length === 0 ? (
                    <p className="text-gray-400 italic bg-gray-900 p-4 rounded-xl">Ma jiraan Codsiyo Lacag Kala Bixis oo sugaya.</p>
                ) : (
                    <div className="space-y-4">
                        {pendingWithdrawals.map(wd => (
                            <div key={wd.id} className="p-4 bg-gray-900 rounded-xl shadow-lg border-l-4 border-indigo-500 space-y-2">
                                <p className="font-bold text-white">Withdrawal: <span className="text-lg text-green-400">${wd.amount.toFixed(2)}</span></p>
                                <p className="text-sm text-gray-300">Method: <span className="font-semibold">{wd.method}</span></p>
                                <p className="text-sm text-gray-300 break-all">Account: <span className="font-mono text-white">{wd.account}</span></p>
                                <p className="text-xs text-gray-500">User: <span className="font-mono text-indigo-400">{wd.telegramUsername}</span> (ID: {wd.userId.substring(0, 8)}...)</p>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleWithdrawalReview(wd, 'APPROVED')}
                                        disabled={isSubmitting}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-700"
                                    >
                                        ✅ Bixi (Paid)
                                    </button>
                                    <button
                                        onClick={() => handleWithdrawalReview(wd, 'REJECTED')}
                                        disabled={isSubmitting}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-700"
                                    >
                                        ❌ Diid & Ku Celi
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    const TabButton = ({ name, label, icon, currentTab, setActive }) => (
        <button
            onClick={() => {
                setActive(name);
                setSelectedTaskId(null);
                setMessage(''); // Nadiifi fariinta marka tab la beddelo
            }}
            className={`flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-200 text-xs font-extrabold ${
                currentTab === name
                    ? 'text-indigo-400 border-t-2 border-indigo-400 bg-gray-800'
                    : 'text-gray-400 hover:text-indigo-400'
            }`}
        >
            <span className="text-lg">{icon}</span>
            {label}
        </button>
    );

    const currentTask = AVAILABLE_TASKS.find(t => t.taskId === selectedTaskId);

    const renderContent = () => {
        if (!isAuthReady) {
            return (
                <div className="text-center p-8 bg-gray-800 rounded-3xl shadow-xl text-white">
                    <p>Sugitaan... Xaqiijinta user-ka iyo Database-ka.</p>
                </div>
            );
        }

        if (activeTab === 'withdraw') {
            return <WithdrawalForm />;
        }
        if (activeTab === 'tasks' && selectedTaskId && currentTask) {
            return <TaskDetailView task={currentTask} />;
        }

        switch (activeTab) {
            case 'home':
                return <HomeTab />;
            case 'tasks':
                return <TaskListView />;
            case 'profile':
                return <ProfileTab />;
            case 'admin':
                return isUserAdmin ? <AdminDashboard /> : <div className="text-center p-8 text-red-400">Ma lihid awooda admin-ka.</div>;
            default:
                return <HomeTab />;
        }
    };

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            {/* Custom CSS for Animated Background (Best Design 2026) */}
            <style>
                {`
                /* Define the gradient animation keyframes */
                @keyframes gradient-move {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                /* Apply the animation to a class */
                .animated-gradient {
                    /* Dark, deep colors for a modern, futuristic look */
                    background: linear-gradient(-45deg, #0f172a, #1e293b, #0c4a6e, #111827);
                    background-size: 400% 400%;
                    animation: gradient-move 25s ease infinite;
                    min-height: 100vh;
                    font-family: 'Inter', sans-serif;
                }
                .dark { color-scheme: dark; }
                `}
            </style>

            <div className={`animated-gradient min-h-screen text-gray-200 pb-20`}>
                <div className="max-w-md mx-auto p-4 sm:p-6">

                    {/* Header (Title) */}
                    <div className="text-center py-4">
                        <h1 className="text-4xl font-black text-white tracking-wider">MY EARNINGS</h1>
                        <p className="text-indigo-400 font-medium">Task & Withdrawal Dashboard</p>
                    </div>

                    {/* Global Message Box */}
                    {message && (
                        <div className="p-3 mb-4 rounded-xl shadow-lg text-center bg-indigo-900 border border-indigo-700 text-indigo-200 text-sm font-medium">
                            {message}
                        </div>
                    )}

                    {/* Content Render */}
                    <div className="mt-4">
                        {renderContent()}
                    </div>

                </div>

                {/* Navigation (Tabs) - Fixed Footer */}
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-900/90 backdrop-blur-sm shadow-2xl rounded-t-3xl border-t border-gray-700 p-2">
                    <div className="flex justify-around">
                        <TabButton name="home" label="Dashboard" icon="🏠" currentTab={activeTab} setActive={setActiveTab} />
                        <TabButton name="tasks" label="Tasks" icon="📝" currentTab={activeTab} setActive={setActiveTab} />
                        <TabButton name="profile" label="Profile" icon="👤" currentTab={activeTab} setActive={setActiveTab} />
                        {isUserAdmin && (
                            <TabButton name="admin" label="Admin" icon="👑" currentTab={activeTab} setActive={setActiveTab} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskEarningApp;

