import React, { useState, useEffect } from 'react'; import { Wallet, Users, User, Send, Zap, Coins, TrendingUp, Shield, Gift, Copy, DollarSign, Youtube, Mail, MessageCircle, Video, Instagram, CheckCircle, Clock, XCircle, Menu, Star, // Loo isticmaalayo Review Key // Loo isticmaalayo Register } from 'lucide-react'; // API configuration (Mocked for front-end focus) const API_BASE_URL = 'https://your-backend-domain.com'; // --- Utility Functions --- // Kaararka Magacyada Platforms-ka iyo Icons-ka const platformIcons = { gmail: , youtube: , tiktok: , telegram: , instagram: , review: , register: , // Icon cusub oo loo isticmaalayo Register }; // Colors-ka platforms-ka const platformColors = { gmail: 'bg-red-600', youtube: 'bg-red-700', tiktok: 'bg-black', telegram: 'bg-blue-500', instagram: 'bg-pink-600', review: 'bg-yellow-500', register: 'bg-indigo-600', // Midab cusub default: 'bg-purple-600' }; // --- Custom Components --- // Button-ka Navigation-ka function NavButton({ icon, label, active, onClick }) { return ( 

{icon} 

{label} ); } // Kaarka Task-ka function TaskCard({ task, onClick }) { // Waxaan isku dayeynaa in aan helno platform-ka, haddii aan la helin waxaan isticmaaleynaa 'default' const platform = task.platform || 'default'; const icon = platformIcons[platform] || ; const color = platformColors[platform] || platformColors.default; return ( 

{icon} 

{task.title}

{platform} {task.type || 'Task'} 

{task.reward.toFixed(2)} 

{task.description}

{task.details && ( 

Xog Gaar Ah 

{Object.keys(task.details).length} Xog 

)} {/* Haddii uusan details lahayn, waxaan isticmaaleynaa requirements-kii hore */} {!task.details && ( 

La xaqiijiyay 

{task.quantity && ( 

{task.completed_count || 0}/{task.quantity} 

)} 

)} 

); } // Modal-ka Task-ga function TaskModal({ task, onClose, onSubmit }) { const [proofImage, setProofImage] = useState(null); const [proofText, setProofText] = useState(''); const [step, setStep] = useState('instructions'); const [message, setMessage] = useState(''); const handleImageUpload = (event) => { const file = event.target.files[0]; if (file && file.size setProofImage(e.target.result); reader.readAsDataURL(file); setMessage(''); } else { setMessage('Fadlan dooro sawir ka yar 1MB.'); } }; const handleUrlClick = (e, url) => { e.stopPropagation(); window.open(url, '_blank'); }; const handleCopy = (text) => { try { const tempInput = document.createElement('textarea'); tempInput.value = text; document.body.appendChild(tempInput); tempInput.select(); document.execCommand('copy'); document.body.removeChild(tempInput); setMessage('Xogta waa la koobiyeeyay!'); setTimeout(() => setMessage(''), 1500); } catch (err) { setMessage('Koobiyeynta way guuldarraysatay.'); } }; const handleSubmit = () => { if (!proofImage && !proofText) { setMessage('Fadlan soo gudbi sawir caddayn ah ama qoraal.'); return; } setMessage('Waa la soo gudbinayaa...'); onSubmit(task.id, proofImage, proofText); }; return ( 

{/* Header */} 

Faahfaahinta Task-ga

{/* Content */} 

{step === 'instructions' && ( 

{task.title}

${task.reward.toFixed(2)} 

{task.description}

{/* DETAILS SECTION (For tasks with specific data) */} {task.details && ( 

Xogta Task-ga (Koobiyeey)

{Object.entries(task.details).map(([key, value]) => ( 

{key}:

{value}

handleCopy(value)} className="p-2 ml-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center" > 

))} 

Waa **WAAJIB** in aad isticmaasho xogtaan sida ay tahay.

)} {/* REQUIREMENTS SECTION (For regular tasks without details) */} {task.requirements && ( 

Shuruudaha

{task.requirements}

)} {task.url && ( handleUrlClick(e, task.url)} className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-amber-400 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 group" > Riix si aad u qabato )} setStep('submit')} className="w-full bg-amber-500 text-gray-900 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all transform active:scale-[0.98] mt-4" > Bilow & Gudbi Caddayn 

)} {step === 'submit' && ( 

Soo Gudbi Caddaynta 

{/* Image Upload */} 

Sawir (Screenshot) 

{proofImage ? ( 

￼ 

Sawirka waa la doortay (Bedel)

) : ( 

Riix si aad sawir u geliso 

Max 1MB

)} 

{/* Text Proof */} 

Qoraal Dheeraad Ah setProofText(e.target.value)} placeholder="Tusaale: @magacaaga ama link..." className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors" rows="2" /> 

{message && ( 

{message} 

)} 

setStep('instructions')} className="bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors" > Dib u noqo Gudbi Hadda 

)} 

); } // Tab-ka Home-ka function HomeTab({ balance, tasks, onTaskSelect }) { const totalEarned = balance.total_earned || 0; return ( 

Dashboard

{new Date().toLocaleDateString()} 

{/* Balance Cards */} 

Hadhaaga

${balance.balance.toFixed(2)}

Diyaar u ah bixitaan 

Wadarta Guud

${totalEarned.toFixed(2)}

Soo kordhaya 

{/* Quick Stats & Metrics */} 

{tasks.length}

Tasks

${balance.pending_balance.toFixed(2)}

Pending

10%

Referral

{/* High-Value Tasks */} 

Tasks Cusub

Fiiri dhamaan 

{tasks.slice(0, 3).map((task) => ( onTaskSelect(task)} /> ))} {tasks.length === 0 && ( 

Hadda tasks ma yaalaan.

)} 

); } // Tab-ka Tasks-ka function TasksTab({ tasks, onTaskSelect }) { const [activeCategory, setActiveCategory] = useState('all'); const categories = [ { id: 'all', name: 'Dhammaan', icon: }, { id: 'youtube', name: 'YouTube', icon: }, { id: 'tiktok', name: 'TikTok', icon: }, { id: 'telegram', name: 'Telegram', icon: }, { id: 'instagram', name: 'Instagram', icon: }, { id: 'review', name: 'Review', icon: }, { id: 'register', name: 'Register', icon: }, // Category cusub ]; const filteredTasks = tasks.filter(task => { if (activeCategory === 'all') return true; const platform = task.platform || 'default'; return platform === activeCategory; }); return ( 

Raadinta Task

{/* Category Filter */} 

{categories.map(category => ( setActiveCategory(category.id)} className={`flex items-center space-x-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 text-xs font-bold border ${ activeCategory === category.id ? 'bg-amber-500 border-amber-500 text-gray-900 shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white' }`} > {category.icon} {category.name} ))} 

{/* Tasks List */} 

{filteredTasks.length} tasks ayaa la helay 

{filteredTasks.map(task => ( onTaskSelect(task)} /> ))} {filteredTasks.length === 0 && ( 

Task-yo lama helin

Isku day inaad bedesho filter-kaaga ama dib u soo noqo mar dambe. 

)} 

); } // Tab-ka Profile-ka function ProfileTab({ user }) { return ( 

{/* User Info Card */} 

{user.telegram_username || "Isticmaale"}

ID: {user.app_uid?.substring(0, 8)}

15

Tasks Done

98%

Accuracy

{/* Settings List */} 

Habka Lacag bixinta 

Zaad, eDahab

Amniga & Xaqiijinta 

Ka bax (Logout) 

); } // Tab-ka Saaxiib Keenista function ReferralTab({ referrals, user }) { const mockReferralCode = user?.app_uid?.substring(0, 10) || 'EARNXYZ123'; const referralLink = `https://t.me/your_bot?start=${mockReferralCode}`; const totalCommission = referrals.totalCommission || 0; const referralCount = referrals.referralCount || 0; const [copied, setCopied] = useState(false); const copyToClipboard = () => { try { const tempInput = document.createElement('textarea'); tempInput.value = referralLink; document.body.appendChild(tempInput); tempInput.select(); document.execCommand('copy'); document.body.removeChild(tempInput); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (err) { console.error('Failed to copy'); } }; return ( 

{/* Referral Header */} 

Casuumad & Kasbasho

La wadaag saaxiibadaada oo hel komishan joogto ah. 

10%

Komishan

Per task

{/* Referral Link & Copy */} 

Link-gaaga

{referralLink} 

{copied ? : } 

{/* Referral Stats */} 

{referralCount} 

Saaxiibada

${totalCommission.toFixed(2)} 

Dakhliga

); } // Tab-ka Lacagta Loo Bixsanayo function WithdrawTab({ balance, method, amount, accountInfo, onMethodChange, onAmountChange, onAccountInfoChange, onWithdraw }) { const withdrawalMethods = [ { id: 'zaad', name: 'Zaad', icon: '🏦', min: 5, placeholder: 'Lambarka Zaad' }, { id: 'edahab', name: 'eDahab', icon: '💳', min: 5, placeholder: 'Lambarka eDahab' }, { id: 'payeer', name: 'Payeer', icon: '🌐', min: 10, placeholder: 'ID-ga Payeer' }, { id: 'crypto', name: 'USDT', icon: '₿', min: 20, placeholder: 'Address-ka TRC20' } ]; const selectedMethod = withdrawalMethods.find(m => m.id === method); const isWithdrawDisabled = !amount || !accountInfo || parseFloat(amount) < (selectedMethod?.min || 0) || parseFloat(amount) > balance; const amountFloat = parseFloat(amount); const [message, setMessage] = useState(''); const handleWithdrawClick = () => { if (isWithdrawDisabled) { setMessage("Fadlan buuxi xogta ama lacagta ma gaadhsiisna min."); return; } onWithdraw(); setMessage(''); }; return ( 

Bixitaan (Withdraw)

{/* Balance Card */} 

Hadhaaga Diyaarka ah

${balance.toFixed(2)}

{/* Withdrawal Method Selection */} 

Habka Bixinta

{withdrawalMethods.map(methodItem => ( onMethodChange(methodItem.id)} className={`p-3 rounded-xl text-center transition-all duration-200 border relative ${ method === methodItem.id ? 'bg-amber-500 border-amber-500 text-gray-900 shadow-lg' : 'bg-[#1a1f2e] border-white/5 text-gray-400 hover:border-white/20' }`} > {method === methodItem.id && 

} 

{methodItem.icon}

{methodItem.name}

))} 

{/* Withdrawal Form */} 

{/* Amount */} 

Lacagta ($) 

$ onAmountChange(e.target.value)} placeholder="0.00" className="w-full bg-black/20 border border-white/10 rounded-xl pl-8 pr-4 py-4 text-white text-xl font-bold focus:outline-none focus:border-emerald-500 transition-colors" /> 

Min: ${selectedMethod?.min.toFixed(2)} balance ? 'text-red-400 font-bold' : 'text-emerald-400'}> Max: ${balance.toFixed(2)} 

{/* Account Info */} 

{selectedMethod?.placeholder} onAccountInfoChange(e.target.value)} placeholder="..." className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" /> 

{message && 

{message}

} {/* Withdrawal Button */} Codso Bixitaan 

); } // Loading Screen Component function LoadingScreen() { return ( 

EarnApp

Loading data...

); } // Authentication Screen Component function AuthenticationScreen() { return ( 

Ku soo Dhawoow

Si aad lacag u samayso, fadlan ka soo gal Telegram Bot-ka rasmiga ah. 

Secure Login 

App-kan wuxuu u baahan yahay Telegram user ID si loo xaqiijiyo akoonkaaga. 

); } // --- Main App Component --- export default function App() { const [activeTab, setActiveTab] = useState('home'); // Xogta Isticmaalaha const [user] = useState({ telegram_username: 'ahmed_ali', app_uid: 'USER_882910' , referral_code: 'SOMALIA1' }); // Task-yada const [tasks, setTasks] = useState([ { id: 1, title: 'Subscribe YouTube Channel', platform: 'youtube', reward: 0.50, description: 'Subscribe kanaalka oo daawo muuqaalkii ugu dambeeyay 30 ilbiriqsi.', requirements: 'Bixi magacaaga YouTube iyo sawirka subscription-ka.', url: 'https://youtube.com', type: 'Subscribe' }, { id: 2, title: 'Follow TikTok Influencer', platform: 'tiktok', reward: 0.25, description: 'La soco akoonkan TikTok oo like saar 3 muuqaal.', requirements: 'Bixi magacaaga TikTok iyo sawirka like-ka.', url: 'https://tiktok.com', type: 'Follow' }, { id: 3, title: 'Join Telegram Group', platform: 'telegram', reward: 0.15, description: 'Ku biir channel-ka oo ku sugnaaw ugu yaraan 24 saac.', requirements: 'Bixi magacaaga Telegram iyo sawirka channel-ka.', url: 'https://t.me/telegram', type: 'Join' }, // TASK CUSUB 1: REGISTER { id: 4, taskId: "REG101", title: "Diiwaangeli Account Cusub", platform: 'register', // Platform cusub reward: 0.50, details: { 'Magaca Hore': 'Numbers', 'Magaca Dambe': '✖️', 'Email': 'otuhufunime678@gmail.com', 'Password': 'nrjXvDq6AdyQ', 'Email Soo Celinta': 'uzulukeyuru67@gmail.com' }, description: "Register account using the specified data. You must use the provided data, otherwise you will not receive the reward.", requirements: 'Bixi screenshot-ka xaqiijinta email-ka ee aad heshay, iyo sawirka profile-ka cusub ee diiwaangashan.', // Shuruudaha oo aan ku daray url: 'https://register-here.example.com', // Url aan ku daray type: 'Registration' }, // TASK CUSUB 2: REVIEW { id: 5, taskId: "REVIEW202", title: "Samee Review 5-Star ah", platform: 'review', reward: 0.75, details: { 'Link-ga Review-ga': 'https://review.example.com/app123', 'Qoraalka Review-ga': 'This is the best app ever! Five stars! (Copy this exact text)' }, description: "Write a 5-star review on the provided link. Copy the review text and submit proof.", requirements: 'Bixi screenshot-ka review-ga la daabacay oo magacaagu ka muuqdo.', // Shuruudaha oo aan ku daray url: 'https://review-app.example.com', // Url aan ku daray type: 'Review' }, { id: 6, title: 'Comment on Post', platform: 'instagram', reward: 0.40, description: 'Ka tag comment macno leh oo ka kooban 5+ eray.', requirements: 'Bixi magacaaga Instagram iyo sawirka comment-ga.', url: 'https://instagram.com', type: 'Comment' }, ]); // Waxaan u bedelay 6 tasks // Xusuusin: ID-yada 4 iyo 5 waa Task-yadii cusbaa ee aad soo dirtay. ID 6 waa kii Instagram-ka oo aan u wareejiyay. // Lacagta const [balance, setBalance] = useState({ balance: 12.75, pending_balance: 3.25, total_earned: 25.50 }); // Saaxiib Keenista const [referrals] = useState({ referralCount: 12, totalCommission: 8.50, }); const [loading, setLoading] = useState(true); const [selectedTask, setSelectedTask] = useState(null); const [withdrawMethod, setWithdrawMethod] = useState('zaad'); const [withdrawAmount, setWithdrawAmount] = useState(''); const [accountInfo, setAccountInfo] = useState(''); // Simulate Loading useEffect(() => { const timer = setTimeout(() => { setLoading(false); }, 1500); return () => clearTimeout(timer); }, []); const submitTask = async (taskId, proofImage = null, proofText = '') => { // Logic for submission setTimeout(() => { // Mock update pending balance const task = tasks.find(t => t.id === taskId); if(task) { setBalance(prev => ({ ...prev, pending_balance: prev.pending_balance + task.reward })); } setSelectedTask(null); // console.log("Success"); }, 1000); }; const requestWithdrawal = async () => { const amount = parseFloat(withdrawAmount); setBalance(prev => ({ ...prev, balance: prev.balance - amount })); setWithdrawAmount(''); setAccountInfo(''); }; if (loading) { return ; } if (!user.app_uid) { return ; } const customStyles = ` .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } `; return ( 

{customStyles} {/* Header */} 

EarnApp

Balance

${balance.balance.toFixed(2)}

{/* Main Content */} {activeTab === 'home' && ( )} {activeTab === 'tasks' && ( )} {activeTab === 'profile' && ( )} {activeTab === 'referrals' && ( )} {activeTab === 'withdraw' && ( )} {/* Navigation */} 

} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} /> } label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} /> } label="Friends" active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} /> } label="Cashout" active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')} /> } label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} /> 

{/* Task Modal */} {selectedTask && ( setSelectedTask(null)} onSubmit={submitTask} /> )} 

); } 
